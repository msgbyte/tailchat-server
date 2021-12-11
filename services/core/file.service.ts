import { TcService } from '../base';
import type { PureContext, TcContext } from '../types';
import { buildUploadUrl, config } from '../../lib/settings';
import MinioService from 'moleculer-minio';
import _ from 'lodash';
import mime from 'mime';
import type { Client as MinioClient } from 'minio';
import { isValidStr } from '../../lib/utils';
import { NoPermissionError } from '../../lib/errors';
import path from 'path';
import type { FileDocument, FileModel } from '../../models/file';
import type { TcDbService } from '../../mixins/db.mixin';
import { Types } from 'mongoose';

interface FileService extends TcService, TcDbService<FileDocument, FileModel> {}
class FileService extends TcService {
  get serviceName(): string {
    return 'file';
  }

  get minioClient(): MinioClient {
    return this.client;
  }

  get bucketName(): string {
    return config.storage.bucketName;
  }

  onInit(): void {
    this.registerDb('file');
    this.registerMixin(MinioService);
    const minioUrl = config.storage.minioUrl;
    const [endPoint, port] = minioUrl.split(':');

    // https://github.com/designtesbrot/moleculer-minio#settings
    this.registerSetting('endPoint', endPoint);
    this.registerSetting('port', Number(port));
    this.registerSetting('useSSL', false);
    this.registerSetting('accessKey', config.storage.user);
    this.registerSetting('secretKey', config.storage.pass);

    this.registerAction('save', this.save);
    this.registerAction('get', this.get, {
      params: {
        objectName: 'string',
      },
      disableSocket: true,
    });
  }

  async onInited() {
    // TODO: 看看有没有办法用一个ctx包起来
    // Services Available
    const isExists = await this.actions['bucketExists']({
      bucketName: this.bucketName,
    });
    if (isExists === false) {
      // bucket不存在，创建新的
      this.logger.info(
        '[File]',
        'Bucket 不存在, 创建新的Bucket',
        this.bucketName
      );
      await this.actions['makeBucket']({
        bucketName: this.bucketName,
      });
    }

    const buckets = await this.actions['listBuckets']();
    this.logger.info(`[File] MinioInfo: | buckets: ${JSON.stringify(buckets)}`);
  }

  /**
   * 通过文件流存储到本地
   */
  async save(
    ctx: TcContext<
      {},
      {
        $params: any;
        filename: any;
      }
    >
  ) {
    const t = ctx.meta.t;
    this.logger.info('Received upload $params:', ctx.meta.$params);

    return new Promise(async (resolve, reject) => {
      const userId = ctx.meta.userId;
      this.logger.info('Received upload meta:', ctx.meta);

      if (!isValidStr(userId)) {
        throw new NoPermissionError(t('用户无上传权限'));
      }

      const originFilename = String(ctx.meta.filename);
      let ext = path.extname(originFilename);

      const stream = ctx.params as ReadableStream;
      (stream as any).on('error', (err) => {
        // 这里是文件传输错误处理
        // 比如文件过大
        this.logger.info('File error received', err.message);
        reject(err);
      });

      try {
        // 临时仓库
        const tmpObjectName = `tmp/${this.randomName()}${ext}`;

        // TODO: 这里在文件过大的时候会超时, 影响不大，但是不太好. 需要优化
        const { etag } = await this.actions['putObject'](stream, {
          meta: {
            bucketName: this.bucketName,
            objectName: tmpObjectName,
            metaData: {
              'content-type': mime.getType(ext),
            },
          },
          parentCtx: ctx,
        });

        // 存储在上传者自己的子目录
        const objectName = `files/${ctx.meta.userId}/${etag}${ext}`;

        try {
          await this.actions['copyObject'](
            {
              bucketName: this.bucketName,
              objectName,
              sourceObject: `/${this.bucketName}/${tmpObjectName}`, // NOTICE: 此处要填入带bucketName的完成路径
              conditions: {
                matchETag: etag,
              },
            },
            {
              parentCtx: ctx,
            }
          );
        } finally {
          this.minioClient.removeObject(this.bucketName, tmpObjectName);
        }

        const url = buildUploadUrl(objectName);

        // 异步执行, 将其存入数据库
        this.minioClient.statObject(this.bucketName, objectName).then((stat) =>
          this.adapter.insert({
            etag,
            userId: Types.ObjectId(userId),
            bucketName: this.bucketName,
            objectName,
            url,
            size: stat.size,
            metaData: stat.metaData,
          })
        );

        resolve({
          etag,
          path: `${this.bucketName}/${objectName}`,
          url,
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * 获取客户端的信息
   */
  async get(
    ctx: PureContext<{
      objectName: string;
    }>
  ) {
    const objectName = ctx.params.objectName;

    const stream = await this.actions['getObject'](
      {
        bucketName: this.bucketName,
        objectName,
      },
      {
        parentCtx: ctx,
      }
    );

    return stream;
  }

  randomName() {
    return `unnamed_${this.broker.nodeID}_${Date.now()}`;
  }
}

export default FileService;

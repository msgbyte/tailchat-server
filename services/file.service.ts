import { TcService } from './base';
import type { TcContext } from './types';
import { config, uploadDir } from '../lib/settings';
import { sync as mkdir } from 'mkdirp';
import MinioService from 'moleculer-minio';
import _ from 'lodash';
import mime from 'mime';
import type { Client as MinioClient } from 'minio';

mkdir(uploadDir);

export default class FileService extends TcService {
  get serviceName(): string {
    return 'file';
  }

  get minioClient(): MinioClient {
    return this.client;
  }

  onInit(): void {
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
  }

  async onInited() {
    // TODO: 看看有没有办法用一个ctx包起来
    // Services Available
    const isExists = await this.actions['bucketExists']({
      bucketName: config.storage.bucketName,
    });
    if (isExists === false) {
      // bucket不存在，创建新的
      await this.actions['makeBucket']({
        bucketName: config.storage.bucketName,
      });
    }

    const buckets = await this.actions['listBuckets']();
    this.logger.info(`[File] MinioInfo: | buckets: ${buckets}`);
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
    this.logger.info('Received upload meta:', ctx.meta);

    const originFilename = String(ctx.meta.filename);
    const ext = _.last(originFilename.split('.'));

    const stream = ctx.params as ReadableStream;
    const objectName = `test/${this.randomName()}.${ext}`;
    const objectId = await this.actions['putObject'](stream, {
      meta: {
        bucketName: config.storage.bucketName,
        objectName,
        metaData: {
          'content-type': mime.getType(ext),
        },
      },
      parentCtx: ctx,
    });

    const file = await this.actions['presignedGetObject'](
      {
        bucketName: config.storage.bucketName,
        objectName,
        expires: 600,

        // Fake
        reqParams: {},
        requestDate: new Date().toISOString(),
      },
      { parentCtx: ctx }
    );

    return {
      objectId,
      path: `${config.storage.bucketName}/${objectName}`,
      file,
    };
  }

  randomName() {
    return 'unnamed_' + Date.now();
  }
}

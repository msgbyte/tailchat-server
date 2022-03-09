import { TcService, config, TcDbService, TcContext } from 'tailchat-server-sdk';
import _ from 'lodash';
import {
  filterAvailableAppCapability,
  OpenAppDocument,
  OpenAppModel,
} from '../../models/openapi/app';
import { EntityError } from '../../lib/errors';
import { Types } from 'mongoose';
import { nanoid } from 'nanoid';

interface OpenAppService
  extends TcService,
    TcDbService<OpenAppDocument, OpenAppModel> {}
class OpenAppService extends TcService {
  get serviceName(): string {
    return 'openapi.app';
  }

  onInit(): void {
    if (!config.enableOpenapi) {
      return;
    }

    this.registerLocalDb(require('../../models/openapi/app').default);

    this.registerAction('all', this.all);
    this.registerAction('create', this.create, {
      params: {
        appName: 'string',
        appDesc: 'string',
        appIcon: 'string',
      },
    });
    this.registerAction('setAppCapability', this.setAppCapability, {
      params: {
        appId: 'string',
        capability: { type: 'array', items: 'string' },
      },
    });
  }

  /**
   * 获取用户参与的所有应用
   */
  async all(ctx: TcContext<{}>) {
    const apps = await this.adapter.model.find({
      owner: ctx.meta.userId,
    });

    return await this.transformDocuments(ctx, {}, apps);
  }

  /**
   * 创建一个第三方应用
   */
  async create(
    ctx: TcContext<{
      appName: string;
      appDesc: string;
      appIcon: string;
    }>
  ) {
    const { appName, appDesc, appIcon } = ctx.params;
    const userId = ctx.meta.userId;

    if (!appName) {
      throw new EntityError();
    }

    const doc = await this.adapter.model.create({
      owner: String(userId),
      appId: `tc_${new Types.ObjectId().toString()}`,
      appSecret: nanoid(32),
      appName,
      appDesc,
      appIcon,
    });

    return await this.transformDocuments(ctx, {}, doc);
  }

  async setAppCapability(
    ctx: TcContext<{
      appId: string;
      capability: string[];
    }>
  ) {
    const { appId, capability } = ctx.params;

    const openapp = await this.adapter.model.findAppById(appId);
    await openapp
      .updateOne({
        capability: filterAvailableAppCapability(capability),
      })
      .exec();

    return true;
  }
}

export default OpenAppService;

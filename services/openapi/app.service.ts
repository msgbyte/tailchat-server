import { TcService } from '../base';
import { config } from '../../lib/settings';
import _ from 'lodash';
import type { TcDbService } from '../../mixins/db.mixin';
import {
  filterAvailableAppCapability,
  OpenAppDocument,
  OpenAppModel,
} from '../../models/openapi/app';
import type { TcContext } from '../types';
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

    this.registerDb('openapi.app');

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

    if (!appName) {
      throw new EntityError();
    }

    const doc = await this.adapter.model.create({
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

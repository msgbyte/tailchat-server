import {
  TcService,
  TcDbService,
  TcContext,
  TcPureContext,
} from 'tailchat-server-sdk';
import { generateRandomStr } from '../../../lib/utils';
import type {
  SimpleNotifyDocument,
  SimpleNotifyModel,
} from '../models/simplenotify';

/**
 * 任务管理服务
 */
interface SimpleNotifyService
  extends TcService,
    TcDbService<SimpleNotifyDocument, SimpleNotifyModel> {}
class SimpleNotifyService extends TcService {
  botUserId: string | undefined;

  get serviceName() {
    return 'plugin:com.msgbyte.simplenotify';
  }

  onInit() {
    this.registerLocalDb(require('../models/simplenotify').default);

    this.registerAction('add', this.add, {
      params: {
        groupId: 'string',
        textPanelId: 'string',
      },
    });
    this.registerAction('list', this.list, {
      params: {
        groupId: 'string',
      },
    });
    this.registerAction('delete', this.delete, {
      params: {
        groupId: 'string',
        subscribeId: 'string',
      },
    });
    this.registerAction('webhook.callback', this.webhookHandler, {
      params: {
        subscribeId: 'string',
        text: 'string',
      },
    });

    this.registerAuthWhitelist([
      '/plugin:com.msgbyte.simplenotify/webhook/callback',
    ]);
  }

  protected onInited(): void {
    // 确保机器人用户存在, 并记录机器人用户id
    this.waitForServices(['user']).then(async () => {
      try {
        const botUserId = await this.broker.call('user.ensurePluginBot', {
          botId: 'simple-notify-bot',
          nickname: 'Notify Bot',
          avatar:
            'https://api.iconify.design/icon-park-outline/volume-notice.svg',
        });

        this.logger.info('Simple Notify Bot Id:', botUserId);

        this.botUserId = String(botUserId);
      } catch (e) {
        this.logger.error(e);
      }
    });
  }

  /**
   * 添加订阅
   */
  async add(
    ctx: TcContext<{
      groupId: string;
      textPanelId: string;
    }>
  ) {
    const { groupId, textPanelId } = ctx.params;

    if (!groupId || !textPanelId) {
      throw new Error('参数不全');
    }

    const isGroupOwner = await ctx.call('group.isGroupOwner', {
      groupId,
    });
    if (isGroupOwner !== true) {
      throw new Error('没有操作权限');
    }

    // TODO: 需要检查textPanelId是否合法

    await this.adapter.model.create({
      groupId,
      textPanelId,
      token: generateRandomStr(),
    });
  }

  /**
   * 列出所有订阅
   */
  async list(
    ctx: TcContext<{
      groupId: string;
    }>
  ) {
    const groupId = ctx.params.groupId;

    const docs = await this.adapter.model
      .find({
        groupId,
      })
      .exec();

    return await this.transformDocuments(ctx, {}, docs);
  }

  /**
   * 列出指定订阅
   */
  async delete(
    ctx: TcContext<{
      groupId: string;
      subscribeId: string;
    }>
  ) {
    const { groupId, subscribeId } = ctx.params;
    const isGroupOwner = await ctx.call('group.isGroupOwner', {
      groupId,
    });
    if (isGroupOwner !== true) {
      throw new Error('没有操作权限');
    }

    await this.adapter.model.deleteOne({
      _id: subscribeId,
    });
  }

  /**
   * 处理github webhook 回调
   */
  async webhookHandler(
    ctx: TcPureContext<{
      subscribeId: string;
      text: string;
    }>
  ) {
    if (!this.botUserId) {
      throw new Error('Not github bot');
    }

    const subscribe = await this.adapter.model.findById(ctx.params.subscribeId);
    if (!subscribe) {
      throw new Error('没有找到该订阅');
    }

    const groupId = String(subscribe.groupId);
    const converseId = String(subscribe.textPanelId);
    this.sendPluginBotMessage(ctx, {
      groupId,
      converseId,
      content: ctx.params.text,
    });
  }

  private async sendPluginBotMessage(
    ctx: TcPureContext<any>,
    messagePayload: {
      converseId: string;
      groupId?: string;
      content: string;
      meta?: any;
    }
  ) {
    if (!this.botUserId) {
      throw new Error('Not Simple Notify bot');
    }

    const res = await ctx.call(
      'chat.message.sendMessage',
      {
        ...messagePayload,
      },
      {
        meta: {
          userId: this.botUserId,
        },
      }
    );

    return res;
  }
}

export default SimpleNotifyService;

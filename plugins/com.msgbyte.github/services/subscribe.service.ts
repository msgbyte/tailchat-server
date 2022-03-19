import {
  TcService,
  TcPureContext,
  TcContext,
  TcDbService,
} from 'tailchat-server-sdk';
import type { WebhookEvent } from '@octokit/webhooks-types';
import type { SubscribeDocument, SubscribeModel } from '../models/subscribe';

/**
 * Github订阅服务
 */

interface GithubSubscribeService
  extends TcService,
    TcDbService<SubscribeDocument, SubscribeModel> {}
class GithubSubscribeService extends TcService {
  botUserId: string | undefined;

  get serviceName() {
    return 'plugin:com.msgbyte.github.subscribe';
  }

  onInit() {
    this.registerLocalDb(require('../models/subscribe').default);

    this.registerAction('add', this.add, {
      params: {
        groupId: 'string',
        textPanelId: 'string',
        repoName: 'string',
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
    this.registerAction('webhook.callback', this.webhookHandler);

    this.registerAuthWhitelist([
      '/plugin:com.msgbyte.github.subscribe/webhook/callback',
    ]);
  }

  protected onInited(): void {
    // 确保机器人用户存在, 并记录机器人用户id
    this.broker.waitForServices(['user']).then(async () => {
      const botUserId = await this.broker.call('user.ensurePluginBot', {
        botId: 'github-bot',
        nickname: 'Github Bot',
        avatar: 'https://api.iconify.design/akar-icons/github-fill.svg',
      });

      this.logger.info('Github Bot Id:', botUserId);

      this.botUserId = String(botUserId);
    });
  }

  /**
   * 添加订阅
   */
  async add(
    ctx: TcContext<{
      groupId: string;
      textPanelId: string;
      repoName: string;
    }>
  ) {
    const { groupId, textPanelId, repoName } = ctx.params;

    if (!groupId || !textPanelId || !repoName) {
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
      repoName,
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
  async webhookHandler(ctx: TcPureContext<any>) {
    if (!this.botUserId) {
      throw new Error('Not github bot');
    }

    const event = ctx.params as WebhookEvent;

    if ('pusher' in event) {
      // Is push event
      const name = event.pusher.name;
      const repo = event.repository.full_name;
      const compareUrl = event.compare;
      const commits = event.commits.map((c) => `- ${c.message}`).join('\n');

      const message = `${name} 在 ${repo} 提交了新的内容:\n${commits}\n\n查看改动: ${compareUrl}`;

      const subscribes = await this.adapter.model.find({
        repoName: repo,
      });

      this.logger.info(
        '发送Github推送通知:',
        subscribes
          .map((s) => `${s.repoName}|${s.groupId}|${s.textPanelId}`)
          .join(',')
      );

      for (const s of subscribes) {
        const groupId = String(s.groupId);
        const converseId = String(s.textPanelId);

        this.sendPluginBotMessage(ctx, {
          groupId,
          converseId,
          content: message,
        });
      }
    }
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

export default GithubSubscribeService;

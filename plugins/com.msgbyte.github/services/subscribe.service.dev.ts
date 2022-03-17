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
    this.registerAction('webhook.callback', this.webhookHandler);
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
    if (!isGroupOwner) {
      throw new Error('没有操作权限');
    }

    await this.adapter.model.create({
      groupId,
      textPanelId,
      repoName,
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

      // TODO: check sub and send message
      console.log(message);
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

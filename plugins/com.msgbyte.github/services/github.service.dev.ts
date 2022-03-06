import { TcService } from '../../../services/base';
import type { TcContext, TcPureContext } from '../../../services/types';
import type { WebhookEvent } from '@octokit/webhooks-types';

/**
 * Github服务
 */
class GithubService extends TcService {
  botUserId: string | undefined;

  get serviceName() {
    return 'plugin:com.msgbyte.github';
  }

  onInit() {
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

  /**
   * 处理github webhook 回调
   */
  async webhookHandler(ctx: TcPureContext<any>) {
    if (!this.botUserId) {
      throw new Error('Not github bot');
    }

    const event = ctx.params as WebhookEvent;

    if ('pusher' in event) {
      // Push event
      const name = event.pusher.name;
      const repo = event.repository.full_name;
      const compareUrl = event.compare;
      const commits = event.commits.map((c) => `- ${c.message}`).join('\n');

      const message = `${name} 在 ${repo} 提交了新的内容:\n${commits}\n查看改动: ${compareUrl}`;

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

export default GithubService;

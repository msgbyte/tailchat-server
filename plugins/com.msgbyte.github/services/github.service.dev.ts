import { TcService } from '../../../services/base';
import type { TcContext, TcPureContext } from '../../../services/types';
import { WebhookEvent } from '@octokit/webhooks-types';

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
   * TODO
   * 处理webhook
   */
  webhookHandler(ctx: TcPureContext<any>) {
    if (!this.botUserId) {
      throw new Error('Not github bot');
    }

    const event = ctx.params as WebhookEvent;

    console.log(event);
  }
}

export default GithubService;

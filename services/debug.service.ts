import { TcService, TcPureContext } from 'tailchat-server-sdk';

export default class TestService extends TcService {
  get serviceName(): string {
    return 'debug';
  }

  onInit(): void {
    this.registerAction('hello', this.echo, {
      params: {
        name: [{ type: 'string', optional: true }],
      },
    });
  }

  // Action
  public echo(ctx: TcPureContext<{ name: string }>): string {
    console.log(ctx.meta);
    return `Hello ${
      ctx.params.name ?? ctx.meta.t('匿名用户')
    }, \nHere is your meta info: ${JSON.stringify(ctx.meta, null, 2)}`;
  }
}

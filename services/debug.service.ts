import { Service, ServiceBroker, Context } from 'moleculer';

export default class TestService extends Service {
  public constructor(public broker: ServiceBroker) {
    super(broker);

    this.parseServiceSchema({
      name: 'debug',
      actions: {
        echo: {
          rest: {
            method: 'GET',
            path: '/hello',
          },
          params: {
            name: [{ type: 'string', optional: true }],
          },
          handler: this.echo,
        },
      },
    });
  }

  // Action
  public echo(ctx: Context<{ name: string }>): string {
    console.log(ctx.meta);
    return `Hello ${
      ctx.params.name ?? 'Anonymous'
    }, \nHere is your meta info: ${JSON.stringify(ctx.meta, null, 2)}`;
  }
}

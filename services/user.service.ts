import { Service, ServiceBroker, Context } from 'moleculer';

export default class ApiService extends Service {
  public constructor(broker: ServiceBroker) {
    super(broker);
    // @ts-ignore
    this.parseServiceSchema({
      name: 'user',
      actions: {
        login: {
          rest: 'POST /login',
          async handler(ctx: Context<{ id: string; value: number }>) {
            return {
              id: 1,
              username: 'test',
            };
          },
        },
      },
    });
  }
}

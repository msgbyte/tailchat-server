import { Service, ServiceBroker, Context } from 'moleculer';
import { DbService } from '../mixins/db.mixin';

export default class UserService extends Service {
  public constructor(broker: ServiceBroker) {
    super(broker);

    this.parseServiceSchema({
      name: 'user',
      mixins: [DbService],
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

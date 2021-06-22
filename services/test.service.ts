'use strict';

import { Service, ServiceBroker, Context } from 'moleculer';

export default class GreeterService extends Service {
  public constructor(public broker: ServiceBroker) {
    super(broker);

    this.parseServiceSchema({
      name: 'test',
      actions: {
        echo: {
          rest: {
            method: 'GET',
            path: '/hello',
          },
          params: {
            name: 'string',
          },
          handler: async (ctx): Promise<string> => {
            return this.ActionHello(ctx.params.name);
          },
        },
      },
    });
  }

  // Action
  public ActionHello(name: string): string {
    return `Hello ${name}`;
  }
}

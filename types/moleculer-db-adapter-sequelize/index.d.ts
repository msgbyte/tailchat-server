/**
 * 参考: https://github.com/moleculerjs/moleculer-db/blob/master/packages/moleculer-db-adapter-mongoose/index.d.ts
 */

declare module 'moleculer-db-adapter-sequelize' {
  import { Service, ServiceBroker } from 'moleculer';

  class SequelizeDbAdapter {
    constructor(uri: string);
  }
  export = SequelizeDbAdapter;
}

import { ServiceSchema } from 'moleculer';
import { sync as mkdirSync } from 'mkdirp';
import * as path from 'path';
import BaseDBService from 'moleculer-db';

export const PawDbService = (collection: string): Partial<ServiceSchema> => {
  if (process.env.MONGO_URI) {
    // Mongo adapter
    const MongoAdapter = require('moleculer-db-adapter-mongo');

    return {
      mixins: [BaseDBService],
      adapter: new MongoAdapter(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
      collection,
    };
  }

  // --- NeDB fallback DB adapter

  // Create data folder
  mkdirSync(path.resolve('./data'));

  return {
    mixins: [BaseDBService],
    adapter: new BaseDBService.MemoryAdapter({
      filename: `./data/${collection}.db`,
    }),

    methods: {
      async entityChanged(type, json, ctx) {
        await this.clearCache();
        const eventName = `${this.name}.entity.${type}`;
        this.broker.emit(eventName, { meta: ctx.meta, entity: json });
      },
    },
  };
};

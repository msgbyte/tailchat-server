import type { Context, ServiceSchema } from 'moleculer';
import { sync as mkdirSync } from 'mkdirp';
import * as path from 'path';
import BaseDBService, { MoleculerDB } from 'moleculer-db';
import type MongooseDbAdapter from 'moleculer-db-adapter-mongoose';
import type { Document, FilterQuery, Model } from 'mongoose';

type EntityChangedType = 'created';

// type MoleculerDBMethods = MoleculerDB<MongooseDbAdapter>['methods'];
type MoleculerDBMethods = MoleculerDB<any>['methods'];

// fork from moleculer-db-adapter-mongoose/index.d.ts
interface FindFilters<T extends Document> {
  query?: FilterQuery<T>;
  search?: string;
  searchFields?: string[]; // never used???
  sort?: string | string[];
  offset?: number;
  limit?: number;
}

// 复写部分 adapter 的方法类型
interface PawDbAdapterOverwrite<T extends Document, M extends Model<T>> {
  model: M;
  insert(entity: Partial<T>): Promise<T>;
  find(filters: FindFilters<T>): Promise<T>;
  findOne(query: FilterQuery<T>): Promise<T | null>;
}

export interface PawDbService<
  T extends Document = Document,
  M extends Model<T> = Model<T>
> extends MoleculerDBMethods {
  entityChanged(type: EntityChangedType, json: {}, ctx: Context): Promise<void>;

  adapter: Omit<MongooseDbAdapter<T>, keyof PawDbAdapterOverwrite<T, M>> &
    PawDbAdapterOverwrite<T, M>;

  /**
   * 转换fetch出来的文档, 变成一个json
   */
  transformDocuments: MoleculerDB<
    // @ts-ignore
    MongooseDbAdapter<T>
  >['methods']['transformDocuments'];
}

export const PawDbService = (
  collectionName: string
): Partial<ServiceSchema> => {
  const actions = {
    /**
     * 自动操作全关
     */
    find: false,
    count: false,
    list: false,
    create: false,
    insert: false,
    get: false,
    update: false,
    remove: false,
  };

  const methods = {
    /**
     * 实体变更时触发事件
     */
    async entityChanged(type, json, ctx) {
      await this.clearCache();
      const eventName = `${this.name}.entity.${type}`;
      this.broker.emit(eventName, { meta: ctx.meta, entity: json });
    },
  };
  if (process.env.MONGO_URI) {
    // Mongo adapter
    const MongooseDbAdapter = require('moleculer-db-adapter-mongoose');

    // 获取model
    const modelPath = `../models/${collectionName}`;
    delete require.cache[require.resolve(modelPath)];
    const model = require(modelPath).default;

    return {
      mixins: [BaseDBService],
      adapter: new MongooseDbAdapter(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
      model,
      actions,
      methods,
    };
  }

  // --- NeDB fallback DB adapter

  // Create data folder
  mkdirSync(path.resolve('./data'));

  return {
    mixins: [BaseDBService],
    adapter: new BaseDBService.MemoryAdapter({
      filename: `./data/${collectionName}.db`,
    }),
    actions,
    methods,
  };
};

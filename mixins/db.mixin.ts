import { ServiceSchema } from 'moleculer';
import { DbService as baseDBService } from 'moleculer-db';
import SqlAdapter from 'moleculer-db-adapter-sequelize';

// TODO
export const DbService: Partial<ServiceSchema> = {
  mixins: [baseDBService],
  adapter: new SqlAdapter('sqlite://:memory:'),
};

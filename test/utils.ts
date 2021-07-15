import { ServiceBroker } from 'moleculer';
import type { PawService } from '../services/base';

export function createTestServiceBroker<T extends PawService = PawService>(
  serviceCls: typeof PawService
): {
  broker: ServiceBroker;
  service: T;
  insertTestData: <E, R extends E = E>(
    entity: E
  ) => Promise<R & { _id: string }>;
} {
  const broker = new ServiceBroker({ logger: false });
  const service = broker.createService(serviceCls) as T;
  const testDataStack = [];

  beforeAll(async () => {
    await broker.start();
  });
  afterAll(async () => {
    await Promise.all(
      testDataStack.map((item) => {
        if (typeof service.adapter !== 'object') {
          throw new Error('无法调用 insertTestData');
        }

        return service.adapter.removeById(item._id);
      })
    )
      .then(() => {
        console.log(`已清理 ${testDataStack.length} 条测试数据`);
      })
      .catch((err) => {
        console.error('测试数据清理失败:', err);
      });

    await broker.stop();
  });

  const insertTestData = async (entity: any) => {
    if (typeof service.adapter !== 'object') {
      throw new Error('无法调用 insertTestData');
    }
    const doc = await service.adapter.insert(entity);
    testDataStack.push(doc);
    return doc;
  };

  return {
    broker,
    service,
    insertTestData,
  };
}

import { ServiceBroker } from 'moleculer';
import type { TcService } from '../services/base';
import jwt from 'jsonwebtoken';
import type { DocumentType } from '@typegoose/typegoose';
import { config } from '../lib/settings';

export function createTestServiceBroker<T extends TcService = TcService>(
  serviceCls: typeof TcService
): {
  broker: ServiceBroker;
  service: T;
  insertTestData: <E, R extends E = E>(
    entity: E
  ) => Promise<DocumentType<R & { _id: string }>>;
} {
  const broker = new ServiceBroker({ logger: false });
  const service = broker.createService(serviceCls) as T;
  const testDataStack = [];

  // Mock
  service.roomcastNotify = jest.fn();

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

/**
 * 创建用户Token
 */
export function createTestUserToken(
  user: {
    _id: string;
    username: string;
    email: string;
    avatar: string;
  } = {
    _id: '',
    username: 'test',
    email: 'test',
    avatar: '',
  }
): string {
  return jwt.sign(
    {
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
    },
    config.jwtSecret,
    {
      expiresIn: '30d',
    }
  );
}

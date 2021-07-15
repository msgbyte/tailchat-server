import { createTestServiceBroker } from '../../utils';
import MessageService from '../../../services/chat/message.service';
import type { MessageDocument } from '../../../models/chat/message';
import { Types } from 'mongoose';
import _ from 'lodash';

function createTestMessage(
  converseId: Types.ObjectId,
  content: string = 'bar'
) {
  return {
    content,
    // author: '',
    // groupId: '',
    avatar: null,
    converseId,
  };
}

describe('Test "chat.message" service', () => {
  const { broker, service, insertTestData } =
    createTestServiceBroker<MessageService>(MessageService);

  describe('Test "chat.message.fetchConverseMessage"', () => {
    test('single message', async () => {
      const converseId = Types.ObjectId();
      const testDoc = await insertTestData(createTestMessage(converseId));

      const res: MessageDocument = await broker.call(
        'chat.message.fetchConverseMessage',
        {
          converseId: String(converseId),
        }
      );

      expect(res).not.toBe(null);
      expect(Array.isArray(res)).toBe(true);
      expect(_.get(res, [0, '_id'])).toBe(String(testDoc._id));
    });

    test('limit should be ok', async () => {
      const converseId = Types.ObjectId();
      const docs = await Promise.all(
        Array(60)
          .fill(null)
          .map(() => insertTestData(createTestMessage(converseId)))
      );

      const res: MessageDocument[] = await broker.call(
        'chat.message.fetchConverseMessage',
        {
          converseId: String(converseId),
        }
      );

      expect(res).not.toBe(null);
      expect(Array.isArray(res)).toBe(true);
      expect(res.length).toBe(50);
    });

    test('startId should be ok', async () => {
      const converseId = Types.ObjectId();
      const docs = await Promise.all(
        Array(60)
          .fill(null)
          .map(() => insertTestData(createTestMessage(converseId)))
      );

      const startId = docs[20]._id; // 这是第21条数据

      const res: MessageDocument[] = await broker.call(
        'chat.message.fetchConverseMessage',
        {
          converseId: String(converseId),
          startId: String(startId),
        }
      );

      expect(res).not.toBe(null);
      expect(Array.isArray(res)).toBe(true);
      expect(res.length).toBe(20); // 因为是倒序排列, 所以会拿到前20条
    });
  });
});

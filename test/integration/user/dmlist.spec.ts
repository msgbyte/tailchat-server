import { createTestServiceBroker } from '../../utils';
import UserDMListService from '../../../services/user/dmlist.service';
import { Types } from 'mongoose';
import type { UserDMList } from '../../../models/user/dmList';

describe('Test "dmlist" service', () => {
  const { broker, service, insertTestData } =
    createTestServiceBroker<UserDMListService>(UserDMListService);

  describe('Test "user.dmlist.addConverse"', () => {
    test('addConverse should be ok', async () => {
      const userId = String(Types.ObjectId());
      const converseId = String(Types.ObjectId());

      await broker.call(
        'user.dmlist.addConverse',
        {
          converseId,
        },
        {
          meta: {
            userId,
          },
        }
      );

      try {
        const res = await service.adapter.model.findOne({
          userId,
        });

        expect(res.converseIds.map((r) => String(r))).toEqual([converseId]); // 应该被成功插入
      } finally {
        await service.adapter.model.deleteOne({
          userId,
        });
      }
    });

    test('addConverse should not be repeat', async () => {
      const userId = String(Types.ObjectId());
      const converseId = String(Types.ObjectId());

      await broker.call(
        'user.dmlist.addConverse',
        {
          converseId,
        },
        {
          meta: {
            userId,
          },
        }
      );

      await broker.call(
        'user.dmlist.addConverse',
        {
          converseId,
        },
        {
          meta: {
            userId,
          },
        }
      );

      try {
        const res = await service.adapter.model.findOne({
          userId,
        });

        expect(res.converseIds.map((r) => String(r))).toEqual([converseId]); // 应该被成功插入
      } finally {
        await service.adapter.model.deleteOne({
          userId,
        });
      }
    });

    test('addConverse can be add more', async () => {
      const userId = String(Types.ObjectId());
      const converseId = String(Types.ObjectId());
      const converseId2 = String(Types.ObjectId());

      await broker.call(
        'user.dmlist.addConverse',
        {
          converseId,
        },
        {
          meta: {
            userId,
          },
        }
      );

      await broker.call(
        'user.dmlist.addConverse',
        {
          converseId: converseId2,
        },
        {
          meta: {
            userId,
          },
        }
      );

      try {
        const res = await service.adapter.model.findOne({
          userId,
        });

        expect(res.converseIds.map((r) => String(r))).toEqual([
          converseId,
          converseId2,
        ]);
      } finally {
        await service.adapter.model.deleteOne({
          userId,
        });
      }
    });
  });

  test('Test "user.dmlist.removeConverse"', async () => {
    const userId = String(Types.ObjectId());
    const converseId = new Types.ObjectId();

    await insertTestData({
      userId,
      converseIds: [converseId],
    });

    expect(
      (await service.adapter.model.findOne({ userId })).converseIds.length
    ).toBe(1);

    await broker.call(
      'user.dmlist.removeConverse',
      {
        converseId: String(converseId),
      },
      {
        meta: {
          userId,
        },
      }
    );

    expect(
      (await service.adapter.model.findOne({ userId })).converseIds.length
    ).toBe(0);
  });

  test('Test "user.dmlist.getAllConverse"', async () => {
    const userId = String(Types.ObjectId());

    const testData = await insertTestData({
      userId,
      converseIds: [Types.ObjectId()],
    });

    const dmlist: UserDMList = await broker.call(
      'user.dmlist.getAllConverse',
      {},
      {
        meta: {
          userId,
        },
      }
    );

    expect(dmlist._id).toEqual(String(testData._id));
    expect(dmlist.converseIds).toEqual([...testData.converseIds]);
  });
});

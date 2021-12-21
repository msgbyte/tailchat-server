import { createTestServiceBroker } from '../../../test/utils';
import TasksService from '../services/tasks.service';
import { Types } from 'mongoose';
import _ from 'lodash';

describe('Test "plugin:com.msgbyte.tasks" service', () => {
  const { broker, service, insertTestData } =
    createTestServiceBroker<TasksService>(TasksService);

  test('Test "plugin:com.msgbyte.tasks.add"', async () => {
    const assignee = new Types.ObjectId();
    const userId = new Types.ObjectId();

    const now = new Date();

    const task: any = await broker.call(
      'plugin:com.msgbyte.tasks.add',
      {
        title: 'foo',
        assignee: String(assignee),
        description: 'bar',
        expiredAt: now.toString(),
      },
      {
        meta: {
          userId: String(userId),
        },
      }
    );

    try {
      const record = await service.adapter.model.findOne({
        _id: task._id,
      });

      expect(record).toHaveProperty('_id');
      expect(record.title).toBe('foo');
      expect(record.description).toBe('bar');
      expect(record.done).toBe(false);
      expect(new Date(record.expiredAt).toISOString()).toBe(
        new Date(
          Math.floor(new Date(now).valueOf() / 1000) * 1000
        ).toISOString()
      );
    } finally {
      await service.adapter.model.findByIdAndDelete({
        _id: task._id,
      });
    }
  });

  test('Test "plugin:com.msgbyte.tasks.update"', async () => {
    const userId = new Types.ObjectId();
    const testTask = await insertTestData({
      creator: String(userId),
      title: 'foo',
    });

    await broker.call(
      'plugin:com.msgbyte.tasks.update',
      {
        taskId: String(testTask._id),
        title: 'bar',
      },
      {
        meta: {
          userId: String(userId),
        },
      }
    );

    const record = await service.adapter.model.findOne({
      _id: String(testTask._id),
    });

    expect(record).toHaveProperty('_id');
    expect(record.title).toBe('bar');
  });

  test('Test "plugin:com.msgbyte.tasks.done"', async () => {
    const userId = new Types.ObjectId();
    const testTask = await insertTestData({
      creator: String(userId),
      title: 'foo',
    });

    await broker.call(
      'plugin:com.msgbyte.tasks.done',
      {
        taskId: String(testTask._id),
      },
      {
        meta: {
          userId: String(userId),
        },
      }
    );

    const record = await service.adapter.model.findOne({
      _id: String(testTask._id),
    });

    expect(record).toHaveProperty('_id');
    expect(record.title).toBe('foo');
    expect(record.done).toBe(true);
  });
});

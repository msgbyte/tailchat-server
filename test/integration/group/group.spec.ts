import { createTestServiceBroker } from '../../utils';
import GroupService from '../../../services/group/group.service';
import { Types } from 'mongoose';
import { Group, GroupPanelType } from '../../../models/group/group';

function createTestGroup(
  userId: Types.ObjectId,
  groupInfo?: Partial<Group>
): Partial<Group> {
  return {
    name: 'test',
    owner: userId,
    members: [
      {
        role: ['manager'],
        userId: userId,
      },
    ],
    panels: [],
    ...groupInfo,
  };
}

describe('Test "group" service', () => {
  const { broker, service, insertTestData } =
    createTestServiceBroker<GroupService>(GroupService);

  test('Test "group.createGroup"', async () => {
    const userId = String(Types.ObjectId());

    const res: Group = await broker.call(
      'group.createGroup',
      {
        name: 'test',
        panels: [
          {
            id: '00',
            name: '频道1',
            type: GroupPanelType.TEXT,
          },
          {
            id: '10',
            name: '频道分组',
            type: GroupPanelType.GROUP,
          },
          {
            id: '11',
            name: '子频道',
            parentId: '10',
            type: GroupPanelType.TEXT,
          },
        ],
      },
      {
        meta: {
          userId,
        },
      }
    );

    try {
      expect(res).toHaveProperty('name', 'test');
      expect(res).toHaveProperty('panels');
      expect(res).toHaveProperty('owner');
      expect(res.members.length).toBe(1);

      // 面板ID会被自动转换
      const panels = res.panels;
      expect(panels[0].id).toHaveLength(24);
      expect(panels[1].id).toBe(panels[2].parentId);
    } finally {
      await service.adapter.model.findByIdAndRemove(res._id);
    }
  });

  test('Test "group.getUserGroups"', async () => {
    const userId = Types.ObjectId();
    const testGroup = await insertTestData(createTestGroup(userId));

    const res: Group[] = await broker.call(
      'group.getUserGroups',
      {},
      {
        meta: {
          userId: String(userId),
        },
      }
    );

    expect(res.length).toBe(1);
    expect(res[0]._id).toBe(String(testGroup._id));
  });

  test('Test "group.joinGroup"', async () => {
    const userId = Types.ObjectId();
    const testGroup = await insertTestData(createTestGroup(userId));

    expect(
      [...testGroup.members].map((v) => service.adapter.entityToObject(v))
    ).toEqual([
      {
        role: ['manager'],
        userId,
      },
    ]);

    const newMemberUserId = Types.ObjectId();

    const res: Group = await broker.call(
      'group.joinGroup',
      {
        groupId: String(testGroup._id),
      },
      {
        meta: {
          userId: String(newMemberUserId),
        },
      }
    );

    const newMembers = [...res.members].map((v) =>
      service.adapter.entityToObject(v)
    );
    expect(newMembers).toEqual([
      {
        role: ['manager'],
        userId,
      },
      {
        role: [],
        userId: newMemberUserId,
      },
    ]);
  });
});

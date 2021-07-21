import { createTestServiceBroker } from '../../utils';
import GroupService from '../../../services/group/group.service';
import { Types } from 'mongoose';
import { Group, GroupPanelType } from '../../../models/group/group';

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
      expect(res).toHaveProperty('creator');
      expect(res.members.length).toBe(1);

      // 面板ID会被自动转换
      const panels = res.panels;
      expect(panels[0].id).toHaveLength(24);
      expect(panels[1].id).toBe(panels[2].parentId);
    } finally {
      await service.adapter.model.findByIdAndRemove(res._id);
    }
  });
});

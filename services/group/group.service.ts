import _ from 'lodash';
import type { Context } from 'moleculer';
import { Types } from 'mongoose';
import {
  DataNotFoundError,
  EntityError,
  NoPermissionError,
} from '../../lib/errors';
import { isValidStr } from '../../lib/utils';
import type { TcDbService } from '../../mixins/db.mixin';
import {
  Group,
  GroupDocument,
  GroupModel,
  GroupPanel,
  GroupPanelType,
} from '../../models/group/group';
import { TcService } from '../base';
import type { TcContext } from '../types';

interface GroupService
  extends TcService,
    TcDbService<GroupDocument, GroupModel> {}
class GroupService extends TcService {
  get serviceName(): string {
    return 'group';
  }

  onInit(): void {
    this.registerDb('group.group');

    this.registerAction('createGroup', this.createGroup, {
      params: {
        name: 'string',
        panels: 'array',
      },
    });
    this.registerAction('getUserGroups', this.getUserGroups);
    this.registerAction(
      'getJoinedGroupAndPanelIds',
      this.getJoinedGroupAndPanelIds
    );
    this.registerAction('getGroupBasicInfo', this.getGroupBasicInfo, {
      params: {
        groupId: 'string',
      },
    });
    this.registerAction('updateGroupField', this.updateGroupField, {
      params: {
        groupId: 'string',
        fieldName: 'string',
        fieldValue: 'any',
      },
    });
    this.registerAction('isGroupOwner', this.isGroupOwner, {
      params: {
        groupId: 'string',
      },
    });
    this.registerAction('joinGroup', this.joinGroup, {
      params: {
        groupId: 'string',
      },
      visibility: 'public',
    });
    this.registerAction('quitGroup', this.quitGroup, {
      params: {
        groupId: 'string',
      },
    });
    this.registerAction('createGroupPanel', this.createGroupPanel, {
      params: {
        groupId: 'string',
        name: 'string',
        type: 'number',
        parentId: { type: 'string', optional: true },
        provider: { type: 'string', optional: true },
        pluginPanelName: { type: 'string', optional: true },
        meta: { type: 'object', optional: true },
      },
    });
    this.registerAction('deleteGroupPanel', this.deleteGroupPanel, {
      params: {
        groupId: 'string',
        panelId: 'string',
      },
    });
    this.registerAction(
      'getGroupLobbyConverseId',
      this.getGroupLobbyConverseId,
      {
        params: {
          groupId: 'string',
        },
      }
    );
  }

  /**
   * 获取群组所有的文字面板id列表
   * 用于加入房间
   */
  private getGroupTextPanelIds(group: Group): string[] {
    // TODO: 先无视权限, 把所有的信息全部显示
    const textPanelIds = group.panels
      .filter((p) => p.type === GroupPanelType.TEXT)
      .map((p) => p.id);

    return textPanelIds;
  }

  /**
   * 创建群组
   */
  async createGroup(
    ctx: TcContext<{
      name: string;
      panels: GroupPanel[];
    }>
  ) {
    const name = ctx.params.name;
    const panels = ctx.params.panels;
    const userId = ctx.meta.userId;

    const group = await this.adapter.model.createGroup({
      name,
      panels,
      owner: userId,
    });

    const textPanelIds = this.getGroupTextPanelIds(group);

    await ctx.call('gateway.joinRoom', {
      roomIds: [String(group._id), ...textPanelIds],
      userId,
    });

    return this.transformDocuments(ctx, {}, group);
  }

  async getUserGroups(ctx: TcContext): Promise<Group[]> {
    const userId = ctx.meta.userId;

    const groups = await this.adapter.model.getUserGroups(userId);

    return this.transformDocuments(ctx, {}, groups);
  }

  /**
   * 获取用户所有加入群组的群组id列表与聊天会话id列表
   */
  async getJoinedGroupAndPanelIds(ctx: TcContext): Promise<{
    groupIds: string[];
    panelIds: string[];
  }> {
    const groups = await this.getUserGroups(ctx); // TODO: 应该使用call而不是直接调用，为了获取tracer和caching支持。目前moleculer的文档没有显式的声明类似localCall的行为，可以花时间看一下
    const panelIds = _.flatten(groups.map((g) => this.getGroupTextPanelIds(g)));

    return {
      groupIds: groups.map((g) => String(g._id)),
      panelIds,
    };
  }

  /**
   * 获取群组基本信息
   */
  async getGroupBasicInfo(
    ctx: Context<{
      groupId: string;
    }>
  ) {
    const group = await this.adapter.model
      .findById(ctx.params.groupId, {
        name: 1,
        avatar: 1,
        owner: 1,
        members: 1,
      })
      .exec();

    if (group === null) {
      return null;
    }

    const groupMemberCount = group.members.length;

    return {
      name: group.name,
      avatar: group.avatar,
      owner: group.owner,
      memberCount: groupMemberCount,
    };
  }

  /**
   * 修改群组字段
   */
  async updateGroupField(
    ctx: TcContext<{
      groupId: string;
      fieldName: string;
      fieldValue: unknown;
    }>
  ) {
    const { groupId, fieldName, fieldValue } = ctx.params;
    const userId = ctx.meta.userId;
    if (!['name', 'avatar', 'panels', 'roles'].includes(fieldName)) {
      throw new EntityError('该数据不允许修改');
    }

    const group = await this.adapter.model.findById(groupId).exec();
    if (String(group.owner) !== userId) {
      throw new NoPermissionError();
    }

    group[fieldName] = fieldValue;
    await group.save();

    this.roomcastNotify(ctx, groupId, 'updateInfo', group);
  }

  /**
   * 检测用户是否为群组所有者
   */
  async isGroupOwner(
    ctx: TcContext<{
      groupId: string;
    }>
  ): Promise<boolean> {
    const group = await this.adapter.model.findById(ctx.params.groupId);
    if (!group) {
      throw new DataNotFoundError('没有找到群组');
    }

    return String(group.owner) === ctx.meta.userId;
  }

  /**
   * 加入群组
   */
  async joinGroup(
    ctx: TcContext<{
      groupId: string;
    }>
  ) {
    const groupId = ctx.params.groupId;
    const userId = ctx.meta.userId;

    if (!isValidStr(userId)) {
      throw new EntityError('用户id为空');
    }

    if (!isValidStr(groupId)) {
      throw new EntityError('群组id为空');
    }

    const doc = await this.adapter.model
      .findByIdAndUpdate(
        groupId,
        {
          $addToSet: {
            members: {
              userId: Types.ObjectId(userId),
            },
          },
        },
        {
          new: true,
        }
      )
      .exec();

    const group: Group = await this.transformDocuments(ctx, {}, doc);

    this.roomcastNotify(ctx, groupId, 'updateInfo', group);
    this.unicastNotify(ctx, userId, 'add', group);

    const textPanelIds = this.getGroupTextPanelIds(group);
    await ctx.call('gateway.joinRoom', {
      roomIds: [String(group._id), ...textPanelIds],
      userId,
    });

    return group;
  }

  /**
   * 退出群组
   */
  async quitGroup(
    ctx: TcContext<{
      groupId: string;
    }>
  ) {
    const groupId = ctx.params.groupId;
    const userId = ctx.meta.userId;

    const group = await this.adapter.findById(groupId);
    if (String(group.owner) === userId) {
      // 是群组所有人
      await this.adapter.removeById(groupId); // TODO: 后续可以考虑改为软删除
      await this.roomcastNotify(ctx, groupId, 'remove', { groupId });
      await ctx.call('gateway.leaveRoom', {
        roomIds: [groupId],
      });
    } else {
      // 是普通群组成员
      const doc = await this.adapter.model
        .findByIdAndUpdate(
          groupId,
          {
            $pull: {
              members: {
                userId: Types.ObjectId(userId),
              },
            },
          },
          {
            new: true,
          }
        )
        .exec();

      const group: Group = await this.transformDocuments(ctx, {}, doc);

      // 先将自己退出房间， 然后再进行房间级别通知
      await ctx.call('gateway.leaveRoom', {
        roomIds: [
          groupId,
          ...group.panels
            .filter((p) => p.type === GroupPanelType.TEXT)
            .map((p) => p.id),
        ], // 离开群组和所有面板房间
        userId,
      });

      this.roomcastNotify(ctx, groupId, 'updateInfo', group);
      this.unicastNotify(ctx, userId, 'remove', { groupId });
    }
  }

  /**
   * 创建群组面板
   */
  async createGroupPanel(
    ctx: TcContext<{
      groupId: string;
      name: string;
      type: number;
      parentId?: string;
      provider?: string;
      pluginPanelName?: string;
      meta?: object;
    }>
  ) {
    const { groupId, name, type, parentId, provider, pluginPanelName, meta } =
      ctx.params;
    const { t } = ctx.meta;
    const isOwner: boolean = await this.actions['isGroupOwner'](
      {
        groupId,
      },
      {
        parentCtx: ctx,
      }
    );

    if (!isOwner) {
      throw new NoPermissionError(t('没有操作权限'));
    }

    const group = await this.adapter.model
      .findOneAndUpdate(
        {
          _id: Types.ObjectId(groupId),
        },
        {
          $push: {
            panels: {
              id: String(Types.ObjectId()),
              name,
              type,
              parentId,
              provider,
              pluginPanelName,
              meta,
            },
          },
        },
        {
          new: true,
        }
      )
      .exec();

    this.roomcastNotify(
      ctx,
      groupId,
      'updateInfo',
      await this.transformDocuments(ctx, {}, group)
    );
  }

  /**
   * 删除群组面板
   */
  async deleteGroupPanel(ctx: TcContext<{ groupId: string; panelId: string }>) {
    const { groupId, panelId } = ctx.params;
    const { t } = ctx.meta;
    const isOwner: boolean = await this.actions['isGroupOwner'](
      {
        groupId,
      },
      {
        parentCtx: ctx,
      }
    );
    if (!isOwner) {
      throw new NoPermissionError(t('没有操作权限'));
    }

    const group = await this.adapter.model
      .findOneAndUpdate(
        {
          _id: Types.ObjectId(groupId),
        },
        {
          $pull: {
            panels: {
              $or: [
                {
                  id: Types.ObjectId(panelId),
                },
                {
                  parentId: Types.ObjectId(panelId),
                },
              ],
            } as any,
          },
        },
        {
          new: true,
        }
      )
      .exec();

    const json = await this.transformDocuments(ctx, {}, group);

    this.roomcastNotify(ctx, groupId, 'updateInfo', json);

    return json;
  }

  /**
   * 获取群组大厅的会话ID()
   */
  async getGroupLobbyConverseId(ctx: TcContext<{ groupId: string }>) {
    const groupId = ctx.params.groupId;

    const group = await this.adapter.model.findById(groupId);
    if (!group) {
      throw new DataNotFoundError('群组未找到');
    }

    const firstTextPanel = group.panels.find(
      (panel) => panel.type === GroupPanelType.TEXT
    );

    if (!firstTextPanel) {
      return null;
    }

    return firstTextPanel.id;
  }
}

export default GroupService;

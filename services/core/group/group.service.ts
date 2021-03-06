import _ from 'lodash';
import { Types } from 'mongoose';
import {
  DataNotFoundError,
  EntityError,
  NoPermissionError,
} from '../../../lib/errors';
import { isValidStr } from '../../../lib/utils';
import {
  Group,
  GroupDocument,
  GroupModel,
  GroupPanel,
  GroupPanelType,
} from '../../../models/group/group';
import {
  TcService,
  GroupBaseInfo,
  TcContext,
  TcDbService,
  PureContext,
} from 'tailchat-server-sdk';
import { call } from '../../../lib/call';
import moment from 'moment';

interface GroupService
  extends TcService,
    TcDbService<GroupDocument, GroupModel> {}
class GroupService extends TcService {
  get serviceName(): string {
    return 'group';
  }

  onInit(): void {
    this.registerLocalDb(require('../../../models/group/group').default);

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
    this.registerAction('getGroupInfo', this.getGroupInfo, {
      params: {
        groupId: 'string',
      },
      cache: {
        keys: ['groupId'],
        ttl: 60 * 60, // 1 hour
      },
      visibility: 'public',
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
    this.registerAction('modifyGroupPanel', this.modifyGroupPanel, {
      params: {
        groupId: 'string',
        panelId: 'string',
        name: 'string',
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
    this.registerAction('createGroupRole', this.createGroupRole, {
      params: {
        groupId: 'string',
        roleName: 'string',
        permissions: { type: 'array', items: 'string' },
      },
    });
    this.registerAction('deleteGroupRole', this.deleteGroupRole, {
      params: {
        groupId: 'string',
        roleId: 'string',
      },
    });
    this.registerAction('updateGroupRoleName', this.updateGroupRoleName, {
      params: {
        groupId: 'string',
        roleId: 'string',
        roleName: 'string',
      },
    });
    this.registerAction(
      'updateGroupRolePermission',
      this.updateGroupRolePermission,
      {
        params: {
          groupId: 'string',
          roleId: 'string',
          permissions: {
            type: 'array',
            items: 'string',
          },
        },
      }
    );
    this.registerAction('getGroupUserPermission', this.getGroupUserPermission, {
      params: {
        groupId: 'string',
      },
    });
    this.registerAction('muteGroupMember', this.muteGroupMember, {
      params: {
        groupId: 'string',
        memberId: 'string',
        muteMs: 'number',
      },
    });
  }

  /**
   * ?????????????????????????????????id??????
   * ??????????????????
   */
  private getGroupTextPanelIds(group: Group): string[] {
    // TODO: ???????????????, ??????????????????????????????
    const textPanelIds = group.panels
      .filter((p) => p.type === GroupPanelType.TEXT)
      .map((p) => p.id);

    return textPanelIds;
  }

  /**
   * ????????????
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
   * ???????????????????????????????????????id?????????????????????id??????
   */
  async getJoinedGroupAndPanelIds(ctx: TcContext): Promise<{
    groupIds: string[];
    panelIds: string[];
  }> {
    const groups = await this.getUserGroups(ctx); // TODO: ????????????call????????????????????????????????????tracer???caching???????????????moleculer????????????????????????????????????localCall????????????????????????????????????
    const panelIds = _.flatten(groups.map((g) => this.getGroupTextPanelIds(g)));

    return {
      groupIds: groups.map((g) => String(g._id)),
      panelIds,
    };
  }

  /**
   * ????????????????????????
   */
  async getGroupBasicInfo(
    ctx: PureContext<{
      groupId: string;
    }>
  ): Promise<GroupBaseInfo> {
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
      owner: String(group.owner),
      memberCount: groupMemberCount,
    };
  }

  /**
   * ????????????????????????
   * ?????????????????????
   */
  async getGroupInfo(ctx: TcContext<{ groupId: string }>): Promise<Group> {
    const groupInfo = await this.adapter.model.findById(ctx.params.groupId);

    return await this.transformDocuments(ctx, {}, groupInfo);
  }

  /**
   * ??????????????????
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
    const t = ctx.meta.t;
    if (
      !['name', 'avatar', 'panels', 'roles', 'fallbackPermissions'].includes(
        fieldName
      )
    ) {
      throw new EntityError(t('????????????????????????'));
    }

    const group = await this.adapter.model.findById(groupId).exec();
    if (String(group.owner) !== userId) {
      throw new NoPermissionError();
    }

    group[fieldName] = fieldValue;
    await group.save();

    this.notifyGroupInfoUpdate(ctx, group);
  }

  /**
   * ????????????????????????????????????
   */
  async isGroupOwner(
    ctx: TcContext<{
      groupId: string;
    }>
  ): Promise<boolean> {
    const t = ctx.meta.t;
    const group = await this.adapter.model.findById(ctx.params.groupId);
    if (!group) {
      throw new DataNotFoundError(t('??????????????????'));
    }

    return String(group.owner) === ctx.meta.userId;
  }

  /**
   * ????????????
   */
  async joinGroup(
    ctx: TcContext<{
      groupId: string;
    }>
  ) {
    const groupId = ctx.params.groupId;
    const userId = ctx.meta.userId;

    if (!isValidStr(userId)) {
      throw new EntityError('??????id??????');
    }

    if (!isValidStr(groupId)) {
      throw new EntityError('??????id??????');
    }

    const { members } = await this.adapter.model.findById(groupId, {
      members: 1,
    });
    if (members.findIndex((m) => String(m.userId) === userId) >= 0) {
      throw new Error('??????????????????');
    }

    const doc = await this.adapter.model
      .findByIdAndUpdate(
        groupId,
        {
          $addToSet: {
            members: {
              userId: new Types.ObjectId(userId),
            },
          },
        },
        {
          new: true,
        }
      )
      .exec();

    const group: Group = await this.transformDocuments(ctx, {}, doc);

    this.notifyGroupInfoUpdate(ctx, group);
    this.unicastNotify(ctx, userId, 'add', group);

    const textPanelIds = this.getGroupTextPanelIds(group);
    await ctx.call('gateway.joinRoom', {
      roomIds: [String(group._id), ...textPanelIds],
      userId,
    });

    return group;
  }

  /**
   * ????????????
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
      // ??????????????????
      await this.adapter.removeById(groupId); // TODO: ?????????????????????????????????
      await this.roomcastNotify(ctx, groupId, 'remove', { groupId });
      await ctx.call('gateway.leaveRoom', {
        roomIds: [groupId],
      });
    } else {
      // ?????????????????????
      const doc = await this.adapter.model
        .findByIdAndUpdate(
          groupId,
          {
            $pull: {
              members: {
                userId: new Types.ObjectId(userId),
              },
            },
          },
          {
            new: true,
          }
        )
        .exec();

      const group: Group = await this.transformDocuments(ctx, {}, doc);

      // ??????????????????????????? ?????????????????????????????????
      await ctx.call('gateway.leaveRoom', {
        roomIds: [
          groupId,
          ...group.panels
            .filter((p) => p.type === GroupPanelType.TEXT)
            .map((p) => p.id),
        ], // ?????????????????????????????????
        userId,
      });

      this.unicastNotify(ctx, userId, 'remove', { groupId });
      this.notifyGroupInfoUpdate(ctx, group);
    }
  }

  /**
   * ??????????????????
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
      throw new NoPermissionError(t('??????????????????'));
    }

    const group = await this.adapter.model
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(groupId),
        },
        {
          $push: {
            panels: {
              id: String(new Types.ObjectId()),
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

    this.notifyGroupInfoUpdate(ctx, group);
  }

  /**
   * ??????????????????
   */
  async modifyGroupPanel(
    ctx: TcContext<{
      groupId: string;
      panelId: string;
      name: string;
      provider?: string;
      pluginPanelName?: string;
      meta?: object;
    }>
  ) {
    const { groupId, panelId, name, provider, pluginPanelName, meta } =
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
      throw new NoPermissionError(t('??????????????????'));
    }

    const res = await this.adapter.model
      .updateOne(
        {
          _id: new Types.ObjectId(groupId),
        },
        {
          $set: {
            'panels.$[element].name': name,
            'panels.$[element].provider': provider,
            'panels.$[element].pluginPanelName': pluginPanelName,
            'panels.$[element].meta': meta,
          },
        },
        {
          new: true,
          arrayFilters: [{ 'element.id': panelId }],
        }
      )
      .exec();

    if (res.modifiedCount === 0) {
      throw new Error(t('?????????????????????'));
    }

    const group = await this.adapter.model.findById(String(groupId));

    const json = await this.notifyGroupInfoUpdate(ctx, group);
    return json;
  }

  /**
   * ??????????????????
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
      throw new NoPermissionError(t('??????????????????'));
    }

    const group = await this.adapter.model
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(groupId),
        },
        {
          $pull: {
            panels: {
              $or: [
                {
                  id: new Types.ObjectId(panelId),
                },
                {
                  parentId: new Types.ObjectId(panelId),
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

    const json = await this.notifyGroupInfoUpdate(ctx, group);
    return json;
  }

  /**
   * ???????????????????????????ID()
   */
  async getGroupLobbyConverseId(ctx: TcContext<{ groupId: string }>) {
    const groupId = ctx.params.groupId;
    const t = ctx.meta.t;

    const group = await this.adapter.model.findById(groupId);
    if (!group) {
      throw new DataNotFoundError(t('???????????????'));
    }

    const firstTextPanel = group.panels.find(
      (panel) => panel.type === GroupPanelType.TEXT
    );

    if (!firstTextPanel) {
      return null;
    }

    return firstTextPanel.id;
  }

  /**
   * ??????????????????
   */
  async createGroupRole(
    ctx: TcContext<{ groupId: string; roleName: string; permissions: string[] }>
  ) {
    const { groupId, roleName, permissions } = ctx.params;
    const userId = ctx.meta.userId;

    const group = await this.adapter.model
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(groupId),
          owner: new Types.ObjectId(userId),
        },
        {
          $push: {
            roles: {
              name: roleName,
              permissions: [],
            },
          },
        },
        {
          new: true,
        }
      )
      .exec();

    const json = await this.notifyGroupInfoUpdate(ctx, group);
    return json;
  }

  /**
   * ??????????????????
   */
  async deleteGroupRole(ctx: TcContext<{ groupId: string; roleId: string }>) {
    const { groupId, roleId } = ctx.params;
    const userId = ctx.meta.userId;

    const group = await this.adapter.model
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(groupId),
          owner: new Types.ObjectId(userId),
        },
        {
          $pull: {
            roles: {
              _id: roleId,
            },
          },
        },
        {
          new: true,
        }
      )
      .exec();

    const json = await this.notifyGroupInfoUpdate(ctx, group);
    return json;
  }

  /**
   * ????????????????????????
   */
  async updateGroupRoleName(
    ctx: TcContext<{
      groupId: string;
      roleId: string;
      roleName: string;
    }>
  ) {
    const { groupId, roleId, roleName } = ctx.params;
    const userId = ctx.meta.userId;

    const group = await this.adapter.model.updateGroupRoleName(
      groupId,
      roleId,
      roleName,
      userId
    );

    const json = await this.notifyGroupInfoUpdate(ctx, group);
    return json;
  }

  /**
   * ????????????????????????
   */
  async updateGroupRolePermission(
    ctx: TcContext<{
      groupId: string;
      roleId: string;
      permissions: string[];
    }>
  ) {
    const { groupId, roleId, permissions } = ctx.params;
    const userId = ctx.meta.userId;

    const group = await this.adapter.model.updateGroupRolePermission(
      groupId,
      roleId,
      permissions,
      userId
    );

    const json = await this.notifyGroupInfoUpdate(ctx, group);
    return json;
  }

  /**
   * ????????????????????????
   */
  async getGroupUserPermission(
    ctx: TcContext<{
      groupId: string;
    }>
  ) {
    const { groupId } = ctx.params;
    const userId = ctx.meta.userId;

    const permissions = await this.adapter.model.getGroupUserPermission(
      groupId,
      userId
    );

    return permissions;
  }

  /**
   * ??????????????????
   */
  async muteGroupMember(
    ctx: TcContext<{
      groupId: string;
      memberId: string;
      muteMs: number; // ????????????????????????. ?????????ms, ????????????0?????????????????????
    }>
  ) {
    const { groupId, memberId, muteMs } = ctx.params;
    const userId = ctx.meta.userId;
    const language = ctx.meta.language;
    const isUnmute = muteMs < 0;

    const group = await this.adapter.model.updateGroupMemberField(
      groupId,
      memberId,
      'muteUntil',
      isUnmute ? undefined : new Date(new Date().valueOf() + muteMs),
      userId
    );

    this.notifyGroupInfoUpdate(ctx, group);

    const memberInfo = await call(ctx).getUserInfo(memberId);
    if (isUnmute) {
      await call(ctx).addGroupSystemMessage(
        groupId,
        `${ctx.meta.user.nickname} ????????? ${memberInfo.nickname} ?????????`
      );
    } else {
      await call(ctx).addGroupSystemMessage(
        groupId,
        `${ctx.meta.user.nickname} ????????? ${memberInfo.nickname} ${moment
          .duration(muteMs, 'ms')
          .locale(language)
          .humanize()}`
      );
    }
  }

  /**
   * ????????????????????????????????????
   */
  private async notifyGroupInfoUpdate(
    ctx: TcContext,
    group: Group
  ): Promise<Group> {
    const groupId = String(group._id);
    const json = await this.transformDocuments(ctx, {}, group);

    this.cleanGroupInfoCache(groupId);
    this.roomcastNotify(ctx, groupId, 'updateInfo', json);

    return json;
  }

  /**
   * ??????????????????
   * @param groupId ??????id
   */
  private cleanGroupInfoCache(groupId: string) {
    this.cleanActionCache('getGroupInfo', [groupId]);
  }
}

export default GroupService;

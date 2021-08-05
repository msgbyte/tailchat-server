import _ from 'lodash';
import type { Context } from 'moleculer';
import { NoPermissionError } from '../../lib/errors';
import { isValidStr } from '../../lib/utils';
import type { TcDbService } from '../../mixins/db.mixin';
import type {
  GroupInvite,
  GroupInviteDocument,
  GroupInviteModel,
} from '../../models/group/invite';
import { TcService } from '../base';
import type { TcContext } from '../types';

interface GroupService
  extends TcService,
    TcDbService<GroupInviteDocument, GroupInviteModel> {}
class GroupService extends TcService {
  get serviceName(): string {
    return 'group.invite';
  }

  onInit(): void {
    this.registerDb('group.invite');

    this.registerAction('createGroupInvite', this.createGroupInvite, {
      params: {
        groupId: 'string',
      },
    });
    this.registerAction('findInviteByCode', this.findInviteByCode, {
      params: {
        code: 'string',
      },
    });
    this.registerAction('applyInvite', this.applyInvite, {
      params: {
        code: 'string',
      },
    });
  }

  /**
   * 创建群组邀请
   */
  async createGroupInvite(
    ctx: TcContext<{
      groupId: string;
    }>
  ): Promise<GroupInvite> {
    const groupId = ctx.params.groupId;
    const userId = ctx.meta.userId;

    // TODO: 基于RBAC判定群组权限
    // 先视为仅群组所有者可以创建群组邀请
    const isGroupOwner = await ctx.call<boolean, { groupId: string }>(
      'group.isGroupOwner',
      {
        groupId,
      }
    );
    if (isGroupOwner !== true) {
      throw new NoPermissionError('不是群组所有者, 没有分享权限');
    }

    const invite = await this.adapter.model.createGroupInvite(groupId, userId);
    return await this.transformDocuments(ctx, {}, invite);
  }

  /**
   * 通过邀请码查找群组邀请信息
   */
  async findInviteByCode(
    ctx: Context<{
      code: string;
    }>
  ): Promise<GroupInvite | null> {
    const code = ctx.params.code;

    const invite = await this.adapter.model.findOne({
      code,
    });

    return await this.transformDocuments(ctx, {}, invite);
  }

  /**
   * 应用群组邀请(通过群组邀请加入群组)
   */
  async applyInvite(ctx: TcContext<{ code: string }>): Promise<void> {
    const code = ctx.params.code;

    const invite = await this.adapter.model.findOne({
      code,
    });

    const groupId = invite.groupId;
    if (_.isNil(groupId)) {
      throw new Error('群组邀请失效: 群组id为空');
    }

    await ctx.call('group.joinGroup', {
      groupId: String(groupId),
    });
  }
}

export default GroupService;

import _ from 'lodash';
import { NoPermissionError } from '../../lib/errors';
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

    const invite = await this.adapter.model.createGroupInvite(groupId);
    return await this.transformDocuments(ctx, {}, invite);
  }
}

export default GroupService;

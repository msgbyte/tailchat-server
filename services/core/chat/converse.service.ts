import _ from 'lodash';
import { Types } from 'mongoose';
import { DataNotFoundError } from '../../../lib/errors';
import type { TcDbService } from '../../../mixins/db.mixin';
import type {
  ConverseDocument,
  ConverseModel,
} from '../../../models/chat/converse';
import { TcService } from '../../base';
import type { TcContext } from '../../types';

interface ConverseService
  extends TcService,
    TcDbService<ConverseDocument, ConverseModel> {}
class ConverseService extends TcService {
  get serviceName(): string {
    return 'chat.converse';
  }

  onInit(): void {
    this.registerDb('chat.converse');

    this.registerAction('createDMConverse', this.createDMConverse, {
      params: {
        /**
         * 创建私人会话的参与者ID列表
         */
        memberIds: 'array',
      },
    });
    this.registerAction(
      'appendDMConverseMembers',
      this.appendDMConverseMembers,
      {
        params: {
          converseId: 'string',
          memberIds: 'array',
        },
      }
    );
    this.registerAction('findConverseInfo', this.findConverseInfo, {
      params: {
        converseId: 'string',
      },
    });
    this.registerAction('findAndJoinRoom', this.findAndJoinRoom);
  }

  async createDMConverse(ctx: TcContext<{ memberIds: string[] }>) {
    const userId = ctx.meta.userId;
    const memberIds = ctx.params.memberIds;

    const participantList = _.uniq([userId, ...memberIds]);

    let converse = await this.adapter.model.findConverseWithMembers(
      participantList
    );
    if (converse === null) {
      // 创建新的会话
      converse = await this.adapter.insert({
        type: 'DM',
        members: participantList.map((id) => new Types.ObjectId(id)),
      });
    }

    await Promise.all(
      participantList.map((uid) =>
        ctx.call('gateway.joinRoom', {
          roomIds: [String(converse._id)],
          userId: uid,
        })
      )
    );

    return await this.transformDocuments(ctx, {}, converse);
  }

  /**
   * 在多人会话中添加成员
   */
  async appendDMConverseMembers(
    ctx: TcContext<{ converseId: string; memberIds: string[] }>
  ) {
    const userId = ctx.meta.userId;
    const { converseId, memberIds } = ctx.params;

    const converse = await this.adapter.model.findById(converseId);
    if (!converse) {
      throw new DataNotFoundError();
    }

    if (!converse.members.map(String).includes(userId)) {
      throw new Error('不是会话参与者, 无法添加成员');
    }

    converse.members.push(...memberIds.map((uid) => new Types.ObjectId(uid)));
    await converse.save();

    await this.roomcastNotify(
      ctx,
      converseId,
      'updateDMConverse',
      converse.toJSON()
    );
    await Promise.all(
      memberIds.map((uid) =>
        ctx.call('gateway.joinRoom', {
          roomIds: [String(converseId)],
          userId: uid,
        })
      )
    );

    return converse;
  }

  /**
   * 查找会话
   */
  async findConverseInfo(
    ctx: TcContext<{
      converseId: string;
    }>
  ) {
    const converseId = ctx.params.converseId;

    const converse = await this.adapter.findById(converseId);

    return await this.transformDocuments(ctx, {}, converse);
  }

  /**
   * 查找用户相关的所有会话并加入房间
   * @returns 返回相关信息
   */
  async findAndJoinRoom(ctx: TcContext) {
    const userId = ctx.meta.userId;
    const dmConverseIds = await this.adapter.model.findAllJoinedConverseId(
      userId
    );

    // 获取群组列表
    const { groupIds, panelIds } = await ctx.call<{
      groupIds: string[];
      panelIds: string[];
    }>('group.getJoinedGroupAndPanelIds');

    await ctx.call('gateway.joinRoom', {
      roomIds: [...dmConverseIds, ...groupIds, ...panelIds],
    });

    return {
      dmConverseIds,
      groupIds,
      panelIds,
    };
  }
}

export default ConverseService;

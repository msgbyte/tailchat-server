import moment from 'moment';
import { Types } from 'mongoose';
import { DataNotFoundError, NoPermissionError } from '../../lib/errors';
import type { TcDbService } from '../../mixins/db.mixin';
import type { MessageDocument, MessageModel } from '../../models/chat/message';
import { TcService } from '../base';
import type { GroupBaseInfo, TcContext } from '../types';

interface MessageService
  extends TcService,
    TcDbService<MessageDocument, MessageModel> {}
class MessageService extends TcService {
  get serviceName(): string {
    return 'chat.message';
  }

  onInit(): void {
    this.registerDb('chat.message');

    this.registerAction('fetchConverseMessage', this.fetchConverseMessage, {
      params: {
        converseId: 'string',
        startId: [{ type: 'string', optional: true }],
      },
    });
    this.registerAction('sendMessage', this.sendMessage, {
      params: {
        converseId: 'string',
        groupId: [{ type: 'string', optional: true }],
        content: 'string',
        meta: { type: 'any', optional: true },
      },
    });
    this.registerAction('recallMessage', this.recallMessage, {
      params: {
        messageId: 'string',
      },
    });
    this.registerAction('deleteMessage', this.deleteMessage, {
      params: {
        messageId: 'string',
      },
    });
    this.registerAction(
      'fetchConverseLastMessages',
      this.fetchConverseLastMessages,
      {
        params: {
          converseIds: 'array',
        },
      }
    );
  }

  /**
   * 获取会话消息
   */
  async fetchConverseMessage(
    ctx: TcContext<{
      converseId: string;
      startId?: string;
    }>
  ) {
    const { converseId, startId } = ctx.params;
    const docs = await this.adapter.model.fetchConverseMessage(
      converseId,
      startId ?? null
    );

    return this.transformDocuments(ctx, {}, docs);
  }

  /**
   * 发送普通消息
   */
  async sendMessage(
    ctx: TcContext<{
      converseId: string;
      groupId?: string;
      content: string;
      meta?: object;
    }>
  ) {
    const { converseId, groupId, content, meta } = ctx.params;
    const userId = ctx.meta.userId;

    const message = await this.adapter.insert({
      converseId: Types.ObjectId(converseId),
      groupId:
        typeof groupId === 'string' ? Types.ObjectId(groupId) : undefined,
      author: Types.ObjectId(userId),
      content,
      meta,
    });

    const json = await this.transformDocuments(ctx, {}, message);

    this.roomcastNotify(ctx, converseId, 'add', json);

    return json;
  }

  /**
   * 撤回消息
   */
  async recallMessage(ctx: TcContext<{ messageId: string }>) {
    const { messageId } = ctx.params;
    const { t, userId } = ctx.meta;

    const message = await this.adapter.model.findById(messageId);
    if (!message) {
      throw new DataNotFoundError(t('该消息未找到'));
    }

    if (message.hasRecall === true) {
      throw new Error(t('该消息已被撤回'));
    }

    // 消息撤回限时
    if (
      moment().valueOf() - moment(message.createdAt).valueOf() >
      15 * 60 * 1000
    ) {
      throw new Error(t('无法撤回 {{minutes}} 分钟前的消息', { minutes: 15 }));
    }

    let allowToRecall = false;

    //#region 撤回权限检查
    const groupId = message.groupId;
    if (groupId) {
      // 是一条群组信息
      const group: GroupBaseInfo = await ctx.call('group.getGroupBasicInfo', {
        groupId: String(groupId),
      });
      if (String(group.owner) === userId) {
        allowToRecall = true; // 是管理员 允许修改
      }
    }

    if (String(message.author) === String(userId)) {
      // 撤回者是消息所有者
      allowToRecall = true;
    }

    if (allowToRecall === false) {
      throw new NoPermissionError(t('撤回失败, 没有权限'));
    }
    //#endregion

    const converseId = String(message.converseId);
    message.hasRecall = true;
    await message.save();

    const json = await this.transformDocuments(ctx, {}, message);
    this.roomcastNotify(ctx, converseId, 'update', json);

    return json;
  }

  /**
   * 删除消息
   * 仅支持群组
   */
  async deleteMessage(ctx: TcContext<{ messageId: string }>) {
    const { messageId } = ctx.params;
    const { t, userId } = ctx.meta;

    const message = await this.adapter.model.findById(messageId);
    if (!message) {
      throw new DataNotFoundError(t('该消息未找到'));
    }

    const groupId = message.groupId;
    if (!groupId) {
      throw new Error(t('无法删除私人信息'));
    }

    const group: GroupBaseInfo = await ctx.call('group.getGroupBasicInfo', {
      groupId: String(groupId),
    });
    if (String(group.owner) !== userId) {
      throw new NoPermissionError(t('没有删除权限')); // 仅管理员允许删除
    }

    const converseId = String(message.converseId);
    this.adapter.removeById(messageId); // TODO: 考虑是否要改为软删除
    this.roomcastNotify(ctx, converseId, 'delete', { converseId, messageId });

    return true;
  }

  /**
   * 基于会话id获取会话最后一条消息的id
   */
  async fetchConverseLastMessages(ctx: TcContext<{ converseIds: string[] }>) {
    const { converseIds } = ctx.params;
    const list = await this.adapter.model
      .aggregate<{
        _id: string;
        lastMessageId: string;
      }>([
        {
          $match: {
            converseId: {
              $in: converseIds.map(Types.ObjectId),
            },
          },
        },
        {
          $group: {
            _id: '$converseId',
            lastMessageId: {
              $last: '$_id',
            },
          },
        },
      ])
      .exec();

    return list.map((item) => ({
      converseId: item._id,
      lastMessageId: item.lastMessageId,
    }));
  }
}

export default MessageService;

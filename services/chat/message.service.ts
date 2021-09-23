import { Types } from 'mongoose';
import type { TcDbService } from '../../mixins/db.mixin';
import type { MessageDocument, MessageModel } from '../../models/chat/message';
import { TcService } from '../base';
import type { TcContext } from '../types';

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

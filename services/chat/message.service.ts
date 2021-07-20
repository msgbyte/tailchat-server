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

    this.registerAction('fetchConverseMessage', {
      params: {
        converseId: 'string',
        startId: [{ type: 'string', optional: true }],
      },
      handler: this.fetchConverseMessage,
    });
    this.registerAction('sendMessage', {
      params: {
        converseId: 'string',
        groupId: [{ type: 'string', optional: true }],
        content: 'string',
      },
      handler: this.sendMessage,
    });
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
    }>
  ) {
    const { converseId, groupId, content } = ctx.params;
    const userId = ctx.meta.userId;

    const message = await this.adapter.insert({
      converseId: Types.ObjectId(converseId),
      groupId: Types.ObjectId(groupId),
      author: Types.ObjectId(userId),
      content,
    });

    const ret = await this.transformDocuments(ctx, {}, message);

    this.roomcastNotify(ctx, converseId, 'add', message);

    return ret;
  }
}

export default MessageService;

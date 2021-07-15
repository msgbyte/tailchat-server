import type { PawDbService } from '../../mixins/db.mixin';
import type { MessageDocument, MessageModel } from '../../models/chat/message';
import { PawService } from '../base';
import type { PawContext } from '../types';

interface MessageService
  extends PawService,
    PawDbService<MessageDocument, MessageModel> {}
class MessageService extends PawService {
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
  }

  /**
   * 获取会话消息
   */
  async fetchConverseMessage(
    ctx: PawContext<{
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
}

export default MessageService;

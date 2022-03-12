import type { MessageMetaStruct } from './chat';

/**
 * 默认服务的事件映射
 */
export interface BuiltinEventMap {
  'chat.message.updateMessage':
    | {
        type: 'add';
        messageId: string;
        content: string;
        meta: MessageMetaStruct;
      }
    | {
        type: 'recall' | 'delete';
        messageId: string;
      };
}

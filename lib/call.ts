import type { TcContext } from 'tailchat-server-sdk';
import { SYSTEM_USERID } from './const';

export function call(ctx: TcContext) {
  return {
    /**
     * 添加群组系统信息
     */
    async addGroupSystemMessage(groupId: string, message: string) {
      const lobbyConverseId = await ctx.call('group.getGroupLobbyConverseId', {
        groupId,
      });

      if (!lobbyConverseId) {
        // 如果没有文本频道则跳过
        return;
      }

      await ctx.call(
        'chat.message.sendMessage',
        {
          converseId: lobbyConverseId,
          groupId: groupId,
          content: message,
        },
        {
          meta: {
            ...ctx.meta,
            userId: SYSTEM_USERID,
          },
        }
      );
    },
  };
}

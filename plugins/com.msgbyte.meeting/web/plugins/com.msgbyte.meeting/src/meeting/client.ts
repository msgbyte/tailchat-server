import { TailchatMeetingClient } from 'tailchat-meeting-sdk';
import _once from 'lodash/once';

/**
 * 初始化会话客户端
 */
export const initMeetingClient = _once(
  (signalingHost: string, userId: string) => {
    const client = new TailchatMeetingClient(signalingHost, userId);

    return client;
  }
);

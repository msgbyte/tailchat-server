import type { Context } from 'moleculer';

export interface UserJWTPayload {
  _id: string;
  username: string;
  email: string;
  avatar: string;
}

export type TcContext<P = {}> = Context<
  P,
  {
    user: UserJWTPayload;
    token: string;
    userId: string;

    /**
     * 仅在 socket.io 的请求中会出现
     */
    socketId?: string;
  }
>;

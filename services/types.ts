import type { Context } from 'moleculer';
import type { TFunction } from 'i18next';

export interface UserJWTPayload {
  _id: string;
  username: string;
  email: string;
  avatar: string;
}

export type TcPureContext<P = {}> = Context<
  P,
  {
    t: TFunction;
  }
>;

export type TcContext<P = {}, M = {}> = Context<
  P,
  {
    user: UserJWTPayload;
    token: string;
    userId: string;

    /**
     * 仅在 socket.io 的请求中会出现
     */
    socketId?: string;
    t: TFunction;
  } & M
>;

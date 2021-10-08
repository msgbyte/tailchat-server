import type { Context } from 'moleculer';
import type { TFunction } from 'i18next';

export interface UserJWTPayload {
  _id: string;
  nickname: string;
  email: string;
  avatar: string;
}

interface TranslationMeta {
  t: TFunction;
}

export type PureContext<P = {}> = Context<P, {}>;

export type TcPureContext<P = {}> = Context<P, TranslationMeta>;

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
  } & TranslationMeta &
    M
>;

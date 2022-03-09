import type { Context } from 'moleculer';
import type { TFunction } from 'i18next';
import type { UserStruct } from '../structs/user';
import type { GroupStruct } from '../structs/group';

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

export type TcPureContext<P = {}, M = {}> = Context<P, TranslationMeta & M>;

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

export type GroupBaseInfo = Pick<GroupStruct, 'name' | 'avatar' | 'owner'> & {
  memberCount: number;
};

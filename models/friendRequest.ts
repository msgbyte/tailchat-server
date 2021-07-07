import {
  getModelForClass,
  prop,
  DocumentType,
  Ref,
} from '@typegoose/typegoose';
import { User } from './user';

/**
 * 好友请求
 */

export class FriendRequest {
  @prop({
    ref: () => User,
    index: true,
  })
  from: Ref<User>;

  @prop({
    ref: () => User,
  })
  to: Ref<User>;

  @prop()
  message: string;
}

export type FriendRequestDocument = DocumentType<FriendRequest>;

export default getModelForClass(FriendRequest);

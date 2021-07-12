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

/**
 * 单向好友结构
 */
export class Friend {
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
  createdAt: Date;
}

export type FriendDocument = DocumentType<Friend>;

export default getModelForClass(Friend);

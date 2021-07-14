import {
  getModelForClass,
  prop,
  DocumentType,
  Ref,
  plugin,
  ReturnModelType,
} from '@typegoose/typegoose';
import { Base, FindOrCreate } from '@typegoose/typegoose/lib/defaultClasses';
import { User } from './user';
import findorcreate from 'mongoose-findorcreate';

/**
 * 好友请求
 */

export interface Friend extends Base {}
/**
 * 单向好友结构
 */
@plugin(findorcreate)
export class Friend extends FindOrCreate {
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

  static async buildFriendRelation(
    this: ReturnModelType<FriendModel>,
    user1: string,
    user2: string
  ) {
    await Promise.all([
      this.findOrCreate({
        from: user1,
        to: user2,
      }),
      this.findOrCreate({
        from: user2,
        to: user1,
      }),
    ]);
  }
}

export type FriendDocument = DocumentType<Friend>;

const model = getModelForClass(Friend);

export type FriendModel = typeof model;

export default model;

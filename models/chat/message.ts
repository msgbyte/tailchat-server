import {
  getModelForClass,
  prop,
  DocumentType,
  Ref,
  ReturnModelType,
  modelOptions,
  Severity,
} from '@typegoose/typegoose';
import { Group } from '../group/group';
import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { Converse } from './converse';
import { User } from '../user/user';
import type { FilterQuery } from 'mongoose';

class MessageReaction {
  /**
   * 消息反应名
   * 可以直接为emoji表情
   */
  @prop()
  name: string;

  @prop({ ref: () => User })
  author?: Ref<User>;
}

export interface Message extends Base {}
@modelOptions({
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class Message extends TimeStamps {
  @prop()
  content: string;

  @prop({ ref: () => User })
  author?: Ref<User>;

  @prop({ ref: () => Group })
  groupId?: Ref<Group>;

  /**
   * 会话ID 必填
   * 私信的本质就是创建一个双人的会话
   */
  @prop({ ref: () => Converse })
  converseId!: Ref<Converse>;

  @prop({ type: () => MessageReaction })
  reactions?: MessageReaction[];

  /**
   * 消息的其他数据
   */
  @prop()
  meta?: object;

  /**
   * 获取会话消息
   */
  static async fetchConverseMessage(
    this: ReturnModelType<typeof Message>,
    converseId: string,
    startId: string | null,
    limit = 50
  ) {
    const conditions: FilterQuery<DocumentType<Converse>> = {
      converseId,
    };
    if (startId !== null) {
      conditions['_id'] = {
        $lt: startId,
      };
    }
    const res = await this.find(conditions)
      .sort({ _id: -1 })
      .limit(limit)
      .exec();

    return res;
  }
}

export type MessageDocument = DocumentType<Message>;

const model = getModelForClass(Message);

export type MessageModel = typeof model;

export default model;

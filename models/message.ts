import {
  getModelForClass,
  prop,
  DocumentType,
  Ref,
} from '@typegoose/typegoose';
import { Group } from './group';
import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { Converse } from './converse';
import { User } from './user';

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
}

export type MessageDocument = DocumentType<Message>;

export default getModelForClass(Message);

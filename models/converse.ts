import {
  getModelForClass,
  prop,
  DocumentType,
  Ref,
} from '@typegoose/typegoose';
import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { NAME_REGEXP } from '../lib/const';
import { User } from './user';

/**
 * 设计参考: https://discord.com/developers/docs/resources/channel
 */

const converseType = [
  'DM', // 私信
  'GROUP', // 多人会话
] as const;

/**
 * 聊天会话
 */
export interface Converse extends Base {}
export class Converse extends TimeStamps {
  @prop({
    trim: true,
    unique: true,
    match: NAME_REGEXP,
    index: true,
  })
  name?: string;

  /**
   * 会话类型
   */
  @prop({
    enum: converseType,
    type: () => String,
  })
  type!: typeof converseType[number];

  /**
   * 会话参与者
   */
  @prop({ ref: () => User })
  members: Ref<User>[];
}

export type ConverseDocument = DocumentType<Converse>;

export default getModelForClass(Converse);

import {
  getModelForClass,
  prop,
  DocumentType,
  Ref,
  ReturnModelType,
} from '@typegoose/typegoose';
import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { NAME_REGEXP } from '../../lib/const';
import { User } from '../user/user';

/**
 * 设计参考: https://discord.com/developers/docs/resources/channel
 */

const converseType = [
  'DM', // 私信
  'Group', // 群组
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
   * DM会话与多人会话有值
   */
  @prop({ ref: () => User })
  members?: Ref<User>[];

  static async findConverseWithMembers(
    this: ReturnModelType<typeof Converse>,
    members: string[]
  ): Promise<DocumentType<Converse> | null> {
    const converse = await this.findOne({
      members: {
        $all: [...members],
      },
    });

    return converse;
  }
}

export type ConverseDocument = DocumentType<Converse>;

const model = getModelForClass(Converse);

export type ConverseModel = typeof model;

export default model;

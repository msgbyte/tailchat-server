import {
  getModelForClass,
  prop,
  DocumentType,
  Ref,
  ReturnModelType,
  modelOptions,
} from '@typegoose/typegoose';
import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import moment from 'moment';
import { nanoid } from 'nanoid';
import { Group } from './group';

function generateCode() {
  return nanoid(8);
}

export interface GroupInvite extends Base {}
export class GroupInvite extends TimeStamps {
  @prop({
    index: true,
    default: () => generateCode(),
  })
  code!: string;

  @prop({
    ref: () => Group,
  })
  groupId!: Ref<Group>;

  @prop()
  expiredAt?: Date;

  /**
   * 创建群组邀请
   * @param groupId 群组id
   * @param expire 过期时间 单位(毫秒)，默认7天(7 * 3600 * 1000), -1 则为永久
   */
  static async createGroupInvite(
    this: ReturnModelType<typeof GroupInvite>,
    groupId: string,
    expire: number = 3600 * 1000
  ): Promise<GroupInviteDocument> {
    const invite = await this.create({
      groupId,
      code: generateCode(),
      expiredAt: expire > 0 ? moment().add(expire).toDate() : undefined,
    });

    return invite;
  }
}

export type GroupInviteDocument = DocumentType<GroupInvite>;

const model = getModelForClass(GroupInvite);

export type GroupInviteModel = typeof model;

export default model;

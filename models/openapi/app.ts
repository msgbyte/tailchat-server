import {
  getModelForClass,
  prop,
  DocumentType,
  index,
  ReturnModelType,
} from '@typegoose/typegoose';
import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import type { Types } from 'mongoose';

const openAppCapability = [
  'bot', // 机器人
  'webpage', // 网页
  'oauth', // 第三方登录
] as const;

type OpenAppCapability = typeof openAppCapability[number];

/**
 * 确保输出类型为应用能力
 */
export function filterAvailableAppCapability(
  input: string[]
): OpenAppCapability[] {
  return input.filter((item) =>
    openAppCapability.includes(item as OpenAppCapability)
  ) as OpenAppCapability[];
}

/**
 * 开放平台应用
 */
@index({ appId: 1 }, { unique: true })
export class OpenApp extends TimeStamps implements Base {
  _id: Types.ObjectId;
  id: string;

  @prop()
  appId: string;

  @prop()
  appSecret: string;

  @prop()
  appName: string;

  @prop()
  appDesc: string;

  @prop()
  appIcon: string; // url

  @prop({
    enum: openAppCapability,
    type: () => String,
  })
  capability: OpenAppCapability[];

  /**
   * 根据appId获取openapp的实例
   */
  static async findAppById(
    this: ReturnModelType<typeof OpenApp>,
    appId: string
  ) {
    const res = await this.findOne({
      appId,
    }).exec();

    return res;
  }
}

export type OpenAppDocument = DocumentType<OpenApp>;

const model = getModelForClass(OpenApp);

export type OpenAppModel = typeof model;

export default model;

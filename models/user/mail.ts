import {
  getModelForClass,
  prop,
  DocumentType,
  Ref,
  modelOptions,
  Severity,
} from '@typegoose/typegoose';
import type { Base } from '@typegoose/typegoose/lib/defaultClasses';
import { User } from './user';

export interface Mail extends Base {}

@modelOptions({
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class Mail {
  /**
   * 发送到的用户id
   */
  @prop({
    ref: () => User,
    index: true,
  })
  userId: Ref<User>;

  /**
   * 发件人邮箱
   */
  @prop()
  from: string;

  /**
   * 收件人邮箱
   */
  @prop()
  to: string;

  /**
   * 邮件主题
   */
  @prop()
  subject: string;

  /**
   * 邮件内容
   */
  @prop()
  body: string;

  @prop()
  host: string;

  @prop()
  port: string;

  @prop()
  secure: boolean;

  @prop()
  is_success: boolean;

  @prop()
  data: any;

  @prop()
  error: string;
}

export type MailDocument = DocumentType<Mail>;

export default getModelForClass(Mail);

import { getModelForClass, prop, DocumentType } from '@typegoose/typegoose';

export class Mail {
  /**
   * 发送到的用户id
   */
  @prop()
  userId: string;

  @prop()
  from: string;

  @prop()
  to: string;

  @prop()
  subject: string;

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

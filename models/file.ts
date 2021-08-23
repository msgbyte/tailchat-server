import {
  getModelForClass,
  prop,
  DocumentType,
  Ref,
  modelOptions,
  Severity,
} from '@typegoose/typegoose';
import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { User } from './user/user';

/**
 * 聊天会话
 */
export interface File extends Base {}

@modelOptions({
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class File extends TimeStamps {
  @prop()
  etag: string;

  @prop({ ref: () => User })
  userId?: Ref<User>;

  @prop()
  bucketName: string;

  @prop()
  objectName: string;

  @prop()
  url: string;

  /**
   * 文件大小, 单位: Byte
   */
  @prop()
  size: number;

  @prop()
  metaData: object;
}

export type FileDocument = DocumentType<File>;

const model = getModelForClass(File);

export type FileModel = typeof model;

export default model;

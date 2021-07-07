import { getModelForClass, prop, DocumentType } from '@typegoose/typegoose';

export class User {
  @prop(() => String)
  public username?: string;

  @prop()
  email?: string;

  @prop()
  password!: string;

  @prop()
  nickname?: string;

  @prop()
  avatar?: string;

  @prop()
  createdAt!: Date;
}

export type UserDocument = DocumentType<User>;

export default getModelForClass(User);

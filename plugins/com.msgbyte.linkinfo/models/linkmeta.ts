import {
  getModelForClass,
  DocumentType,
  modelOptions,
  prop,
  Severity,
} from '@typegoose/typegoose';
import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import type { Types } from 'mongoose';

@modelOptions({
  options: {
    customName: 'p_linkmeta',
    allowMixed: Severity.ALLOW,
  },
})
export class Linkmeta extends TimeStamps implements Base {
  _id: Types.ObjectId;
  id: string;

  @prop()
  url: string;

  @prop()
  data: any;
}

export type LinkmetaDocument = DocumentType<Linkmeta>;

const model = getModelForClass(Linkmeta);

export type LinkmetaModel = typeof model;

export default model;

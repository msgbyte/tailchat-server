import {
  getModelForClass,
  prop,
  DocumentType,
  Ref,
} from '@typegoose/typegoose';
import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { NAME_REGEXP } from '../lib/const';
import { GroupPanel } from './groupPanel';
import { User } from './user';

export interface Group extends Base {}
export class Group extends TimeStamps {
  @prop({
    trim: true,
    unique: true,
    match: NAME_REGEXP,
    index: true,
  })
  name!: string;

  @prop()
  avatar?: string;

  @prop({
    ref: () => User,
  })
  creator: Ref<User>;

  @prop({
    ref: () => User,
  })
  members: Ref<User>[];

  @prop({
    ref: () => GroupPanel,
  })
  panels: Ref<GroupPanel>[];
}

export type GroupDocument = DocumentType<Group>;

export default getModelForClass(Group);

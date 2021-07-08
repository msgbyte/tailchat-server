import {
  getModelForClass,
  prop,
  DocumentType,
  Ref,
} from '@typegoose/typegoose';
import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { NAME_REGEXP } from '../lib/const';
// import { Group } from './group';

export interface GroupPanel extends Base {}
export class GroupPanel extends TimeStamps {
  @prop({
    trim: true,
    unique: true,
    match: NAME_REGEXP,
    index: true,
  })
  name?: string;

  /**
   * 面板类型
   */
  @prop()
  type!: string;
}

export type GroupPanelDocument = DocumentType<GroupPanel>;

export default getModelForClass(GroupPanel);

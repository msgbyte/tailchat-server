import {
  getModelForClass,
  prop,
  DocumentType,
  Ref,
  ReturnModelType,
  modelOptions,
  Severity,
} from '@typegoose/typegoose';
import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { Types } from 'mongoose';
import { NAME_REGEXP } from '../../lib/const';
import { User } from '../user/user';

export enum GroupPanelType {
  TEXT = 0,
  GROUP = 1,
  PLUGIN = 2,
}

class GroupMember {
  @prop()
  role: string; // 角色

  @prop({
    ref: () => User,
  })
  userId: Ref<User>;
}

@modelOptions({
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class GroupPanel {
  @prop()
  id: string; // 在群组中唯一

  @prop()
  name: string;

  @prop()
  parentId?: string; // 父节点id

  @prop()
  type: number; // 面板类型: Reference: https://discord.com/developers/docs/resources/channel#channel-object-channel-types

  /**
   * 面板的其他数据
   */
  @prop()
  meta?: object;
}

export interface Group extends Base {}
export class Group extends TimeStamps {
  @prop({
    trim: true,
    match: NAME_REGEXP,
  })
  name!: string;

  @prop()
  avatar?: string;

  @prop({
    ref: () => User,
  })
  owner: Ref<User>;

  @prop({
    type: () => GroupMember,
    _id: false,
  })
  members: GroupMember[];

  @prop({ type: () => GroupPanel, _id: false })
  panels: GroupPanel[];

  /**
   * 创建群组
   */
  static async createGroup(
    this: ReturnModelType<typeof Group>,
    options: {
      name: string;
      avatarBase64?: string; // base64版本的头像字符串
      panels?: GroupPanel[];
      owner: string;
    }
  ): Promise<GroupDocument> {
    const { name, avatarBase64, panels = [], owner } = options;
    if (typeof avatarBase64 === 'string') {
      // TODO: 处理头像上传逻辑
    }

    // 预处理panels信息, 变换ID为objectid
    const panelSectionMap: Record<string, string> = {};
    panels.forEach((panel) => {
      const originPanelId = panel.id;
      panel.id = String(Types.ObjectId());
      if (panel.type === GroupPanelType.GROUP) {
        panelSectionMap[originPanelId] = panel.id;
      }

      if (typeof panel.parentId === 'string') {
        if (typeof panelSectionMap[panel.parentId] !== 'string') {
          throw new Error('创建失败, 面板参数不合法');
        }
        panel.parentId = panelSectionMap[panel.parentId];
      }
    });

    // NOTE: Expression produces a union type that is too complex to represent.
    const res = await this.create<GroupDocument>({
      name,
      panels,
      owner,
      members: [
        {
          role: 'manager',
          userId: owner,
        },
      ],
    });

    return res;
  }

  /**
   * 获取用户加入的群组列表
   * @param userId 用户ID
   */
  static async getUserGroups(
    this: ReturnModelType<typeof Group>,
    userId: string
  ): Promise<GroupDocument[]> {
    return this.find({
      'members.userId': userId,
    });
  }
}

export type GroupDocument = DocumentType<Group>;

const model = getModelForClass(Group);

export type GroupModel = typeof model;

export default model;

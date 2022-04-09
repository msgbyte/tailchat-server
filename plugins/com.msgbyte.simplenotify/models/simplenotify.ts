import { db } from 'tailchat-server-sdk';
const { getModelForClass, prop, modelOptions, TimeStamps } = db;

@modelOptions({
  options: {
    customName: 'p_simplenotify',
  },
})
export class SimpleNotify extends TimeStamps implements db.Base {
  _id: db.Types.ObjectId;
  id: string;

  @prop()
  groupId: string;

  @prop()
  textPanelId: string;
}

export type SimpleNotifyDocument = db.DocumentType<SimpleNotify>;

const model = getModelForClass(SimpleNotify);

export type SimpleNotifyModel = typeof model;

export default model;

import { Schema, Document } from 'mongoose';

export interface FriendDocument extends Document {
  from: string;
  to: string;
  createdAt: Date;
}

/**
 * 单向好友结构
 */
const friendSchema = new Schema<FriendDocument>({
  from: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    index: true,
  },
  to: {
    type: Schema.Types.ObjectId,
    ref: 'user',
  },
  createdAt: { type: Date, default: Date.now },
});

export default friendSchema;

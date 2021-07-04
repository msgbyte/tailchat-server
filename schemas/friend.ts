import { Schema } from 'mongoose';

/**
 * 单向好友结构
 */
const friendSchema = new Schema({
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

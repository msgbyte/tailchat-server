import { Schema } from 'mongoose';

/**
 * 单向好友结构
 */
const friendSchema = new Schema({
  createTime: { type: Date, default: Date.now },
  from: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    index: true,
  },
  to: {
    type: Schema.Types.ObjectId,
    ref: 'user',
  },
});

export default friendSchema;

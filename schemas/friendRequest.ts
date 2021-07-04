import { Schema } from 'mongoose';

/**
 * 好友请求
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
  message: {
    type: Schema.Types.String,
  },
  createdAt: { type: Date, default: Date.now },
});

export default friendSchema;

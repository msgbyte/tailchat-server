import { Schema, Document } from 'mongoose';

export interface MailDocument extends Document {
  /**
   * 发送到的用户id
   */
  userId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  host: string;
  port: string;
  secure: boolean;
  is_success: boolean;
  data: any;
  error: string;
}

const mailSchema = new Schema<MailDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    index: true,
  },
  from: {
    type: Schema.Types.String,
  },
  to: {
    type: Schema.Types.String,
  },
  subject: {
    type: Schema.Types.String,
  },
  body: {
    type: Schema.Types.String,
  },
  host: {
    type: Schema.Types.String,
  },
  port: {
    type: Schema.Types.String,
  },
  secure: {
    type: Schema.Types.Boolean,
  },
  is_success: {
    type: Schema.Types.Boolean,
  },
  data: {
    type: Schema.Types.Mixed,
  },
  error: {
    type: Schema.Types.String,
  },
});

export default mailSchema;

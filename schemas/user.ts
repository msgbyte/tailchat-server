import mongoose from 'mongoose';

export interface UserDocument extends mongoose.Document {
  username: string;
  email: string;
  password: string;
  nickname: string;
  avatar: string;
  createdAt: Date;
}

const userSchema = new mongoose.Schema<UserDocument>({
  username: {
    type: 'string',
  },
  email: {
    type: 'string',
  },
  password: {
    type: 'string',
  },
  nickname: {
    type: 'string',
  },
  avatar: {
    type: 'string',
  },
  createdAt: {
    type: Date,
  },
});

export default userSchema;

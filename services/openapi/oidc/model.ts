import { mongoose } from '@typegoose/typegoose';
import { config } from '../../../lib/settings';
import OpenApp from '../../../models/openapi/app';
import User from '../../../models/user/user';

mongoose.connect(config.mongoUrl);

export { OpenApp, User };

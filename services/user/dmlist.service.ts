import { Types } from 'mongoose';
import type { PawDbService } from '../../mixins/db.mixin';
import type {
  UserDMListDocument,
  UserDMListModel,
} from '../../models/user/dmList';
import { PawService } from '../base';
import type { PawContext } from '../types';

interface UserDMListService
  extends PawService,
    PawDbService<UserDMListDocument, UserDMListModel> {}
class UserDMListService extends PawService {
  get serviceName(): string {
    return 'user.dmlist';
  }

  onInit(): void {
    this.registerDb('user.dmlist');
    this.registerAction('addConverse', {
      params: {
        converseId: 'string',
      },
      handler: this.addConverse,
    });
  }

  async addConverse(ctx: PawContext<{ converseId: string }>) {
    const userId = ctx.meta.userId;
    const converseId = ctx.params.converseId;

    const record = await this.adapter.model.findOrCreate({
      userId,
    });

    const res = await this.adapter.model.findByIdAndUpdate(record.doc._id, {
      $addToSet: {
        converseIds: Types.ObjectId(converseId),
      },
    });

    return await this.transformDocuments(ctx, {}, res);
  }
}

export default UserDMListService;

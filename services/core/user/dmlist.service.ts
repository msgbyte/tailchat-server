import { Types } from 'mongoose';
import type { TcDbService } from '../../../mixins/db.mixin';
import type {
  UserDMList,
  UserDMListDocument,
  UserDMListModel,
} from '../../../models/user/dmlist';
import { TcService } from '../../base';
import type { TcContext } from '../../types';

interface UserDMListService
  extends TcService,
    TcDbService<UserDMListDocument, UserDMListModel> {}
class UserDMListService extends TcService {
  get serviceName(): string {
    return 'user.dmlist';
  }

  onInit(): void {
    this.registerDb('user.dmlist');
    this.registerAction('addConverse', this.addConverse, {
      params: {
        converseId: 'string',
      },
    });
    this.registerAction('removeConverse', this.removeConverse, {
      params: {
        converseId: 'string',
      },
    });
    this.registerAction('getAllConverse', this.getAllConverse);
  }

  async addConverse(ctx: TcContext<{ converseId: string }>) {
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

  /**
   * 移除会话
   */
  async removeConverse(ctx: TcContext<{ converseId: string }>) {
    const userId = ctx.meta.userId;
    const converseId = ctx.params.converseId;

    const { nModified } = await this.adapter.model
      .updateOne(
        {
          userId,
        },
        {
          $pull: {
            converseIds: Types.ObjectId(converseId),
          },
        }
      )
      .exec();

    return nModified;
  }

  /**
   * 获取所有会话
   */
  async getAllConverse(ctx: TcContext) {
    const userId = ctx.meta.userId;

    const doc = await this.adapter.model.findOne({
      userId,
    });

    const res: UserDMList | null = await this.transformDocuments(ctx, {}, doc);

    return res?.converseIds ?? [];
  }
}

export default UserDMListService;

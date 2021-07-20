import { TcCacheCleaner } from '../../mixins/cache.cleaner.mixin';
import type { TcDbService } from '../../mixins/db.mixin';
import type { FriendDocument, FriendModel } from '../../models/user/friend';
import { TcService } from '../base';
import type { TcContext } from '../types';

interface FriendService
  extends TcService,
    TcDbService<FriendDocument, FriendModel> {}
class FriendService extends TcService {
  get serviceName(): string {
    return 'friend';
  }
  onInit(): void {
    this.registerDb('user.friend');
    // this.registerMixin(TcCacheCleaner(['cache.clean.friend']));

    this.registerAction('getAllFriends', {
      handler: this.getAllFriends,
    });
    this.registerAction('buildFriendRelation', {
      params: {
        user1: 'string',
        user2: 'string',
      },
      handler: this.buildFriendRelation,
    });
  }

  /**
   * 获取所有好友
   */
  async getAllFriends(ctx: TcContext<{}>) {
    const userId = ctx.meta.userId;

    const list = await this.adapter.find({
      query: {
        from: userId,
      },
    });

    const records = await this.transformDocuments(ctx, {}, list);
    const ids = records.map((r) => r.to);

    return ids;
  }

  /**
   * 构建好友关系
   */
  async buildFriendRelation(ctx: TcContext<{ user1: string; user2: string }>) {
    const { user1, user2 } = ctx.params;
    await this.adapter.model.buildFriendRelation(user1, user2);

    this.unicastNotify(ctx, user1, 'add', {
      userId: user2,
    });
    this.unicastNotify(ctx, user2, 'add', {
      userId: user1,
    });
  }
}
export default FriendService;

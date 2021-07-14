import { PawCacheCleaner } from '../../mixins/cache.cleaner.mixin';
import type { PawDbService } from '../../mixins/db.mixin';
import type { FriendDocument, FriendModel } from '../../models/user/friend';
import { PawService } from '../base';
import type { PawContext } from '../types';

interface FriendService
  extends PawService,
    PawDbService<FriendDocument, FriendModel> {}
class FriendService extends PawService {
  get serviceName(): string {
    return 'friend';
  }
  onInit(): void {
    this.registerDb('user.friend');
    // this.registerMixin(PawCacheCleaner(['cache.clean.friend']));

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
  async getAllFriends(ctx: PawContext<{}>) {
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
  async buildFriendRelation(ctx: PawContext<{ user1: string; user2: string }>) {
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

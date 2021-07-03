import { PawCacheCleaner } from '../../mixins/cache.cleaner.mixin';
import { PawDbService } from '../../mixins/db.mixin';
import { PawService } from '../base';
import type { PawContext } from '../types';

interface FriendService extends PawService, PawDbService<any> {}
class FriendService extends PawService {
  get serviceName(): string {
    return 'friend';
  }
  onInit(): void {
    this.registerMixin(PawDbService('friend'));
    // this.registerMixin(PawCacheCleaner(['cache.clean.friend']));

    this.registerAction('getAllFriends', {
      handler: this.getAllFriends,
    });
  }

  async getAllFriends(ctx: PawContext<{}>) {
    const userId = ctx.meta.userId;

    const list = await this.adapter.find({
      query: {
        from: userId,
      },
    });

    return list;
  }
}
export default FriendService;

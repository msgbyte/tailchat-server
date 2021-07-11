import { PawCacheCleaner } from '../../mixins/cache.cleaner.mixin';
import { PawDbService } from '../../mixins/db.mixin';
import { PawService } from '../base';
import { Errors } from 'moleculer';
import type { PawContext } from '../types';

interface FriendService extends PawService, PawDbService<any> {}
class FriendService extends PawService {
  get serviceName(): string {
    return 'friend.request';
  }
  onInit(): void {
    this.registerMixin(PawDbService('friendRequest'));
    // this.registerMixin(PawCacheCleaner(['cache.clean.friend']));

    this.registerAction('add', {
      params: {
        to: 'string',
        message: [{ type: 'string', optional: true }],
      },
      handler: this.add,
    });
    this.registerAction('allRelated', this.allRelated);
    this.registerAction('allSend', this.allSend);
    this.registerAction('allReceived', this.allReceived);
  }

  /**
   * 请求添加好友
   */
  async add(ctx: PawContext<{ to: string; message?: string }>) {
    const from = ctx.meta.userId;

    const { to, message } = ctx.params;

    if (from === to) {
      throw new Errors.ValidationError('不能添加自己为好友');
    }

    const exist = await this.adapter.findOne({
      from,
      to,
    });
    if (exist) {
      throw new Errors.MoleculerError('不能发送重复的好友请求');
    }

    const doc = await this.adapter.insert({
      from,
      to,
      message,
    });
    const request = await this.transformDocuments(ctx, {}, doc);

    this.unicastNotify(from, 'add', request);
    this.unicastNotify(to, 'add', request);

    return request;
  }

  /**
   * 所有与自己相关的好友请求
   */
  async allRelated(ctx: PawContext) {
    const userId = ctx.meta.userId;

    const doc = await this.adapter.find({
      query: {
        $or: [{ from: userId }, { to: userId }],
      },
    });

    const list = await await this.transformDocuments(ctx, {}, doc);
    return list;
  }

  /**
   * 所有发送的好友请求
   */
  async allSend(ctx: PawContext) {
    const from = ctx.meta.userId;

    const list = await this.adapter.find({ query: { from } });

    return await await this.transformDocuments(ctx, {}, list);
  }

  /**
   * 所有接受的好友请求
   */
  async allReceived(ctx: PawContext) {
    const to = ctx.meta.userId;

    const list = await this.adapter.find({ query: { to } });

    return await await this.transformDocuments(ctx, {}, list);
  }
}
export default FriendService;

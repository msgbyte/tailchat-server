import type { PawDbService } from '../../mixins/db.mixin';
import type {
  ConverseDocument,
  ConverseModel,
} from '../../models/chat/converse';
import { PawService } from '../base';
import type { PawContext } from '../types';

interface ConverseService
  extends PawService,
    PawDbService<ConverseDocument, ConverseModel> {}
class ConverseService extends PawService {
  get serviceName(): string {
    return 'chat.converse';
  }

  onInit(): void {
    this.registerDb('chat.converse');

    this.registerAction('createDMConverse', {
      params: {
        /**
         * 创建私人会话的对方ID
         */
        targetId: 'string',
      },
      handler: this.createDMConverse,
    });
    this.registerAction('findConverseInfo', {
      params: {
        converseId: 'string',
      },
      handler: this.findConverseInfo,
    });
  }

  async createDMConverse(ctx: PawContext<{ targetId: string }>) {
    const userId = ctx.meta.userId;
    const targetId = ctx.params.targetId;

    let converse = await this.adapter.model.findConverseWithMembers([
      userId,
      targetId,
    ]);
    if (converse === null) {
      // 创建新的会话
      converse = await this.adapter.insert({
        type: 'DM',
        members: [userId, targetId] as any,
      });
    }

    return await this.transformDocuments(ctx, {}, converse);
  }

  /**
   * 查找会话
   */
  async findConverseInfo(
    ctx: PawContext<{
      converseId: string;
    }>
  ) {
    const converseId = ctx.params.converseId;

    const converse = await this.adapter.findById(converseId);

    return await this.transformDocuments(ctx, {}, converse);
  }
}

export default ConverseService;

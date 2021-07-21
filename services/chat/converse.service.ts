import type { TcDbService } from '../../mixins/db.mixin';
import type {
  ConverseDocument,
  ConverseModel,
} from '../../models/chat/converse';
import { TcService } from '../base';
import type { TcContext } from '../types';

interface ConverseService
  extends TcService,
    TcDbService<ConverseDocument, ConverseModel> {}
class ConverseService extends TcService {
  get serviceName(): string {
    return 'chat.converse';
  }

  onInit(): void {
    this.registerDb('chat.converse');

    this.registerAction('createDMConverse', this.createDMConverse, {
      params: {
        /**
         * 创建私人会话的对方ID
         */
        targetId: 'string',
      },
    });
    this.registerAction('findConverseInfo', this.findConverseInfo, {
      params: {
        converseId: 'string',
      },
    });
  }

  async createDMConverse(ctx: TcContext<{ targetId: string }>) {
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
    ctx: TcContext<{
      converseId: string;
    }>
  ) {
    const converseId = ctx.params.converseId;

    const converse = await this.adapter.findById(converseId);

    return await this.transformDocuments(ctx, {}, converse);
  }
}

export default ConverseService;

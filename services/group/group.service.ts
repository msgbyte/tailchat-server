import type { TcDbService } from '../../mixins/db.mixin';
import type {
  GroupDocument,
  GroupModel,
  GroupPanel,
} from '../../models/group/group';
import { TcService } from '../base';
import type { TcContext } from '../types';

interface GroupService
  extends TcService,
    TcDbService<GroupDocument, GroupModel> {}
class GroupService extends TcService {
  get serviceName(): string {
    return 'group';
  }

  onInit(): void {
    this.registerDb('group.group');

    this.registerAction('createGroup', this.createGroup, {
      params: {
        name: 'string',
        panels: 'array',
      },
    });
  }

  /**
   * 创建群组
   */
  async createGroup(
    ctx: TcContext<{
      name: string;
      panels: GroupPanel[];
    }>
  ) {
    const name = ctx.params.name;
    const panels = ctx.params.panels;
    const creator = ctx.meta.userId;

    const group = await this.adapter.model.createGroup({
      name,
      panels,
      creator,
    });

    return this.transformDocuments(ctx, {}, group);
  }
}

export default GroupService;

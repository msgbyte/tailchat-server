import type { TcDbService } from '../../../mixins/db.mixin';
import { TcService } from '../../../services/base';
import type { TcContext } from '../../../services/types';
import type { LinkmetaDocument, LinkmetaModel } from '../models/linkmeta';
import { getLinkPreview } from 'link-preview-js';

/**
 * 用户服务
 */
interface LinkmetaService
  extends TcService,
    TcDbService<LinkmetaDocument, LinkmetaModel> {}
class LinkmetaService extends TcService {
  get serviceName() {
    return 'plugin:com.msgbyte.linkmeta';
  }

  onInit() {
    this.registerLocalDb(require('../models/linkmeta').default);

    this.registerAction('fetch', this.fetch, {
      params: {
        url: 'string',
      },
    });
  }

  /**
   * 获取连接预览信息
   */
  private async fetch(ctx: TcContext<{ url: string }>) {
    const url = ctx.params.url;

    const meta = await this.adapter.model.findOne({
      url,
    });

    if (!meta) {
      // 没有找到或已过期
      const data = await getLinkPreview(url);

      await this.adapter.model.create({
        url,
        data,
      });

      return { ...data, isCache: false };
    }

    return {
      ...meta.data,
      isCache: true,
    };
  }
}

export default LinkmetaService;

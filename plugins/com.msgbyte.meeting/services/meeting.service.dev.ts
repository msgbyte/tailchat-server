import { TcService, TcDbService, TcContext } from 'tailchat-server-sdk';
import { generateRandomNumStr, isValidStr } from '../../../lib/utils';
import type { MeetingDocument, MeetingModel } from '../models/meeting';

/**
 * 任务管理服务
 */
interface MeetingService
  extends TcService,
    TcDbService<MeetingDocument, MeetingModel> {}
class MeetingService extends TcService {
  get serviceName() {
    return 'plugin:com.msgbyte.meeting';
  }

  get tailchatMeetingUrl() {
    return process.env.TAILCHAT_MEETING_URL;
  }

  onInit() {
    // this.registerLocalDb(require('../models/meeting').default);

    this.registerAction('available', this.available);

    if (!isValidStr(this.tailchatMeetingUrl)) {
      return;
    }

    this.registerAction('create', this.create);
  }

  available(ctx: TcContext) {
    return Boolean(this.tailchatMeetingUrl);
  }

  /**
   * 创建房间
   *
   * TODO: 先手动返回一个随机生成的房间号
   */
  create(ctx: TcContext) {
    const roomId = generateRandomNumStr(9);
    return {
      roomId,
      url: `${this.tailchatMeetingUrl}/room/${roomId}`,
    };
  }
}

export default MeetingService;

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
    this.registerAction('getJoinMeetingInfo', this.getJoinMeetingInfo);
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

  /**
   * 获取加入会议的基本信息
   */
  getJoinMeetingInfo(ctx: TcContext) {
    const user = ctx.meta.user;

    return {
      signalingUrl: this.tailchatMeetingUrl.replace('https', 'wss'),
      userId: String(user._id),
      nickname: user.nickname,
      avatar: user.avatar,
    };
  }
}

export default MeetingService;

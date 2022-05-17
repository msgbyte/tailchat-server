import { showToasts } from '@capital/common';
import { joinMeeting } from '../meeting';

let currentMeeting: string | null = null;

/**
 * 启动快速会议
 */
export function startFastMeeting(meetingId: string) {
  console.log('startFastMeeting:', meetingId);

  if (currentMeeting) {
    showToasts('当前已有正在进行中的通话, 请先结束上一场通话');
    return;
  }

  joinMeeting(meetingId);

  // TODO
}

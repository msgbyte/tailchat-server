import { regCustomPanel, Loadable, regInspectService } from '@capital/common';
import { Translate } from './translate';

console.log('Plugin 音视频服务 is loaded');

regCustomPanel({
  position: 'personal',
  icon: 'mdi:video-box',
  name: 'com.msgbyte.meeting/meetingPanel',
  label: Translate.meeting,
  render: Loadable(() => import('./MeetingPanel')),
});

regInspectService({
  name: 'plugin:com.msgbyte.meeting',
  label: Translate.meetingService,
});

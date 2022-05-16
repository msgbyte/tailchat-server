import {
  regCustomPanel,
  Loadable,
  regInspectService,
  regPluginPanelAction,
} from '@capital/common';
import { startFastMeeting } from './FloatWindow';
import { Translate } from './translate';

console.log('Plugin 音视频服务 is loaded');

// regCustomPanel({
//   position: 'personal',
//   icon: 'mdi:video-box',
//   name: 'com.msgbyte.meeting/meetingPanel',
//   label: Translate.meeting,
//   render: Loadable(() => import('./MeetingPanel')),
// });

regPluginPanelAction({
  name: 'plugin:com.msgbyte.meeting/dmAction',
  label: '发起通话',
  position: 'dm',
  icon: 'mdi:video-box',
  onClick: ({ converseId }) => {
    startFastMeeting(converseId);
  },
});

regPluginPanelAction({
  name: 'plugin:com.msgbyte.meeting/groupAction',
  label: '发起通话',
  position: 'group',
  icon: 'mdi:video-box',
  onClick: ({ groupId, panelId }) => {
    startFastMeeting(`${groupId}|${panelId}`);
  },
});

regInspectService({
  name: 'plugin:com.msgbyte.meeting',
  label: Translate.meetingService,
});

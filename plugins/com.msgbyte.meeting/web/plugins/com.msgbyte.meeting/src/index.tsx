import {
  regCustomPanel,
  Loadable,
  regInspectService,
  regPluginPanelAction,
  regPluginRootRoute,
} from '@capital/common';
import { openConfirmModal } from '@capital/component';
import { createMeetingAndShare } from './helper';
import { Translate } from './translate';

console.log('Plugin 音视频服务 is loaded');

// regCustomPanel({
//   position: 'personal',
//   icon: 'mdi:video-box',
//   name: 'com.msgbyte.meeting/meetingPanel',
//   label: Translate.meeting,
//   render: Loadable(() => import('./MeetingPanel')),
// });

// 发起个人通话
regPluginPanelAction({
  name: 'plugin:com.msgbyte.meeting/dmAction',
  label: '发起通话',
  position: 'dm',
  icon: 'mdi:video-box',
  onClick: ({ converseId }) => {
    import('./FloatWindow').then(
      (module) => module.startFastMeeting('123456789') // 仅用于测试

      // (module) => module.startFastMeeting(converseId)

      // 启动后发送消息卡片
    );
  },
});

// 发起群组会议
regPluginPanelAction({
  name: 'plugin:com.msgbyte.meeting/groupAction',
  label: '发起通话',
  position: 'group',
  icon: 'mdi:video-box',
  onClick: ({ groupId, panelId }) => {
    openConfirmModal({
      title: '发起通话',
      content: '打开 tailchat-meeting 开始通话并向当前会话发送会议链接',
      onConfirm: async () => {
        await createMeetingAndShare(groupId, panelId);
      },
    });
  },
});

regPluginRootRoute({
  name: 'plugin:com.msgbyte.meeting/route',
  path: '/meeting/:meetingId',
  component: Loadable(() => import('./MeetingUrlWrapper')),
});

regInspectService({
  name: 'plugin:com.msgbyte.meeting',
  label: Translate.meetingService,
});

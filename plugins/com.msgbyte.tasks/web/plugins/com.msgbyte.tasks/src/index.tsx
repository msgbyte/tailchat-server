import { regCustomPanel, localTrans, Loadable } from '@capital/common';

regCustomPanel({
  position: 'personal',
  icon: 'mdi:checkbox-marked-outline',
  name: 'com.msgbyte.tasks/tasksPanel',
  label: localTrans({ 'zh-CN': '任务', 'en-US': 'Tasks' }),
  render: Loadable(() => import('./TasksPanel')),
});

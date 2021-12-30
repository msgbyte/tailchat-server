import { regCustomPanel, Loadable } from '@capital/common';
import { Translate } from './translate';

regCustomPanel({
  position: 'personal',
  icon: 'mdi:checkbox-marked-outline',
  name: 'com.msgbyte.tasks/tasksPanel',
  label: Translate.tasks,
  render: Loadable(() => import('./TasksPanel')),
});

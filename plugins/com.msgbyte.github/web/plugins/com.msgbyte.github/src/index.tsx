import { regCustomPanel, Loadable, regInspectService } from '@capital/common';
import { Translate } from './translate';

regCustomPanel({
  position: 'groupdetail',
  name: 'com.msgbyte.github/groupSubscribe',
  label: Translate.groupSubscribe,
  render: Loadable(() => import('./GroupSubscribePanel')),
});

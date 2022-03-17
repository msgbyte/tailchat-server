import React, { useCallback } from 'react';
import { openModal, closeModal, useGroupIdContext } from '@capital/common';
import { Button } from '@capital/component';
import { Translate } from '../translate';
import { AddGroupSubscribeModal } from './AddGroupSubscribeModal';

const GroupSubscribePanel: React.FC = React.memo(() => {
  const groupId = useGroupIdContext();
  const handleAdd = useCallback(() => {
    const key = openModal(
      <AddGroupSubscribeModal
        groupId={groupId}
        onSuccess={() => closeModal(key)}
      />
    );
  }, [groupId]);

  return (
    <div>
      <h2>{Translate.groupSubscribe}</h2>

      <Button type="primary" onClick={handleAdd}>
        {Translate.add}
      </Button>
    </div>
  );
});
GroupSubscribePanel.displayName = 'GroupSubscribePanel';

export default GroupSubscribePanel;

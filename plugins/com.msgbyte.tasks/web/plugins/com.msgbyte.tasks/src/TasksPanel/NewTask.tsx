import React, { useCallback, useState } from 'react';
import { Input } from '@capital/component';
import { Translate } from '../translate';
import { request } from '../request';

interface NewTaskProps {
  onSuccess?: () => void;
}
export const NewTask: React.FC<NewTaskProps> = React.memo((props) => {
  const { onSuccess } = props;
  const [title, setTitle] = useState('');
  const handleCreateTask = useCallback(() => {
    request
      .post('add', {
        title,
      })
      .then(() => {
        setTitle('');
        onSuccess && onSuccess();
      });
  }, [title, onSuccess]);

  return (
    <Input
      className="plugin-task-new"
      size="large"
      placeholder={Translate.insertTip}
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onPressEnter={handleCreateTask}
    />
  );
});
NewTask.displayName = 'NewTask';

import React from 'react';
import { TaskItemType } from './type';
import { Checkbox } from '@capital/component';

export const TaskItem: React.FC<{
  task: TaskItemType;
}> = React.memo(({ task }) => {
  return (
    <div className="plugin-task-item">
      <Checkbox />

      <div className="plugin-task-item_body">
        <div>{task.title}</div>
        <div>{task.description}</div>
      </div>
    </div>
  );
});
TaskItem.displayName = 'TaskItem';

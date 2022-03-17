import React from 'react';
import {
  ModalWrapper,
  createFastFormSchema,
  fieldSchema,
  useAsyncRequest,
  showToasts,
} from '@capital/common';
import { WebFastForm } from '@capital/component';
import { request } from '../request';

interface Values {
  repoName: string;
  textPanelId: string;
}

const schema = createFastFormSchema({
  repoName: fieldSchema.string().required('仓库名不能为空'),
  textPanelId: fieldSchema.string().required('频道ID不能为空'),
});

const fields = [
  {
    type: 'text',
    name: 'repoName',
    label: '仓库名',
    placeholder: 'msgbyte/tailchat',
  },
  {
    type: 'text',
    name: 'textPanelId',
    label: '文本面板ID',
  },
];

export const AddGroupSubscribeModal: React.FC<{
  groupId: string;
  onSuccess?: () => void;
}> = React.memo((props) => {
  const groupId = props.groupId;
  const [, handleSubmit] = useAsyncRequest(
    async (values: Values) => {
      const { repoName, textPanelId } = values;
      await request.post('subscribe.add', {
        groupId,
        textPanelId,
        repoName,
      });

      showToasts('成功', 'success');
      props.onSuccess?.();
    },
    [groupId, props.onSuccess]
  );

  return (
    <ModalWrapper title="创建应用">
      <WebFastForm schema={schema} fields={fields} onSubmit={handleSubmit} />
    </ModalWrapper>
  );
});
AddGroupSubscribeModal.displayName = 'AddGroupSubscribeModal';

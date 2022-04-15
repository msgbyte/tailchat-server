import React, { useCallback, useMemo } from 'react';
import {
  openModal,
  closeModal,
  useGroupIdContext,
  useAsyncRefresh,
  useAsyncRequest,
  getServiceUrl,
} from '@capital/common';
import { Button, Space, Table } from '@capital/component';
import { Translate } from '../translate';
import { AddGroupSubscribeModal } from './AddGroupSubscribeModal';
import { request } from '../request';

interface SubscribeItem {
  _id: string;
  groupId: string;
  textPanelId: string;
  createdAt: string;
  updatedAt: string;
}

const GroupSubscribePanel: React.FC = React.memo(() => {
  const groupId = useGroupIdContext();

  const { value: subscribes, refresh } = useAsyncRefresh(async () => {
    const { data } = await request.post('list', { groupId });
    return data;
  }, [groupId]);

  const handleAdd = useCallback(() => {
    const key = openModal(
      <AddGroupSubscribeModal
        groupId={groupId}
        onSuccess={() => {
          closeModal(key);
          refresh();
        }}
      />
    );
  }, [groupId, refresh]);

  const [, handleDelete] = useAsyncRequest(
    async (subscribeId) => {
      await request.post('delete', {
        groupId,
        subscribeId,
      });

      refresh();
    },
    [groupId, refresh]
  );

  const columns = useMemo(
    () => [
      {
        title: 'ID',
        dataIndex: '_id',
      },
      {
        title: Translate.panel,
        dataIndex: 'textPanelId',
      },
      {
        title: Translate.action,
        key: 'action',
        render: (_, record: SubscribeItem) => (
          <Space>
            <Button onClick={() => handleDelete(record._id)}>
              {Translate.delete}
            </Button>
          </Space>
        ),
      },
    ],
    [handleDelete]
  );

  return (
    <div>
      <div
        style={{
          marginBottom: 10,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <h2>{Translate.groupSubscribe}</h2>

        <Button type="primary" onClick={handleAdd}>
          {Translate.add}
        </Button>
      </div>

      <Table columns={columns} dataSource={subscribes} pagination={false} />

      {Array.isArray(subscribes) && subscribes.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <h3>如何接入:</h3>
          <p>
            直接发送请求:&nbsp;
            <code style={{ userSelect: 'text' }}>
              {getServiceUrl()}
              /api/plugin:com.msgbyte.simplenotify/webhook/callback?text=&lt;文本内容&gt;&subscribeId=&lt;ID&gt;
            </code>
          </p>
          <p>支持GET与POST</p>
          <p>
            <b>请保管好您的ID</b>
          </p>
        </div>
      )}
    </div>
  );
});
GroupSubscribePanel.displayName = 'GroupSubscribePanel';

export default GroupSubscribePanel;

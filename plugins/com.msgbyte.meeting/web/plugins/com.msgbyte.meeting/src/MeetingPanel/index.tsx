import React from 'react';
import { useAsyncRequest, useAsync, useCurrentUserInfo } from '@capital/common';
import { Button, LoadingSpinner } from '@capital/component';
import { request } from '../request';

/**
 * 视频会议面板
 */
const MeetingPanel: React.FC = React.memo(() => {
  const userInfo = useCurrentUserInfo();
  const [{ loading }, handleCreate] = useAsyncRequest(async () => {
    const { data } = await request.post('create');

    const meetingUrl = data.url;

    // 临时方案, 数据可能会变更因此需要在外面包一层
    window.open(
      `${meetingUrl}?displayName=${userInfo.nickname}&avatar=${userInfo.avatar}&from=tailchat`
    );
  }, [userInfo]);

  const { loading: availableLoading, value: available } = useAsync(async () => {
    const { data } = await request.get('available');

    return data;
  }, []);

  if (availableLoading) {
    return <LoadingSpinner />;
  }

  if (!available) {
    return <div>音视频服务不可用</div>;
  }

  return (
    <div style={{ padding: 10 }}>
      <Button type="primary" loading={loading} onClick={handleCreate}>
        快速发起会议
      </Button>
    </div>
  );
});
MeetingPanel.displayName = 'MeetingPanel';

export default MeetingPanel;

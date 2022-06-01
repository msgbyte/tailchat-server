import React, { useState } from 'react';
import { useAsync } from '@capital/common';
import { LoadingSpinner, IconBtn } from '@capital/component';
import { joinMeeting } from '../meeting';
import type { TailchatMeetingClient } from 'tailchat-meeting-sdk';
import { useClientState } from '../meeting/useClientState';
import './window.less';

/**
 * 音视频会议弹窗
 */
export const FloatMeetingWindow: React.FC<{
  client: TailchatMeetingClient;
  onClose: () => void;
}> = React.memo((props) => {
  const [folder, setFolder] = useState(false);
  const {
    volume,
    peers,
    webcamSrcObject,
    webcamEnabled,
    micEnabled,
    switchWebcam,
    switchMic,
  } = useClientState(props.client);

  return (
    <div
      className="plugin-meeting-floatwindow"
      style={{
        transform: folder ? 'translateY(-100%)' : 'none',
      }}
    >
      <div className="body">
        <div>当前正在会议中</div>

        <div>{JSON.stringify({ volume, peers, webcamSrcObject })}</div>
      </div>

      <div className="controller">
        <IconBtn
          icon={webcamEnabled ? 'mdi:video' : 'mdi:video-off'}
          title={webcamEnabled ? '关闭摄像头' : '开启摄像头'}
          size="large"
          onClick={switchWebcam}
        />

        <IconBtn
          icon={micEnabled ? 'mdi:microphone' : 'mdi:microphone-off'}
          title={micEnabled ? '关闭麦克风' : '开启麦克风'}
          size="large"
          onClick={switchMic}
        />

        <IconBtn
          icon="mdi:phone-remove-outline"
          title="挂断"
          danger={true}
          size="large"
          onClick={() => {
            props.client.close();
            props.onClose();
          }}
        />
      </div>

      <div className="folder-btn" onClick={() => setFolder(!folder)}>
        {folder ? '展开' : '收起'}
      </div>
    </div>
  );
});
FloatMeetingWindow.displayName = 'FloatMeetingWindow';

export const FloatMeetingWindowWrapper: React.FC<{
  meetingId: string;
  onClose: () => void;
}> = React.memo((props) => {
  const { loading, value: client } = useAsync(
    () => joinMeeting(props.meetingId),
    []
  );

  if (loading) {
    return (
      <div className="plugin-meeting-floatwindow">
        <LoadingSpinner />
      </div>
    );
  }

  if (!client) {
    return <div>出现错误</div>;
  }

  return <FloatMeetingWindow client={client} onClose={props.onClose} />;
});
FloatMeetingWindowWrapper.displayName = 'FloatMeetingWindowWrapper';

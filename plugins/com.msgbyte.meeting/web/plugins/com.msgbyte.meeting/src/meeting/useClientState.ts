import { useLayoutEffect, useState } from 'react';
import type { Peer, TailchatMeetingClient } from 'tailchat-meeting-sdk';

export function useClientState(client: TailchatMeetingClient) {
  const [volume, setVolume] = useState<{
    volume: number;
    scaledVolume: number;
  }>({ volume: 0, scaledVolume: 0 });
  const [peers, setPeers] = useState<Peer[]>([]);
  const [webcamSrcObject, setWebcamSrcObject] = useState<
    MediaStream | undefined
  >();

  useLayoutEffect(() => {
    const webcamProduceHandler = (webcamProducer) => {
      if (webcamProducer.track) {
        setWebcamSrcObject(new MediaStream([webcamProducer.track]));
      }
    };
    const webcamCloseHandler = () => {
      setWebcamSrcObject(null);
    };
    const micProduceHandler = (micProducer) => {
      debugger;
      (micProducer.appData as any).volumeWatcher.on('volumeChange', (data) => {
        setVolume(data);
      });
    };
    const micCloseHandler = () => {};
    const peersUpdatedHandler = (peers) => {
      setPeers([...peers]);
    };

    client.on('webcamProduce', webcamProduceHandler);
    client.on('webcamClose', webcamCloseHandler);
    client.on('micProduce', micProduceHandler);
    client.on('micClose', micCloseHandler);
    client.room.on('peersUpdated', peersUpdatedHandler);

    setPeers(client.room.peers);

    return () => {
      client.off('webcamProduce', webcamProduceHandler);
      client.off('webcamClose', webcamCloseHandler);
      client.off('micProduce', micProduceHandler);
      client.off('micClose', micCloseHandler);
      client.room.off('peersUpdated', peersUpdatedHandler);
    };
  }, [client]);

  return { volume, peers, webcamSrcObject };
}

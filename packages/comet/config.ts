import config from 'config';
import type { instrument } from '@socket.io/admin-ui';
import type { ClusterNode } from 'ioredis';

export const cometConfig = config.get<{
  port: number;
  rpc: {
    port: number;
  };
  instrument: Parameters<typeof instrument>[1];
  socketAdapter: 'redis' | 'none';
  redisCluster: ClusterNode[];
}>('comet');

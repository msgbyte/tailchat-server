import config from 'config';

export const logicConfig = config.get<{
  rpc: {
    port: number;
  };
}>('logic');

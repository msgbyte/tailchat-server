import Koa from 'koa';
import http from 'http';
import { Server, Socket } from 'socket.io';
// import { createAdapter } from 'socket.io-amqp0';
// import { connect } from 'amqplib';
import { createAdapter } from '@socket.io/redis-adapter';
import { Cluster, ClusterNode } from 'ioredis';
import { instrument } from '@socket.io/admin-ui';
import config from 'config';

const cometConfig = config.get<{
  port: number;
  instrument: Parameters<typeof instrument>[1];
  socketAdapter: 'redis' | 'none';
  redisCluster: ClusterNode[];
}>('comet');

const app = new Koa();
const httpServer = http.createServer(app.callback());
const io = new Server(httpServer, {
  transports: ['websocket'],
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

instrument(io, {
  ...cometConfig.instrument,
});
// io.adapter(
//   createAdapter({
//     amqpConnection: () => connect('amqp://localhost'),
//   }) as any
// );

if (cometConfig.socketAdapter === 'redis') {
  const pubClient = new Cluster(cometConfig.redisCluster);
  const subClient = pubClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));
}
io.on('connection', (socket) => {
  // 连接时
  socket.onAny((...args) => {
    // 接受任意消息
    console.log('Receive Message:', ...args);
    // TODO
  });
});

httpServer.listen(cometConfig.port);
console.log(`PAW Chat Comet Service Start. Listening ${cometConfig.port}...`);

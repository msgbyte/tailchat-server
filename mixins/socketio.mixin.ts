import { ServiceSchema, Errors, ServiceBroker } from 'moleculer';
import { Server as SocketServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import RedisClient from 'ioredis';
import type { PawService } from '../services/base';
import type { PawContext, UserJWTPayload } from '../services/types';
import _ from 'lodash';

/**
 * Socket IO 服务 mixin
 */
export const PawSocketIOService = (): Partial<ServiceSchema> => {
  const schema: Partial<ServiceSchema> = {
    async started() {
      if (!this.io) {
        this.initSocketIO();
      }

      this.logger.info('SocketIO 服务已启动');

      const io: SocketServer = this.io;
      if (process.env.REDIS_URI) {
        const pubClient = new RedisClient(process.env.REDIS_URI);
        const subClient = pubClient.duplicate();
        io.adapter(
          createAdapter(pubClient, subClient, {
            key: 'pawchat-socket',
          })
        );
        this.logger.info('SocketIO 正在使用 Redis Adapter');
      }

      io.use(async (socket, next) => {
        // 授权
        try {
          const token = socket.handshake.auth['token'];
          if (typeof token !== 'string') {
            throw new Errors.MoleculerError('Token不能为空');
          }

          const user: UserJWTPayload = await this.broker.call(
            'user.resolveToken',
            {
              token,
            }
          );

          if (!(user && user._id)) {
            throw new Error('Token不合规');
          }

          this.logger.info('Authenticated via JWT: ', user.username);

          socket.data.user = user;
          socket.data.token = token;
          socket.data.userId = user._id;

          next();
        } catch (e) {
          return next(e);
        }
      });

      io.on('connection', (socket) => {
        // 连接时
        socket.onAny(
          (
            eventName: string,
            eventData: unknown,
            cb: (data: unknown) => void
          ) => {
            this.logger.debug(
              '[SocketIO]',
              '<=',
              eventName,
              JSON.stringify(eventData)
            );
            // 接受任意消息, 并调用action
            (this.broker as ServiceBroker)
              .call(eventName, eventData, {
                meta: {
                  ...socket.data,
                  socketId: socket.id,
                },
              })
              .then((data: unknown) => {
                if (typeof cb === 'function') {
                  this.logger.debug('[SocketIO]', '=>', JSON.stringify(data));
                  cb({ result: true, data });
                }
              })
              .catch((err: Error) => {
                cb({
                  result: false,
                  message: _.get(err, 'message', '服务器异常'),
                });
              });
          }
        );

        socket.on('disconnecting', (reason) => {
          console.log('Socket Disconnect:', reason, '| Rooms:', socket.rooms);
        });
      });
    },
    actions: {
      joinRoom: {
        params: {
          roomId: 'string',
          socketId: [{ type: 'string', optional: true }],
        },
        async handler(
          this: PawService,
          ctx: PawContext<{ roomId: string; socketId?: string }>
        ) {
          const roomId = ctx.params.roomId;
          const socketId = ctx.params.socketId ?? ctx.meta.socketId;
          if (!ctx.meta.socketId) {
            throw new Error('无法加入房间, 当前socket链接不存在');
          }

          // 获取远程socket链接并加入
          const io: SocketServer = this.io;
          const remoteSockets = await io.in(socketId).fetchSockets();
          if (remoteSockets.length === 0) {
            throw new Error('无法加入房间, 无法找到当前socket链接');
          }

          // 最多只有一个
          remoteSockets[0].join(roomId);
        },
      },
    },
    methods: {
      initSocketIO() {
        if (!this.server) {
          throw new Errors.ServiceNotAvailableError(
            '需要和 [moleculer-web] 一起使用'
          );
        }
        this.io = new SocketServer(this.server, {
          serveClient: false,
          transports: ['websocket'],
          cors: {
            origin: '*',
            methods: ['GET', 'POST'],
          },
        });
      },
    },
  };

  return schema;
};

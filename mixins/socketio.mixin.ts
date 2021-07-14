import {
  ServiceSchema,
  Errors,
  ServiceBroker,
  Service,
  Utils,
  Context,
} from 'moleculer';
import { Server as SocketServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import RedisClient from 'ioredis';
import type { PawService } from '../services/base';
import type { PawContext, UserJWTPayload } from '../services/types';
import _ from 'lodash';

const blacklist: (string | RegExp)[] = ['gateway.*'];

function checkBlacklist(eventName: string): boolean {
  return blacklist.some((item) => {
    if (_.isString(item)) {
      return Utils.match(eventName, item);
    } else if (_.isRegExp(item)) {
      return item.test(eventName);
    }
  });
}

/**
 * socket 用户房间编号
 */
function buildUserRoomId(userId: string) {
  return `u-${userId}`;
}

/**
 * socket online 用户编号
 */
function buildUserOnlineKey(userId: string) {
  return `pawchat-socketio.online:${userId}`;
}

const expiredTime = 1 * 24 * 60 * 60; // 1天

/**
 * Socket IO 服务 mixin
 */
export const PawSocketIOService = (): Partial<ServiceSchema> => {
  const schema: Partial<ServiceSchema> = {
    async started(this: Service) {
      if (!this.io) {
        this.initSocketIO();
      }

      this.logger.info('SocketIO 服务已启动');

      const io: SocketServer = this.io;
      if (!process.env.REDIS_URL) {
        throw new Errors.MoleculerClientError(
          'SocketIO服务启动失败, 需要环境变量: process.env.REDIS_URL'
        );
      }

      const pubClient = new RedisClient(process.env.REDIS_URL);
      const subClient = pubClient.duplicate();
      io.adapter(
        createAdapter(pubClient, subClient, {
          key: 'pawchat-socket',
        })
      );
      this.logger.info('SocketIO 正在使用 Redis Adapter');

      this.redis = pubClient;

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
        if (typeof socket.data.userId !== 'string') {
          // 不应该进入的逻辑
          return;
        }

        const userId = socket.data.userId;
        pubClient
          .hset(buildUserOnlineKey(userId), socket.id, this.broker.nodeID)
          .then(() => {
            pubClient.expire(buildUserOnlineKey(userId), expiredTime);
          });

        // 加入自己userId所生产的id
        socket.join(buildUserRoomId(userId));

        // 用户断线
        socket.on('disconnecting', (reason) => {
          console.log('Socket Disconnect:', reason, '| Rooms:', socket.rooms);
          pubClient.hdel(buildUserOnlineKey(userId), socket.id);
        });

        // 连接时
        socket.onAny(
          (
            eventName: string,
            eventData: unknown,
            cb: (data: unknown) => void
          ) => {
            this.logger.info(
              '[SocketIO]',
              '<=',
              eventName,
              JSON.stringify(eventData)
            );

            // 检测是否允许调用
            if (checkBlacklist(eventName)) {
              const message = '不允许的请求';
              this.logger.warn('[SocketIO]', '=>', message);
              cb({
                result: false,
                message,
              });
              return;
            }

            // 接受任意消息, 并调用action
            // TODO: 这里有个问题, 就是如果一个action仅内部调用的话无法过滤! 需要借鉴moleculer-web的实现
            (this.broker as ServiceBroker)
              .call(eventName, eventData, {
                meta: {
                  ...socket.data,
                  socketId: socket.id,
                },
              })
              .then((data: unknown) => {
                if (typeof cb === 'function') {
                  this.logger.info('[SocketIO]', '=>', JSON.stringify(data));
                  cb({ result: true, data });
                }
              })
              .catch((err: Error) => {
                const message = _.get(err, 'message', '服务器异常');
                this.logger.info('[SocketIO]', '=>', message);
                this.logger.error('[SocketIO]', err);
                cb({
                  result: false,
                  message,
                });
              });
          }
        );
      });
    },
    actions: {
      joinRoom: {
        visibility: 'public',
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

      /**
       * 服务端通知
       */
      notify: {
        visibility: 'public',
        params: {
          type: 'string',
          target: [
            { type: 'string', optional: true },
            { type: 'array', optional: true },
          ],
          eventName: 'string',
          eventData: 'any',
        },
        handler(
          this: Service,
          ctx: Context<{
            type: string;
            target: string | string[];
            eventName: string;
            eventData: any;
          }>
        ) {
          const { type, target, eventName, eventData } = ctx.params;
          const io: SocketServer = this.io;
          if (type === 'unicast' && typeof target === 'string') {
            // 单播
            io.to(buildUserRoomId(target)).emit(eventName, eventData);
          } else if (type === 'listcast' && Array.isArray(target)) {
            // 列播
            io.to(target.map((t) => buildUserRoomId(t))).emit(
              eventName,
              eventData
            );
          } else if (type === 'roomcast') {
            // 组播
            io.to(target).emit(eventName, eventData);
          } else if (type === 'broadcast') {
            // 广播
            io.emit(eventName, eventData);
          } else {
            this.logger.warn(
              '[SocketIO]',
              'Unknown notify type or target',
              type,
              target
            );
          }
        },
      },

      /**
       * 检查用户在线状态
       */
      checkUserOnline: {
        params: {
          userIds: 'array',
        },
        async handler(this: PawService, ctx: Context<{ userIds: string[] }>) {
          const userIds = ctx.params.userIds;

          const status = await Promise.all(
            userIds.map((userId) =>
              (this.redis as RedisClient.Redis).exists(
                buildUserOnlineKey(userId)
              )
            )
          );

          return status.map((d) => Boolean(d));
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

import { ServiceSchema, Errors } from 'moleculer';
import { Server } from 'socket.io';
import { UserJWTPayload } from '../services/user/user.service';
import { createAdapter } from '@socket.io/redis-adapter';
import RedisClient from 'ioredis';

/**
 * Socket IO 服务 mixin
 */
export const PawSocketIOService = (): Partial<ServiceSchema> => {
  return {
    async started() {
      if (!this.io) {
        this.initSocketIO();
      }

      const io: Server = this.io;
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
          const token = socket.handshake.headers['x-token'];
          if (typeof token !== 'string') {
            throw new Errors.MoleculerError('Token不能为空');
          }

          const user: UserJWTPayload = await this.call('user.resolveToken', {
            token,
          });

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
    },
    methods: {
      initSocketIO() {
        if (!this.server) {
          throw new Errors.ServiceNotAvailableError(
            '需要和 moleculer-web 一起使用'
          );
        }
        this.io = new Server(this.server, {
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
};

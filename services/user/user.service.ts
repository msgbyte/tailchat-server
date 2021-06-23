import { Service, ServiceBroker, Context } from 'moleculer';
import { PawCacheCleaner } from '../../mixins/cache.cleaner.mixin';
import { PawDbService } from '../../mixins/db.mixin';

/**
 * 用户服务
 */
export default class UserService extends Service {
  public constructor(broker: ServiceBroker) {
    super(broker);

    this.parseServiceSchema({
      name: 'user',
      mixins: [PawDbService('user'), PawCacheCleaner(['cache.clean.user'])],
      actions: {
        login: {
          rest: 'POST /login',
          handler: this.login,
        },
        register: {
          rest: 'POST /register',
          params: {
            username: 'string',
            password: 'string',
          },
          handler: this.register,
        },
      },
      methods: {
        authorize: this.authorize,
      },
    });
  }

  /**
   * jwt秘钥
   */
  get jwtSecretKey() {
    return process.env.PAW_JWT_SECRET || 'pawchat';
  }

  async login(ctx: Context) {
    return {
      id: 1,
      username: 'test',
    };
  }

  async register(ctx: Context<{ username: string; password: string }>) {
    console.log(ctx, this.jwtSecretKey);

    return {};
  }

  /**
   * 授权
   */
  async authorize(ctx: Context) {
    // TODO
  }
}

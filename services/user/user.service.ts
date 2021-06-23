import { Service, ServiceBroker, Context, Errors } from 'moleculer';
import { PawCacheCleaner } from '../../mixins/cache.cleaner.mixin';
import { PawDbService } from '../../mixins/db.mixin';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

interface UserJWTPayload {
  id: string;
  username: string;
}

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
        create: false,
        login: {
          rest: 'POST /login',
          handler: this.login,
        },
        register: {
          rest: 'POST /register',
          params: {
            username: 'string',
            email: 'string',
            password: 'string',
          },
          handler: this.register,
        },
        resolveToken: {
          cache: {
            keys: ['token'],
            ttl: 60 * 60, // 1 hour
          },
          params: {
            token: 'string',
          },
          handler: this.resolveToken,
        },
      },
    });
  }

  /**
   * jwt秘钥
   */
  get jwtSecretKey() {
    return process.env.PAW_JWT_SECRET || 'pawchat';
  }

  /**
   * TODO
   * 登录
   */
  async login(ctx: Context) {
    return {
      id: 1,
      username: 'test',
    };
  }

  async register(
    ctx: Context<{ username: string; email: string; password: string }, any>
  ) {
    const entity: any = ctx.params;
    // await this.validateEntity(entity);

    if (entity.username) {
      const found = await this.adapter.findOne({ username: entity.username });
      if (found) {
        throw new Errors.MoleculerClientError('用户名已存在!', 422, '', [
          { field: 'username', message: 'is exist' },
        ]);
      }
    }

    if (entity.email) {
      const found = await this.adapter.findOne({ email: entity.email });
      if (found) {
        throw new Errors.MoleculerClientError('邮箱已存在!', 422, '', [
          { field: 'email', message: 'is exist' },
        ]);
      }
    }

    entity.password = bcrypt.hashSync(entity.password, 10);
    entity.avatar = entity.avatar || null;
    entity.createdAt = new Date();

    const doc = await this.adapter.insert(entity);
    const user = await this.transformDocuments(ctx, {}, doc);
    const json = await this.transformEntity(user, true, ctx.meta.token);
    await this.entityChanged('created', json, ctx);
    return json;
  }

  /**
   * 校验JWT的合法性
   * @param ctx
   * @returns
   */
  async resolveToken(ctx: Context<{ token: string }>) {
    const decoded = await new Promise<UserJWTPayload>((resolve, reject) => {
      jwt.verify(
        ctx.params.token,
        this.jwtSecretKey,
        (err, decoded: UserJWTPayload) => {
          if (err) return reject(err);

          resolve(decoded);
        }
      );
    });

    if (decoded.id) {
      return this.getById(decoded.id);
    }
  }

  /**
   * Transform returned user entity. Generate JWT token if neccessary.
   *
   * @param {Object} user
   * @param {Boolean} withToken
   */
  transformEntity(user: any, withToken: boolean, token) {
    if (user) {
      //user.image = user.image || "https://www.gravatar.com/avatar/" + crypto.createHash("md5").update(user.email).digest("hex") + "?d=robohash";
      user.image = user.image || '';
      if (withToken) {
        user.token = token || this.generateJWT(user);
      }
    }

    return { user };
  }

  /**
   * 生成jwt
   */
  generateJWT(user: { _id: string; username: string }) {
    return jwt.sign(
      {
        id: user._id,
        username: user.username,
      } as UserJWTPayload,
      this.jwtSecretKey,
      {
        expiresIn: '30d',
      }
    );
  }
}

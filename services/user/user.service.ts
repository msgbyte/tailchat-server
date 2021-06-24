import { Service, ServiceBroker, Context, Errors } from 'moleculer';
import { PawCacheCleaner } from '../../mixins/cache.cleaner.mixin';
import { PawDbService } from '../../mixins/db.mixin';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserDocument } from '../../schemas/user';

interface UserJWTPayload {
  id: string;
  username: string;
}

/**
 * 用户服务
 */
interface UserService extends Service, PawDbService<UserDocument> {}
class UserService extends Service {
  public constructor(broker: ServiceBroker) {
    super(broker);

    this.parseServiceSchema({
      name: 'user',
      mixins: [PawDbService('user'), PawCacheCleaner(['cache.clean.user'])],
      actions: {
        create: false,
        login: {
          rest: 'POST /login',
          params: {
            username: [{ type: 'string', optional: true }],
            email: [{ type: 'string', optional: true }],
            password: 'string',
          },
          handler: this.login,
        },
        register: {
          rest: 'POST /register',
          params: {
            username: [{ type: 'string', optional: true }],
            email: [{ type: 'string', optional: true }],
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
   * 登录
   */
  async login(
    ctx: Context<{ username?: string; email?: string; password: string }, any>
  ) {
    const { username, email, password } = ctx.params;

    let user: UserDocument;
    if (typeof username === 'string') {
      user = await this.adapter.findOne({ username });
      if (!user) {
        throw new Errors.MoleculerClientError('User not found!', 422, '', [
          { field: 'username', message: 'is not found' },
        ]);
      }
    } else if (typeof email === 'string') {
      user = await this.adapter.findOne({ email });
      if (!user) {
        throw new Errors.MoleculerClientError('User not found!', 422, '', [
          { field: 'email', message: 'is not found' },
        ]);
      }
    } else {
      throw new Errors.MoleculerClientError(
        'Email or Username is invalid!',
        422,
        '',
        [{ field: 'email', message: 'is not found' }]
      );
    }

    const res = await bcrypt.compare(password, user.password);
    if (!res)
      throw new Errors.MoleculerClientError('Wrong password!', 422, '', [
        { field: 'email', message: 'is not found' },
      ]);

    // Transform user entity (remove password and all protected fields)
    const doc = await this.transformDocuments(ctx, {}, user);
    return await this.transformEntity(doc, true, ctx.meta.token);
  }

  async register(
    ctx: Context<{ username?: string; email?: string; password: string }, any>
  ) {
    const params = { ...ctx.params };
    await this.validateEntity(params);

    if (!params.username && !params.email) {
      throw new Errors.ValidationError('用户名或邮箱为空');
    }

    if (params.username) {
      const found = await this.adapter.findOne({ username: params.username });
      if (found) {
        throw new Errors.MoleculerClientError('用户名已存在!', 422, '', [
          { field: 'username', message: 'is exist' },
        ]);
      }
    }

    if (params.email) {
      const found = await this.adapter.findOne({ email: params.email });
      if (found) {
        throw new Errors.MoleculerClientError('邮箱已存在!', 422, '', [
          { field: 'email', message: 'is exist' },
        ]);
      }
    }

    const doc = await this.adapter.insert({
      ...params,
      password: bcrypt.hashSync(params.password, 10),
      nickname: params.username,
      avatar: null,
      createdAt: new Date(),
    });
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
      //user.avatar = user.avatar || "https://www.gravatar.com/avatar/" + crypto.createHash("md5").update(user.email).digest("hex") + "?d=robohash";
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

export default UserService;

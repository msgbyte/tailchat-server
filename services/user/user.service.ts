import { Context, Errors } from 'moleculer';
import { PawCacheCleaner } from '../../mixins/cache.cleaner.mixin';
import { PawDbService } from '../../mixins/db.mixin';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { UserDocument } from '../../schemas/user';
import { PawService } from '../base';
import type { PawContext, UserJWTPayload } from '../types';
import { DataNotFoundError, EntityError } from '../../lib/errors';

/**
 * 用户服务
 */
interface UserService extends PawService, PawDbService<UserDocument> {}
class UserService extends PawService {
  get serviceName() {
    return 'user';
  }

  onInit() {
    this.registerMixin(PawDbService('user'));
    this.registerMixin(PawCacheCleaner(['cache.clean.user']));

    // Public fields
    this.registerSetting('fields', [
      '_id',
      'username',
      'email',
      'avatar',
      'nickname',
      'createdAt',
    ]);

    this.registerAction('login', {
      rest: 'POST /login',
      params: {
        username: [{ type: 'string', optional: true }],
        email: [{ type: 'string', optional: true }],
        password: 'string',
      },
      handler: this.login,
    });
    this.registerAction('register', {
      rest: 'POST /register',
      params: {
        username: [{ type: 'string', optional: true }],
        email: [{ type: 'string', optional: true }],
        password: 'string',
      },
      handler: this.register,
    });
    this.registerAction('resolveToken', {
      cache: {
        keys: ['token'],
        ttl: 60 * 60, // 1 hour
      },
      params: {
        token: 'string',
      },
      handler: this.resolveToken,
    });
    this.registerAction('whoami', {
      handler: this.whoami,
    });
  }

  /**
   * jwt秘钥
   */
  get jwtSecretKey() {
    return process.env.PAW_JWT_SECRET || 'pawchat';
  }

  /**
   * 用户登录
   */
  async login(
    ctx: Context<{ username?: string; email?: string; password: string }, any>
  ) {
    const { username, email, password } = ctx.params;

    let user: UserDocument;
    if (typeof username === 'string') {
      user = await this.adapter.findOne({ username });
      if (!user) {
        throw new EntityError('用户不存在, 请检查您的用户名', 442, '', [
          { field: 'username', message: '用户名不存在' },
        ]);
      }
    } else if (typeof email === 'string') {
      user = await this.adapter.findOne({ email });
      if (!user) {
        throw new EntityError('用户不存在, 请检查您的邮箱', 422, '', [
          { field: 'email', message: '邮箱不存在' },
        ]);
      }
    } else {
      throw new EntityError('用户名或邮箱为空', 422, '', [
        { field: 'email', message: '邮箱不存在' },
      ]);
    }

    const res = await bcrypt.compare(password, user.password);
    if (!res)
      throw new EntityError('密码错误', 422, '', [
        { field: 'password', message: '密码错误' },
      ]);

    // Transform user entity (remove password and all protected fields)
    const doc = await this.transformDocuments(ctx, {}, user);
    return await this.transformEntity(doc, true, ctx.meta.token);
  }

  /**
   * 用户注册
   */
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
  async resolveToken(ctx: PawContext<{ token: string }>) {
    const decoded = await this.verifyJWT(ctx.params.token);

    if (typeof decoded._id !== 'string') {
      // token 中没有 _id
      throw new EntityError('Token 内容不正确');
    }
    const doc = await this.getById(decoded._id);
    const user = await this.transformDocuments(ctx, {}, doc);
    const json = await this.transformEntity(user, true, ctx.meta.token);
    return json;
  }

  whoami(ctx: PawContext) {
    return ctx.meta ?? null;
  }

  /**
   * Transform returned user entity. Generate JWT token if neccessary.
   *
   * @param {Object} user
   * @param {Boolean} withToken
   */
  private async transformEntity(user: any, withToken: boolean, token?: string) {
    if (user) {
      //user.avatar = user.avatar || "https://www.gravatar.com/avatar/" + crypto.createHash("md5").update(user.email).digest("hex") + "?d=robohash";
      if (withToken) {
        if (token !== undefined) {
          // 携带了token
          try {
            this.verifyJWT(token);
            // token 可用, 原样传回
            user.token = token;
          } catch (err) {
            // token 不可用, 生成一个新的返回
            user.token = this.generateJWT(user);
          }
        } else {
          // 没有携带token 生成一个
          user.token = this.generateJWT(user);
        }
      }

      if (typeof user.nickname !== 'string') {
        user.nickname = user.username ?? user.email;
      }
    }

    return user;
  }

  private async verifyJWT(token: string): Promise<UserJWTPayload> {
    const decoded = await new Promise<UserJWTPayload>((resolve, reject) => {
      jwt.verify(token, this.jwtSecretKey, (err, decoded: UserJWTPayload) => {
        if (err) return reject(err);

        resolve(decoded);
      });
    });

    return decoded;
  }

  /**
   * 生成jwt
   */
  private generateJWT(user: {
    _id: string;
    username: string;
    email: string;
    avatar: string;
  }): string {
    return jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      } as UserJWTPayload,
      this.jwtSecretKey,
      {
        expiresIn: '30d',
      }
    );
  }
}

export default UserService;

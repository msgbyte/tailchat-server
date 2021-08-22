import {
  ActionHandler,
  ActionSchema,
  Context,
  Service,
  ServiceBroker,
  ServiceSchema,
} from 'moleculer';
import { once } from 'lodash';
import { TcDbService } from '../mixins/db.mixin';
import type { TcContext, TcPureContext } from './types';
import type { TFunction } from 'i18next';
import { t } from '../lib/i18n';

type ServiceActionHandler<T = any> = (
  ctx: TcPureContext<any>
) => Promise<T> | T;

/**
 * TcService 微服务抽象基类
 */
export abstract class TcService extends Service {
  /**
   * 服务名, 全局唯一
   */
  abstract get serviceName(): string;
  private _mixins: ServiceSchema['mixins'] = [];
  private _actions: ServiceSchema['actions'] = {};
  private _methods: ServiceSchema['methods'] = {};
  private _settings: ServiceSchema['settings'] = {};

  private _generateAndParseSchema() {
    this.parseServiceSchema({
      name: this.serviceName,
      mixins: this._mixins,
      settings: this._settings,
      actions: this._actions,
    });
  }

  constructor(broker: ServiceBroker) {
    super(broker); // Skip 父级的 parseServiceSchema 方法

    this.onInit(); // 初始化服务

    this._generateAndParseSchema();

    this.onInited(); // 初始化完毕
  }

  protected abstract onInit(): void;

  protected onInited() {}

  registerMixin(mixin: Partial<ServiceSchema>): void {
    this._mixins.push(mixin);
  }

  /**
   * 注册微服务绑定的数据库
   * 不能调用多次
   */
  registerDb = once((schemaName: string) => {
    this.registerMixin(TcDbService(schemaName.replace('.', '/')));
  });

  /**
   * 注册一个操作
   *
   * 该操作会同时生成http请求和socketio事件的处理
   * @param name 操作名, 需微服务内唯一
   * @param handler 处理方法
   * @returns
   */
  registerAction(
    name: string,
    handler: ServiceActionHandler,
    schema?: ActionSchema
  ) {
    if (this._actions[name]) {
      this.logger.warn(`重复注册操作: ${name}。操作被跳过...`);
      return;
    }

    this._actions[name] = {
      ...schema,
      handler(
        this: Service,
        ctx: Context<unknown, { language: string; t: TFunction }>
      ) {
        // 调用时生成t函数
        ctx.meta.t = (key: string, defaultValue?: string) =>
          t(key, defaultValue, {
            lng: ctx.meta.language,
          });
        return handler.call(this, ctx);
      },
    };
  }

  /**
   * 注册一个内部方法
   */
  registerMethod(name: string, method: (...args: any[]) => any) {
    if (this._methods[name]) {
      this.logger.warn(`重复注册方法: ${name}。操作被跳过...`);
      return;
    }

    this._methods[name] = method;
  }

  /**
   * 注册一个配置项
   */
  registerSetting(key: string, value: unknown): void {
    if (this._settings[key]) {
      this.logger.warn(`重复注册配置: ${key}。之前的设置将被覆盖...`);
    }

    this._settings[key] = value;
  }

  /**
   * 清理action缓存
   * NOTICE: 这里使用Redis作为缓存管理器，因此不需要通知所有的service
   */
  async cleanActionCache(actionName: string, keys: string[] = []) {
    await this.broker.cacher.clean(
      `${this.serviceName}.${actionName}:${keys.join('|')}**`
    );
  }

  /**
   * 生成一个有命名空间的通知事件名
   */
  protected generateNotifyEventName(eventName: string) {
    return `notify:${this.serviceName}.${eventName}`;
  }

  /**
   * 单播推送socket事件
   */
  unicastNotify(
    ctx: TcContext,
    userId: string,
    eventName: string,
    eventData: unknown
  ): Promise<void> {
    return ctx.call('gateway.notify', {
      type: 'unicast',
      target: userId,
      eventName: this.generateNotifyEventName(eventName),
      eventData,
    });
  }

  /**
   * 列播推送socket事件
   */
  listcastNotify(
    ctx: TcContext,
    userIds: string[],
    eventName: string,
    eventData: unknown
  ) {
    return ctx.call('gateway.notify', {
      type: 'listcast',
      target: userIds,
      eventName: this.generateNotifyEventName(eventName),
      eventData,
    });
  }

  /**
   * 组播推送socket事件
   */
  roomcastNotify(
    ctx: TcContext,
    roomId: string,
    eventName: string,
    eventData: unknown
  ): Promise<void> {
    return ctx.call('gateway.notify', {
      type: 'roomcast',
      target: roomId,
      eventName: this.generateNotifyEventName(eventName),
      eventData,
    });
  }
  /**
   * 群播推送socket事件
   */
  broadcastNotify(
    ctx: TcContext,
    eventName: string,
    eventData: unknown
  ): Promise<void> {
    return ctx.call('gateway.notify', {
      type: 'broadcast',
      eventName: this.generateNotifyEventName(eventName),
      eventData,
    });
  }
}

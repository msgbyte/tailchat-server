import {
  ActionHandler,
  ActionSchema,
  Service,
  ServiceBroker,
  ServiceSchema,
} from 'moleculer';
import { once } from 'lodash';
import { PawDbService } from '../mixins/db.mixin';

/**
 * PawService 微服务抽象基类
 */
export abstract class PawService extends Service {
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
  }

  abstract onInit(): void;

  registerMixin(mixin: Partial<ServiceSchema>): void {
    this._mixins.push(mixin);
  }

  /**
   * 注册微服务绑定的数据库
   * 不能调用多次
   */
  registerDb = once((schemaName: string) => {
    this.registerMixin(PawDbService(schemaName));
  });

  /**
   * 注册一个操作
   *
   * 该操作会同时生成http请求和socketio事件的处理
   * @param name 操作名, 需微服务内唯一
   * @param action 操作
   * @returns
   */
  registerAction(name: string, action: ActionSchema | ActionHandler | boolean) {
    if (this._actions[name]) {
      this.logger.warn(`重复注册操作: ${name}。操作被跳过...`);
      return;
    }

    this._actions[name] = action;
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
   * 单播推送socket事件
   */
  unicastNotify(userId: string, eventName: string, eventData: unknown) {
    this.broker.call('gateway.notify', {
      type: 'unicast',
      target: userId,
      eventName,
      eventData,
    });
  }

  /**
   * 组播推送socket事件
   */
  roomcastNotify(roomId: string, eventName: string, eventData: unknown) {
    this.broker.call('gateway.notify', {
      type: 'roomcast',
      target: roomId,
      eventName,
      eventData,
    });
  }
  /**
   * 群播推送socket事件
   */
  broadcastNotify(eventName: string, eventData: unknown) {
    this.broker.call('gateway.notify', {
      type: 'broadcast',
      eventName,
      eventData,
    });
  }
}

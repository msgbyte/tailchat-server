import {
  ActionHandler,
  ActionSchema,
  Context,
  Service,
  ServiceBroker,
  ServiceSchema,
} from 'moleculer';

export type PawActionContext<P = {}> = Context<
  P,
  {
    user: any;
    token: string;
    userId: string;
  }
>;

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

  private _generateAndParseSchema() {
    this.parseServiceSchema({
      name: this.serviceName,
      mixins: this._mixins,
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

  registerAction(name: string, action: ActionSchema | ActionHandler | boolean) {
    if (this._actions[name]) {
      this.logger.warn(`重复注册操作: ${name}。操作被跳过...`);
      return;
    }

    this._actions[name] = action;
  }
}

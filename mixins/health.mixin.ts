import type { Context, ServiceSchema } from 'moleculer';

/**
 * 增加一个action
 * 用于返回当前节点的健康信息
 */
export const TcHealth = (): Partial<ServiceSchema> => {
  return {
    actions: {
      health(ctx: Context) {
        const status = ctx.broker.getHealthStatus();

        return {
          nodeID: this.broker.nodeID,
          cpu: status.cpu,
          memory: status.mem,
          services: this.broker.services.map((service) => service.fullName),
        };
      },
    },
  };
};

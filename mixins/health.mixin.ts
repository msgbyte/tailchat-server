import type { Context, ServiceSchema } from 'moleculer';

/**
 * 增加一个action
 * 用于返回当前节点的健康信息
 */
export const TcHealth = (): Partial<ServiceSchema> => {
  return {
    actions: {
      async health(ctx: Context) {
        const status = ctx.broker.getHealthStatus();

        const services: any[] = await ctx.call('$node.services');

        return {
          nodeID: this.broker.nodeID,
          cpu: status.cpu,
          memory: status.mem,
          services: services
            .filter((s) => s.available === true)
            .map((s) => s.fullName),
        };
      },
    },
  };
};

import { Etcd3 } from 'etcd3';
import os from 'os';

/**
 * 集群管理器
 * 用于服务发现与服务注册
 */
export class ClusterManager {
  client: Etcd3;

  constructor(hosts: string[], public serviceName: string) {
    this.client = new Etcd3({
      hosts,
    });
    this.grantLease().then(() => {
      this.getAvailableHosts().then((hosts) => {
        console.log('当前可用节点:', hosts);
      });
    });
  }

  buildPrefix(serviceName: string = this.serviceName): string {
    return `paw/services/${serviceName}/`;
  }

  /**
   * 获取公共IP地址
   */
  getPublicIPAddress(): string | null {
    const interfaces = os.networkInterfaces();
    for (const [group, list = []] of Object.entries(interfaces)) {
      if (group === 'lo') {
        continue;
      }

      for (const info of list) {
        if (info.family === 'IPv4' && info.internal === false) {
          return info.address;
        }
      }
    }

    return null;
  }

  getPublicHost() {
    const publicIP = this.getPublicIPAddress();
    if (publicIP === null) {
      console.warn('无法获取公共IP, 使用hostname');
    }

    return publicIP ?? os.hostname();
  }

  async grantLease() {
    const lease = this.client.lease(10); // set a TTL of 10 seconds
    const prefix = this.buildPrefix();

    lease.on('lost', (err) => {
      console.log('We lost our lease as a result of this error:', err);
      console.log('Trying to re-grant it...');
      this.grantLease().then(() => console.log('Re-grant success...'));
    });

    await lease.put(prefix + this.getPublicHost()).value('');
  }

  async getAvailableHosts(serviceName?: string) {
    const prefix = this.buildPrefix(serviceName);
    const keys = await this.client.getAll().prefix(prefix).keys();
    return keys.map((key) => key.slice(prefix.length));
  }
}

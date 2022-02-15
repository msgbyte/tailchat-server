import { TcService } from '../../../services/base';
import { createOIDCProvider } from '../lib/provider';
import axios from 'axios';

class OIDCService extends TcService {
  providerInfo = createOIDCProvider();

  get serviceName(): string {
    return 'plugin:com.msgbyte.oidc';
  }

  get provider() {
    return this.providerInfo.oidc;
  }

  get providerPort() {
    return this.providerInfo.port;
  }

  async requestProvider(url: string) {
    return axios
      .get(url, {
        baseURL: `http://localhost:${this.providerPort}`,
      })
      .then((res) => res.data);
  }

  protected onInit(): void {
    this.registerAction('openid-configuration', this.openidConfiguration);
  }

  async openidConfiguration() {
    const res = await this.requestProvider('/.well-known/openid-configuration');

    return res;
  }
}
export default OIDCService;

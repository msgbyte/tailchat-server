import { Provider, Configuration } from 'oidc-provider';
import type { AddressInfo } from 'net';
import { config } from '../../../lib/settings';

const ISSUER = config.apiUrl;

const configuration: Configuration = {
  // ... see /docs for available configuration
  clients: [
    {
      client_id: 'foo',
      client_secret: 'bar',
      redirect_uris: ['http://lvh.me:8080/cb'],
      // ... other client properties
    },
  ],
  async findAccount(ctx, id) {
    return {
      accountId: id,
      async claims(use, scope) {
        return { sub: id };
      },
    };
  },
};

export function createOIDCProvider() {
  const oidc = new Provider(ISSUER, configuration);

  const app = oidc.app;
  const server = app.listen(0, () => {
    console.log(
      'oidc-provider listening on port 3000, check http://localhost:3000/.well-known/openid-configuration'
    );
  });

  const port = (<AddressInfo>server.address()).port;

  return {
    oidc,
    port,
  };
}

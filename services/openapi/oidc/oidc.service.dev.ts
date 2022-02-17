import { TcService } from '../../base';
import ApiGateway from 'moleculer-web';
import { Provider, Configuration, InteractionResults } from 'oidc-provider';
import { config } from '../../../lib/settings';
import type { IncomingMessage, ServerResponse } from 'http';
import ejs from 'ejs';
import path from 'path';
import assert from 'assert';

const ISSUER = config.apiUrl;

const configuration: Configuration = {
  // ... see /docs for available configuration
  clients: [
    // For test
    {
      client_id: 'foo',
      client_secret: 'bar',
      client_name: 'Test App',
      logo_uri:
        'https://avatars.githubusercontent.com/oa/442346?s=100&amp;u=ceed99acb322ed09a5314c493b7b05060cbe08c0&amp;v=4',
      application_type: 'web',
      grant_types: ['refresh_token', 'authorization_code'],
      redirect_uris: ['http://localhost:8080/cb'],
      // ... other client properties
    },
  ],
  pkce: {
    methods: ['S256'],
    required: () => false, // TODO: false in test
  },
  async findAccount(ctx, id) {
    return {
      accountId: id,
      async claims(use, scope) {
        return { sub: id, use, scope };
      },
    };
  },
  cookies: {
    keys: ['__tailchat_oidc'],
  },
};
export function createOIDCProvider() {
  const oidc = new Provider(ISSUER, configuration);

  return oidc;
}

class OIDCService extends TcService {
  provider = createOIDCProvider();

  get serviceName(): string {
    return 'openapi.oidc';
  }

  protected onInit(): void {
    this.registerMixin(ApiGateway);

    this.registerSetting('port', config.port);
    this.registerSetting('routes', this.getRoutes());
  }

  getRoutes() {
    const providerRoute = (req, res) => {
      return this.provider.callback()(req, res);
    };

    return [
      {
        // Reference: https://github.com/moleculerjs/moleculer-web/blob/master/examples/file/index.js
        path: '/open',
        // You should disable body parsers
        bodyParsers: {
          json: false,
          urlencoded: false,
        },

        whitelist: [],

        authentication: false,
        authorization: false,

        aliases: {
          /**
           * 授权交互界面
           */
          'GET /interaction/:uid': async (
            req: IncomingMessage,
            res: ServerResponse
          ) => {
            try {
              const details = await this.provider.interactionDetails(req, res);
              const { uid, prompt, params, session } = details;

              const client = await this.provider.Client.find(
                String(params.client_id)
              );

              const promptName = prompt.name;
              const data = {
                logoUri: client.logoUri,
                clientName: client.clientName,
                uid,
                details: prompt.details,
                params,
                session,
                dbg: {
                  params: params,
                  prompt: prompt,
                },
              };

              if (promptName === 'login') {
                this.renderHTML(
                  res,
                  await ejs.renderFile(
                    path.resolve(__dirname, './views/login.ejs'),
                    data
                  )
                );
              } else if (promptName === 'consent') {
                this.renderHTML(
                  res,
                  await ejs.renderFile(
                    path.resolve(__dirname, './views/authorize.ejs'),
                    data
                  )
                );
              } else {
                this.renderError(res, '未知的操作');
              }
            } catch (err) {
              this.renderError(res, err);
            }
          },
          'POST /interaction/:uid/login': async (
            req: IncomingMessage,
            res: ServerResponse
          ) => {
            try {
              const {
                prompt: { name },
              } = await this.provider.interactionDetails(req, res);
              assert.equal(name, 'login');

              // TODO: find user
              // const account = await Account.findByLogin(req.body.login);
              const result = {
                login: {
                  // accountId: account.accountId,
                  accountId: 'any',
                },
              };

              await this.provider.interactionFinished(req, res, result, {
                mergeWithLastSubmission: false,
              });
            } catch (err) {
              this.renderError(res, err);
            }
          },
          'POST /interaction/:uid/confirm': async (
            req: IncomingMessage,
            res: ServerResponse
          ) => {
            try {
              const interactionDetails = await this.provider.interactionDetails(
                req,
                res
              );
              const {
                prompt: { name, details },
                params,
                session: { accountId },
              } = interactionDetails;
              assert.equal(name, 'consent');

              let { grantId } = interactionDetails;
              const grant = grantId
                ? // we'll be modifying existing grant in existing session
                  await this.provider.Grant.find(grantId)
                : // we're establishing a new grant
                  new this.provider.Grant({
                    accountId,
                    clientId: String(params.client_id),
                  });

              if (Array.isArray(details.missingOIDCScope)) {
                grant.addOIDCScope(details.missingOIDCScope.join(' '));
              }
              if (Array.isArray(details.missingOIDCClaims)) {
                grant.addOIDCClaims(details.missingOIDCClaims);
              }
              if (details.missingResourceScopes) {
                for (const [indicator, scopes] of Object.entries(
                  details.missingResourceScopes
                )) {
                  grant.addResourceScope(indicator, scopes.join(' '));
                }
              }

              grantId = await grant.save();

              const consent: InteractionResults['consent'] = {};
              if (!interactionDetails.grantId) {
                // we don't have to pass grantId to consent, we're just modifying existing one
                consent.grantId = grantId;
              }

              const result: InteractionResults = { consent };
              await this.provider.interactionFinished(req, res, result, {
                mergeWithLastSubmission: true,
              });
            } catch (err) {
              this.renderError(res, err);
            }
          },
          'GET /auth': providerRoute,
          'GET /auth/:uid': providerRoute,
          'POST /token': providerRoute,
          'POST /me': providerRoute,
        },
      },
    ];
  }

  renderError(res: ServerResponse, error: any) {
    res.writeHead(500);
    res.end(String(error));
  }

  renderHTML(res: ServerResponse, html: string) {
    res.writeHead(200, {
      'Content-Type': 'text/html',
    });
    res.end(html);
  }
}
export default OIDCService;

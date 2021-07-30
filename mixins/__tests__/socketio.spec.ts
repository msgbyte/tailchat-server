import { ServiceBroker } from 'moleculer';
import { TcSocketIOService } from '../socketio.mixin';
import { io } from 'socket.io-client';
import ApiGateway from 'moleculer-web';
import { createTestUserToken } from '../../test/utils';

require('dotenv').config();

const PORT = 28193;

describe('Testing "socketio.mixin"', () => {
  const broker = new ServiceBroker({ logger: false });
  const actionHandler1 = jest.fn();
  const service = broker.createService({
    name: 'test',
    mixins: [
      ApiGateway,
      TcSocketIOService({
        async userAuth(token) {
          return {
            _id: 'any some',
            username: '',
            email: '',
            avatar: '',
          };
        },
      }),
    ],
    settings: {
      port: PORT,
    },
    actions: {
      hello: actionHandler1,
    },
  });

  beforeAll(async () => {
    await broker.start();
  });

  afterAll(async () => {
    await broker.stop();
  });

  test('actions should be ok', () => {
    expect(service.actions).toHaveProperty('joinRoom');
    expect(service.actions).toHaveProperty('notify');
    expect(service.actions).toHaveProperty('checkUserOnline');
  });

  test('socketio should be call action', async () => {
    const socket = io(`http://localhost:${PORT}/`, {
      transports: ['websocket'],
      auth: {
        token: createTestUserToken(),
      },
    });

    await new Promise((resolve, reject) => {
      socket.on('connect', () => {
        resolve(null);
      });
      socket.on('connect_error', (err) => {
        reject(err);
      });
    });

    await new Promise((resolve) => {
      socket.emit('test.hello', {}, (ret) => {
        resolve(ret);
      });
    });

    expect(actionHandler1.mock.calls.length).toBeGreaterThanOrEqual(1);

    socket.close();
  });

  test.todo('socketio should not call non-published action');
});

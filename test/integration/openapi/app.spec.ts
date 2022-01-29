import { createTestServiceBroker } from '../../utils';
import OpenAppService from '../../../services/openapi/app.service';
import { Types } from 'mongoose';
import _ from 'lodash';
import { generateRandomStr } from '../../../lib/utils';
import type { OpenApp } from '../../../models/openapi/app';

describe('Test "openapi.app" service', () => {
  const { broker, service, insertTestData } =
    createTestServiceBroker<OpenAppService>(OpenAppService);

  test('Test "openapi.app.create"', async () => {
    const userId = String(new Types.ObjectId());
    const name = generateRandomStr();

    const res: OpenApp = await broker.call(
      'openapi.app.create',
      {
        appName: name,
        appDesc: '',
        appIcon: '',
      },
      {
        meta: {
          userId,
        },
      }
    );

    try {
      expect(res.appId).toHaveLength(27);
      expect(res.appSecret).toHaveLength(32);
      expect(res.appName).toBe(name);
    } finally {
      await service.adapter.model.findByIdAndRemove(res._id);
    }
  });
});

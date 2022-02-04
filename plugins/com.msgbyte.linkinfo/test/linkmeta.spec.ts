import { createTestServiceBroker } from '../../../test/utils';
import LinkinfoService from '../services/linkmeta.service';
import { Types } from 'mongoose';
import _ from 'lodash';

describe('Test "plugin:com.msgbyte.linkinfo" service', () => {
  const { broker, service, insertTestData } =
    createTestServiceBroker<LinkinfoService>(LinkinfoService);

  test('Test "plugin:com.msgbyte.linkmeta.fetch"', async () => {
    const url = 'https://www.baidu.com/?fortest';
    const meta: any = await broker.call('plugin:com.msgbyte.linkmeta.fetch', {
      url,
    });

    try {
      expect(meta).toHaveProperty('url', url);
      expect(meta).toHaveProperty('isCache', false);
      expect(meta).toHaveProperty('title');
      expect(meta).toHaveProperty('siteName');
      expect(meta).toHaveProperty('description');
      expect(meta).toHaveProperty('mediaType', 'website');
      expect(meta).toHaveProperty('contentType', 'text/html');
      expect(meta).toHaveProperty('images');
      expect(meta).toHaveProperty('videos');
      expect(meta).toHaveProperty('favicons');

      const metaWithCache: any = await broker.call(
        'plugin:com.msgbyte.linkmeta.fetch',
        {
          url,
        }
      );
      expect(metaWithCache).toHaveProperty('isCache', true);
    } finally {
      await service.adapter.model.deleteOne({
        url,
      });
    }
  });
});

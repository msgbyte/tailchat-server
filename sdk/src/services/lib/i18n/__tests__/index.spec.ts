import { t } from '../index';
import { sleep } from '../../utils';

describe('i18n', () => {
  test('should be work', async () => {
    await sleep(2000); // 等待异步加载完毕

    expect(t('Token不合规')).toBe('Token不合规');
    expect(
      t('Token不合规', undefined, {
        lng: 'en-US',
      })
    ).toBe('Token Invalid');
  });
});

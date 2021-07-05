import { getEmailAddress } from '../utils';

describe('getEmailAddress', () => {
  test.each([
    ['foo@example.com', 'foo'],
    ['foo.bar@example.com', 'foo.bar'],
    ['foo$bar@example.com', 'foo$bar'],
  ])('%s', (input, output) => {
    expect(getEmailAddress(input)).toBe(output);
  });
});

import { generateRandomStr, getEmailAddress } from '../utils';

describe('getEmailAddress', () => {
  test.each([
    ['foo@example.com', 'foo'],
    ['foo.bar@example.com', 'foo.bar'],
    ['foo$bar@example.com', 'foo$bar'],
  ])('%s', (input, output) => {
    expect(getEmailAddress(input)).toBe(output);
  });
});

describe('generateRandomStr', () => {
  test('should generate string with length 10(default)', () => {
    expect(generateRandomStr()).toHaveLength(10);
  });

  test('should generate string with manual length', () => {
    expect(generateRandomStr(4)).toHaveLength(4);
  });
});

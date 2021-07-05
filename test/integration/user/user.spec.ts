import { getEmailAddress } from '../../../lib/utils';
import UserService from '../../../services/user/user.service';
import { createTestServiceBroker } from '../../utils';
import bcrypt from 'bcryptjs';

function createTestUser(email = 'foo@bar.com') {
  return {
    email,
    nickname: getEmailAddress(email),
    password: bcrypt.hashSync('123456', 10),
    avatar: null,
    createdAt: { $$date: Date.now() },
  };
}

describe('Test "user" service', () => {
  const { broker, service, insertTestData } =
    createTestServiceBroker<UserService>(UserService);

  test('Test "user.register"', async () => {
    const params = {
      email: 'test@example.com',
      password: '123456',
    };
    const user: any = await broker.call('user.register', params);

    try {
      expect(user.email).toBe(params.email);
      expect(user.avatar).toBe(null);
      expect(user.nickname).toBe(getEmailAddress(params.email));
    } finally {
      await service.adapter.removeById(user._id);
    }
  });

  test('Test "user.searchUserWithKeyword"', async () => {
    const testDoc = await insertTestData(createTestUser());

    const res: any[] = await broker.call('user.searchUserWithKeyword', {
      keyword: testDoc.nickname,
    });

    expect(res.length).toBe(1);
    expect(res[0].nickname).toBe(testDoc.nickname);
    expect(res[0]).not.toHaveProperty('password');
  });
});

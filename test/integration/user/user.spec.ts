import { getEmailAddress } from '../../../lib/utils';
import UserService from '../../../services/user/user.service';
import { createTestServiceBroker } from '../../utils';
import bcrypt from 'bcryptjs';
import type { UserDocument } from '../../../models/user/user';

function createTestUser(email = 'foo@bar.com') {
  return {
    email,
    nickname: getEmailAddress(email),
    password: bcrypt.hashSync('123456', 10),
    avatar: null,
    discriminator: '0000',
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

  test('Test "user.searchUserWithUniqueName"', async () => {
    const testDoc = await insertTestData(createTestUser());

    const res: UserDocument = await broker.call(
      'user.searchUserWithUniqueName',
      {
        uniqueName: testDoc.nickname + '#' + testDoc.discriminator,
      }
    );

    expect(res).not.toBe(null);
    expect(res.nickname).toBe(testDoc.nickname);
    expect(res).not.toHaveProperty('password');
  });
});

/**
 * 返回电子邮箱的地址
 * @param email 电子邮箱
 * @returns 电子邮箱
 */
export function getEmailAddress(email: string) {
  return email.split('@')[0];
}

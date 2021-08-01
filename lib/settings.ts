/**
 * 鉴权白名单
 * 在白名单中的路由会被跳过
 */

export const authWhitelist = [
  '/user/login',
  '/user/register',
  '/user/resolveToken',
  '/user/getUserInfo',
  '/group/getGroupBasicInfo',
  '/group/invite/findInviteByCode',
];

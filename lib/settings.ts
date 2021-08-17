import path from 'path';

/**
 * 配置信息
 */
export const config = {
  port: process.env.PORT || 11000,
  jwtSecret: process.env.JWT_SECRET || 'tailchat',
  env: process.env.NODE_ENV || 'development',
  redisUrl: process.env.REDIS_URL,
  mongoUrl: process.env.MONGO_URL,
  storage: {
    type: 'minio', // 可选: minio
    minioUrl: process.env.MINIO_URL,
    user: process.env.MINIO_USER,
    pass: process.env.MINIO_PASS,
    bucketName: 'tailchat',
  },
};

/**
 * 鉴权白名单
 * 在白名单中的路由会被跳过
 */
export const authWhitelist = [
  '/gateway/health',
  '/debug/hello',
  '/user/login',
  '/user/register',
  '/user/resolveToken',
  '/user/getUserInfo',
  '/group/getGroupBasicInfo',
  '/group/invite/findInviteByCode',
];

export const uploadDir = path.resolve(__dirname, '../', '__uploads');

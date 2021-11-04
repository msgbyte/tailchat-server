import dotenv from 'dotenv';
dotenv.config();

/**
 * 配置信息
 */
const port = process.env.PORT || 11000;
export const config = {
  port,
  jwtSecret: process.env.JWT_SECRET || 'tailchat',
  env: process.env.NODE_ENV || 'development',
  /**
   * 是否打开socket admin ui
   */
  enableSocketAdmin: !!process.env.ADMIN,
  redisUrl: process.env.REDIS_URL,
  mongoUrl: process.env.MONGO_URL,
  storage: {
    type: 'minio', // 可选: minio
    minioUrl: process.env.MINIO_URL,
    user: process.env.MINIO_USER,
    pass: process.env.MINIO_PASS,
    bucketName: 'tailchat',
  },
  staticUrl: process.env.STATIC_URL || `http://127.0.0.1:${port}/static/`,
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
  '/user/createTemporaryUser',
  '/user/resolveToken',
  '/user/getUserInfo',
  '/group/getGroupBasicInfo',
  '/group/invite/findInviteByCode',
];

/**
 * 构建上传地址
 */
export function buildUploadUrl(objectName: string) {
  return config.staticUrl + objectName;
}

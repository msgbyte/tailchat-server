# tailchat-server
tailchat server side

## 启动开发服务器

```bash
cp .env.example .env
vim .env
```

编辑`.env`的配置为自己的

```bash
yarn install # 安装环境变量
yarn dev # 启动开发服务器
```

## 开发环境

建议使用 Docker 初始化第三方开发环境

mongodb
```bash
docker run -d --name mongo -p 27017:27017 mongo:4
```

redis
```bash
docker run -d --name redis -p 6379:6379 redis
```

minio
```bash
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  --name minio \
  -e "MINIO_ROOT_USER=tailchat" \
  -e "MINIO_ROOT_PASSWORD=com.msgbyte.tailchat" \
  minio/minio server /data --console-address ":9001"
```

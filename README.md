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

mongodb
```bash
docker run -itd --name mongo -p 27017:27017 mongo:4
```

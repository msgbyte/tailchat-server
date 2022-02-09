# tailchat-server

## 启动开发服务器

```bash
cp .env.example .env
vim .env
```

编辑`.env`的配置为自己的

```bash
pnpm install # 安装环境变量
pnpm dev # 启动开发服务器
```

## 开发环境

强烈建议使用 `Docker` 初始化第三方开发环境, 隔离性更加好 并且无需复杂的安装配置。

mongodb
```bash
docker run -d --name mongo -p 127.0.0.1:27017:27017 mongo:4
```

redis
```bash
docker run -d --name redis -p 127.0.0.1:6379:6379 redis
```

minio
```bash
docker run -d \
  -p 127.0.0.1:19000:9000 \
  -p 127.0.0.1:19001:9001 \
  --name minio \
  -e "MINIO_ROOT_USER=tailchat" \
  -e "MINIO_ROOT_PASSWORD=com.msgbyte.tailchat" \
  minio/minio server /data --console-address ":9001"
```

#### 服务端插件安装方式

安装所有插件
```
pnpm plugin:install all
```

安装单个插件
```
pnpm plugin:install com.msgbyte.tasks
```

## 单节点部署

#### docker-compose 一键部署

请确保已经安装了:
- docker
- docker-compose


在项目根目录下执行
```bash
docker-compose up -d
```

## 运维

### 使用mongo工具进行管理

#### 从docker中取出mongodb的数据

```bash
docker exec -it <MONGO_DOCKER_NAME> mongodump -h 127.0.0.1 --port 27017 -d <MONGO_COLLECTION_NAME> -o /opt/backup/
docker exec -it <MONGO_DOCKER_NAME> tar -zcvf /tmp/mongodata.tar.gz /opt/backup/<MONGO_COLLECTION_NAME>
docker cp <MONGO_DOCKER_NAME>:/tmp/mongodata.tar.gz ${PWD}/
```

#### 将本地的备份存储到mongodb镜像

```bash
docker cp mongodata.tar.gz <MONGO_DOCKER_NAME>:/tmp/
docker exec -it <MONGO_DOCKER_NAME> tar -zxvf /tmp/mongodata.tar.gz
docker exec -it <MONGO_DOCKER_NAME> mongorestore -h 127.0.0.1 --port 27017 -d <MONGO_COLLECTION_NAME> /opt/backup/<MONGO_COLLECTION_NAME>
```

### 通过docker volume

#### 备份
```bash
docker run -it --rm --volumes-from <DOCKER_CONTAINER_NAME> -v ${PWD}:/opt/backup --name export busybox sh

# 进入容器
tar -zcvf /opt/backup/data.tar <DATA_PATH>

exit
```
此处<DATA_PATH>, 如果是minio则为`/data/`如果是mongo则为`/data/db`

#### 恢复
```bash
docker run -it --rm --volumes-from <DOCKER_CONTAINER_NAME> -v ${PWD}:/opt/backup --name importer busybox sh
tar -zxvf /opt/backup/data.tar
exit
```

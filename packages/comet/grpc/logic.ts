import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import type { ProtoGrpcType } from '../../../proto/logic';
import { ConnectReply } from '../../../proto/logic/ConnectReply';
import type { LogicClient } from '../../../proto/logic/Logic';

export class LogicRPCClient {
  packageDefinition = protoLoader.loadSync(
    path.resolve(__dirname, '../../../proto/logic.proto')
  );
  proto = grpc.loadPackageDefinition(
    this.packageDefinition
  ) as unknown as ProtoGrpcType;
  client: LogicClient;

  constructor(address: string) {
    this.client = new this.proto.logic.Logic(
      address,
      grpc.credentials.createInsecure()
    );
  }

  /**
   * 用户连接
   */
  connect(serverId: string, token: string): Promise<ConnectReply> {
    return new Promise((resolve, reject) => {
      this.client.Connect(
        {
          server: serverId,
          token,
        },
        (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        }
      );
    });
  }

  /**
   * 用户断开连接
   */
  disconnect(serverId: string, userUUID: string, socketId: string) {
    return new Promise((resolve, reject) => {
      this.client.Disconnect(
        {
          userUUID,
          socketId,
          serverId,
        },
        (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        }
      );
    });
  }
}

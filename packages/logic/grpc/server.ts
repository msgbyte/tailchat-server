import * as grpc from '@grpc/grpc-js';
import { handleUnaryCall } from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { ProtoGrpcType } from '../../../proto/logic';
import { ConnectReply } from '../../../proto/logic/ConnectReply';
import { ConnectReq } from '../../../proto/logic/ConnectReq';
import { DisconnectReply } from '../../../proto/logic/DisconnectReply';
import { DisconnectReq } from '../../../proto/logic/DisconnectReq';
import { ReceiveReply } from '../../../proto/logic/ReceiveReply';
import { ReceiveReq } from '../../../proto/logic/ReceiveReq';
import { logicConfig } from '../config';

export class GRPCServer {
  packageDefinition = protoLoader.loadSync(
    path.resolve(__dirname, '../../../proto/logic.proto')
  );
  proto = grpc.loadPackageDefinition(
    this.packageDefinition
  ) as unknown as ProtoGrpcType;
  server = new grpc.Server();
  constructor() {
    this.server.addService(this.proto.logic.Logic.service, {
      Connect: this.onConnect,
      Disconnect: this.onDisconnect,
      Receive: this.onReceive,
    });
    const port = logicConfig.rpc.port;
    const addr = `0.0.0.0:${port}`;
    this.server.bindAsync(addr, grpc.ServerCredentials.createInsecure(), () => {
      this.server.start();
      console.log(`grpc server started in ${addr}`);
    });
  }

  onConnect: handleUnaryCall<ConnectReq, ConnectReply> = (call, callback) => {
    const { server, token } = call.request;

    // 添加到redis中

    callback(null, {
      userUUID: 'aaa',
    });
  };

  onDisconnect: handleUnaryCall<DisconnectReq, DisconnectReply> = (
    call,
    callback
  ) => {
    console.log(call.request);

    callback(null, { has: false });
  };

  // 接受到通用消息
  onReceive: handleUnaryCall<ReceiveReq, ReceiveReply> = (call, callback) => {
    console.log(call.request);

    callback(null);
  };
}

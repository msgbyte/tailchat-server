import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import type { ProtoGrpcType } from '../../../proto/logic';
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

  connect() {
    // TODO
    // this.client.Connect()
  }
}

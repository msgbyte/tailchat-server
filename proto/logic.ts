import type * as grpc from '@grpc/grpc-js';
import type { ServiceDefinition, EnumTypeDefinition, MessageTypeDefinition } from '@grpc/proto-loader';

import type { LogicClient as _logic_LogicClient, LogicDefinition as _logic_LogicDefinition } from './logic/Logic';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  logic: {
    ConnectReply: MessageTypeDefinition
    ConnectReq: MessageTypeDefinition
    DisconnectReply: MessageTypeDefinition
    DisconnectReq: MessageTypeDefinition
    Logic: SubtypeConstructor<typeof grpc.Client, _logic_LogicClient> & { service: _logic_LogicDefinition }
    ReceiveReply: MessageTypeDefinition
    ReceiveReq: MessageTypeDefinition
  }
  protocol: {
    Proto: MessageTypeDefinition
  }
}


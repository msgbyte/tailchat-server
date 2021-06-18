// Original file: proto/logic.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { ConnectReply as _logic_ConnectReply, ConnectReply__Output as _logic_ConnectReply__Output } from '../logic/ConnectReply';
import type { ConnectReq as _logic_ConnectReq, ConnectReq__Output as _logic_ConnectReq__Output } from '../logic/ConnectReq';
import type { DisconnectReply as _logic_DisconnectReply, DisconnectReply__Output as _logic_DisconnectReply__Output } from '../logic/DisconnectReply';
import type { DisconnectReq as _logic_DisconnectReq, DisconnectReq__Output as _logic_DisconnectReq__Output } from '../logic/DisconnectReq';
import type { ReceiveReply as _logic_ReceiveReply, ReceiveReply__Output as _logic_ReceiveReply__Output } from '../logic/ReceiveReply';
import type { ReceiveReq as _logic_ReceiveReq, ReceiveReq__Output as _logic_ReceiveReq__Output } from '../logic/ReceiveReq';

export interface LogicClient extends grpc.Client {
  Connect(argument: _logic_ConnectReq, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _logic_ConnectReply__Output) => void): grpc.ClientUnaryCall;
  Connect(argument: _logic_ConnectReq, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _logic_ConnectReply__Output) => void): grpc.ClientUnaryCall;
  Connect(argument: _logic_ConnectReq, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _logic_ConnectReply__Output) => void): grpc.ClientUnaryCall;
  Connect(argument: _logic_ConnectReq, callback: (error?: grpc.ServiceError, result?: _logic_ConnectReply__Output) => void): grpc.ClientUnaryCall;
  connect(argument: _logic_ConnectReq, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _logic_ConnectReply__Output) => void): grpc.ClientUnaryCall;
  connect(argument: _logic_ConnectReq, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _logic_ConnectReply__Output) => void): grpc.ClientUnaryCall;
  connect(argument: _logic_ConnectReq, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _logic_ConnectReply__Output) => void): grpc.ClientUnaryCall;
  connect(argument: _logic_ConnectReq, callback: (error?: grpc.ServiceError, result?: _logic_ConnectReply__Output) => void): grpc.ClientUnaryCall;
  
  Disconnect(argument: _logic_DisconnectReq, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _logic_DisconnectReply__Output) => void): grpc.ClientUnaryCall;
  Disconnect(argument: _logic_DisconnectReq, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _logic_DisconnectReply__Output) => void): grpc.ClientUnaryCall;
  Disconnect(argument: _logic_DisconnectReq, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _logic_DisconnectReply__Output) => void): grpc.ClientUnaryCall;
  Disconnect(argument: _logic_DisconnectReq, callback: (error?: grpc.ServiceError, result?: _logic_DisconnectReply__Output) => void): grpc.ClientUnaryCall;
  disconnect(argument: _logic_DisconnectReq, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _logic_DisconnectReply__Output) => void): grpc.ClientUnaryCall;
  disconnect(argument: _logic_DisconnectReq, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _logic_DisconnectReply__Output) => void): grpc.ClientUnaryCall;
  disconnect(argument: _logic_DisconnectReq, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _logic_DisconnectReply__Output) => void): grpc.ClientUnaryCall;
  disconnect(argument: _logic_DisconnectReq, callback: (error?: grpc.ServiceError, result?: _logic_DisconnectReply__Output) => void): grpc.ClientUnaryCall;
  
  Receive(argument: _logic_ReceiveReq, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _logic_ReceiveReply__Output) => void): grpc.ClientUnaryCall;
  Receive(argument: _logic_ReceiveReq, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _logic_ReceiveReply__Output) => void): grpc.ClientUnaryCall;
  Receive(argument: _logic_ReceiveReq, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _logic_ReceiveReply__Output) => void): grpc.ClientUnaryCall;
  Receive(argument: _logic_ReceiveReq, callback: (error?: grpc.ServiceError, result?: _logic_ReceiveReply__Output) => void): grpc.ClientUnaryCall;
  receive(argument: _logic_ReceiveReq, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _logic_ReceiveReply__Output) => void): grpc.ClientUnaryCall;
  receive(argument: _logic_ReceiveReq, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _logic_ReceiveReply__Output) => void): grpc.ClientUnaryCall;
  receive(argument: _logic_ReceiveReq, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _logic_ReceiveReply__Output) => void): grpc.ClientUnaryCall;
  receive(argument: _logic_ReceiveReq, callback: (error?: grpc.ServiceError, result?: _logic_ReceiveReply__Output) => void): grpc.ClientUnaryCall;
  
}

export interface LogicHandlers extends grpc.UntypedServiceImplementation {
  Connect: grpc.handleUnaryCall<_logic_ConnectReq__Output, _logic_ConnectReply>;
  
  Disconnect: grpc.handleUnaryCall<_logic_DisconnectReq__Output, _logic_DisconnectReply>;
  
  Receive: grpc.handleUnaryCall<_logic_ReceiveReq__Output, _logic_ReceiveReply>;
  
}

export interface LogicDefinition extends grpc.ServiceDefinition {
  Connect: MethodDefinition<_logic_ConnectReq, _logic_ConnectReply, _logic_ConnectReq__Output, _logic_ConnectReply__Output>
  Disconnect: MethodDefinition<_logic_DisconnectReq, _logic_DisconnectReply, _logic_DisconnectReq__Output, _logic_DisconnectReply__Output>
  Receive: MethodDefinition<_logic_ReceiveReq, _logic_ReceiveReply, _logic_ReceiveReq__Output, _logic_ReceiveReply__Output>
}

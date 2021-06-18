// Original file: proto/logic.proto

import type { Proto as _protocol_Proto, Proto__Output as _protocol_Proto__Output } from '../protocol/Proto';
import type { Long } from '@grpc/proto-loader';

export interface ReceiveReq {
  'mid'?: (number | string | Long);
  'proto'?: (_protocol_Proto | null);
}

export interface ReceiveReq__Output {
  'mid': (string);
  'proto': (_protocol_Proto__Output | null);
}

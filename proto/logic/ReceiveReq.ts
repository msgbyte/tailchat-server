// Original file: proto/logic.proto

import type { Proto as _protocol_Proto, Proto__Output as _protocol_Proto__Output } from '../protocol/Proto';

export interface ReceiveReq {
  'userUUID'?: (string);
  'proto'?: (_protocol_Proto | null);
}

export interface ReceiveReq__Output {
  'userUUID': (string);
  'proto': (_protocol_Proto__Output | null);
}

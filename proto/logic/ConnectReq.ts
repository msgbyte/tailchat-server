// Original file: proto/logic.proto


export interface ConnectReq {
  'server'?: (string);
  'token'?: (Buffer | Uint8Array | string);
}

export interface ConnectReq__Output {
  'server': (string);
  'token': (Buffer);
}

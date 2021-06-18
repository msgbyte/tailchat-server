// Original file: proto/protocol.proto


export interface Proto {
  'ver'?: (number);
  'op'?: (number);
  'seq'?: (number);
  'body'?: (Buffer | Uint8Array | string);
}

export interface Proto__Output {
  'ver': (number);
  'op': (number);
  'seq': (number);
  'body': (Buffer);
}

// Original file: proto/logic.proto


export interface ConnectReply {
  'userUUID'?: (string);
  'key'?: (string);
  'roomUUID'?: (string);
  'accepts'?: (number)[];
}

export interface ConnectReply__Output {
  'userUUID': (string);
  'key': (string);
  'roomUUID': (string);
  'accepts': (number)[];
}

export enum JsonNull {
  isNull = 'JsonNull(Null)',
}

export enum JsonBool {
  True = 'JsonBool(True)',
  False = 'JsonBool(False)',
}

export type JsonString = string;
export type JsonNumber = number;

export type JsonValue =
  | JsonBool
  | JsonNull
  | JsonString
  | JsonNumber
  | JsonList;

export type JsonList = JsonValue[];

export type JsonKeyValuePair = [JsonString, JsonValue | JsonObject];

export type JsonObject = Record<JsonString, JsonValue>;

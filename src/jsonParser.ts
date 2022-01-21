import { strict as assert } from 'assert';

import {
  JSON_TRUE,
  JSON_FALSE,
  JSON_NULL,
  JSON_STRING_START,
  JSON_STRING_END,
  JSON_LIST_START,
  JSON_LIST_END,
  JSON_LIST_DELIMITER,
  JSON_KV_DELIMITER,
  JSON_OBJECT_START,
  JSON_OBJECT_END,
  JSON_OBJECT_DELIMITER,
  JSON_STRING_ESCAPE,
} from './symbols';

import {
  JsonBool,
  JsonNull,
  JsonNumber,
  JsonString,
  JsonList,
  JsonValue,
  JsonKeyValuePair,
  JsonObject,
} from './types';

import {
  Parser,
  Parsed,
  matchStringParser,
  eitherStringParser,
  modifyParsed,
  parseFailed,
  firstSuccessfulParser,
  delimitedParser,
} from './parserCombinator';

const numericLiteralToNumber = (numericLiteral: string): number => {
  const numbers = '0123456789'.split('');
  const [intLiteral, decLiteral] = numericLiteral.split('.');

  const numericReduce = (
    digits: string[],
    exponentCalculator: (number) => number
  ) =>
    digits.reduce((acc, digit, index) => {
      const base = 10 ** exponentCalculator(index);
      return acc + numbers.indexOf(digit) * base;
    }, 0);

  const integer = numericReduce(intLiteral.split('').reverse(), (i) => i);
  const decimal = decLiteral
    ? numericReduce(decLiteral.split(''), (i) => -(i + 1))
    : 0;

  return integer + decimal;
};

const toIntTester = () => {
  console.log(numericLiteralToNumber('2106.23415302'));
};

const invalidIndexKey = -1;

const removeInsignificantWhitespace = (value: string) => {
  return value.replace(/\n|  /g, '');
};

export const jsonTypes = {
  parseBool(value: string): Parsed<JsonBool> {
    //console.log(value);
    const boolLiteralParser = eitherStringParser(JSON_TRUE, JSON_FALSE);
    const result = boolLiteralParser(value);

    return modifyParsed(result, (p: string) =>
      p === JSON_TRUE ? JsonBool.True : JsonBool.False
    );
  },

  parseNull(value: string): Parsed<JsonNull> {
    const nullLiteralParser = matchStringParser(JSON_NULL);
    const result = nullLiteralParser(value);

    return modifyParsed(result, () => JsonNull.isNull);
  },

  parseString(value: string): Parsed<JsonString> {
    const hasOpen = value.startsWith(JSON_STRING_START);
    if (!hasOpen) parseFailed(value);
    const letters = value.split('');

    const endIndex = letters.reduce(
      (acc, letter, index) =>
        index !== 0 &&
        letter === JSON_STRING_END &&
        letters[index - 1] !== JSON_STRING_ESCAPE &&
        acc === invalidIndexKey
          ? index
          : acc,
      invalidIndexKey
    );

    if (endIndex === invalidIndexKey) return parseFailed(value);

    const stringValue = value.slice(JSON_STRING_START.length, endIndex);

    return {
      parsed: stringValue as JsonString,
      unparsed: value.slice(endIndex + 1),
    };
  },

  parseNumber(value: string): Parsed<JsonNumber> {
    const literalValues = '0123456789.'.split('');
    const letters = value.split('');

    if (!literalValues.includes(letters[0])) return parseFailed(value);

    const foundEnd = letters.reduce(
      (acc, letter, index) =>
        !literalValues.includes(letter) && acc === invalidIndexKey
          ? index
          : acc,
      invalidIndexKey
    );

    const literalEnd = foundEnd !== invalidIndexKey ? foundEnd : value.length;

    const isAllNumber = letters.every((l) => literalValues.includes(l));

    if (literalEnd === invalidIndexKey && !isAllNumber)
      return parseFailed(value);

    const numericLiteral = value.slice(0, literalEnd);
    return {
      parsed: numericLiteralToNumber(numericLiteral),
      unparsed: value.slice(literalEnd),
    };
  },

  parseList(value: string): Parsed<JsonList> {
    // This function used to be written recusivley using the 'delimitedParse' function
    // There were some errors with removing significant data from the list
    // I would like to rewrite in the future
    const hasOpen = value.startsWith(JSON_LIST_START);
    if (!hasOpen) return parseFailed(value);
    const letters = value.split('');

    const listEnd = letters.reduce(
      (acc, letter, index) => (letter === JSON_LIST_END ? index : acc),
      invalidIndexKey
    );

    const listLiteral = value.slice(1, listEnd);

    const listVals = [];
    let currentLiteral = listLiteral;

    while (listLiteral !== '') {
      const { parsed, unparsed } = jsonTypes.parseValue(currentLiteral);
      listVals.push(parsed);

      if (!unparsed.startsWith(JSON_LIST_DELIMITER)) break;
      currentLiteral = unparsed.slice(1).trim();
    }

    return {
      parsed: listVals as JsonList,
      unparsed: value.slice(listEnd + 1),
    };
  },

  parseValue(value: string): Parsed<JsonValue | JsonObject> {
    const parser = firstSuccessfulParser(
      jsonTypes.parseList,
      jsonTypes.parseObject,
      jsonTypes.parseBool,
      jsonTypes.parseNull,
      jsonTypes.parseNumber,
      jsonTypes.parseString
    );

    return parser(value);
  },

  parseKeyValuePair(value: string): Parsed<JsonKeyValuePair> {
    const key = jsonTypes.parseString(value);
    if (!key.parsed) return parseFailed(value);

    const hasSep = key.unparsed.startsWith(JSON_KV_DELIMITER);
    if (!hasSep) return parseFailed(value);

    const rawVal = key.unparsed.slice(JSON_KV_DELIMITER.length).trim();
    const val = jsonTypes.parseValue(rawVal);

    return {
      parsed: [key.parsed, val.parsed] as JsonKeyValuePair,
      unparsed: val.unparsed,
    };
  },

  parseObject(value: string): Parsed<JsonObject> {
    value = removeInsignificantWhitespace(value);
    const hasOpen = value.startsWith(JSON_OBJECT_START);
    if (!hasOpen) return parseFailed(value);
    const letters = value.split('');

    const objectEnd = letters.reduce(
      (acc, letter, index) => (letter === JSON_OBJECT_END ? index : acc),
      invalidIndexKey
    );

    const objectLiteral = value.slice(1, objectEnd);

    if (objectLiteral === '')
      return {
        parsed: {},
        unparsed: value.slice(objectEnd + 1),
      };

    const parseKvPairs = delimitedParser(
      JSON_OBJECT_DELIMITER,
      jsonTypes.parseKeyValuePair
    );

    const kvPairs = parseKvPairs(objectLiteral).parsed;

    return {
      parsed: Object.fromEntries(kvPairs),
      unparsed: value.slice(objectEnd + 1),
    };
  },
};

export const JsonParserCombinator = {
  types: jsonTypes,
  parse(rawJson: string) {
    const parser = firstSuccessfulParser(
      jsonTypes.parseObject,
      jsonTypes.parseValue
    );
    const result = parser(rawJson);

    return result.parsed;
  },
};

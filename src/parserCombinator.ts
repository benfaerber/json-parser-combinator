export type Parsed<O> = { parsed: O | null; unparsed: string };
export type Parser<O> = (value: string) => Parsed<O>;

// Function vocab:
// (description)Parser - returns a custom build parser function
// parse(description) - applies a given parser in a specific way
// or more simply: Parser returns a function, parse returns a Parsed<> Object
export const parseFailed = (value: string) => ({
  parsed: null,
  unparsed: value,
});

export const modifyParsed = (result, modifer) => {
  const parsed =
    result.parsed !== null && result.parsed !== undefined
      ? modifer(result.parsed)
      : null;
  return { parsed, unparsed: result.unparsed };
};

export const matchStringParser = (lookfor: string): Parser<string> => {
  return (value: string) =>
    value.startsWith(lookfor)
      ? {
          parsed: value.slice(0, lookfor.length),
          unparsed: value.slice(lookfor.length),
        }
      : parseFailed(value);
};

export const eitherStringParser = (...options: string[]): Parser<string> => {
  return (value: string) => {
    const result = options
      .map((option) => {
        const parser = matchStringParser(option);
        const result = parser(value);

        return result;
      })
      .find((result) => result.parsed);

    return result ? result : parseFailed(value);
  };
};

export const firstSuccessfulParser = (
  ...parsers: Parser<any>[]
): Parser<any> => {
  return (value: string) =>
    parsers.map((parser) => parser(value)).find((result) => !!result.parsed) ??
    parseFailed(value);
};

export const parseRecursively = (
  value: string,
  parser: Parser<any>,
  data = []
): Parsed<any[]> => {
  const result = parser(value);
  if (result.parsed !== null) {
    return parseRecursively(result.unparsed, parser, [...data, result.parsed]);
  }

  return {
    parsed: data,
    unparsed: '',
  };
};

export const delimitedParser = (
  delimiter: string,
  parser: Parser<any>
): Parser<any[]> => {
  return (value: string) => {
    const { parsed: firstValue, unparsed: delimitedValues } = parser(value);
    const delimiterParser = matchStringParser(delimiter);

    if (!firstValue) return parseFailed(value);

    const parseDelimitedChunk = (chunk: string): Parsed<string> => {
      const { parsed: foundDelim, unparsed: remaining } =
        delimiterParser(chunk);
      if (!foundDelim) return parseFailed(chunk);

      return parser(remaining.trim());
    };

    return parseRecursively(delimitedValues, parseDelimitedChunk, [firstValue]);
  };
};

const testDelimitedParse = () => {
  const alphabetParser = eitherStringParser('a', 'b', 'c', 'd', 'e');
  const csvParser = delimitedParser(',', alphabetParser);
  console.log(csvParser('a, b, d, a, a,a, a,a'));
};

const testRecursiveParse = () => {
  console.log(
    parseRecursively('1234567', (v) =>
      v.length !== 0
        ? {
            parsed: v.slice(0, 1),
            unparsed: v.slice(1),
          }
        : parseFailed(v)
    )
  );
};

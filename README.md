# JSON Parser Combinator
 A JSON parser written in Typescript using the Parser Combinator methodology.
 I recommend that anyone who is interested in functional parsers should use this as a reference.
 A Rust implementation is coming soon.

## Docs

### Basic Usage
```
import { JsonParserCombinator } from './jsonParser';

// Parsing JSON
const farm = JsonParserCombinator.parse(`
{
  "name": "Red Barn Farm",
   "animals": ["pigs", "chickens", "cows"],
  "employees": [
    {
      "name": "Joe",
      "role": "Owner",
      "pay": 12.00
    },
    {
      "name": "Heather",
      "role": "Vetrinarian",
      "isSalaried": true
    }
  ]
}
`);

const vegetables = JsonParserCombinator.parse('["carrot", "onion", "turnip"]');
// Outputs: [ 'carrot', 'onion', 'turnip' ] (as list)

const booleanLiteral = JsonParserCombinator.parse('true');
// Outputs: true (as boolean)
```

### Parsing Individual Types
```
const parsedBoolean = JsonParserCombinator.types.parseBool('false');
// Outputs: {parsed: JsonBool(false), unparsed: ''}: Parsed<JsonBool>

const parsedList = JsonParserCombinator.types.parseList('[1, 2, 3] ASDF');
// Outputs: {parsed: [1, 2, 3], unparsed: ' ASDF'}
```

### Using the Parser Combinator System
If you would like to use the parser combinator system used under the hood import any of the following types and functions:

```
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
```

## Data Types

### Parsed
```
type Parsed<O> = { parsed: O | null; unparsed: string };
```
The output from a parser, the output type is specified using the O generic.
If the parse failed, the `parsed` property would be null.
`unparsed` is a string that returns the rest of the string that was not parsed.
If the entire string was consumed by the parser an empty string will be outputted.

### Parser
```
type Parser<O> = (value: string) => Parsed<O>;
```
Given an output type, create a function that takes a string (called value) and returns a Parsed object with the given output type

## Helper Functions

### Parse Failed
```
const parseFailed = (value: string): Parsed<any>
```
This is a helper function used when a parser has failed.
It is commonly used in guard clauses that check whether the string matches the criteria to be parsed.
It takes the value that was fed to parser and returns a parsed object.

### Modify Parsed
```
const modifyParsed = (result: Parsed<any>, modifer: Function): Parsed<any>
```
This is a helper function to modify the output of a parser.
In this implementation it is usually used to cast parsed strings to specific types.
It takes a result from a parser and modifier function.

Example use case:
```
const parsedBoolean = {
  parsed: 'true',
  unparsed: ''
};

const modified = modifyParsed(
  parsedBoolean,
  (p: string) => p === 'true' ? JsonBool.True : JsonBool.False
);
```

## Basic Parsers

### Match String Parser
```
const matchStringParser = (lookfor: string): Parser<string>
```
Creates a parser that matches a specific string, this is the most fundamental parser in this library.

Example Use:
```
const appleParser = matchStringParser('apple');

appleParser('applesauce is good');
// Outputs: { parsed: 'apple', unparsed: 'sauce is good' }
```

### Either String Parser
```
const eitherStringParser = (...options: string[]): Parser<string>
```
Takes a variable number of strings and returns a parser that will parse any of these strings.

Example Use:
```
const fruitParser = eitherStringParser('apple', 'pear', 'plum', 'orange');

fruitParser('sheep'); // Outputs: { parsed: null, unparsed: 'sheep' }
fruitParser('pears are tasty'); // Outputs: { parsed: 'pear', unparsed: 's are tasty' }
```

### First Successful Parser
```
const firstSuccessfulParser = (
  ...parsers: Parser<any>[]
): Parser<any>
```

Takes a list of parsers and returns a parser that attempts to parse a value using the given parsers. The first parser to succeed's result is returned.

Example Use:
```
const fruitParser = eitherStringParser('apple', 'pear', 'plum', 'orange');
const vegetableParser = eitherStringParser('squash', 'broccoli', 'carrot');
const meatParser = eitherStringParser('beef', 'pork', 'chicken');

const foodParser = firstSuccessfulParser(fruitParser, vegetableParser, meatParser);

foodParser('squash can be made into a soup');
// Outputs: { parsed: 'squash', unparsed: ' can be made into a soup' }

foodParser('i like to go to store');
// Outputs: { parsed: null, unparsed: 'i like to go to store' }

foodParser('porkaslkwjkqa');
// Outputs: { parsed: 'pork', unparsed: 'aslkwjkqa' }

```

### Parse Recursively
```
const parseRecursively = (
  value: string,
  parser: Parser<any>,
  data = []
): Parsed<any[]>
```

Applies a parser to a value recusivly until the entire string is consumed or the parser fails.
Returns a list of all the parsed results

Example Use:
```
const capitalLetterParser = eitherStringParser(
  ...'ABCDEFGHIJLMNOPQRSTUVWXYZ'.split('')
);
const spaceParser = matchStringParser(' ');

const capitalSentenceParser = firstSuccessfulParser(
  capitalLetterParser,
  spaceParser
);

const sentence = 'THIS RECIPE REQUIRES 3 STICKS OF BUTTER';

capitalSentenceParser(sentence);
// Outputs: { parsed: [
    'T', 'H', 'I', 'S', ' ',
    'R', 'E', 'C', 'I', 'P',
    'E', ' ', 'R', 'E', 'Q',
    'U', 'I', 'R', 'E', 'S',
    ' '
  ], unparsed: '3 STICKS OF BUTTER' }

```

### Delimited Parser
```
const delimitedParser = (
  delimiter: string,
  parser: Parser<any>
): Parser<any[]>
```

Applies a parser on a delimited string, first the parser is applied to get an initial value.
The parser checks to see if the provided delimiter is in the string, if so it applies the parser again.
This process contains until the parser fails or the entire string is consumed.

Example Use:
```
const fruitParser = eitherStringParser('apple', 'pear', 'plum', 'orange');

const semicolonFruitParser = delimitedParser(';;', fruitParser);

const sentence = 'plum;;pear;;apple;;dog;;pear';
// Outptus: { parsed: [ 'plum', 'pear', 'apple' ], unparsed: 'dog;;pear' }
```

### Building a parser from scratch
Some of these parsers will not meet your needs, luckily it is easy to write custom parsers.

### First example: Non composible parser
A function that returns parsed output

In this example we will build an uppercase word parser. (An uppercase word parser will be capable of parsing a word that has only uppercase letters and no spaces or symbols inside)

```
// All parsers take a string called value as input
const parseUppercaseWord = (value: string): Parsed<string> => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXZY'.split('');

  if (value.length === 0 || !letters.includes(value[0]))
    return parseFailed(value);

  // Find the index of the first occurence of a non capital letter
  const endOfLetters = value
    .split('')
    .reduce(
      (acc, letter, index) =>
        !letters.includes(letter) && acc === 0 ? index : acc,
      0
    );

  return {
    parsed: value.slice(0, endOfLetters),
    unparsed: value.slice(endOfLetters + 1),
  };
};

parseUppercaseWord('UPPERCASE not')
// Outputs: { parsed: 'UPPERCASE', unparsed: ' not' }

parseUppercaseWord('no match not')
// Outputs: { parsed: null, unparsed: 'no match not' }

parseUppercaseWord('MATCHES FIRST WORD')
// Outputs: { parsed: 'MATCHES', unparsed: ' FIRST WORD' }
```

### Second Example: Composable parser
A function that returns a parser

We will create a function that modifies an existing parser.
In this example we will create a "startsWith" parser.
It will take a parser and modify it so it will only parse if a start string is matched and the existing parser matches afterwords.

Heres an example of how it will work:
```
const fruitParser = eitherStringParser('apple', 'pear', 'plum', 'orange');
const dunderFruitParser = startsWithParser('__', fruitParser);

dunderFruitParser('__apple = 100;'); // Outputs: { parsed: '__apple', unparsed: ' = 100;' }
```

Now let's implement this parser!

```
const startsWithParser = (
  start: string, // Takes a start string
  parser: Parser<string> // Takes a parser
): Parser<string> => {
  // First we will create the starting parser
  const startParser = matchStringParser(start);

  // Now we will return the parser we are building
  return (value: string) => {
    // Destructure what was parsed and what's left
    const { parsed: startParsed, unparsed: afterStart } = startParser(value);
    // If the starter string was not found, fail
    if (!startParsed) return parseFailed(value);

    // Using what was unparsed from the startParser, attempt to use the user provided parser
    const after = parser(afterStart);
    // If this parse failed, fail the parser
    if (!after.parsed) return parseFailed(value);

    // Finally return the start result plus the after result
    return {
      parsed: startParsed + after.parsed,
      unparsed: after.unparsed,
    };
  };
};


const fruitParser = eitherStringParser('apple', 'pear', 'plum', 'orange');
const dunderParser = startsWithParser('__', fruitParser);

dunderParser('__apple = 100 ');
// Outputs: { parsed: '__apple', unparsed: ' = 100 ' }
```
import { JsonParserCombinator } from './jsonParser';

const shouldShowInput = true;
const displayTest = (name: string, parserInput: string) => {
  console.log(name);
  console.log(JsonParserCombinator.parse(parserInput));

  if (shouldShowInput) console.log(`Input: "${parserInput}"`);
  console.log('');
};

const stringTests = () => {
  displayTest('Basic String', '"basic string"');
  displayTest('Quote String', '"string " with quotes"');
  displayTest('Escaped String', '"string \\" with escape"');
};

const symbolLiteralTests = () => {
  displayTest('True Literal', 'true asdf');
  displayTest('False Literal', 'false');
  displayTest('String true', '"true"e asdf');

  displayTest('Null Literal', 'null"e asdf');
};

const numberTests = () => {
  displayTest('Decimal Number', '12.34 asdf;lqw');
  displayTest('Integer number', '123 asdfas');
  displayTest('All Number', '19265');
  displayTest('Long Float', '102256.420723');
  displayTest('Only decimal', '.22');
  displayTest('No number', 'asdfas');
};

const listTests = () => {
  displayTest('Basic List', '[1, true, false, "applesauce"] asdf');

  displayTest(
    'Comma List',
    '[1, "i want to, confuse ,the s,ystem", false, "applesauce"] asdf'
  );

  displayTest('Mixed Type Object List', '[2, {"a": "b"}, null]');

  displayTest('Single List', '[234] asdf');
  displayTest('Empty List', '[]');

  displayTest(
    'Nested List End',
    '[1, "i want to, confuse ,the s,ystem", "applesauce", [true, false, [1, 2, 3]]] asdf'
  );

  displayTest(
    'Nested List Middle',
    '[1, "i want to, confuse ,the s,ystem", [true, false, [1, 2, 3]], "applesauce"]'
  );
};

const objectTests = () => {
  displayTest('Simple object', '{"name": "Joe", "age": 53, "job": "Farmer"}');

  displayTest('Empty object', '{}');

  displayTest('1 Element object', '{"a":2}');

  displayTest(
    'Tested Object',

    '{"name": "Joe", "age": 53, "job": {"company": "Red Barn Farm", "pay": 12, "tasks": ["clean coop", "collect eggs", "feed chickens"]}}'
  );

  displayTest(
    'Whitespace tolerant',
    `{
        "name": "Joe",
        "age": 53,
        "job": {
          "company": "Red Barn Farm",
          "pay": 12,
          "tasks": ["clean coop", "collect eggs", "feed chickens"]
        }
      }
      `
  );
};

export function test() {
  stringTests();
  symbolLiteralTests();
  numberTests();
  listTests();
  objectTests();
}

test();

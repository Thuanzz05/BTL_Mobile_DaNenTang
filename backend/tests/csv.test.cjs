const test = require('node:test');
const assert = require('node:assert/strict');
const { parseCsv } = require('../dist/utils/csv.util');

test('CSV parser handles BOM, quoted commas, escaped quotes and multiline cells', () => {
  assert.deepEqual(
    parseCsv('\uFEFFtopic,word,example\r\nFood,apple,"I said ""hello, friend"".\nIt is red."'),
    [
      ['topic', 'word', 'example'],
      ['Food', 'apple', 'I said "hello, friend".\nIt is red.'],
    ]
  );
  assert.throws(() => parseCsv('a,b\n"unfinished,b'), /chưa đóng/);
});

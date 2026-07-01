const fs = require('fs');
const parser = require('@babel/parser');
const code = fs.readFileSync('src/App.js', 'utf8');
try {
  parser.parse(code, { sourceType: 'module', plugins: ['jsx', 'classProperties', 'optionalChaining', 'nullishCoalescingOperator'] });
  console.log('PARSE_OK');
} catch (e) {
  console.error('ERROR', e.message);
  console.error('LOC', e.loc);
}

const fs = require('fs');
const parser = require('@babel/parser');
const code = fs.readFileSync('frontend/src/App.js', 'utf8');
try {
  parser.parse(code, {sourceType: 'module', plugins: ['jsx','classProperties']});
  console.log('Parsed OK');
} catch(e) {
  console.error(e.message);
}

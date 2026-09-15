const assert = require('assert');
const { formatArl, getFoldingRanges } = require('../src/arl-structure.cjs');

const messy = [
  'func void main()',
  'if(a>0)',
  'MoveJ(p1)',
  'elseif(a==0)',
  'if(b)',
  'MoveL(p2)',
  'endif',
  'else',
  'while(x) doSomething()',
  'print "x"',
  'endif',
  'endfunc'
].join('\n');

const expected = [
  'func void main()',
  '    if(a>0)',
  '        MoveJ(p1)',
  '    elseif(a==0)',
  '        if(b)',
  '            MoveL(p2)',
  '        endif',
  '    else',
  '        while(x) doSomething()',
  '        print "x"',
  '    endif',
  'endfunc'
].join('\n');

assert.strictEqual(formatArl(messy), expected, 'Formatter must mirror ARL-IDE OPEN/CLOSE/SAME indentation');

const switchMessy = [
  'switch(mode)',
  'case 1:',
  'MoveJ(p1)',
  'case 2:',
  'MoveL(p2)',
  'default:',
  'MoveJ(p3)',
  'endswitch'
].join('\n');
const switchExpected = [
  'switch(mode)',
  'case 1:',
  '    MoveJ(p1)',
  'case 2:',
  '    MoveL(p2)',
  'default:',
  '    MoveJ(p3)',
  'endswitch'
].join('\n');
assert.strictEqual(formatArl(switchMessy), switchExpected, 'case/default must use SAME branch semantics');

const compact = ['if(a) MoveJ(p1)', 'print "same level"'].join('\n');
assert.strictEqual(formatArl(compact), compact, 'Compact if(...) action must not open a block');

const crlf = 'func void main()\r\nMoveJ(p1)\r\nendfunc\r\n';
assert.strictEqual(
  formatArl(crlf, { eol: '\r\n' }),
  'func void main()\r\n    MoveJ(p1)\r\nendfunc\r\n',
  'Formatter must preserve requested EOL style and trailing newline'
);

const foldText = [
  'func void main()',      // 0
  '    if(a)',             // 1
  '        while(b)',      // 2
  '            MoveJ(p1)', // 3
  '        endwhile',      // 4
  '    else',              // 5
  '        MoveL(p2)',     // 6
  '    endif',             // 7
  'endfunc'                // 8
].join('\n');
assert.deepStrictEqual(getFoldingRanges(foldText), [
  { start: 0, end: 7, type: 'func' },
  { start: 1, end: 6, type: 'if' },
  { start: 2, end: 3, type: 'while' }
], 'Folding must return exact nested ARL block ranges and leave closing keywords visible');

const repeatFold = ['repeat', '    MoveJ(p1)', 'until(done)'].join('\n');
assert.deepStrictEqual(getFoldingRanges(repeatFold), [
  { start: 0, end: 1, type: 'repeat' }
]);

const compactFold = ['if(a) MoveJ(p1)', 'endif'].join('\n');
assert.deepStrictEqual(getFoldingRanges(compactFold), [], 'Compact single-line statements must not create folding ranges');

const lexicalMessy = [
  'func void main()',
  '/*',
  'endfunc',
  'if(fake)',
  '*/',
  'print "endfunc ( )"',
  'if(check(")"))',
  'MoveJ(p1)',
  'endif',
  'endfunc'
].join('\n');
const lexicalExpected = [
  'func void main()',
  '    /*',
  '    endfunc',
  '    if(fake)',
  '    */',
  '    print "endfunc ( )"',
  '    if(check(")"))',
  '        MoveJ(p1)',
  '    endif',
  'endfunc'
].join('\n');
assert.strictEqual(
  formatArl(lexicalMessy),
  lexicalExpected,
  'Formatter must ignore block keywords and parentheses inside comments and strings'
);

const lexicalFold = [
  'func void main()',        // 0
  '    /*',                  // 1
  '    endfunc',             // 2
  '    if(fake)',            // 3
  '    */',                  // 4
  '    if(check(")"))',      // 5
  '        MoveJ(p1)',       // 6
  '    endif',               // 7
  'endfunc'                  // 8
].join('\n');
assert.deepStrictEqual(getFoldingRanges(lexicalFold), [
  { start: 0, end: 7, type: 'func' },
  { start: 5, end: 6, type: 'if' }
], 'Folding must ignore block keywords and parentheses inside comments and strings');

const nestedCondition = ['if(getdi(abs(1)))', 'MoveJ(p1)', 'endif'].join('\n');
assert.strictEqual(
  formatArl(nestedCondition),
  ['if(getdi(abs(1)))', '    MoveJ(p1)', 'endif'].join('\n'),
  'Nested function calls in a block condition must open indentation'
);

const languageConfiguration = require('../language-configuration.json');
const increaseIndent = new RegExp(languageConfiguration.indentationRules.increaseIndentPattern);
assert(increaseIndent.test('if(getdi(abs(1)))'), 'VS Code auto-indent must recognize nested function calls in conditions');
assert(!increaseIndent.test('if(getdi(abs(1))) MoveJ(p1)'), 'VS Code auto-indent must keep compact single-line statements compact');

console.log('ARL formatter/folding tests passed');

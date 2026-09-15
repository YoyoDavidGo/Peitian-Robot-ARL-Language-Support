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

console.log('ARL formatter/folding tests passed');

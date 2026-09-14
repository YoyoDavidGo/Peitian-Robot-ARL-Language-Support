'use strict';

// Mirrors ARL-IDE fmtCode() block semantics.
const OPEN = new Set(['func','if','while','for','loop','switch','repeat','interrupt','timer','trigger']);
const CLOSE = new Set(['endfunc','endif','endwhile','endfor','endloop','endswitch','until']);
const SAME = new Set(['elseif','else','case','default']);

const FOLD_PAIRS = new Map([
  ['func', 'endfunc'],
  ['if', 'endif'],
  ['while', 'endwhile'],
  ['for', 'endfor'],
  ['loop', 'endloop'],
  ['switch', 'endswitch'],
  ['repeat', 'until']
]);
const FOLD_CLOSE_TO_OPEN = new Map([...FOLD_PAIRS].map(([open, close]) => [close, open]));

function firstWord(trimmedLine) {
  return trimmedLine.split(/[\s(:]/)[0].toLowerCase();
}

function hasCompactStatementAfterCondition(trimmedLine, keyword) {
  let rest = trimmedLine.slice(keyword.length).trim();
  if (rest.startsWith('(')) {
    let depth = 0;
    let index = 0;
    for (; index < rest.length; index++) {
      if (rest[index] === '(') depth++;
      else if (rest[index] === ')') {
        depth--;
        if (depth === 0) { index++; break; }
      }
    }
    rest = rest.slice(index).trim();
  }
  return rest !== '' && !rest.startsWith('//');
}

function opensIndentedBlock(trimmedLine, keyword) {
  if (!OPEN.has(keyword)) return false;
  if (keyword === 'func') return true;
  return !hasCompactStatementAfterCondition(trimmedLine, keyword);
}

function indentUnit(options = {}) {
  if (options.insertSpaces === false) return '\t';
  const size = Number.isInteger(options.tabSize) && options.tabSize > 0 ? options.tabSize : 4;
  return ' '.repeat(size);
}

function formatArl(text, options = {}) {
  const eol = options.eol || (text.includes('\r\n') ? '\r\n' : '\n');
  const unit = indentUnit(options);
  const lines = text.split(/\r?\n/);
  let depth = 0;
  const formatted = lines.map(raw => {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    const keyword = firstWord(trimmed);
    if (CLOSE.has(keyword)) {
      depth = Math.max(0, depth - 1);
      return unit.repeat(depth) + trimmed;
    }
    if (SAME.has(keyword)) {
      depth = Math.max(0, depth - 1);
      const out = unit.repeat(depth) + trimmed;
      depth++;
      return out;
    }
    const out = unit.repeat(depth) + trimmed;
    if (opensIndentedBlock(trimmed, keyword)) depth++;
    return out;
  });
  return formatted.join(eol);
}

function getFoldingRanges(text) {
  const lines = text.split(/\r?\n/);
  const stack = [];
  const ranges = [];
  for (let line = 0; line < lines.length; line++) {
    const trimmed = lines[line].trim();
    if (!trimmed || trimmed.startsWith('//')) continue;
    const keyword = firstWord(trimmed);
    if (FOLD_PAIRS.has(keyword) && opensIndentedBlock(trimmed, keyword)) {
      stack.push({ type: keyword, line });
      continue;
    }
    const expectedOpen = FOLD_CLOSE_TO_OPEN.get(keyword);
    if (!expectedOpen) continue;
    let matchIndex = -1;
    for (let i = stack.length - 1; i >= 0; i--) {
      if (stack[i].type === expectedOpen) { matchIndex = i; break; }
    }
    if (matchIndex < 0) continue;
    const opener = stack[matchIndex];
    stack.length = matchIndex;
    const end = line - 1;
    if (end > opener.line) ranges.push({ start: opener.line, end, type: opener.type });
  }
  ranges.sort((a, b) => a.start - b.start || a.end - b.end);
  return ranges;
}

module.exports = { OPEN, CLOSE, SAME, formatArl, getFoldingRanges, opensIndentedBlock };

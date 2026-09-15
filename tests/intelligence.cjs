const assert = require('assert');
const {
  parseFunctions,
  findFunction,
  parseFunctionReference,
  lookupHoverEntry,
  parseVariables,
  buildCompletionCandidates,
  getSignatureContext,
  getFontWeightProfile,
  collectWeightRanges,
  getCompletionPrefix,
  getTypedCompletionContext,
  filterTypedCompletionCandidates,
  collectVisibleVariables,
  getSmartCompletionTemplates,
  collectIndexedSystemVariableUsages,
  isIndexedSystemVariable
} = require('../src/arl-intelligence.cjs');

const code = [
  'func pose singleModle(int is,int grab)',
  '    return p1',
  'endfunc',
  '',
  'func void main()',
  '    singleModle(1,0)',
  '    def::point_offset()',
  'endfunc'
].join('\n');

const functions = parseFunctions(code);
assert.deepStrictEqual(functions.map(fn => ({
  name: fn.name,
  returnType: fn.returnType,
  params: fn.params,
  startLine: fn.startLine,
  endLine: fn.endLine
})), [
  { name: 'singleModle', returnType: 'pose', params: 'int is,int grab', startLine: 0, endLine: 2 },
  { name: 'main', returnType: 'void', params: '', startLine: 4, endLine: 7 }
]);

const sameFile = findFunction(code, 'SINGLEmodle');
assert(sameFile, 'Function lookup should be case-insensitive');
assert.strictEqual(sameFile.startLine, 0);
assert.strictEqual(sameFile.nameStart, 'func pose '.length);

assert.deepStrictEqual(parseFunctionReference('    singleModle(1,0)', 8), {
  file: null,
  name: 'singleModle',
  start: 4,
  end: 15
});
assert.deepStrictEqual(parseFunctionReference('    def::point_offset()', 10), {
  file: 'def',
  name: 'point_offset',
  start: 4,
  end: 21
});
assert.strictEqual(parseFunctionReference('    MoveJ p:p1', 7), null, 'Instruction without () must not be treated as function call');

const docs = {
  entries: {
    waittime: { type: 'instruction', desc: '等待指定秒数', proto: 'waittime time:<double>' }
  }
};
assert.deepStrictEqual(lookupHoverEntry('WAITTIME', docs), docs.entries.waittime);
assert.strictEqual(lookupHoverEntry('unknown', docs), null);

console.log('ARL intelligence tests passed');


// v0.6.0: declared variables + function parameters are completion sources.
const completionCode = [
  'speed vFast={ per 80 }',
  'pose pHome',
  'func pose calcOffset(pose src, double dx)',
  '    int localCount=0, retry=1',
  '    return offset(src,dx,0,0,0,0,0)',
  'endfunc'
].join('\n');
const vars = parseVariables(completionCode);
assert(vars.some(v=>v.name==='vFast' && v.type==='speed' && v.scope==='global'));
assert(vars.some(v=>v.name==='pHome' && v.type==='pose' && v.scope==='global'));
assert(vars.some(v=>v.name==='src' && v.type==='pose' && v.kind==='parameter'));
assert(vars.some(v=>v.name==='dx' && v.type==='double' && v.kind==='parameter'));
assert(vars.some(v=>v.name==='localCount' && v.type==='int' && v.scope==='calcOffset'));
assert(vars.some(v=>v.name==='retry' && v.type==='int' && v.scope==='calcOffset'));

const languageData = require('../language-data/arl-language.json');
const completions = buildCompletionCandidates(completionCode, languageData);
for (const label of ['ptp','offset','setdo','calcOffset','vFast','pHome','localCount']) {
  assert(completions.some(c=>c.label===label), `Missing completion: ${label}`);
}
assert.strictEqual(completions.filter(c=>c.label.toLowerCase()==='offset').length,1,'Completions must be de-duplicated case-insensitively');

const reference = require('../language-data/arl-reference.json');
let sigText='func void main()\n    offset(pHome,10,20,\nendfunc';
let sig = getSignatureContext(sigText, sigText.indexOf('\nendfunc'), reference, languageData);
assert(sig, 'Expected signature help for built-in function');
assert(sig.label.includes('offset('));
assert.strictEqual(sig.activeParameter,3);
assert(sig.parameters.length>=4);

sigText='func pose calcOffset(pose src, double dx)\n    return src\nendfunc\nfunc void main()\n    calcOffset(pHome,\nendfunc';
sig = getSignatureContext(sigText, sigText.indexOf('\nendfunc', sigText.indexOf('func void main')) , reference, languageData);
assert(sig, 'Expected signature help for user function');
assert(sig.label.includes('func pose calcOffset(pose src, double dx)'));
assert.strictEqual(sig.activeParameter,1);
assert.deepStrictEqual(sig.parameters,['pose src','double dx']);

sigText='func void main()\n    ptp p:pHome, v:vFast, \nendfunc';
sig = getSignatureContext(sigText, sigText.indexOf('\nendfunc'), reference, languageData);
assert(sig, 'Expected signature help for ARL instruction syntax');
assert(sig.label.startsWith('ptp '));
assert.strictEqual(sig.activeParameter,2);

assert.deepStrictEqual(getFontWeightProfile("'JetBrains Mono', Consolas"), { base:'200', mid:'350', heavy:'400', family:'jetbrains-mono' });
assert.deepStrictEqual(getFontWeightProfile("'Cascadia Code', Consolas"), { base:'300', mid:'350', heavy:'400', family:'cascadia-code' });
assert.strictEqual(getFontWeightProfile('Consolas, monospace'), null);

const weightCode='func void main() // comment\n    ptp p:offset(p1,0,0,0)\nendfunc';
const weights=collectWeightRanges(weightCode, languageData);
const heavyTexts=weights.heavy.map(r=>weightCode.slice(r.start,r.end));
const midTexts=weights.mid.map(r=>weightCode.slice(r.start,r.end));
for (const token of ['func','void','ptp','endfunc','// comment']) assert(heavyTexts.includes(token),`Expected heavy token: ${token}`);
assert(midTexts.includes('(') && midTexts.includes(')'),'Expected bracket mid-weight ranges');
assert(!heavyTexts.includes('offset'),'Built-in function should keep base/light weight');

const blockWeightCode='func void main() /* block comment\ncontinues here */\nendfunc';
const blockWeights=collectWeightRanges(blockWeightCode, languageData);
const blockHeavyTexts=blockWeights.heavy.map(r=>blockWeightCode.slice(r.start,r.end));
assert(blockHeavyTexts.includes('/* block comment\ncontinues here */'),'Block comments must receive the same heavy comment weight as // comments');

console.log('ARL v0.6 intelligence/font-weight tests passed');


// v0.6.1: completion prefix owns the typed '$' so accepting a system variable
// replaces it instead of inserting a second '$'.
assert.deepStrictEqual(getCompletionPrefix('$', 1), { text:'$', start:0, end:1 });
assert.deepStrictEqual(getCompletionPrefix('$AT_', 4), { text:'$AT_', start:0, end:4 });
assert.deepStrictEqual(getCompletionPrefix('    off', 7), { text:'off', start:4, end:7 });
assert.deepStrictEqual(getCompletionPrefix('def::poi', 8), { text:'poi', start:5, end:8 });

// Weight ranges must be disjoint. A full-document base decoration overlapping
// heavy/mid tokens can win CSS precedence and erase the visible weight contrast.
const partition=collectWeightRanges(weightCode, languageData);
assert(Array.isArray(partition.base) && partition.base.length>0, 'Expected explicit base-weight ranges');
for (const a of partition.base) for (const b of [...partition.mid,...partition.heavy]) {
  assert(a.end<=b.start || b.end<=a.start, `Base range overlaps weighted token: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`);
}
console.log('ARL v0.6.1 completion replacement/font partition tests passed');

// v0.6.3: every built-in S1 token (logic / keyword / datatype) should have
// its own Wizard-derived Hover entry instead of falling back to a generic label.
const hoverRef063 = require('../language-data/arl-reference.json');
for (const group of ['logic','keywords','datatypes']) {
  for (const token of languageData.categories[group] || []) {
    const entry = hoverRef063.entries[String(token).toLowerCase()];
    assert(entry, `Missing detailed Hover entry for ${group}:${token}`);
    assert(entry.desc && entry.desc.trim(), `Missing Hover description for ${group}:${token}`);
    assert(entry.type && entry.type.trim(), `Missing Hover type for ${group}:${token}`);
  }
}
assert.strictEqual(hoverRef063.entries.if.desc, '条件判断，满足时执行块内代码');
assert.strictEqual(hoverRef063.entries.if.proto, 'if(bool 表达式)');
assert.strictEqual(hoverRef063.entries.return.proto, 'return [表达式]');
assert.strictEqual(hoverRef063.entries.pose.desc, '位姿类型（位置+姿态）');
console.log('ARL v0.6.3 detailed S1 Hover tests passed');


// v0.6.6: context-aware typed completion.
// Free input must not offer anything before the first character is typed.
assert.deepStrictEqual(getTypedCompletionContext('', 0, reference, languageData), {
  mode:'free', prefix:'', expectedType:null, instruction:null, parameter:null
});

// A typed free-form prefix keeps the broad ARL vocabulary available.
let typedCtx = getTypedCompletionContext('p', 1, reference, languageData);
assert.strictEqual(typedCtx.mode, 'free');
assert.strictEqual(typedCtx.prefix, 'p');

// Named instruction parameters establish a semantic type, but ':' alone is
// still not enough to show suggestions.
typedCtx = getTypedCompletionContext('ptp p:', 'ptp p:'.length, reference, languageData);
assert.strictEqual(typedCtx.mode, 'typed');
assert.strictEqual(typedCtx.expectedType, 'pose');
assert.strictEqual(typedCtx.prefix, '');
assert.strictEqual(typedCtx.parameter, 'p');

typedCtx = getTypedCompletionContext('ptp p:p', 'ptp p:p'.length, reference, languageData);
assert.strictEqual(typedCtx.mode, 'typed');
assert.strictEqual(typedCtx.expectedType, 'pose');
assert.strictEqual(typedCtx.prefix, 'p');

assert.strictEqual(getTypedCompletionContext('movej j:j', 'movej j:j'.length, reference, languageData).expectedType, 'joint');
assert.strictEqual(getTypedCompletionContext('ptp v:v', 'ptp v:v'.length, reference, languageData).expectedType, 'speed');
assert.strictEqual(getTypedCompletionContext('ptp s:s', 'ptp s:s'.length, reference, languageData).expectedType, 'slip');
assert.strictEqual(getTypedCompletionContext('ptp t:t', 'ptp t:t'.length, reference, languageData).expectedType, 'tool');
assert.strictEqual(getTypedCompletionContext('ptp w:w', 'ptp w:w'.length, reference, languageData).expectedType, 'wobj');

const typedCode = [
  'pose pGlobal',
  'joint jGlobal',
  'speed vGlobal',
  'func void helper()',
  '    pose pOtherLocal',
  'endfunc',
  'func void main(pose pArg)',
  '    pose pLocal',
  '    joint jLocal',
  '    ptp p:p',
  'endfunc'
].join('\n');

const visibleAtPtp = collectVisibleVariables(typedCode, 9, languageData);
assert(visibleAtPtp.some(v=>v.name==='pGlobal' && v.type==='pose'));
assert(visibleAtPtp.some(v=>v.name==='pArg' && v.type==='pose'));
assert(visibleAtPtp.some(v=>v.name==='pLocal' && v.type==='pose'));
assert(!visibleAtPtp.some(v=>v.name==='pOtherLocal'), 'locals from another function must not leak into completion');

const typedCandidates = [
  ...visibleAtPtp.map(v=>({label:v.name,kind:'variable',type:v.type})),
  {label:'jGlobal',kind:'variable',type:'joint'},
  {label:'ptp',kind:'instruction'},
  {label:'pose',kind:'datatype'},
  {label:'$P',kind:'system-variable',type:'pose'},
  {label:'$D',kind:'system-variable',type:'double'}
];
const poseOnly = filterTypedCompletionCandidates(typedCandidates, {mode:'typed',prefix:'p',expectedType:'pose'});
assert.deepStrictEqual(poseOnly.map(x=>x.label).sort(), ['pArg','pGlobal','pLocal'].sort(), 'typed p: context must return only matching pose variables');
const poseSys = filterTypedCompletionCandidates(typedCandidates, {mode:'typed',prefix:'$',expectedType:'pose'});
assert.deepStrictEqual(poseSys.map(x=>x.label), ['$P'], 'typed pose context with $ prefix must return only pose system variables');
const freeP = filterTypedCompletionCandidates(typedCandidates, {mode:'free',prefix:'p',expectedType:null});
assert(freeP.some(x=>x.label==='ptp') && freeP.some(x=>x.label==='pose'), 'free p prefix may mix ARL categories');
assert.deepStrictEqual(filterTypedCompletionCandidates(typedCandidates, {mode:'free',prefix:'',expectedType:null}), [], 'no prefix means no completion popup');

console.log('ARL v0.6.6 typed-context completion tests passed');


// v1.1.0: optional Smart Completion generates structure, never locks values.
let smart = getSmartCompletionTemplates('ptp', 'instruction', reference);
assert.strictEqual(smart.length, 2, 'ptp should expose percentage and variable smart templates');
assert(smart.some(x=>x.variant==='literal' && x.snippet==='ptp p:${1},vp:${2}%,sp:${3}%,t:${4:$FLANGE},w:${5:$WORLD}'));
assert(smart.some(x=>x.variant==='variables' && x.snippet==='ptp p:${1},v:${2},s:${3},t:${4:$FLANGE},w:${5:$WORLD}'));
for (const template of smart) {
  assert(!template.snippet.includes('p4'), 'Smart templates must not hard-code user variable names');
  assert(!template.snippet.includes('|'), 'Smart templates must not use closed choice lists; users may type custom values');
  assert.strictEqual(template.triggerSuggest, false, 'Motion templates should wait for the first typed character before showing variable suggestions');
}

smart = getSmartCompletionTemplates('movej', 'instruction', reference);
assert(smart.some(x=>x.variant==='literal' && x.snippet==='movej j:${1},vp:${2}%,sp:${3}%,t:${4:$FLANGE}'));
assert(smart.some(x=>x.variant==='variables' && x.snippet==='movej j:${1},v:${2},s:${3},t:${4:$FLANGE}'));

smart = getSmartCompletionTemplates('lin', 'instruction', reference);
assert(smart.some(x=>x.variant==='literal' && x.snippet==='lin p:${1},vl:${2}mm/s,sl:${3}mm,t:${4:$FLANGE},w:${5:$WORLD}'), 'Motion value template must use blank numeric placeholders so candidates open before a value is chosen');

smart = getSmartCompletionTemplates('cir', 'instruction', reference);
assert(smart.some(x=>x.variant==='literal' && x.snippet==='cir m:${1},p:${2},vl:${3}mm/s,sl:${4}mm,t:${5:$FLANGE},w:${6:$WORLD}'));

smart = getSmartCompletionTemplates('ccir', 'instruction', reference);
assert(smart.some(x=>x.variant==='literal' && x.snippet==='ccir p:${1},vl:${2}mm/s,sl:${3}mm,t:${4:$FLANGE},w:${5:$WORLD}'));

smart = getSmartCompletionTemplates('offset', 'function', reference);
assert.strictEqual(smart.length, 1);
assert.strictEqual(smart[0].snippet, 'offset(${1:p}, ${2:dx}, ${3:dy}, ${4:dz}, ${5:rz}, ${6:ry}, ${7:rx})');
assert.strictEqual(smart[0].triggerSuggest, false);

smart = getSmartCompletionTemplates('if', 'keyword', reference);
assert.strictEqual(smart.length, 1);
assert.strictEqual(smart[0].snippet, 'if(${1:condition})\n    ${0}\nendif');
smart = getSmartCompletionTemplates('func', 'keyword', reference);
assert.strictEqual(smart[0].snippet, 'func ${1:void} ${2:functionName}(${3})\n    ${0}\nendfunc');

const typedNoPrefix = filterTypedCompletionCandidates(
  typedCandidates,
  {mode:'typed',prefix:'',expectedType:'pose'},
  {allowEmptyTypedPrefix:true}
);
assert(typedNoPrefix.some(x=>x.label==='pGlobal'));
assert(typedNoPrefix.some(x=>x.label==='$P'));
assert(!typedNoPrefix.some(x=>x.label==='jGlobal'));
assert.deepStrictEqual(
  filterTypedCompletionCandidates(typedCandidates,{mode:'free',prefix:'',expectedType:null},{allowEmptyTypedPrefix:true}),
  [],
  'Even explicit invocation should not dump the whole vocabulary on an empty free line'
);
console.log('ARL v1.1 Smart Completion tests passed');

// 1.0.0 RC: system variables use an explicit $ namespace. Once a normal
// identifier prefix is typed, $-system variables must not remain candidates.
const strictPoseCandidates = [
  {label:'p1',kind:'variable',type:'pose'},
  {label:'pHome',kind:'variable',type:'pose'},
  {label:'$P',kind:'system-variable',type:'pose'}
];
assert.deepStrictEqual(
  filterTypedCompletionCandidates(strictPoseCandidates,{mode:'typed',prefix:'p',expectedType:'pose'}).map(x=>x.label),
  ['p1','pHome'],
  'Typing p in a pose slot must exclude $P; system variables require a $ prefix'
);
assert.deepStrictEqual(
  filterTypedCompletionCandidates(strictPoseCandidates,{mode:'typed',prefix:'p1',expectedType:'pose'}).map(x=>x.label),
  ['p1'],
  'Typing p1 must not leave $P as an accept-by-Tab candidate'
);

// Smart motion templates should insert the fixed parameter syntax but should
// not open an empty-prefix suggestion widget. Suggestions begin after the user
// types the first character (or explicitly invokes Ctrl+Space).
for (const name of ['ptp','lin','movej','cir','ccir']) {
  for (const template of getSmartCompletionTemplates(name,'instruction',reference)) {
    assert.strictEqual(template.triggerSuggest, false, `${name} Smart template must not auto-open empty-prefix suggestions`);
  }
}
console.log('ARL 1.0.0 RC strict typed-prefix tests passed');


// 1.0.0 RC: indexed system variables are reusable typed-completion candidates.
assert.deepStrictEqual(getCompletionPrefix('$P[2', 4), { text:'$P[2', start:0, end:4 });
assert.deepStrictEqual(getCompletionPrefix('ptp p:$P[21', 11), { text:'$P[21', start:6, end:11 });
assert.deepStrictEqual(getCompletionPrefix('waittime time:1', 'waittime time:1'.length), { text:'1', start:'waittime time:'.length, end:'waittime time:1'.length }, 'Numeric parameter prefixes must be owned by ARL completion');
assert.deepStrictEqual(getCompletionPrefix('lin p:p1,vl:65.5', 'lin p:p1,vl:65.5'.length), { text:'65.5', start:'lin p:p1,vl:'.length, end:'lin p:p1,vl:65.5'.length }, 'Decimal prefixes must be completable');
assert.strictEqual(isIndexedSystemVariable('$P', reference), true, '$P is an indexed pose system-variable array');
assert.strictEqual(isIndexedSystemVariable('$D', reference), true, '$D is an indexed double system-variable array');
assert.strictEqual(isIndexedSystemVariable('$WORLD', reference), false, '$WORLD is not indexed');
const indexedUsages = collectIndexedSystemVariableUsages([
  'ptp p:$P[21],vp:30%,sp:0%,t:$FLANGE,w:$WORLD',
  'double d=$D[3]',
  'ptp p:$P[21],vp:20%,sp:0%,t:$FLANGE,w:$WORLD',
  '// $P[99] is only a comment',
  'print "$P[88] is text"'
].join('\n'), reference);
assert.deepStrictEqual(indexedUsages.map(x=>x.label), ['$P[21]','$D[3]']);
assert.strictEqual(indexedUsages.find(x=>x.label==='$P[21]').type, 'pose');
assert.strictEqual(indexedUsages.find(x=>x.label==='$D[3]').type, 'double');
const indexedPoseCandidates = [
  {label:'p1',kind:'variable',type:'pose'},
  {label:'$P',kind:'system-variable',type:'pose'},
  {label:'$P[21]',kind:'system-variable',type:'pose',indexedValue:true}
];
assert.deepStrictEqual(
  filterTypedCompletionCandidates(indexedPoseCandidates,{mode:'typed',prefix:'',expectedType:'pose'},{allowEmptyTypedPrefix:true}).map(x=>x.label),
  ['p1','$P','$P[21]'],
  'Empty pose parameter prefix may show every pose candidate'
);
assert.deepStrictEqual(
  filterTypedCompletionCandidates(indexedPoseCandidates,{mode:'typed',prefix:'p',expectedType:'pose'},{allowEmptyTypedPrefix:true}).map(x=>x.label),
  ['p1'],
  'After typing p, $P and $P[index] must be excluded by strict namespace prefix filtering'
);
assert.deepStrictEqual(
  filterTypedCompletionCandidates(indexedPoseCandidates,{mode:'typed',prefix:'$P',expectedType:'pose'},{allowEmptyTypedPrefix:true}).map(x=>x.label),
  ['$P','$P[21]'],
  'Typing $P should keep both the base array and observed indexed values'
);
assert.deepStrictEqual(
  filterTypedCompletionCandidates(indexedPoseCandidates,{mode:'typed',prefix:'$P[2',expectedType:'pose'},{allowEmptyTypedPrefix:true}).map(x=>x.label),
  ['$P[21]'],
  'Typing an indexed prefix should narrow to observed complete indexed values'
);
console.log('ARL 1.0.0 RC indexed system-variable completion tests passed');

// 1.0.0 RC Wizard-driven completion: the original ARL Wizard metadata is the
// authority for variants, parameter types, units, candidates and ordering.
const {
  parseWizardMarkdown,
  getWizardEntry,
  getWizardParamContext,
  buildWizardParameterCandidates,
  getWizardSmartTemplates
} = require('../src/arl-intelligence.cjs');

// 1.0.0 RC7: Wizard candidates are shown only after the user types a
// first character, and every typed prefix (including digits) is strict. This
// avoids a numeric candidate such as 250 stealing Tab after the user typed 22.
const wizardDataRc3 = require('../language-data/arl-wizard.json');
const waittimeRc3 = wizardDataRc3.entries.waittime;
const numericPrefixCandidates = buildWizardParameterCandidates({
  entry: waittimeRc3,
  variantIndex: 0,
  paramIndex: 0,
  variables: [{label:'i123',kind:'variable',type:'double',detail:'variable · double'}],
  lastUsed: ['2.5'],
  prefix: '0.5'
});
assert.deepStrictEqual(numericPrefixCandidates.map(x=>x.label), ['0.5'], 'Numeric prefixes must be strict; typing 0.5 must not keep unrelated variables/recent values visible');

const onePrefixCandidates = buildWizardParameterCandidates({
  entry: waittimeRc3,
  variantIndex: 0,
  paramIndex: 0,
  variables: [{label:'i123',kind:'variable',type:'double',detail:'variable · double'}],
  lastUsed: ['2.5'],
  prefix: '1'
});
assert.deepStrictEqual(onePrefixCandidates.map(x=>x.label), ['1'], 'Typing 1 must only match candidates beginning with 1');

const twoPrefixCandidates = buildWizardParameterCandidates({
  entry: waittimeRc3,
  variantIndex: 0,
  paramIndex: 0,
  variables: [{label:'i123',kind:'variable',type:'double',detail:'variable · double'}],
  lastUsed: ['2.5'],
  prefix: '2'
});
assert(twoPrefixCandidates.every(x=>String(x.label).startsWith('2')), 'Every numeric suggestion must obey the typed numeric prefix');

const waittimeTemplatesRc4 = getWizardSmartTemplates('waittime','instruction',wizardDataRc3,require('../language-data/arl-reference.json'));
assert(waittimeTemplatesRc4.some(x=>x.snippet==='waittime time:${1}'),'Detailed Wizard templates must start with an empty editable placeholder instead of forcing the first documented candidate');

const wizardSample = `# ARL 指令向导文档 v4.5.0
## waituntil
desc: 等待条件成立
desc_en: Wait until condition is true
type: instruction
proto: waituntil cond:, [maxtime:], [timeoutflag:]
params: 1~3

### variant: 基本写法
### variant_en: Basic
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| cond | bool | * |  |  | getdi(1) | 等待条件表达式 | condition |
| maxtime | double |  |  | s | 0.5,1 | 最长等待时间 | max wait |
| timeoutflag | bool |  |  |  |  | 超时标志变量 | timeout flag |

---

## setdo
desc: 设置数字量输出
desc_en: Set digital output
type: function
proto: void setdo(int chan, bool value)
params: 2~3

### variant: 单通道
### variant_en: Single CH
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| chan | int | * |  |  | 1,2,3 | 通道号 | channel |
| val | bool | * | 0,1 |  | 1,0 | 输出值 | value |

### variant: 多通道
### variant_en: Multi CH
| 参数 | 类型 | 必填 | 备选项 | 单位 | 候选项 | 说明 | desc_en |
|---|---|---|---|---|---|---|---|
| from | int | * |  |  | 1 | 起始通道 | from ch |
| to | int | * |  |  | 2 | 结束通道 | to ch |
| val | int | * | 0~4294967295 |  | 1 | 输出值 | value |
`;

const parsedWizard = parseWizardMarkdown(wizardSample);
assert.strictEqual(parsedWizard.waituntil.type, 'instruction');
assert.strictEqual(parsedWizard.waituntil.variants.length, 1);
assert.deepStrictEqual(parsedWizard.waituntil.variants[0].params[0], {
  key:'cond', type:'bool', req:true, opt:false, options:'', unit:'',
  candidates:['getdi(1)'], ph:'cond', desc:'等待条件表达式', desc_en:'condition'
});
assert.strictEqual(parsedWizard.waituntil.variants[0].params[1].unit, 's');
assert.deepStrictEqual(parsedWizard.waituntil.variants[0].params[1].candidates, ['0.5','1']);
assert.strictEqual(parsedWizard.setdo.variants.length, 2);
assert.strictEqual(parsedWizard.setdo.variants[1].name_en, 'Multi CH');
assert.strictEqual(getWizardEntry(parsedWizard, 'WAITUNTIL'), parsedWizard.waituntil);

let wizTemplates = getWizardSmartTemplates('waituntil', 'instruction', parsedWizard, reference);
assert.strictEqual(wizTemplates.length, 2);
assert(wizTemplates.some(x=>x.snippet==='waituntil cond:${1}'), 'Optional instructions should offer a blank required-only Smart form so the candidate list drives input');
assert(wizTemplates.some(x=>x.snippet.includes('maxtime:${2}s')), 'Optional Wizard parameters remain blank/editable in a full Smart form while preserving fixed units');

wizTemplates = getWizardSmartTemplates('setdo', 'function', parsedWizard, reference);
assert.strictEqual(wizTemplates.length, 2, 'Wizard variants must map to separate VS Code Smart completions');
assert.strictEqual(wizTemplates[0].snippet, 'setdo(${1}, ${2})');
assert.strictEqual(wizTemplates[1].snippet, 'setdo(${1}, ${2}, ${3})');

// Parameter context is derived from Wizard metadata for both instruction-style
// named parameters and function-style positional arguments.
let wizCtx = getWizardParamContext('waituntil cond:g', 'waituntil cond:g'.length, parsedWizard, reference, languageData);
assert.strictEqual(wizCtx.expectedType, 'bool');
assert.strictEqual(wizCtx.symbol, 'waituntil');
assert.strictEqual(wizCtx.parameter, 'cond');
assert.strictEqual(wizCtx.paramIndex, 0);
assert.strictEqual(wizCtx.prefix, 'g');

wizCtx = getWizardParamContext('setdo(1, f', 'setdo(1, f'.length, parsedWizard, reference, languageData);
assert.strictEqual(wizCtx.expectedType, 'bool');
assert.strictEqual(wizCtx.symbol, 'setdo');
assert.strictEqual(wizCtx.paramIndex, 1);
assert.strictEqual(wizCtx.prefix, 'f');

const wizardVars = [
  {label:'flagReady',kind:'variable',type:'bool'},
  {label:'flagTimeout',kind:'variable',type:'bool'},
  {label:'maxWait',kind:'variable',type:'double'},
  {label:'count',kind:'variable',type:'int'}
];
let wizCands = buildWizardParameterCandidates({
  entry: parsedWizard.waituntil,
  variantIndex: 0,
  paramIndex: 0,
  variables: wizardVars,
  prefix: ''
});
assert.deepStrictEqual(wizCands.map(x=>x.label).slice(0,3), ['flagReady','flagTimeout','getdi(1)'], 'Normal params prioritize matching declared variables, then Wizard candidates');

wizCands = buildWizardParameterCandidates({
  entry: {type:'instruction',variants:[{params:[{key:'vl',type:'double',req:false,opt:true,options:'',unit:'mm/s',candidates:['250','650'],ph:'vl',desc:'',desc_en:''}]}]},
  variantIndex:0,paramIndex:0,variables:wizardVars,prefix:''
});
assert.deepStrictEqual(wizCands.map(x=>x.label).slice(0,3), ['maxWait','250','650'], 'All Wizard params use the universal order: declared variables, documented candidates, recent values');

wizCands = buildWizardParameterCandidates({
  entry: parsedWizard.waituntil, variantIndex:0, paramIndex:0,
  variables:wizardVars, prefix:'fl'
});
assert.deepStrictEqual(wizCands.map(x=>x.label), ['flagReady','flagTimeout'], 'Typed prefixes are strict and never fall back to unrelated candidates');
wizCands = buildWizardParameterCandidates({
  entry: parsedWizard.waituntil, variantIndex:0, paramIndex:0,
  variables:wizardVars, prefix:'zzz'
});
assert.deepStrictEqual(wizCands, [], 'No strict-prefix match means an empty candidate list');

console.log('ARL 1.0.0 RC Wizard-driven completion tests passed');

// Packaged ARCS 2.6.6 / Manual v4.5.0 Wizard data drives real completions.
const packagedWizard = require('../language-data/arl-wizard.json');
assert.strictEqual(packagedWizard.source.arcsVersion, '2.6.6');
assert.strictEqual(packagedWizard.source.arlReferenceVersion, '4.5.0');
assert(packagedWizard.entries.waituntil?.variants?.length, 'Packaged Wizard data must include waituntil');
assert.strictEqual(packagedWizard.entries.waituntil.variants[0].params[0].type, 'bool');
assert.deepStrictEqual(packagedWizard.entries.waituntil.variants[0].params[0].candidates, ['getdi(1)']);
assert.strictEqual(packagedWizard.entries.setdo.variants.length, 2, 'setdo must retain original Single/Multi channel variants');
assert.strictEqual(packagedWizard.entries.lin.variants[1].params.find(p=>p.key==='vl').unit, 'mm/s');
assert.strictEqual(packagedWizard.entries.ptp.variants[1].params.find(p=>p.key==='vp').unit, '%');

let packagedTemplates = getSmartCompletionTemplates('waituntil','instruction',reference,packagedWizard);
assert.strictEqual(packagedTemplates.length,2);
assert(packagedTemplates.some(x=>x.snippet==='waituntil cond:${1}'));
assert(packagedTemplates.some(x=>x.snippet.includes('maxtime:${2}')));
packagedTemplates = getSmartCompletionTemplates('setdo','function',reference,packagedWizard);
assert.strictEqual(packagedTemplates.length,2);
assert.strictEqual(packagedTemplates[0].snippet,'setdo(${1}, ${2})');

const packagedCtx = getWizardParamContext('waituntil cond:', 'waituntil cond:'.length, packagedWizard, reference, languageData);
assert.strictEqual(packagedCtx.expectedType,'bool');
const boolCandidates = buildWizardParameterCandidates({
  entry:packagedCtx.entry, variantIndex:packagedCtx.variantIndex, paramIndex:packagedCtx.paramIndex,
  variables:[{label:'ready',kind:'variable',type:'bool'},{label:'delay',kind:'variable',type:'double'}], prefix:''
});
assert.deepStrictEqual(boolCandidates.map(x=>x.label).slice(0,2),['ready','getdi(1)']);
console.log('ARL packaged Wizard metadata tests passed');
const { collectNearbyWizardValues } = require('../src/arl-intelligence.cjs');
const nearbyCode = [
  'double maxWait',
  'waituntil cond:getdi(1),maxtime:3,timeoutflag:$B[1]',
  'waituntil cond:getdi(2),maxtime:5,timeoutflag:$B[2]',
  'waituntil cond:'
].join('\n');
const nearbyCtx = getWizardParamContext('waituntil cond:', 'waituntil cond:'.length, packagedWizard, reference, languageData);
assert.deepStrictEqual(collectNearbyWizardValues(nearbyCode,3,nearbyCtx), ['getdi(1)','getdi(2)']);
const ordered = buildWizardParameterCandidates({
  entry:packagedWizard.entries.waituntil,variantIndex:0,paramIndex:0,
  variables:[{label:'ready',kind:'variable',type:'bool'}],lastUsed:['getdi(2)'],prefix:''
});
assert.deepStrictEqual(ordered.map(x=>x.label),['ready','getdi(1)','getdi(2)']);
assert.deepStrictEqual(ordered.map(x=>x.wizardOrder),[0,1,2]);
console.log('ARL Wizard nearby-value and priority-order tests passed');

// Wizard unit metadata is carried with both documented values and compatible
// declared variables so accepting a completion can append fixed ARL units.
const unitCands = buildWizardParameterCandidates({
  entry: packagedWizard.entries.lin,
  variantIndex:1,
  paramIndex:1, // vl
  variables:[{label:'vLinear',kind:'variable',type:'double'}],
  prefix:''
});
assert.strictEqual(unitCands[0].label,'vLinear','Universal Wizard ordering must put declared type-compatible variables before documented values');
assert.strictEqual(unitCands[1].label,'250','Wizard-documented values must follow declared variables');
assert.strictEqual(unitCands[0].wizardUnit,'mm/s');
const vLinearCand=unitCands.find(x=>x.label==='vLinear');
assert(vLinearCand && vLinearCand.wizardUnit==='mm/s','double variables in vl: must retain the fixed mm/s unit');
console.log('ARL Wizard unit-candidate metadata tests passed');

// 1.0.0 RC: Wizard engine must safely fall back to reference proto metadata
// when an exact embedded Wizard variant has not yet been packaged. This keeps
// completion broad without inventing undocumented signatures or candidates.
const syntheticReference = {
  entries: {
    foo: { type:'instruction', desc:'Synthetic instruction', proto:'foo count:<int>, [flag:<bool>]' },
    bar: { type:'function', desc:'Synthetic function', proto:'double bar(double value, bool flag)' }
  }
};
const emptyWizard = { entries:{} };
let syntheticTemplates = getSmartCompletionTemplates('foo','instruction',syntheticReference,emptyWizard);
assert(syntheticTemplates.some(x=>x.snippet==='foo count:${1:count}'), 'Proto-derived instruction should expose a required-only Smart form');
assert(syntheticTemplates.some(x=>x.snippet.includes('flag:${2:flag}')), 'Proto-derived instruction should expose optional params in a full Smart form');

let syntheticCtx = getWizardParamContext('foo count:', 'foo count:'.length, emptyWizard, syntheticReference, languageData);
assert(syntheticCtx, 'Proto-derived instruction should provide parameter context');
assert.strictEqual(syntheticCtx.expectedType,'int');
assert.strictEqual(syntheticCtx.parameter,'count');

syntheticTemplates = getSmartCompletionTemplates('bar','function',syntheticReference,emptyWizard);
assert(syntheticTemplates.some(x=>x.snippet==='bar(${1:value}, ${2:flag})'), 'Proto-derived function should expose positional Smart arguments');
syntheticCtx = getWizardParamContext('bar(1, ', 'bar(1, '.length, emptyWizard, syntheticReference, languageData);
assert(syntheticCtx, 'Proto-derived function should provide positional parameter context');
assert.strictEqual(syntheticCtx.expectedType,'bool');
assert.strictEqual(syntheticCtx.parameter,'flag');

// If neither exact Wizard metadata nor a usable proto exists, do not invent a
// signature merely because a symbol name is present.
assert.deepStrictEqual(getSmartCompletionTemplates('unknownfunc','function',{entries:{}},emptyWizard), []);
console.log('ARL safe proto-fallback Wizard tests passed');

// Source TIPS sometimes encode overloads as `sig1 | sig2`. Proto fallback must
// preserve each overload as its own Smart Completion instead of inventing or
// collapsing the signature.
const overloadReference = { entries: {
  baz: { type:'function', desc:'Synthetic overload', proto:'int baz()  |  double baz(double start, double end)' }
}};
const overloadTemplates = getSmartCompletionTemplates('baz','function',overloadReference,emptyWizard);
assert.strictEqual(overloadTemplates.length,2,'Pipe-separated proto overloads should become separate Smart templates');
assert(overloadTemplates.some(x=>x.snippet==='baz()'));
assert(overloadTemplates.some(x=>x.snippet==='baz(${1:start}, ${2:end})'));
console.log('ARL proto-overload fallback tests passed');

// Proto fallback also needs to understand the compact forms used by the
// original TIPS table: array types, inherited shorthand types, and optional
// bracketed arguments written as `[, arg]`.
const compactProtoReference = { entries: {
  bytesfn: {type:'function', proto:'double bytesfn(byte[] data, int start)'},
  shorthand: {type:'function', proto:'wobj shorthand(joint j1, j2, j3, tool t)'},
  netfn: {type:'function', proto:'netfn(host, port [, timeout])'}
}};
let compactTemplates = getSmartCompletionTemplates('bytesfn','function',compactProtoReference,emptyWizard);
assert(compactTemplates.some(x=>x.snippet==='bytesfn(${1:data}, ${2:start})'),'Array-typed proto args should remain completable');
let compactCtx = getWizardParamContext('bytesfn(', 'bytesfn('.length, emptyWizard, compactProtoReference, languageData);
assert.strictEqual(compactCtx.expectedType,'byte','byte[] should filter against byte declarations');
compactCtx = getWizardParamContext('shorthand(j1, ', 'shorthand(j1, '.length, emptyWizard, compactProtoReference, languageData);
assert.strictEqual(compactCtx.expectedType,'joint','Untyped shorthand args should inherit the preceding explicit type in a proto group');
compactTemplates = getSmartCompletionTemplates('netfn','function',compactProtoReference,emptyWizard);
assert(compactTemplates.some(x=>x.snippet==='netfn(${1:host}, ${2:port})'),'Optional [, arg] syntax should expose a required-only form');
assert(compactTemplates.some(x=>x.snippet==='netfn(${1:host}, ${2:port}, ${3:timeout})'),'Optional [, arg] syntax should expose a full form');
console.log('ARL compact TIPS proto parsing tests passed');

// Real original-editor TIPS prototypes backfill the reference so built-ins that
// do not yet have a packaged detailed Wizard table still get safe Smart
// structure/type completion.
let tipTemplates = getSmartCompletionTemplates('asin','function',reference,packagedWizard);
assert(tipTemplates.some(x=>x.snippet==='asin(${1:x})'),'Math functions from original TIPS should get Smart positional completion');
tipTemplates = getSmartCompletionTemplates('connect','function',reference,packagedWizard);
assert(tipTemplates.some(x=>x.snippet==='connect(${1:host}, ${2:port})'));
assert(tipTemplates.some(x=>x.snippet==='connect(${1:host}, ${2:port}, ${3:timeout})'));
tipTemplates = getSmartCompletionTemplates('rand','function',reference,packagedWizard);
assert(tipTemplates.some(x=>x.snippet==='rand()'));
assert(tipTemplates.some(x=>x.snippet==='rand(${1:start}, ${2:end})'));
tipTemplates = getSmartCompletionTemplates('clkread','function',reference,packagedWizard);
assert(tipTemplates.some(x=>x.snippet==='clkread(${1:c})'));
let tipCtx = getWizardParamContext('clkread(', 'clkread('.length, packagedWizard, reference, languageData);
assert.strictEqual(tipCtx.expectedType,'clock');
tipCtx = getWizardParamContext('getwobj_indi(j1, j2, ', 'getwobj_indi(j1, j2, '.length, packagedWizard, reference, languageData);
assert.strictEqual(tipCtx.expectedType,'joint','Original shorthand joint j1,j2,j3 proto must keep joint type through the group');
const saveSvCtx=getWizardParamContext('savesv(', 'savesv('.length, packagedWizard, reference, languageData);
const saveSvCandidates=buildWizardParameterCandidates({
  entry:saveSvCtx.entry,variantIndex:saveSvCtx.variantIndex,paramIndex:saveSvCtx.paramIndex,
  variables:[{label:'someString',kind:'variable',type:'string'}],prefix:''
});
assert.deepStrictEqual(saveSvCandidates.map(x=>x.label),['"I"','"D"','"B"','"P"','"J"','"S"'],'savesv must preserve original MD-only candidate rule');
console.log('ARL original TIPS broad-coverage tests passed');

// Every built-in function listed by the original ARL editor now has a Smart
// structure source: exact Wizard variants where available, otherwise the exact
// original TIPS proto. Unknown signatures are never fabricated.
for(const fnName of languageData.categories.functions){
  const templates=getSmartCompletionTemplates(fnName,'function',reference,packagedWizard);
  assert(templates.length>0,`Built-in function ${fnName} should have at least one source-driven Smart template`);
}
console.log('ARL built-in function Smart coverage tests passed');

const assert=require('assert');
const intelligence=require('../src/arl-intelligence.cjs');
const languageData=require('../language-data/arl-language.json');
const wizard=require('../language-data/arl-wizard.json');
const reference={entries:{
  waittime:{type:'instruction',desc:'等待指定时间',proto:'waittime time:<double>'},
  waituntil:{type:'instruction',desc:'等待条件成立',proto:'waituntil cond:, [maxtime:], [timeoutflag:]'},
  offset:{type:'function',desc:'位姿偏移',proto:'pose offset(pose p, double dx, double dy, double dz, double rz, double ry, double rx)'},
  abs:{type:'function',desc:'绝对值',proto:'double abs(double x)'}
}};

assert.deepStrictEqual(intelligence.getCompletionPrefix('waittime time:22',16),{text:'22',start:14,end:16});
assert.strictEqual(intelligence.getWizardParamContext('waittime time:',14,wizard,reference,languageData).prefix,'');
let ctx=intelligence.getWizardParamContext('waittime time:i',15,wizard,reference,languageData);
assert.strictEqual(ctx.expectedType,'double');
assert.strictEqual(ctx.prefix,'i');
let c=intelligence.buildWizardParameterCandidates({entry:ctx.entry,variantIndex:ctx.variantIndex,paramIndex:ctx.paramIndex,variables:[{label:'i123',kind:'variable',type:'double'},{label:'bb',kind:'variable',type:'bool'}],lastUsed:['3'],prefix:'i'});
assert.deepStrictEqual(c.map(x=>x.label),['i123']);
ctx=intelligence.getWizardParamContext('waittime time:2',15,wizard,reference,languageData);
c=intelligence.buildWizardParameterCandidates({entry:ctx.entry,variantIndex:ctx.variantIndex,paramIndex:ctx.paramIndex,variables:[{label:'i123',kind:'variable',type:'double'}],lastUsed:['2.1','3'],prefix:'2'});
assert(c.every(x=>String(x.label).startsWith('2')));
assert(c.some(x=>x.label==='2.1'));
assert(!c.some(x=>x.label==='i123'));

const linTemplates=intelligence.getSmartCompletionTemplates('lin','instruction',reference,wizard).map(x=>x.snippet);
assert(linTemplates.includes('lin p:${1},vl:${2}mm/s,sl:${3}mm,t:${4},w:${5}'));
const waitTemplates=intelligence.getSmartCompletionTemplates('waittime','instruction',reference,wizard).map(x=>x.snippet);
assert(waitTemplates.includes('waittime time:${1}'));
const offsetTemplates=intelligence.getSmartCompletionTemplates('offset','function',reference,wizard).map(x=>x.snippet);
assert(offsetTemplates.some(x=>x==='offset(${1},${2},${3},${4})'));
const absTemplates=intelligence.getSmartCompletionTemplates('abs','function',reference,wizard).map(x=>x.snippet);
assert(absTemplates.some(x=>x==='abs(${1})'));

const nearby=['waittime time:1','waittime time:3','waittime time:i'].join('\n');
ctx=intelligence.getWizardParamContext('waittime time:i',15,wizard,reference,languageData);
assert.deepStrictEqual(intelligence.collectNearbyWizardValues(nearby,2,ctx),['1','3']);

assert.deepStrictEqual(intelligence.collectIndexedSystemVariableUsages('ptp p:$P[21]\nptp p:$P[21]\nptp p:$P[3]','pose').map(x=>x.label),['$P[21]','$P[3]']);
console.log('ARL RC7 first-character Smart Completion tests passed');

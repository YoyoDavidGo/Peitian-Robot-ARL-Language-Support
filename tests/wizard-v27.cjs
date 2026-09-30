const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const {parseWizardMarkdown,getSmartCompletionTemplates,collectWeightRanges,inferSystemVariableType,isIndexedSystemVariable,getWizardHoverParameters}=require('../src/arl-intelligence.cjs');
const wizard=require('../language-data/arl-wizard.json');
const reference=require('../language-data/arl-reference.json');
const language=require('../language-data/arl-language.json');
const source=fs.readFileSync(require.resolve('../language-data/ARL_Wizard.source.md'),'utf8').replace(/\r\n/g,'\n');
assert.equal(Object.keys(wizard.entries).length,331);
assert.equal(wizard.source.schemaVersion,'2.7');
assert.equal(wizard.source.sha256,crypto.createHash('sha256').update(source).digest('hex'));
assert.deepEqual(parseWizardMarkdown(source),wizard.entries);
assert.deepEqual(reference,wizard);
assert.equal(wizard.entries.return.type,'logic');
assert.equal(wizard.entries.void.type,'datatype');
assert.equal(wizard.entries.pi.type,'builtin.constant');
assert.equal(wizard.entries.palletcompen.type,'function');
assert(language.categories.functions.includes('geterror'));
assert.equal(wizard.entries.$base.type,'sysvar');
assert.equal(wizard.entries.$base.array_length,3);
assert.equal(inferSystemVariableType('$BASE'), 'wobj');
assert(isIndexedSystemVariable('$BASE',reference));
assert.equal(inferSystemVariableType('$CHAN_ESTOP_STATE_DO'),'int');
assert(!isIndexedSystemVariable('$CHAN_ESTOP_STATE_DO',reference));
assert.equal(wizard.entries.lin.variants[0].params.find(param=>param.key==='dura').hiddenDefault,true);
assert(wizard.entries.lin.wizard.some(preset=>preset.selectedKeys.includes('vl')));
for(const entry of Object.values(wizard.entries).filter(entry=>entry.type==='instruction.motion')){
  const templates=getSmartCompletionTemplates(entry.name,'instruction',reference,wizard);
  assert(templates.length>=2,entry.name);
  for(const template of templates){
    const keys=[...template.snippet.matchAll(/\b([A-Za-z_]+):/g)].map(match=>match[1]);
    const variant=entry.variants[template.wizardVariantIndex];
    for(const group of variant.choiceGroups||[]) assert(keys.filter(key=>group.includes(key)).length<=1,`${entry.name}: ${group}`);
    assert(!keys.includes('dura'),'Hidden trajectory duration must not be inserted by default');
  }
}
assert(wizard.entries.trigger.variants.some(variant=>variant.syntax==='parallel'));
assert(getSmartCompletionTemplates('trigger','instruction',reference,wizard).every(template=>!template.variantName.includes('并行')));
assert.equal(wizard.entries.tostr.variants[1].params[1].desc,'有效数字位数，默认6');
assert.equal(wizard.entries.rand.variants[0].signature,'int rand()');
assert(wizard.entries.pose.members.length>0);
assert(wizard.entries.trigger.notes.length>0);
assert(getWizardHoverParameters('lin',wizard,reference,language).find(param=>param.key==='vp').options.includes('100'));

const mixed='print "程序完成! English"\n你好是的 是的\n// 中文注释\n/* 中文块注释 */\nabc变量名';
const ranges=collectWeightRanges(mixed,language);
for(let index=0;index<mixed.length;index++){
  if(mixed.charCodeAt(index)<=127) continue;
  assert(ranges.heavy.some(range=>index>=range.start && index<range.end),`Chinese glyph ${mixed[index]} must use normal weight everywhere`);
  assert(!ranges.base.some(range=>index>=range.start && index<range.end));
}
const english=mixed.indexOf('English');
assert(ranges.base.some(range=>english>=range.start && english<range.end),'Latin string text must retain the existing font profile');
console.log('ARL Wizard V2.7 source, presets, semantic types and CJK weight tests passed');

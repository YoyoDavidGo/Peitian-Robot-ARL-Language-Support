const assert = require('assert');
const { parseFunctions, findFunction, parseFunctionReference, lookupHoverEntry, parseVariables, buildCompletionCandidates, getSignatureContext, getFontWeightProfile, collectWeightRanges, getCompletionPrefix, getTypedCompletionContext, filterTypedCompletionCandidates, collectVisibleVariables } = require('../src/arl-intelligence.cjs');

const code=['func pose singleModle(int is,int grab)','    return p1','endfunc','','func void main()','    singleModle(1,0)','    def::point_offset()','endfunc'].join('\n');
const functions=parseFunctions(code);
assert.deepStrictEqual(functions.map(fn=>({name:fn.name,returnType:fn.returnType,params:fn.params,startLine:fn.startLine,endLine:fn.endLine})),[{name:'singleModle',returnType:'pose',params:'int is,int grab',startLine:0,endLine:2},{name:'main',returnType:'void',params:'',startLine:4,endLine:7}]);
const sameFile=findFunction(code,'SINGLEmodle'); assert(sameFile); assert.strictEqual(sameFile.startLine,0);
assert.deepStrictEqual(parseFunctionReference('    singleModle(1,0)',8),{file:null,name:'singleModle',start:4,end:15});
assert.deepStrictEqual(parseFunctionReference('    def::point_offset()',10),{file:'def',name:'point_offset',start:4,end:21});
assert.strictEqual(parseFunctionReference('    MoveJ p:p1',7),null);
const docs={entries:{waittime:{type:'instruction',desc:'等待指定秒数',proto:'waittime time:<double>'}}};
assert.deepStrictEqual(lookupHoverEntry('WAITTIME',docs),docs.entries.waittime); assert.strictEqual(lookupHoverEntry('unknown',docs),null);

const completionCode=['speed vFast={ per 80 }','pose pHome','func pose calcOffset(pose src, double dx)','    int localCount=0, retry=1','    return offset(src,dx,0,0,0,0,0)','endfunc'].join('\n');
const vars=parseVariables(completionCode); assert(vars.some(v=>v.name==='vFast'&&v.type==='speed')); assert(vars.some(v=>v.name==='src'&&v.type==='pose'&&v.kind==='parameter')); assert(vars.some(v=>v.name==='localCount'&&v.type==='int'));
const languageData=require('../language-data/arl-language.json'); const completions=buildCompletionCandidates(completionCode,languageData); for(const label of ['ptp','offset','setdo','calcOffset','vFast','pHome','localCount']) assert(completions.some(c=>c.label===label),`Missing completion: ${label}`);
const reference=require('../language-data/arl-reference.json');
let sigText='func void main()\n    offset(pHome,10,20,\nendfunc'; let sig=getSignatureContext(sigText,sigText.indexOf('\nendfunc'),reference,languageData); assert(sig&&sig.label.includes('offset(')); assert.strictEqual(sig.activeParameter,3);
sigText='func pose calcOffset(pose src, double dx)\n    return src\nendfunc\nfunc void main()\n    calcOffset(pHome,\nendfunc'; sig=getSignatureContext(sigText,sigText.indexOf('\nendfunc',sigText.indexOf('func void main')),reference,languageData); assert(sig&&sig.label.includes('func pose calcOffset'));
assert.deepStrictEqual(getFontWeightProfile("'JetBrains Mono', Consolas"),{base:'200',mid:'350',heavy:'400',family:'jetbrains-mono'}); assert.deepStrictEqual(getFontWeightProfile("'Cascadia Code', Consolas"),{base:'300',mid:'350',heavy:'400',family:'cascadia-code'});
const weightCode='func void main() // comment\n    ptp p:offset(p1,0,0,0)\nendfunc'; const weights=collectWeightRanges(weightCode,languageData); const heavyTexts=weights.heavy.map(r=>weightCode.slice(r.start,r.end)); for(const token of ['func','void','ptp','endfunc','// comment']) assert(heavyTexts.includes(token));
const blockWeightCode='func void main() /* block comment\ncontinues here */\nendfunc'; const blockWeights=collectWeightRanges(blockWeightCode,languageData); assert(blockWeights.heavy.map(r=>blockWeightCode.slice(r.start,r.end)).includes('/* block comment\ncontinues here */'));
assert.deepStrictEqual(getCompletionPrefix('$',1),{text:'$',start:0,end:1}); assert.deepStrictEqual(getCompletionPrefix('$AT_',4),{text:'$AT_',start:0,end:4}); assert.deepStrictEqual(getCompletionPrefix('    off',7),{text:'off',start:4,end:7});
const hoverRef063=require('../language-data/arl-reference.json'); for(const group of ['logic','keywords','datatypes']) for(const token of languageData.categories[group]||[]){ const entry=hoverRef063.entries[String(token).toLowerCase()]; assert(entry&&entry.desc&&entry.type,`Missing detailed Hover entry: ${token}`); }
assert.strictEqual(hoverRef063.entries.if.desc,'条件判断，满足时执行块内代码'); assert.strictEqual(hoverRef063.entries.pose.desc,'位姿类型（位置+姿态）');
assert.deepStrictEqual(getTypedCompletionContext('',0,reference,languageData),{mode:'free',prefix:'',expectedType:null,instruction:null,parameter:null});
let typedCtx=getTypedCompletionContext('ptp p:','ptp p:'.length,reference,languageData); assert.strictEqual(typedCtx.mode,'typed'); assert.strictEqual(typedCtx.expectedType,'pose'); assert.strictEqual(typedCtx.prefix,'');
typedCtx=getTypedCompletionContext('ptp p:p','ptp p:p'.length,reference,languageData); assert.strictEqual(typedCtx.prefix,'p'); assert.strictEqual(typedCtx.expectedType,'pose');
assert.strictEqual(getTypedCompletionContext('movej j:j','movej j:j'.length,reference,languageData).expectedType,'joint'); assert.strictEqual(getTypedCompletionContext('ptp v:v','ptp v:v'.length,reference,languageData).expectedType,'speed');
const typedCode=['pose pGlobal','joint jGlobal','speed vGlobal','func void helper()','    pose pOtherLocal','endfunc','func void main(pose pArg)','    pose pLocal','    joint jLocal','    ptp p:p','endfunc'].join('\n'); const visibleAtPtp=collectVisibleVariables(typedCode,9,languageData); assert(visibleAtPtp.some(v=>v.name==='pGlobal')); assert(visibleAtPtp.some(v=>v.name==='pArg')); assert(visibleAtPtp.some(v=>v.name==='pLocal')); assert(!visibleAtPtp.some(v=>v.name==='pOtherLocal'));
const typedCandidates=[...visibleAtPtp.map(v=>({label:v.name,kind:'variable',type:v.type})),{label:'jGlobal',kind:'variable',type:'joint'},{label:'ptp',kind:'instruction'},{label:'pose',kind:'datatype'},{label:'$P',kind:'system-variable',type:'pose'},{label:'$D',kind:'system-variable',type:'double'}];
assert.deepStrictEqual(filterTypedCompletionCandidates(typedCandidates,{mode:'typed',prefix:'$',expectedType:'pose'}).map(x=>x.label),['$P']); assert.deepStrictEqual(filterTypedCompletionCandidates(typedCandidates,{mode:'free',prefix:'',expectedType:null}),[]);
console.log('ARL intelligence/completion/font-weight tests passed');

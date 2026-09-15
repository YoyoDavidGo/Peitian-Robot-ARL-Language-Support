'use strict';

const defaultLanguageData = require('../language-data/arl-language.json');
const defaultWizardData = require('../language-data/arl-wizard.json');

const FUNC_DEF_RE = /^\s*func\s+([A-Za-z_][A-Za-z0-9_]*)\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)/i;
const CALL_RE = /(?:(?<file>[A-Za-z_][A-Za-z0-9_]*)::)?(?<name>[A-Za-z_][A-Za-z0-9_]*)\s*\(/g;

function splitTopLevel(text, separator=',') {
  const out=[]; let start=0,par=0,sq=0,br=0,quote=null,esc=false;
  for(let i=0;i<String(text||'').length;i++){
    const ch=text[i];
    if(quote){ if(esc){esc=false;continue;} if(ch==='\\'){esc=true;continue;} if(ch===quote) quote=null; continue; }
    if(ch==='"'||ch==="'"){quote=ch;continue;}
    if(ch==='(') par++; else if(ch===')') par=Math.max(0,par-1);
    else if(ch==='[') sq++; else if(ch===']') sq=Math.max(0,sq-1);
    else if(ch==='{') br++; else if(ch==='}') br=Math.max(0,br-1);
    else if(ch===separator && !par && !sq && !br){out.push(text.slice(start,i).trim());start=i+1;}
  }
  out.push(String(text||'').slice(start).trim());
  return out.filter(Boolean);
}

function parseFunctions(text){
  const lines=String(text||'').split(/\r?\n/), out=[]; let current=null;
  for(let line=0;line<lines.length;line++){
    const raw=lines[line], m=FUNC_DEF_RE.exec(raw);
    if(m){
      const name=m[2], nameStart=raw.toLowerCase().indexOf(name.toLowerCase(),m.index);
      current={name,returnType:m[1],params:m[3].trim(),signature:raw.trim(),startLine:line,endLine:line,nameStart,nameEnd:nameStart+name.length};
      out.push(current); continue;
    }
    if(/^\s*endfunc\b/i.test(raw) && current){current.endLine=line;current=null;}
  }
  if(current) current.endLine=Math.max(current.startLine,lines.length-1);
  return out;
}
function findFunction(text,name){const q=String(name||'').toLowerCase();return parseFunctions(text).find(x=>x.name.toLowerCase()===q)||null;}
function parseFunctionReference(lineText,character){
  const line=String(lineText||''),cursor=Math.max(0,Number(character)||0); CALL_RE.lastIndex=0; let m;
  while((m=CALL_RE.exec(line))){
    const full=m[0],op=full.lastIndexOf('('),token=full.slice(0,op).trimEnd(),start=m.index,end=start+token.length;
    if(cursor<start||cursor>end) continue;
    if(/^\s*func\b/i.test(line.slice(0,start))) return null;
    return {file:m.groups?.file||null,name:m.groups?.name||'',start,end};
  }
  return null;
}
function lookupHoverEntry(word,reference){return reference?.entries?.[String(word||'').toLowerCase()]||null;}

function datatypeSet(languageData=defaultLanguageData){return new Set([...(languageData.categories?.datatypes||[]),'void'].map(x=>String(x).toLowerCase()));}
function parseParamDecl(param){const m=String(param||'').trim().match(/^(?:const\s+)?([A-Za-z_][A-Za-z0-9_]*)\s+([A-Za-z_][A-Za-z0-9_]*)/i);return m?{type:m[1],name:m[2]}:null;}
function parseVariables(text,languageData=defaultLanguageData){
  const lines=String(text||'').split(/\r?\n/),types=datatypeSet(languageData),vars=[]; let currentFn='';
  for(let line=0;line<lines.length;line++){
    const raw=lines[line], fm=FUNC_DEF_RE.exec(raw);
    if(fm){currentFn=fm[2];for(const p of splitTopLevel(fm[3])){const d=parseParamDecl(p);if(d&&types.has(d.type.toLowerCase())) vars.push({name:d.name,type:d.type.toLowerCase(),scope:currentFn,kind:'parameter',line});}continue;}
    if(/^\s*endfunc\b/i.test(raw)){currentFn='';continue;}
    const noComment=raw.replace(/\/\/.*$/,''),dm=noComment.match(/^\s*(?:const\s+)?([A-Za-z_][A-Za-z0-9_]*)\s+(.+)$/i);
    if(!dm||!types.has(dm[1].toLowerCase())||dm[1].toLowerCase()==='void') continue;
    const type=dm[1].toLowerCase();
    for(const part of splitTopLevel(dm[2])){const nm=part.match(/^([A-Za-z_][A-Za-z0-9_]*)/);if(nm)vars.push({name:nm[1],type,scope:currentFn||'global',kind:'variable',line});}
  }
  const seen=new Set(); return vars.filter(v=>{const k=`${v.scope.toLowerCase()}\0${v.name.toLowerCase()}`;if(seen.has(k))return false;seen.add(k);return true;});
}
function collectVisibleVariables(text,lineNumber,languageData=defaultLanguageData){
  const line=Math.max(0,Number(lineNumber)||0),vars=parseVariables(text,languageData),fn=parseFunctions(text).find(f=>line>=f.startLine&&line<=f.endLine)||null;
  return vars.filter(v=>v.scope==='global'?v.line<=line:!!fn&&v.scope.toLowerCase()===fn.name.toLowerCase()&&v.line<=line);
}

const SYSTEM_VARIABLE_TYPE_HINTS=Object.freeze({
  '$i':'int','$s':'string','$b':'bool','$d':'double','$p':'pose','$j':'joint','$tools':'tool','$wobjs':'wobj','$world':'wobj','$flange':'tool','$base':'frame',
  '$dfspeed':'speed','$dfslip':'slip','$dftool':'tool','$dfwobj':'wobj','$cjoint':'joint','$pi':'double'
});
const INDEXED_SYSTEM_VARIABLES=new Set(['$i','$s','$b','$d','$p','$j','$tools','$wobjs']);
function inferSystemVariableType(label){return SYSTEM_VARIABLE_TYPE_HINTS[String(label||'').toLowerCase()]||null;}
function isIndexedSystemVariable(label){return INDEXED_SYSTEM_VARIABLES.has(String(label||'').toLowerCase());}

function buildCompletionCandidates(text,languageData=defaultLanguageData){
  const out=[],seen=new Set(),add=item=>{const k=String(item.label||'').toLowerCase();if(!k||seen.has(k))return;seen.add(k);out.push(item);};
  for(const v of parseVariables(text,languageData)) add({label:v.name,kind:'variable',type:v.type,detail:`${v.kind} · ${v.type}`});
  for(const fn of parseFunctions(text)) add({label:fn.name,kind:'user-function',type:fn.returnType,detail:fn.signature});
  const groups=[['instructions','instruction'],['functions','function'],['parenOnlyFunctions','function'],['logic','keyword'],['keywords','keyword'],['datatypes','datatype'],['systemVariables','system-variable']];
  for(const [group,kind] of groups) for(const label of languageData.categories?.[group]||[]) add({label,kind,type:kind==='system-variable'?inferSystemVariableType(label):undefined,detail:`PEITIAN ARL ${kind}`});
  return out;
}

function findInnermostOpenParen(prefix){
  let depth=0,quote=null,esc=false; for(let i=String(prefix||'').length-1;i>=0;i--){const ch=prefix[i];if(quote){if(esc){esc=false;continue;}if(ch==='\\'){esc=true;continue;}if(ch===quote)quote=null;continue;}if(ch==='"'||ch==="'"){quote=ch;continue;}if(ch===')')depth++;else if(ch==='('){if(depth===0)return i;depth--;}}return-1;
}
function countTopLevelCommas(text){
  let count=0,par=0,sq=0,br=0,quote=null,esc=false;
  for(const ch of String(text||'')){
    if(quote){if(esc){esc=false;continue;}if(ch==='\\'){esc=true;continue;}if(ch===quote)quote=null;continue;}
    if(ch==='"'||ch==="'"){quote=ch;continue;}
    if(ch==='(')par++;else if(ch===')')par=Math.max(0,par-1);else if(ch==='[')sq++;else if(ch===']')sq=Math.max(0,sq-1);else if(ch==='{')br++;else if(ch==='}')br=Math.max(0,br-1);else if(ch===','&&!par&&!sq&&!br)count++;
  }
  return count;
}
function parametersFromProto(proto,name){
  const p=String(proto||'').trim(),open=p.indexOf('('),close=p.lastIndexOf(')'); if(open>=0&&close>open)return splitTopLevel(p.slice(open+1,close));
  const re=new RegExp(`^\\s*${String(name||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`,'i'); return splitTopLevel(p.replace(re,'').trim());
}
function getSignatureContext(text,offset,reference,languageData=defaultLanguageData){
  const source=String(text||''),pos=Math.max(0,Math.min(Number(offset)||0,source.length)),lineStart=source.lastIndexOf('\n',pos-1)+1,lineEndRaw=source.indexOf('\n',pos),lineEnd=lineEndRaw<0?source.length:lineEndRaw,line=source.slice(lineStart,lineEnd),rel=pos-lineStart,prefix=line.slice(0,rel),functions=parseFunctions(source);
  const open=findInnermostOpenParen(prefix);
  if(open>=0){const before=prefix.slice(0,open),m=before.match(/(?:(?:[A-Za-z_][A-Za-z0-9_]*)::)?([A-Za-z_][A-Za-z0-9_]*)\s*$/);if(m){const name=m[1],local=functions.find(fn=>fn.name.toLowerCase()===name.toLowerCase()),active=countTopLevelCommas(prefix.slice(open+1));if(local){const params=splitTopLevel(local.params);return{name:local.name,label:local.signature,parameters:params,activeParameter:Math.min(active,Math.max(0,params.length-1)),documentation:'ARL user function',kind:'user-function'};}const entry=lookupHoverEntry(name,reference),known=(languageData.categories?.functions||[]).concat(languageData.categories?.parenOnlyFunctions||[]).some(x=>String(x).toLowerCase()===name.toLowerCase());if(entry||known){const label=entry?.proto||`${name}(...)`,params=entry?.proto?parametersFromProto(entry.proto,name):[];return{name,label,parameters:params,activeParameter:params.length?Math.min(active,params.length-1):0,documentation:entry?.desc||'PEITIAN ARL built-in function',kind:'function'};}}}
  const im=line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\b/);if(im){const name=im[1],isInstruction=(languageData.categories?.instructions||[]).some(x=>String(x).toLowerCase()===name.toLowerCase());if(isInstruction&&rel>=im.index+im[0].length){const entry=lookupHoverEntry(name,reference),params=entry?.proto?parametersFromProto(entry.proto,name):[],active=countTopLevelCommas(line.slice(im[0].length,rel));return{name,label:entry?.proto||name,parameters:params,activeParameter:params.length?Math.min(active,params.length-1):0,documentation:entry?.desc||'PEITIAN ARL instruction',kind:'instruction'};}}
  return null;
}

function getCompletionPrefix(lineText,character){
  const line=String(lineText||''),end=Math.max(0,Math.min(Number(character)||0,line.length)),before=line.slice(0,end);
  const m=before.match(/(?:\$[A-Za-z_][A-Za-z0-9_]*(?:\[[A-Za-z0-9_]*\]?)?|\$|[A-Za-z_][A-Za-z0-9_]*|[-+]?(?:\d+(?:\.\d*)?|\.\d+))$/);
  return m?{text:m[0],start:end-m[0].length,end}:{text:'',start:end,end};
}

const INSTRUCTION_PARAM_TYPE_HINTS=Object.freeze({p:'pose',m:'pose',j:'joint',v:'speed',s:'slip',t:'tool',w:'wobj',cond:'bool',when:'bool',timeoutflag:'bool',vp:'double',vl:'double',sp:'double',sl:'double',dura:'double',maxtime:'double',time:'double'});
function instructionParamType(instruction,parameter,reference){
  const name=String(instruction||'').toLowerCase(),key=String(parameter||'').toLowerCase(),proto=reference?.entries?.[name]?.proto||'';
  if(proto){const m=String(proto).match(new RegExp(`(?:^|[\\s,\\[])${key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\s*:\\s*<([A-Za-z_][A-Za-z0-9_]*)>`,'i'));if(m)return m[1].toLowerCase();}
  return INSTRUCTION_PARAM_TYPE_HINTS[key]||null;
}
function getTypedCompletionContext(lineText,character,reference,languageData=defaultLanguageData){
  const line=String(lineText||''),end=Math.max(0,Math.min(Number(character)||0,line.length)),prefixInfo=getCompletionPrefix(line,end),base={mode:'free',prefix:prefixInfo.text,expectedType:null,instruction:null,parameter:null},before=line.slice(0,prefixInfo.start),im=line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\b/);
  if(!im)return base;const instruction=im[1].toLowerCase();if(!(languageData.categories?.instructions||[]).some(x=>String(x).toLowerCase()===instruction))return base;const pm=before.match(/(?:^|[\s,])([A-Za-z_][A-Za-z0-9_]*)\s*:\s*$/);if(!pm)return base;const parameter=pm[1].toLowerCase(),expectedType=instructionParamType(instruction,parameter,reference);return expectedType?{mode:'typed',prefix:prefixInfo.text,expectedType,instruction,parameter}:base;
}
function filterTypedCompletionCandidates(candidates,context){
  const prefix=String(context?.prefix||'');if(!prefix)return[];const q=prefix.toLowerCase();let out=(candidates||[]).filter(i=>String(i.label||'').toLowerCase().startsWith(q));if(context?.mode==='typed'&&context.expectedType){const e=String(context.expectedType).toLowerCase();out=out.filter(i=>(i.kind==='variable'||i.kind==='system-variable')&&String(i.type||'').toLowerCase()===e);}return out;
}

function wizardTypeMatches(expected,actual){
  const e=String(expected||'any').toLowerCase().replace(/&/g,'').replace(/\[\]/g,'').trim(),a=String(actual||'').toLowerCase().replace(/&/g,'').replace(/\[\]/g,'').trim();
  if(!e||e==='any')return true;if(e===a)return true;if(e==='int')return['int','uint','byte'].includes(a);if(e==='pose'||e==='frame')return['pose','frame'].includes(a);return false;
}
function getWizardEntry(wizard,name){return wizard?.entries?.[String(name||'').toLowerCase()]||null;}
function normalizeWizardParam(p){return{key:p.key||p.name||'',type:String(p.type||'any').toLowerCase(),required:!!(p.required||p.req),unit:p.unit||'',candidates:Array.isArray(p.candidates)?p.candidates:[]};}
function parseProtoParam(raw,inherited=''){
  const optional=/^\[.*\]$/.test(raw.trim()),t=raw.trim().replace(/^\[|\]$/g,'').trim().replace(/^const\s+/i,''),m=t.match(/^([A-Za-z_][A-Za-z0-9_]*)(?:\[\])?\s*&?\s*([A-Za-z_][A-Za-z0-9_]*)$/);if(m)return{param:{key:m[2],type:m[1].toLowerCase(),required:!optional,unit:'',candidates:[]},inherited:m[1].toLowerCase()};const u=t.match(/^&?([A-Za-z_][A-Za-z0-9_]*)$/);return u?{param:{key:u[1],type:inherited||'any',required:!optional,unit:'',candidates:[]},inherited}:null;
}
function synthesizeWizardEntryFromProto(name,kind,reference){
  const key=String(name||'').toLowerCase(),entry=lookupHoverEntry(key,reference),proto=String(entry?.proto||'').trim();if(!proto)return null;
  if(kind==='function'||entry?.type==='function'||proto.includes(`${key}(`)){
    const variants=[];for(const alt of proto.split(/\s+\|\s+/)){const m=alt.match(new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\s*\\((.*)\\)\\s*$`,'i'));if(!m)continue;let inherited='';const params=[];for(const raw of splitTopLevel(m[1].replace(/\[\s*,\s*/g,', ['))){const pp=parseProtoParam(raw,inherited);if(!pp){params.length=0;break;}params.push(pp.param);if(pp.inherited)inherited=pp.inherited;}variants.push({name:variants.length?'Overload':'Basic',params});}return variants.length?{type:'function',synthetic:true,proto,variants}:null;
  }
  return null;
}
function resolveWizardEntry(wizard,name,reference,kind){return getWizardEntry(wizard,name)||synthesizeWizardEntryFromProto(name,kind,reference);}
function getWizardParamContext(lineText,character,wizard=defaultWizardData,reference,languageData=defaultLanguageData){
  const line=String(lineText||''),end=Math.max(0,Math.min(Number(character)||0,line.length)),prefix=getCompletionPrefix(line,end),before=line.slice(0,prefix.start);
  const open=findInnermostOpenParen(before);if(open>=0){const m=before.slice(0,open).match(/(?:(?:[A-Za-z_][A-Za-z0-9_]*)::)?([A-Za-z_][A-Za-z0-9_]*)\s*$/);if(m){const symbol=m[1].toLowerCase(),entry=resolveWizardEntry(wizard,symbol,reference,'function');if(entry){const idx=countTopLevelCommas(before.slice(open+1)),variant=(entry.variants||[]).find(v=>v.params?.[idx])||entry.variants?.[0],param=variant?.params?.[idx];if(param)return{mode:'wizard',prefix:prefix.text,expectedType:param.type,symbol,parameter:param.key,paramIndex:idx,variantIndex:entry.variants.indexOf(variant),entry};}}}
  const im=line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\b/);if(!im)return null;const symbol=im[1].toLowerCase(),entry=resolveWizardEntry(wizard,symbol,reference,'instruction');if(!entry)return null;const pm=before.match(/(?:^|[\s,])([A-Za-z_][A-Za-z0-9_]*)\s*:\s*$/);if(!pm)return null;for(let vi=0;vi<(entry.variants||[]).length;vi++){const pi=(entry.variants[vi].params||[]).findIndex(p=>String(p.key).toLowerCase()===pm[1].toLowerCase());if(pi>=0){const p=entry.variants[vi].params[pi];return{mode:'wizard',prefix:prefix.text,expectedType:p.type,symbol,parameter:p.key,paramIndex:pi,variantIndex:vi,entry};}}return null;
}
function stripUnit(v,p){const raw=String(v||'').trim(),unit=String(p?.unit||'');return unit&&raw.endsWith(unit)?raw.slice(0,-unit.length).trim():raw;}
function collectNearbyWizardValues(text,lineNumber,context,radius=12){
  const lines=String(text||'').split(/\r?\n/),line=Math.max(0,Number(lineNumber)||0),entry=context?.entry,variant=entry?.variants?.[context?.variantIndex||0],param=variant?.params?.[context?.paramIndex||0],found=[],seen=new Set(),add=v=>{const x=stripUnit(v,param);if(x&&!seen.has(x.toLowerCase())){seen.add(x.toLowerCase());found.push(x);}};
  const lo=Math.max(0,line-radius),hi=Math.min(lines.length-1,line+radius),symbol=String(context?.symbol||'').toLowerCase();
  for(let i=lo;i<=hi;i++){if(i===line)continue;const raw=lines[i].replace(/\/\/.*$/,'').trim();if(!raw)continue;if(entry?.type==='function'){const m=raw.match(new RegExp(`\\b${symbol}\\s*\\((.*)\\)`,'i'));if(m){const args=splitTopLevel(m[1]);if(args[context.paramIndex]!=null)add(args[context.paramIndex]);}}else{const m=raw.match(new RegExp(`^${symbol}\\b(.*)$`,'i'));if(m){for(const part of splitTopLevel(m[1])){const kv=part.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/);if(kv&&kv[1].toLowerCase()===String(context.parameter).toLowerCase())add(kv[2]);}}}}
  return found;
}
function buildWizardParameterCandidates({entry,variantIndex=0,paramIndex=0,variables=[],userFunctions=[],lastUsed=[],prefix=''}){
  const variant=entry?.variants?.[variantIndex],param=normalizeWizardParam(variant?.params?.[paramIndex]||{});if(!param.key)return[];const vars=[],docs=[],recent=[],seen=new Set(),add=(arr,item)=>{const obj=typeof item==='string'?{label:item,kind:'wizard-value',type:param.type,detail:`Wizard candidate · ${param.type}`}:{...item};const k=String(obj.label||'').toLowerCase();if(!k||seen.has(k))return;seen.add(k);arr.push(obj);};
  if(param.type==='function'){for(const fn of userFunctions)add(vars,fn);}else for(const v of variables)if(wizardTypeMatches(param.type,v.type))add(vars,v);
  for(const c of param.candidates||[])if(c!=='[null]')add(docs,c);for(const c of lastUsed)add(recent,{label:c,kind:'wizard-value',type:param.type,detail:`Recent code value · ${param.type}`});
  let merged=[...vars,...docs,...recent];if(String(entry?.name||'').toLowerCase()==='savesv')merged=[...docs];
  if(prefix){const q=String(prefix).toLowerCase();merged=merged.filter(x=>String(x.label||'').toLowerCase().startsWith(q));}
  return merged.map((x,i)=>({...x,wizardOrder:i,wizardUnit:param.unit||''}));
}
function collectIndexedSystemVariableUsages(text,type){
  const expected=String(type||'').toLowerCase(),out=[],seen=new Set(),re=/\$([A-Za-z_][A-Za-z0-9_]*)\[([^\]\r\n]+)\]/g;let m;
  while((m=re.exec(String(text||'')))){const label=`$${m[1]}[${m[2]}]`,base=`$${m[1]}`,t=inferSystemVariableType(base);if(expected&&!wizardTypeMatches(expected,t))continue;const k=label.toLowerCase();if(seen.has(k))continue;seen.add(k);out.push({label,kind:'system-variable',type:t,indexedValue:true,detail:`PEITIAN ARL system variable · ${t}`});}return out;
}

const SMART_BLOCKS={
  if:'if(${1:cond})\n    $0\nendif',while:'while(${1:cond})\n    $0\nendwhile',for:'for ${1}\n    $0\nendfor',loop:'loop\n    $0\nendloop',repeat:'repeat\n    $0\nuntil(${1:cond})',switch:'switch(${1:value})\n    case ${2}:\n        $0\nendswitch',func:'func ${1:void} ${2:name}(${3})\n    $0\nendfunc'
};
function templateFromVariant(name,entry,variant,index){
  const fn=entry.type==='function',parts=[];let n=1;for(const raw of variant.params||[]){const p=normalizeWizardParam(raw),ph=`\${${n++}}`,withUnit=`${ph}${p.unit||''}`;parts.push(fn?withUnit:`${p.key}:${withUnit}`);}return{variant:`wizard-${index}`,description:`Smart · ${variant.name||'ARL'}`,snippet:fn?`${name}(${parts.join(',')})`:`${name}${parts.length?' ':''}${parts.join(',')}`,wizard:true};
}
function getSmartCompletionTemplates(name,kind,reference,wizard=defaultWizardData){
  const key=String(name||'').toLowerCase();if(SMART_BLOCKS[key])return[{variant:'block',description:'Smart · block',snippet:SMART_BLOCKS[key]}];const entry=resolveWizardEntry(wizard,key,reference,kind);if(!entry?.variants?.length)return[];return entry.variants.map((v,i)=>templateFromVariant(key,entry,v,i));
}

function getFontWeightProfile(fontFamily){const f=String(fontFamily||'').toLowerCase();if(f.includes('jetbrains mono'))return{base:'200',mid:'350',heavy:'400',family:'jetbrains-mono'};if(f.includes('cascadia code')||f.includes('cascadia mono'))return{base:'300',mid:'350',heavy:'400',family:'cascadia-code'};return null;}
function collectWeightRanges(text,languageData=defaultLanguageData){
  const source=String(text||''),heavy=[],mid=[],heavyWords=new Set([...(languageData.categories?.logic||[]),...(languageData.categories?.instructions||[]),...(languageData.categories?.keywords||[]),...(languageData.categories?.datatypes||[])].map(x=>String(x).toLowerCase()));let i=0;const ident=/\$?[A-Za-z_][A-Za-z0-9_]*/y;
  while(i<source.length){if(source[i]==='/'&&source[i+1]==='*'){const c=source.indexOf('*/',i+2),end=c<0?source.length:c+2;heavy.push({start:i,end});i=end;continue;}if(source[i]==='/'&&source[i+1]==='/'){const e=source.indexOf('\n',i);heavy.push({start:i,end:e<0?source.length:e});i=e<0?source.length:e;continue;}if(source[i]==='"'||source[i]==="'"){const q=source[i++];let esc=false;while(i<source.length){const ch=source[i++];if(esc){esc=false;continue;}if(ch==='\\'){esc=true;continue;}if(ch===q)break;}continue;}if('()[]{}'.includes(source[i])){mid.push({start:i,end:i+1});i++;continue;}ident.lastIndex=i;const m=ident.exec(source);if(m){if(heavyWords.has(m[0].toLowerCase()))heavy.push({start:i,end:i+m[0].length});i+=m[0].length;continue;}i++;}
  const weighted=[...heavy,...mid].sort((a,b)=>a.start-b.start||a.end-b.end),merged=[];for(const r of weighted){const last=merged.at(-1);if(last&&r.start<=last.end)last.end=Math.max(last.end,r.end);else merged.push({...r});}const base=[];let cursor=0;for(const r of merged){if(cursor<r.start)base.push({start:cursor,end:r.start});cursor=Math.max(cursor,r.end);}if(cursor<source.length)base.push({start:cursor,end:source.length});return{base,heavy,mid};
}

module.exports={FUNC_DEF_RE,splitTopLevel,parseFunctions,findFunction,parseFunctionReference,lookupHoverEntry,parseVariables,buildCompletionCandidates,getSignatureContext,getFontWeightProfile,collectWeightRanges,getCompletionPrefix,inferSystemVariableType,isIndexedSystemVariable,collectIndexedSystemVariableUsages,collectVisibleVariables,getTypedCompletionContext,filterTypedCompletionCandidates,wizardTypeMatches,getWizardEntry,resolveWizardEntry,getWizardParamContext,collectNearbyWizardValues,buildWizardParameterCandidates,getSmartCompletionTemplates};

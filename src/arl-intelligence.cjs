'use strict';

const defaultLanguageData = require('../language-data/arl-language.json');

const FUNC_DEF_RE = /^\s*func\s+([A-Za-z_][A-Za-z0-9_]*)\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)/i;
const CALL_RE = /(?:(?<file>[A-Za-z_][A-Za-z0-9_]*)::)?(?<name>[A-Za-z_][A-Za-z0-9_]*)\s*\(/g;

function splitTopLevel(text, separator=',') {
  const out=[];
  let start=0, par=0, sq=0, br=0, quote=null, esc=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(quote){
      if(esc){ esc=false; continue; }
      if(ch==='\\'){ esc=true; continue; }
      if(ch===quote) quote=null;
      continue;
    }
    if(ch==='"' || ch==="'"){ quote=ch; continue; }
    if(ch==='(') par++; else if(ch===')') par=Math.max(0,par-1);
    else if(ch==='[') sq++; else if(ch===']') sq=Math.max(0,sq-1);
    else if(ch==='{') br++; else if(ch==='}') br=Math.max(0,br-1);
    else if(ch===separator && par===0 && sq===0 && br===0){ out.push(text.slice(start,i).trim()); start=i+1; }
  }
  out.push(text.slice(start).trim());
  return out.filter(Boolean);
}

function maskLexical(text, maskStrings=true) {
  const src=String(text||'');
  let out='', quote=null, lineComment=false, blockComment=false, esc=false;
  for(let i=0;i<src.length;i++){
    const ch=src[i], next=src[i+1];
    if(lineComment){
      if(ch==='\n'){ lineComment=false; out+='\n'; }
      else out+=' ';
      continue;
    }
    if(blockComment){
      if(ch==='*' && next==='/'){ out+='  '; i++; blockComment=false; }
      else out+=ch==='\n'?'\n':' ';
      continue;
    }
    if(quote){
      if(maskStrings) out+=ch==='\n'?'\n':' ';
      else out+=ch;
      if(esc){ esc=false; continue; }
      if(ch==='\\'){ esc=true; continue; }
      if(ch===quote) quote=null;
      continue;
    }
    if(ch==='/' && next==='/'){ out+='  '; i++; lineComment=true; continue; }
    if(ch==='/' && next==='*'){ out+='  '; i++; blockComment=true; continue; }
    if(ch==='"' || ch==="'"){
      quote=ch;
      out+=maskStrings?' ':ch;
      continue;
    }
    out+=ch;
  }
  return out;
}

function stripComments(text){
  return maskLexical(text,false);
}

function parseFunctions(text) {
  const source=String(text||'');
  const lines=source.split(/\r?\n/);
  const codeLines=stripStringsAndComments(source).split(/\r?\n/);
  const functions = [];
  let current = null;

  for (let line = 0; line < lines.length; line++) {
    const raw = lines[line];
    const code=codeLines[line];
    const match = FUNC_DEF_RE.exec(code);
    if (match) {
      const returnType = match[1];
      const name = match[2];
      const declarationOpen=match[0].lastIndexOf('(');
      const relativeNameStart=match[0].toLowerCase().lastIndexOf(name.toLowerCase(),declarationOpen);
      const nameStart=match.index+relativeNameStart;
      current = {
        name,
        returnType,
        params: match[3].trim(),
        signature: raw.trim(),
        startLine: line,
        endLine: line,
        nameStart,
        nameEnd: nameStart + name.length
      };
      functions.push(current);
      continue;
    }

    if (/^\s*endfunc\b/i.test(code) && current) {
      current.endLine = line;
      current = null;
    }
  }

  if (current) current.endLine = Math.max(current.startLine, lines.length - 1);
  return functions;
}

function findFunction(text, name) {
  const target = String(name || '').toLowerCase();
  if (!target) return null;
  return parseFunctions(text).find(fn => fn.name.toLowerCase() === target) || null;
}

function parseFunctionReference(lineText, character) {
  const line = String(lineText || '');
  const code=stripStringsAndComments(line);
  const cursor = Math.max(0, Number(character) || 0);
  CALL_RE.lastIndex = 0;
  let match;
  while ((match = CALL_RE.exec(code)) !== null) {
    const full = match[0];
    const openParenOffset = full.lastIndexOf('(');
    const tokenText = full.slice(0, openParenOffset).trimEnd();
    const tokenStart = match.index;
    const tokenEnd = tokenStart + tokenText.length;
    if (cursor < tokenStart || cursor > tokenEnd) continue;

    if (/^\s*func\b/i.test(code.slice(0, tokenStart))) return null;

    return {
      file: match.groups?.file || null,
      name: match.groups?.name || '',
      start: tokenStart,
      end: tokenEnd
    };
  }
  return null;
}

function lookupHoverEntry(word, reference) {
  if (!word || !reference || !reference.entries) return null;
  return reference.entries[String(word).toLowerCase()] || null;
}

function datatypeSet(languageData=defaultLanguageData){
  return new Set((languageData.categories?.datatypes || []).map(x=>String(x).toLowerCase()).concat(['void']));
}

function parseParamDecl(param){
  const m=String(param||'').trim().match(/^(?:const\s+)?([A-Za-z_][A-Za-z0-9_]*)\s+([A-Za-z_][A-Za-z0-9_]*)/i);
  return m ? {type:m[1], name:m[2]} : null;
}

function parseVariables(text, languageData=defaultLanguageData){
  const source=String(text||'');
  const lines=source.split(/\r?\n/);
  const codeLines=stripStringsAndComments(source).split(/\r?\n/);
  const types=datatypeSet(languageData);
  const vars=[];
  let currentFn='';
  for(let line=0; line<lines.length; line++){
    const raw=codeLines[line];
    const fm=FUNC_DEF_RE.exec(raw);
    if(fm){
      currentFn=fm[2];
      for(const param of splitTopLevel(fm[3])){
        const decl=parseParamDecl(param);
        if(decl && types.has(decl.type.toLowerCase())) vars.push({name:decl.name,type:decl.type.toLowerCase(),scope:currentFn,kind:'parameter',line});
      }
      continue;
    }
    if(/^\s*endfunc\b/i.test(raw)){ currentFn=''; continue; }

    const noComment=raw.replace(/\/\/.*$/,'');
    const dm=noComment.match(/^\s*(?:const\s+)?([A-Za-z_][A-Za-z0-9_]*)\s+(.+)$/i);
    if(!dm || !types.has(dm[1].toLowerCase()) || dm[1].toLowerCase()==='void') continue;
    const type=dm[1].toLowerCase();
    for(const part of splitTopLevel(dm[2])){
      const nm=part.match(/^([A-Za-z_][A-Za-z0-9_]*)/);
      if(nm) vars.push({name:nm[1],type,scope:currentFn||'global',kind:'variable',line});
    }
  }
  const seen=new Set();
  return vars.filter(v=>{ const k=`${v.scope.toLowerCase()}\0${v.name.toLowerCase()}`; if(seen.has(k)) return false; seen.add(k); return true; });
}

function buildCompletionCandidates(text, languageData=defaultLanguageData, lineNumber){
  const out=[];
  const seen=new Set();
  const add=(item)=>{ const key=String(item.label).toLowerCase(); if(!key || seen.has(key)) return; seen.add(key); out.push(item); };

  const variables=Number.isFinite(Number(lineNumber))
    ? collectVisibleVariables(text,Number(lineNumber),languageData)
    : parseVariables(text,languageData).filter(v=>v.scope==='global');
  for(const v of variables) add({label:v.name,kind:'variable',type:v.type,detail:`${v.kind} · ${v.type}`});
  for(const fn of parseFunctions(text)) add({label:fn.name,kind:'user-function',type:fn.returnType,detail:fn.signature,insertText:`${fn.name}()`});

  const cats=languageData.categories||{};
  const groups=[
    ['instructions','instruction'],['functions','function'],['parenOnlyFunctions','function'],
    ['logic','keyword'],['keywords','keyword'],['datatypes','datatype'],['constants','constant'],['systemVariables','system-variable']
  ];
  for(const [group,kind] of groups){
    for(const label of cats[group]||[]){
      const isFn=kind==='function';
      add({label,kind,type:kind==='system-variable'?inferSystemVariableType(label):undefined,detail:`PEITIAN ARL ${kind}`,insertText:isFn?`${label}()`:label});
    }
  }
  return out;
}

function findInnermostOpenParen(prefix){
  let depth=0, quote=null, esc=false;
  for(let i=prefix.length-1;i>=0;i--){
    const ch=prefix[i];
    if(quote){
      if(esc){ esc=false; continue; }
      if(ch==='\\'){ esc=true; continue; }
      if(ch===quote) quote=null;
      continue;
    }
    if(ch==='"' || ch==="'"){ quote=ch; continue; }
    if(ch===')') depth++;
    else if(ch==='('){ if(depth===0) return i; depth--; }
  }
  return -1;
}

function findMatchingCloseParen(text,open){
  let depth=0;
  for(let i=Math.max(0,Number(open)||0);i<String(text||'').length;i++){
    const ch=text[i];
    if(ch==='(') depth++;
    else if(ch===')'){
      depth--;
      if(depth===0) return i;
    }
  }
  return -1;
}

function countTopLevelCommas(text){
  let count=0,par=0,sq=0,br=0,quote=null,esc=false;
  for(const ch of String(text||'')){
    if(quote){ if(esc){esc=false;continue;} if(ch==='\\'){esc=true;continue;} if(ch===quote) quote=null; continue; }
    if(ch==='"'||ch==="'"){ quote=ch; continue; }
    if(ch==='(') par++; else if(ch===')') par=Math.max(0,par-1);
    else if(ch==='[') sq++; else if(ch===']') sq=Math.max(0,sq-1);
    else if(ch==='{') br++; else if(ch==='}') br=Math.max(0,br-1);
    else if(ch===',' && par===0 && sq===0 && br===0) count++;
  }
  return count;
}

function parametersFromProto(proto, name){
  const p=String(proto||'').trim();
  const open=p.indexOf('('), close=p.lastIndexOf(')');
  if(open>=0 && close>open) return splitTopLevel(p.slice(open+1,close));
  const re=new RegExp(`^\\s*${String(name||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`,'i');
  return splitTopLevel(p.replace(re,'').trim().replace(/^\s+/,''));
}

function protoFunctionSignatures(proto,name){
  const escaped=String(name||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const out=[];
  for(const alternative of String(proto||'').split(/\s+\|\s+|\s+或\s+|\/(?=[A-Za-z_][A-Za-z0-9_]*\s+[A-Za-z_][A-Za-z0-9_]*\s*\()/).map(x=>x.trim()).filter(Boolean)){
    if(!new RegExp(`\\b${escaped}\\s*\\(`,'i').test(alternative)) continue;
    out.push({label:alternative,parameters:parametersFromProto(alternative,name)});
  }
  return out;
}

function argumentCount(text){
  const inside=String(text||'');
  return inside.trim()?countTopLevelCommas(inside)+1:0;
}

function chooseByArity(items, count, activeIndex=0, getLength=item=>item?.parameters?.length||0){
  const candidates=(items||[]).filter(item=>getLength(item)>activeIndex || (count===0 && getLength(item)===0));
  if(!candidates.length) return (items||[])[0] || null;
  return candidates.find(item=>getLength(item)===count)
    || candidates.filter(item=>getLength(item)>=count).sort((a,b)=>getLength(a)-getLength(b))[0]
    || candidates.sort((a,b)=>getLength(b)-getLength(a))[0];
}

function inferWizardArgument(text,variables,reference,depth=0){
  const value=String(text||'').trim();
  if(!value) return null;
  if(/^["']/.test(value)) return {type:'string'};
  if(/^(?:true|false)$/i.test(value)) return {type:'bool'};
  if(/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?$/i.test(value))
    return {type:/^[-+]?\d+$/.test(value)?'int':'double',numericLiteral:true};
  const variable=(variables||[]).find(item=>String(item.label||item.name).toLowerCase()===value.toLowerCase());
  if(variable?.type) return {type:variable.type};
  if(/^\$[A-Za-z_]\w*(?:\[[^\]]+\])?$/.test(value)){
    const type=inferSystemVariableType(value);
    if(type) return {type};
  }
  const call=value.match(/^([A-Za-z_]\w*)\s*\(([\s\S]*)\)$/);
  if(call && depth<4){
    const local=(variables||[]).find(item=>item.kind==='user-function' && String(item.label||item.name).toLowerCase()===call[1].toLowerCase());
    if(local?.type) return {type:local.type};
    const entry=lookupHoverEntry(call[1],reference);
    const variant=rankWizardFunctionVariants(entry,call[2],0,variables,reference,depth+1)[0]?.variant;
    const type=(variant?.signature || entry?.proto || '').match(/^([A-Za-z_]\w*(?:\[\])?)\s+/)?.[1];
    if(type) return {type};
  }
  return null;
}

// Keep ambiguous overloads tied, so a partial identifier can suggest variables
// accepted by any compatible form instead of silently choosing the first type.
function rankWizardFunctionVariants(entry,inside,activeIndex=0,variables=[],reference=null,depth=0){
  const variants=usableWizardVariants(entry,true);
  const args=splitTopLevel(inside);
  const count=argumentCount(inside);
  return variants.map(variant=>{
    const params=variant.params||[];
    const required=params.filter(param=>!wizardParamIsOptional(param)).length;
    const compatible=count>=required && count<=params.length && (params.length>activeIndex || count===0);
    let score=(compatible?0:100)+Math.abs(params.length-count)*10;
    args.forEach((arg,argIndex)=>{
      const param=params[argIndex];
      if(!param || !String(arg).trim()) return;
      const actual=inferWizardArgument(arg,variables,reference,depth);
      if(actual){
        const expected=String(param.type).toLowerCase().replace(/&/g,'').trim();
        if(expected==='any') score+=2;
        else if(expected===String(actual.type).toLowerCase()) return;
        else if(actual.numericLiteral && ['int','uint','byte','double'].includes(expected)) score+=1;
        else if(wizardTypeMatches(expected,actual.type)) score+=1;
        else score+=1000;
      } else {
        const value=String(arg).trim().toLowerCase();
        const documented=variants.some(item=>item.params[argIndex]?.candidates?.some(candidate=>String(candidate).toLowerCase()===value));
        if(documented && !param.candidates?.some(candidate=>String(candidate).toLowerCase()===value) && param.type!=='any') score+=1000;
      }
    });
    return {variant,index:entry.variants.indexOf(variant),score};
  }).sort((a,b)=>a.score-b.score || a.index-b.index);
}

function wizardFunctionContext(entry,inside,activeIndex,variables,reference){
  const ranked=rankWizardFunctionVariants(entry,inside,activeIndex,variables,reference);
  const first=ranked[0];
  const param=first?.variant.params[activeIndex];
  if(!param) return null;
  const matches=ranked.filter(item=>item.score===first.score && item.variant.params[activeIndex]);
  return {parameter:param.key,paramIndex:activeIndex,variantIndex:first.index,
    variantIndices:matches.map(item=>item.index),
    expectedType:[...new Set(matches.map(item=>item.variant.params[activeIndex].type))].join('/')};
}

function wizardReturnType(entry,name){
  const escaped=String(name||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return String(entry?.proto||'').match(new RegExp(`^\\s*(.*?)\\s+${escaped}\\s*\\(`,'i'))?.[1]?.trim() || '';
}

function wizardParamIsOptional(param){
  return param?.req===false || param?.opt===true;
}

function wizardVariantHasUniqueParameterNames(variant){
  const names=(variant?.params||[]).map(param=>String(param.key||'').toLowerCase()).filter(Boolean);
  return new Set(names).size===names.length;
}

function usableWizardVariants(entry,isFunction){
  const variants=Array.isArray(entry?.variants)?entry.variants:[];
  return isFunction?variants.filter(wizardVariantHasUniqueParameterNames):variants;
}

function formatWizardParamList(params, render, separator=', '){
  let label='';
  for(const param of params||[]){
    const value=render(param);
    if(wizardParamIsOptional(param)) label+=label?` [${separator.trimEnd()} ${value}]`:`[${value}]`;
    else label+=`${label?separator:''}${value}`;
  }
  return label;
}

function formatWizardFunctionSignature(entry,name,variant){
  if(variant?.signature) return variant.signature;
  const parameters=formatWizardParamList(variant?.params||[],param=>`${param.type||'any'} ${param.key}`.trim());
  const returnType=variant?.returns || entry?.returns || wizardReturnType(entry,name);
  return `${returnType?returnType+' ':''}${name}(${parameters})`;
}

function formatWizardInstructionSignature(entry,name,variant){
  if(variant?.signature) return variant.signature;
  const separator=variant?.sep===';'?'; ':', ';
  const parameters=formatWizardParamList(variant?.params||[],param=>{
    const type=`<${param.type||'any'}>`;
    const value=instructionParamUsesColon(entry,param.key)?`${param.key}:${type}`:type;
    return `${value}${param.unit||''}`;
  },separator);
  return `${name}${parameters?' '+parameters:''}`;
}

function wordAtCharacter(text,character){
  const source=String(text||'');
  const at=Math.max(0,Math.min(Number(character)||0,source.length));
  let start=at,end=at;
  if(start===source.length || !/[A-Za-z0-9_]/.test(source[start]||'')) start--;
  if(start<0 || !/[A-Za-z0-9_]/.test(source[start]||'')) return null;
  end=start+1;
  while(start>0 && /[A-Za-z0-9_]/.test(source[start-1])) start--;
  while(end<source.length && /[A-Za-z0-9_]/.test(source[end])) end++;
  const word=source.slice(start,end);
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(word)?{word,start,end}:null;
}

function resolveWizardHoverContext(name,wizard,reference,languageData=defaultLanguageData){
  const key=String(name||'').toLowerCase();
  if(!key) return null;
  const referenceEntry=lookupHoverEntry(key,reference);
  const functionNames=languageData.categories?.functions||[];
  const parenOnlyNames=languageData.categories?.parenOnlyFunctions||[];
  const functionStyle=referenceEntry?.type==='function'
    || functionNames.some(item=>String(item).toLowerCase()===key)
    || parenOnlyNames.some(item=>String(item).toLowerCase()===key);
  const entry=resolveWizardEntry(wizard,key,reference,functionStyle?'function':'instruction');
  if(!entry) return null;
  const isFunction=functionStyle || entry.type==='function';
  const instructionNames=languageData.categories?.instructions||[];
  const isInstruction=['instruction','instruction.motion','logic','keyword'].includes(entry.type)
    || referenceEntry?.type==='instruction'
    || instructionNames.some(item=>String(item).toLowerCase()===key);
  return isFunction || isInstruction?{key,entry,referenceEntry,isFunction,isInstruction}:null;
}

function rankHoverSignaturesByArity(signatures,supplied){
  return signatures.map((signature,index)=>({signature,index,score:Math.abs((signature.parameters||[]).length-supplied)*10+index}))
    .sort((a,b)=>a.score-b.score)
    .map(item=>item.signature);
}

function instructionProtoParameterKeys(proto){
  const keys=[];
  const seen=new Set();
  const re=/([A-Za-z_][A-Za-z0-9_]*)\s*:/g;
  let match;
  while((match=re.exec(String(proto||'')))!==null){
    const key=match[1].toLowerCase();
    if(!seen.has(key)){seen.add(key);keys.push(key);}
  }
  return keys;
}

function normalizeHoverParameterType(type){
  const value=String(type||'any').toLowerCase().replace(/\s+/g,'');
  return value==='anytype'?'any':value;
}

function findWizardParameter(entry,key,type=''){
  const targetKey=String(key||'').toLowerCase();
  const targetType=normalizeHoverParameterType(type);
  const all=(entry?.variants||[]).flatMap(variant=>variant.params||[]);
  const candidates=all.filter(param=>String(param.key||'').toLowerCase()===targetKey);
  const exact=candidates.find(param=>normalizeHoverParameterType(param.type)===targetType);
  if(exact || candidates[0]) return exact || candidates[0];

  // A few compact TIPS prototypes intentionally shorten the names used by the
  // detailed Wizard table (for example s -> number_string and
  // base -> number_base). Prefer an explicit suffix relationship before using
  // a type-only match so the attached explanation still describes this
  // parameter rather than another parameter with the same primitive type.
  const aliased=all.find(param=>{
    const sourceKey=String(param.key||'').toLowerCase();
    return sourceKey.endsWith(`_${targetKey}`) || targetKey.endsWith(`_${sourceKey}`);
  });
  if(aliased) return aliased;

  const sameType=all.filter(param=>normalizeHoverParameterType(param.type)===targetType);
  return sameType.length===1 ? sameType[0] : null;
}

function findSharedInstructionParameter(wizard,key){
  const groups=new Map();
  for(const entry of Object.values(wizard?.entries||wizard||{})){
    if(!['instruction','instruction.motion'].includes(entry?.type)) continue;
    for(const variant of entry.variants||[]){
      for(const param of variant.params||[]){
        if(String(param.key||'').toLowerCase()!==String(key||'').toLowerCase()) continue;
        const identity=[param.type,param.unit,param.desc,param.desc_en].map(value=>String(value||'').toLowerCase()).join('\u0000');
        const group=groups.get(identity)||{param,count:0};
        group.count++;
        groups.set(identity,group);
      }
    }
  }
  return [...groups.values()].sort((a,b)=>b.count-a.count)[0]?.param || null;
}

function instructionProtoParameterIsOptional(proto,key){
  const escaped=String(key||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return new RegExp(`\\[[^\\]]*\\b${escaped}\\s*:`, 'i').test(String(proto||''));
}

function getWizardHoverSignatures(lineText,character,wizard,reference,languageData=defaultLanguageData,variables=[]){
  const line=String(lineText||'');
  const code=stripStringsAndComments(line);
  const token=wordAtCharacter(code,character);
  if(!token) return [];
  const context=resolveWizardHoverContext(token.word,wizard,reference,languageData);
  if(!context) return [];
  const {key:name,entry,referenceEntry,isFunction}=context;
  const variants=usableWizardVariants(entry,isFunction);
  if(!variants.length) return [];
  let ranked=variants.map((variant,index)=>({variant,index,score:index}));

  if(isFunction){
    const after=code.slice(token.end);
    const relativeOpen=after.search(/^\s*\(/);
    let supplied=null;
    if(relativeOpen>=0){
      const open=token.end+after.indexOf('(',relativeOpen);
      const close=findMatchingCloseParen(code,open);
      const inside=stripComments(line).slice(open+1,close>=0?close:code.length);
      supplied=argumentCount(inside);
      ranked=rankWizardFunctionVariants(entry,inside,0,variables,reference);
    }
    const protoSignatures=protoFunctionSignatures(referenceEntry?.proto,name);
    if(protoSignatures.length>1 && !variants.some(variant=>variant.signature)){
      const ordered=supplied===null?protoSignatures:rankHoverSignaturesByArity(protoSignatures,supplied);
      return ordered.map(signature=>signature.label);
    }
  } else {
    const suppliedKeys=splitTopLevel(code.slice(token.end)).map(piece=>piece.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:/)?.[1]?.toLowerCase()).filter(Boolean);
    if(suppliedKeys.length){
      for(const item of ranked){
        const keys=new Set((item.variant?.params||[]).map(param=>String(param.key||'').toLowerCase()));
        const unsupported=suppliedKeys.filter(key=>!keys.has(key)).length;
        item.score=unsupported*100+Math.max(0,keys.size-suppliedKeys.length)*10+item.index;
      }
    }
  }

  ranked.sort((a,b)=>a.score-b.score);
  const seen=new Set();
  const signatures=[];
  const displayName=entry.name || name;
  for(const item of ranked){
    const signature=isFunction
      ?formatWizardFunctionSignature(entry,displayName,item.variant)
      :formatWizardInstructionSignature(entry,displayName,item.variant);
    if(signature && !seen.has(signature)){seen.add(signature);signatures.push(signature);}
  }
  if(!isFunction){
    const proto=String(referenceEntry?.proto||entry.proto||'').trim();
    const variantKeys=new Set(variants.flatMap(variant=>(variant.params||[]).map(param=>String(param.key||'').toLowerCase())));
    const missingKeys=instructionProtoParameterKeys(proto).filter(key=>!variantKeys.has(key));
    if(proto && missingKeys.length){
      const suppliedKeys=splitTopLevel(code.slice(token.end)).map(piece=>piece.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:/)?.[1]?.toLowerCase()).filter(Boolean);
      if(suppliedKeys.some(key=>missingKeys.includes(key))) signatures.unshift(proto);
      else signatures.push(proto);
    }
  }
  return signatures;
}

function getWizardHoverParameters(name,wizard,reference,languageData=defaultLanguageData){
  const context=resolveWizardHoverContext(name,wizard,reference,languageData);
  if(!context) return [];
  const parameters=[];
  const byIdentity=new Map();
  const add=(param,required=!wizardParamIsOptional(param),variantName='')=>{
    if(!param) return;
    const item={
      key:String(param.key||''), type:String(param.type||'any'), unit:String(param.unit||''),
      required:!!required, desc:String(param.desc||''), desc_en:String(param.desc_en||''), options:String(param.options||''),
      variantNames:variantName?[variantName]:[]
    };
    const identity=[item.key,item.type,item.unit,item.desc,item.desc_en,item.options].map(value=>value.toLowerCase()).join('\u0000');
    const existing=byIdentity.get(identity);
    if(existing){
      existing.required=existing.required && item.required;
      if(variantName && !existing.variantNames.includes(variantName)) existing.variantNames.push(variantName);
      return;
    }
    byIdentity.set(identity,item);
    parameters.push(item);
  };

  const proto=String(context.referenceEntry?.proto||context.entry.proto||'');
  const protoSignatures=context.isFunction?protoFunctionSignatures(proto,context.key):[];
  if(context.isFunction && protoSignatures.length>1 && !context.entry.variants?.some(variant=>variant.signature)){
    for(const signature of protoSignatures){
      const open=signature.label.indexOf('('),close=signature.label.lastIndexOf(')');
      const parsed=open>=0 && close>open?parseProtoFunctionParams(signature.label.slice(open+1,close)):[];
      for(const protoParam of parsed||[]){
        const source=findWizardParameter(context.entry,protoParam.key,protoParam.type);
        add({...protoParam,desc:source?.desc||'',desc_en:source?.desc_en||'',unit:source?.unit||''},!wizardParamIsOptional(protoParam));
      }
    }
  } else {
    for(const variant of usableWizardVariants(context.entry,context.isFunction)) for(const param of variant.params||[]) add(param,undefined,variant.name);
  }

  if(context.isInstruction){
    const documentedKeys=new Set(parameters.map(parameter=>parameter.key.toLowerCase()));
    for(const key of instructionProtoParameterKeys(proto)){
      if(documentedKeys.has(key)) continue;
      const shared=findSharedInstructionParameter(wizard,key);
      if(shared){add(shared,!instructionProtoParameterIsOptional(proto,key));documentedKeys.add(key);}
    }
  }
  return parameters;
}

function wizardSignature(entry,name,count,activeIndex,selectedVariant=null){
  const variants=usableWizardVariants(entry,true);
  const variant=selectedVariant || chooseByArity(variants,count,activeIndex,item=>item?.params?.length||0);
  if(!variant) return null;
  const parameters=(variant.params||[]).map(param=>`${param.type||'any'} ${param.key}`.trim());
  return {
    label:formatWizardFunctionSignature(entry,entry.name||name,variant),
    parameters,
    parameterDocumentation:(variant.params||[]).map(param=>{
      const parts=[];
      if(param.desc) parts.push(param.desc);
      if(param.desc_en) parts.push(param.desc_en);
      if(param.unit) parts.push(`unit: ${param.unit}`);
      if(param.options) parts.push(`取值规则: ${param.options}`);
      return parts.join(' / ');
    }),
    variantIndex:(entry?.variants||[]).indexOf(variant)
  };
}

function getSignatureContext(text, offset, reference, languageData=defaultLanguageData, wizard=null,variables=[]){
  const source=String(text||'');
  const masked=stripStringsAndComments(source);
  const pos=Math.max(0,Math.min(Number(offset)||0,source.length));
  const lineStart=source.lastIndexOf('\n',pos-1)+1;
  const lineEndRaw=source.indexOf('\n',pos);
  const lineEnd=lineEndRaw<0?source.length:lineEndRaw;
  const line=source.slice(lineStart,lineEnd);
  const codeLine=masked.slice(lineStart,lineEnd);
  const valueLine=stripComments(source).slice(lineStart,lineEnd);
  const rel=pos-lineStart;
  const prefix=codeLine.slice(0,rel);
  const functions=parseFunctions(source);

  const open=findInnermostOpenParen(prefix);
  if(open>=0){
    const before=prefix.slice(0,open);
    const m=before.match(/(?:(?:[A-Za-z_][A-Za-z0-9_]*)::)?([A-Za-z_][A-Za-z0-9_]*)\s*$/);
    if(m){
      const name=m[1];
      const local=functions.find(fn=>fn.name.toLowerCase()===name.toLowerCase());
      const valueInside=valueLine.slice(open+1,rel);
      const active=countTopLevelCommas(valueInside);
      if(local){
        const params=splitTopLevel(local.params);
        return {name:local.name,label:local.signature,parameters:params,activeParameter:Math.min(active,Math.max(0,params.length-1)),documentation:'ARL user function',kind:'user-function'};
      }
      const entry=lookupHoverEntry(name,reference);
      const knownFn=(languageData.categories?.functions||[]).some(x=>String(x).toLowerCase()===name.toLowerCase()) || (languageData.categories?.parenOnlyFunctions||[]).some(x=>String(x).toLowerCase()===name.toLowerCase());
      if(entry || knownFn){
        const close=findMatchingCloseParen(codeLine,open);
        const fullInside=valueLine.slice(open+1,close>=0?close:line.length);
        const count=argumentCount(fullInside);
        const wizardEntry=wizard?resolveWizardEntry(wizard,name,reference,'function'):(entry?.variants?.length?entry:null);
        const known=[...collectVisibleVariables(source,source.slice(0,pos).split('\n').length-1,languageData),...variables,
          ...functions.map(fn=>({label:fn.name,type:fn.returnType,kind:'user-function'}))];
        const selectedVariant=rankWizardFunctionVariants(wizardEntry,fullInside,active,known,reference)[0]?.variant;
        const protoSignatures=protoFunctionSignatures(entry?.proto,name);
        const explicitProtoOverloads=/\s\|\s/.test(String(entry?.proto||'')) && !wizardEntry?.variants?.some(variant=>variant.signature);
        const selected=(explicitProtoOverloads?chooseByArity(protoSignatures,count,active):null)
          || wizardSignature(wizardEntry,name,count,active,selectedVariant)
          || chooseByArity(protoSignatures,count,active)
          || {label:`${name}(...)`,parameters:[]};
        const params=selected.parameters||[];
        return {name,label:selected.label,parameters:params,parameterDocumentation:selected.parameterDocumentation||[],activeParameter:params.length?Math.min(active,params.length-1):0,documentation:entry?.desc||wizardEntry?.desc||'PEITIAN ARL built-in function',kind:'function',variantIndex:selected.variantIndex};
      }
    }
  }

  const im=codeLine.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\b/);
  if(im){
    const name=im[1];
    const isInstruction=(languageData.categories?.instructions||[]).some(x=>String(x).toLowerCase()===name.toLowerCase());
    if(isInstruction && rel>=im.index+im[0].length){
      const entry=lookupHoverEntry(name,reference);
      const label=entry?.proto || name;
      const params=entry?.proto ? parametersFromProto(entry.proto,name) : [];
      const rest=codeLine.slice(im[0].length,rel);
      const active=countTopLevelCommas(rest);
      return {name,label,parameters:params,activeParameter:params.length?Math.min(active,params.length-1):0,documentation:entry?.desc||'PEITIAN ARL instruction',kind:'instruction'};
    }
  }
  return null;
}

function getCompletionPrefix(lineText, character){
  const line=String(lineText||'');
  const end=Math.max(0,Math.min(Number(character)||0,line.length));
  const before=line.slice(0,end);
  const m=before.match(/(?:\$[A-Za-z_][A-Za-z0-9_]*(?:\[[A-Za-z0-9_]*\]?)?|\$|[A-Za-z_][A-Za-z0-9_]*|[-+]?(?:\d+(?:\.\d*)?|\.\d+))$/);
  if(!m) return {text:'',start:end,end};
  return {text:m[0],start:end-m[0].length,end};
}



const INSTRUCTION_PARAM_TYPE_HINTS = Object.freeze({
  p:'pose', m:'pose', j:'joint', v:'speed', s:'slip', t:'tool', w:'wobj',
  cond:'bool', when:'bool', timeoutflag:'bool',
  vp:'double', vl:'double', sp:'double', sl:'double', dura:'double', maxtime:'double'
});

const SYSTEM_VARIABLE_TYPE_HINTS = Object.freeze({
  '$i':'int', '$s':'string', '$b':'bool', '$d':'double', '$p':'pose', '$j':'joint',
  '$tools':'tool', '$wobjs':'wobj', '$world':'wobj', '$flange':'tool',
  '$dfspeed':'speed', '$dfslip':'slip', '$dftool':'tool', '$dfwobj':'wobj',
  '$cjoint':'joint', '$pi':'double'
});

function inferSystemVariableType(label){
  const base=String(label||'').match(/^\$[A-Za-z_][A-Za-z0-9_]*/)?.[0] || String(label||'');
  return defaultLanguageData.systemVariableTypes?.[base.toLowerCase()] || SYSTEM_VARIABLE_TYPE_HINTS[base.toLowerCase()] || null;
}

function isIndexedSystemVariable(label, reference){
  const base=String(label||'').match(/^\$[A-Za-z_][A-Za-z0-9_]*/)?.[0] || '';
  if(!base) return false;
  const entry=reference?.entries?.[base.toLowerCase()];
  if(entry?.shape) return entry.shape==='array';
  const text=`${entry?.desc||''} ${entry?.desc_en||''}`.toLowerCase();
  return /数组|\barray\b|\[index\]/i.test(text);
}

function stripStringsAndComments(text){
  return maskLexical(text,true);
}

function collectIndexedSystemVariableUsages(text, reference){
  const source=stripStringsAndComments(text);
  const out=[];
  const seen=new Set();
  const re=/\$[A-Za-z_][A-Za-z0-9_]*\s*\[\s*(?:[A-Za-z_][A-Za-z0-9_]*|\d+)\s*\]/g;
  let match;
  while((match=re.exec(source))!==null){
    const label=match[0].replace(/\s+/g,'');
    const base=label.match(/^\$[A-Za-z_][A-Za-z0-9_]*/)?.[0] || '';
    if(!base || !isIndexedSystemVariable(base,reference)) continue;
    const type=inferSystemVariableType(base);
    if(!type) continue;
    const key=label.toLowerCase();
    if(seen.has(key)) continue;
    seen.add(key);
    out.push({label,kind:'system-variable',type,detail:`observed · ${type}`,indexedValue:true,baseLabel:base});
  }
  return out;
}

function collectVisibleVariables(text, lineNumber, languageData=defaultLanguageData){
  const line=Math.max(0, Number(lineNumber)||0);
  const vars=parseVariables(text,languageData);
  const fn=parseFunctions(text).find(item=>line>=item.startLine && line<=item.endLine) || null;
  const locals=fn?vars.filter(v=>v.scope!=='global' && v.scope.toLowerCase()===fn.name.toLowerCase() && v.line<=line):[];
  const shadowed=new Set(locals.map(v=>v.name.toLowerCase()));
  const globals=vars.filter(v=>v.scope==='global' && v.line<=line && !shadowed.has(v.name.toLowerCase()));
  return [...locals,...globals];
}

function instructionParamType(instruction, parameter, reference){
  const name=String(instruction||'').toLowerCase();
  const key=String(parameter||'').toLowerCase();
  if(!name || !key) return null;
  const proto=reference?.entries?.[name]?.proto || '';
  if(proto){
    const escaped=key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const m=String(proto).match(new RegExp(`(?:^|[\\s,\\[])${escaped}\\s*:\\s*<([A-Za-z_][A-Za-z0-9_]*)>`,'i'));
    if(m) return m[1].toLowerCase();
  }
  return INSTRUCTION_PARAM_TYPE_HINTS[key] || null;
}

function getTypedCompletionContext(lineText, character, reference, languageData=defaultLanguageData){
  const line=String(lineText||'');
  const code=stripStringsAndComments(line);
  const end=Math.max(0,Math.min(Number(character)||0,line.length));
  const prefixInfo=getCompletionPrefix(line,end);
  const base={mode:'free',prefix:prefixInfo.text,expectedType:null,instruction:null,parameter:null};
  if(prefixInfo.text && code.slice(prefixInfo.start,end)!==line.slice(prefixInfo.start,end)) return {...base,prefix:''};
  const beforePrefix=code.slice(0,prefixInfo.start);
  const im=code.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\b/);
  if(!im) return base;
  const instruction=im[1].toLowerCase();
  const isInstruction=(languageData.categories?.instructions||[]).some(x=>String(x).toLowerCase()===instruction);
  if(!isInstruction) return base;
  const pm=beforePrefix.match(/(?:^|[\s,])([A-Za-z_][A-Za-z0-9_]*)\s*:\s*$/);
  if(!pm) return base;
  const parameter=pm[1].toLowerCase();
  const expectedType=instructionParamType(instruction,parameter,reference);
  if(!expectedType) return base;
  return {mode:'typed',prefix:prefixInfo.text,expectedType,instruction,parameter};
}

function filterTypedCompletionCandidates(candidates, context, options={}){
  const ctx=context||{};
  const prefix=String(ctx.prefix||'');
  const allowEmptyTypedPrefix=!!options.allowEmptyTypedPrefix;
  if(!prefix && !(ctx.mode==='typed' && allowEmptyTypedPrefix)) return [];
  const query=prefix.toLowerCase();
  let out=(candidates||[]);
  if(query) {
    // ARL system variables live in an explicit '$' namespace. VS Code's fuzzy
    // matcher may otherwise consider '$P' a match for a normal 'p' prefix,
    // which can make Tab accept the wrong symbol inside Smart Completion.
    if (query.startsWith('$')) out=out.filter(item=>item.kind==='system-variable');
    else out=out.filter(item=>item.kind!=='system-variable');
    out=out.filter(item=>String(item.label||'').toLowerCase().startsWith(query));
  }
  if(ctx.mode==='typed' && ctx.expectedType){
    const expected=String(ctx.expectedType).toLowerCase();
    out=out.filter(item=>{
      if(item.kind!=='variable' && item.kind!=='system-variable') return false;
      return String(item.type||'').toLowerCase()===expected;
    });
  }
  return out;
}




function splitWizardCandidates(text){
  const value=String(text||'').trim();
  if(!value) return [];
  return splitTopLevel(value).map(x=>x.trim()).filter(Boolean);
}

function parseWizardMarkdown(text){
  const source=String(text||'').replace(/\r\n?/g,'\n');
  const doc={};
  const blocks=source.split(/\n(?=##\s+)/);
  for(const block of blocks){
    const lines=block.split('\n');
    const head=lines[0]?.match(/^##\s+(\$?[A-Za-z_][A-Za-z0-9_]*)\s*$/);
    if(!head) continue;
    const name=head[1].trim();
    const entry={name,desc:'',desc_en:'',type:'',proto:'',params:'',variants:[]};
    let current=null, table=null, section=null, fenced=false;
    for(let i=1;i<lines.length;i++){
      const line=lines[i].trim();
      let m;
      if(line.startsWith('```')){fenced=!fenced;continue;}
      if(fenced){if(section==='examples') (entry.examples ||= []).push(lines[i]);continue;}
      if(line==='wizard:'){entry.wizard=[];table='wizard';section=null;continue;}
      if(['members:','enum_members:','component_types:','notes:','examples:'].includes(line)){
        section=line.slice(0,-1);table=null;current=null;continue;
      }
      if((m=line.match(/^desc:\s*(.*)$/))) { entry.desc=m[1].trim(); continue; }
      if((m=line.match(/^desc_en:\s*(.*)$/))) { entry.desc_en=m[1].trim(); continue; }
      if((m=line.match(/^type:\s*(.*)$/))) { entry.type=m[1].trim(); continue; }
      if((m=line.match(/^proto:\s*(.*)$/))) { entry.proto=m[1].trim(); continue; }
      if((m=line.match(/^params:\s*(.*)$/))) { entry.params=m[1].trim(); continue; }
      if((m=line.match(/^signature:\s*(.*)$/))){
        if(current) current.signature=m[1].trim();
        else {entry.signature=m[1].trim();entry.proto=entry.signature;}
        continue;
      }
      if((m=line.match(/^(returns|syntax|choice_groups|positional|repeat_keys):\s*(.*)$/))){
        const target=current || entry, field=m[1], value=m[2].trim();
        if(field==='choice_groups') target.choiceGroups=value.split(';').map(group=>group.split('|').map(key=>key.trim()).filter(Boolean)).filter(group=>group.length>1);
        else if(field==='positional') target.positionalKeys=value.split(',').map(key=>key.trim()).filter(Boolean);
        else if(field==='repeat_keys') target.repeatKeys=value.split(',').map(item=>{const [key,limit]=item.trim().split('=');return {key,max:limit==='*'?null:Number(limit)};});
        else target[field]=value;
        continue;
      }
      if((m=line.match(/^([a-z_]+):\s*(.+)$/))){
        const value=m[2].trim();entry[m[1]]=value==='true'?true:value==='false'?false:/^\d+$/.test(value)?Number(value):value;
        table=null;continue;
      }
      if((m=line.match(/^###\s+variant:\s*(.*)$/))){
        current={name:m[1].trim(),name_en:'',sep:name.toLowerCase()==='for'?';':',',params:[]};
        entry.variants.push(current);table=null;section=null;continue;
      }
      if((m=line.match(/^###\s+variant_en:\s*(.*)$/))){ if(current) current.name_en=m[1].trim(); continue; }
      if(line.startsWith('|')){
        const cells=line.replace(/^\|/,'').replace(/\|$/,'').split(/(?<!\\)\|/).map(x=>x.trim().replace(/\\\|/g,'|'));
        if(cells[0]==='参数' || cells[0]==='param'){table='params';continue;}
        if(cells[0]==='预设' || /^:?-+:?$/.test(cells[0])) continue;
        if(table==='wizard' && cells.length===4){entry.wizard.push({name:cells[0],name_en:cells[1],variant:cells[2],selectedKeys:cells[3].split(',').map(key=>key.trim()).filter(Boolean)});continue;}
        if(section && section!=='notes' && section!=='examples'){(entry[section] ||= []).push(cells);continue;}
        if(!current || table!=='params') continue;
        if(cells.length<6) continue;
        const [key,type,req,options,unit,cands,descCell='',descEnCell='']=cells;
        if(!key || /^-+$/.test(key)) continue;
        let candidates=splitWizardCandidates(cands);
        if(!candidates.length && options && !options.includes('~') && options.includes(',')) candidates=splitWizardCandidates(options);
        current.params.push({
          key:key.trim(), type:(type||'any').trim()||'any', req:(req||'').trim()==='*',
          opt:(req||'').trim()!=='*', hiddenDefault:req==='-', options:(options||'').trim(), unit:(unit||'').trim(),
          candidates, ph:key.trim(), desc:(descCell||'').trim(), desc_en:(descEnCell||'').trim()
        });
      }
      else if(section==='notes' && line.startsWith('- ')) (entry.notes ||= []).push(line.slice(2));
    }
    if(entry.type || entry.desc || entry.proto) doc[name.toLowerCase()]=entry;
  }
  return doc;
}

function getWizardEntry(wizard, name){
  if(!wizard || !name) return null;
  const entries=wizard.entries || wizard;
  return entries[String(name).toLowerCase()] || null;
}

function unwrapProtoOptional(text){
  const raw=String(text||'').trim();
  if(raw.startsWith('[') && raw.endsWith(']')) return {text:raw.slice(1,-1).trim(),optional:true};
  return {text:raw,optional:false};
}

function parseProtoFunctionParam(raw,index,inheritedType=''){
  const wrapped=unwrapProtoOptional(raw);
  let text=wrapped.text.replace(/^const\s+/i,'').trim();
  if(!text) return null;
  // ARL TIPS uses forms such as `double value`, `byte[] data`, `pose &p`,
  // `tool& t`, or shorthand siblings like `joint j1, j2, j3`.
  const typed =
    text.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*\[\s*\]\s*(?:&\s*)?([A-Za-z_][A-Za-z0-9_]*)$/) ||
    text.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*&\s*([A-Za-z_][A-Za-z0-9_]*)$/) ||
    text.match(/^([A-Za-z_][A-Za-z0-9_]*)\s+&?\s*([A-Za-z_][A-Za-z0-9_]*)$/);
  if(typed){
    return {
      param:{
        key:typed[2], type:typed[1].toLowerCase(), req:!wrapped.optional, opt:wrapped.optional,
        options:'', unit:'', candidates:[], ph:typed[2], desc:'', desc_en:''
      },
      explicitType:typed[1].toLowerCase()
    };
  }
  const untyped=text.match(/^&?\s*([A-Za-z_][A-Za-z0-9_]*)$/);
  if(untyped){
    const type=String(inheritedType||'any').toLowerCase();
    return {
      param:{
        key:untyped[1], type, req:!wrapped.optional, opt:wrapped.optional,
        options:'', unit:'', candidates:[], ph:untyped[1], desc:'', desc_en:''
      },
      explicitType:''
    };
  }
  return null;
}

function parseProtoFunctionParams(inside){
  // Original TIPS writes optional trailing arguments as `host, port [, timeout]`.
  // Normalize only that comma-bearing bracket form before top-level splitting.
  const normalized=String(inside||'').replace(/\[\s*,\s*/g, ', [');
  const rawParams=normalized.trim() ? splitTopLevel(normalized) : [];
  const params=[];
  let inheritedType='';
  for(let i=0;i<rawParams.length;i++){
    const parsed=parseProtoFunctionParam(rawParams[i],i,inheritedType);
    if(!parsed) return null;
    params.push(parsed.param);
    if(parsed.explicitType) inheritedType=parsed.explicitType;
  }
  return params;
}

function parseProtoInstructionParam(raw){
  const wrapped=unwrapProtoOptional(raw);
  const text=wrapped.text.trim();
  if(!text || text.includes('|')) return null;
  const m=text.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/);
  if(!m) return null;
  const key=m[1];
  const rhs=m[2].trim();
  const tm=rhs.match(/^<([A-Za-z_][A-Za-z0-9_]*)>/);
  const type=tm ? tm[1].toLowerCase() : (INSTRUCTION_PARAM_TYPE_HINTS[key.toLowerCase()] || 'any');
  return {
    key, type, req:!wrapped.optional, opt:wrapped.optional, options:'', unit:'',
    candidates:[], ph:key, desc:'', desc_en:''
  };
}

function synthesizeWizardEntryFromProto(name, kind, reference){
  const key=String(name||'').toLowerCase();
  const ref=lookupHoverEntry(key,reference);
  const proto=String(ref?.proto||'').trim();
  if(!key || !proto) return null;
  const escaped=key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const functionAlternatives=proto.split(/\s+\|\s+/).map(x=>x.trim()).filter(Boolean);
  const parsedFunctionVariants=[];
  for(const alternative of functionAlternatives){
    const fnMatch=alternative.match(new RegExp(`\\b${escaped}\\s*\\((.*)\\)\\s*$`,'i'));
    if(!fnMatch) continue;
    const inside=fnMatch[1].trim();
    const params=parseProtoFunctionParams(inside);
    // If a non-empty proto contains syntax we cannot safely parse, skip that
    // overload rather than fabricate a partial signature.
    if(params===null) continue;
    parsedFunctionVariants.push({
      name:parsedFunctionVariants.length?`重载 ${parsedFunctionVariants.length+1}`:'基本写法',
      name_en:parsedFunctionVariants.length?`Overload ${parsedFunctionVariants.length+1}`:'Basic',
      sep:',',params
    });
  }
  const isFunction=(kind==='function' || ref?.type==='function' || parsedFunctionVariants.length>0);
  if(isFunction && parsedFunctionVariants.length){
    return {
      name:key, desc:ref?.desc||'', desc_en:ref?.desc_en||'', type:'function', proto,
      params:String(Math.max(...parsedFunctionVariants.map(v=>v.params.length),0)), synthetic:true,
      variants:parsedFunctionVariants
    };
  }

  const prefixRe=new RegExp(`^\\s*${escaped}\\b`,'i');
  if(!prefixRe.test(proto)) return null;
  const rest=proto.replace(prefixRe,'').trim();
  if(!rest) return null;
  const rawParams=splitTopLevel(rest);
  const params=rawParams.map(parseProtoInstructionParam).filter(Boolean);
  if(!params.length || params.length!==rawParams.length) return null;
  return {
    name:key, desc:ref?.desc||'', desc_en:ref?.desc_en||'', type:'instruction', proto,
    params:String(params.length), synthetic:true,
    variants:[{name:'基本写法',name_en:'Basic',sep:',',params}]
  };
}

function resolveWizardEntry(wizard,name,reference,kind){
  const exact=getWizardEntry(wizard,name) || lookupHoverEntry(name,reference);
  if(exact && Array.isArray(exact.variants) && exact.variants.length) return exact;
  return synthesizeWizardEntryFromProto(name,kind,reference) || exact || null;
}

function wizardTypeMatches(expected, actual){
  const normalize=value=>String(value||'').toLowerCase().replace(/&/g,'').replace(/\[\s*\]/g,'').trim();
  const expectedTypes=String(expected||'any').split('/').map(normalize).filter(Boolean);
  const actualTypes=String(actual||'').split('/').map(normalize).filter(Boolean);
  if(!expectedTypes.length || expectedTypes.includes('any')) return true;
  return expectedTypes.some(e=>actualTypes.some(a=>{
    if(e===a) return true;
    if(e==='int') return ['int','uint','byte'].includes(a);
    if(e==='pose' || e==='frame') return a==='pose' || a==='frame';
    return false;
  }));
}


function collectNearbyWizardValues(text, lineNumber, context, radius=10){
  const source=String(text||'');
  const lines=stripComments(source).split(/\r?\n/);
  const codeLines=stripStringsAndComments(source).split(/\r?\n/);
  const line=Math.max(0,Math.min(Number(lineNumber)||0,Math.max(0,lines.length-1)));
  const symbol=String(context?.symbol||'').toLowerCase();
  const parameter=String(context?.parameter||'');
  const paramIndex=Number(context?.paramIndex)||0;
  if(!symbol) return [];
  const found=[]; const seen=new Set();
  const param=context?.entry?.variants?.[Number(context?.variantIndex)||0]?.params?.[Number(context?.paramIndex)||0] || context?.param || null;
  const add=v=>{
    const x=stripWizardParamUnit(String(v||'').trim(),param);
    if(x && !seen.has(x.toLowerCase())){seen.add(x.toLowerCase());found.push(x);}
  };
  const lo=Math.max(0,line-radius), hi=Math.min(lines.length-1,line+radius);
  for(let i=lo;i<=hi;i++){
    if(i===line) continue;
    const raw=lines[i];
    const code=codeLines[i];
    if(!code.trim()) continue;
    const call=code.match(new RegExp(`(?:^|\\s)${symbol}\\s*\\(`,'i'));
    if(call){
      const open=call.index+call[0].lastIndexOf('(');
      const close=raw.lastIndexOf(')');
      const args=splitTopLevel(raw.slice(open+1,close>open?close:raw.length));
      if(args[paramIndex]!==undefined) add(args[paramIndex]);
      continue;
    }
    const inst=code.match(new RegExp(`^\\s*${symbol}\\b`,'i'));
    if(inst && parameter){
      const symbolEnd=inst.index+inst[0].length;
      const pieces=splitTopLevel(raw.slice(symbolEnd).trim());
      for(const piece of pieces){
        const m=piece.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/);
        if(m && m[1].toLowerCase()===parameter.toLowerCase()){ add(m[2]); break; }
      }
    }
  }
  return found;
}

function buildWizardParameterCandidates(options={}){
  const entry=options.entry || null;
  const variant=entry?.variants?.[Number(options.variantIndex)||0] || null;
  const param=variant?.params?.[Number(options.paramIndex)||0] || null;
  if(!param) return [];
  const params=(options.variantIndices || [Number(options.variantIndex)||0])
    .map(index=>entry.variants[index]?.params?.[Number(options.paramIndex)||0]).filter(Boolean);
  const prefix=String(options.prefix||'');
  const variables=Array.isArray(options.variables)?options.variables:[];
  const userFunctions=Array.isArray(options.userFunctions)?options.userFunctions:[];
  const lastUsed=Array.isArray(options.lastUsed)?options.lastUsed:[];
  const vars=[]; const md=[]; const last=[];
  const seen=new Set();
  const add=(arr,item)=>{
    const label=typeof item==='string'?item:item?.label;
    const key=String(label||'').toLowerCase();
    if(!key || seen.has(key)) return;
    seen.add(key);
    arr.push(typeof item==='string'?{label:item,kind:'wizard-value',type:param.type,detail:`Wizard candidate · ${param.type}`}:{...item});
  };

  if(params.some(item=>String(item.type).toLowerCase()==='function')){
    for(const fn of userFunctions) add(vars,{label:fn.label||fn.name,kind:'user-function',type:'function',detail:fn.detail||'ARL user function'});
  }
  for(const v of variables) if(params.some(item=>wizardTypeMatches(item.type,v.type))) add(vars,v);
  for(const item of params) for(const c of item.candidates||[])
    if(c!=='[null]') add(md,{label:c,kind:'wizard-value',type:item.type,detail:`Wizard candidate · ${item.type}`});
  for(const c of lastUsed) add(last,{label:c,kind:'wizard-value',type:param.type,detail:`Recent code value · ${param.type}`});

  let merged=[];
  if(String(entry?.name||'').toLowerCase()==='savesv') merged=[...md];
  else merged=[...vars,...md,...last];

  if(prefix){
    const q=prefix.toLowerCase();
    // Once the user types the first character, every Wizard parameter uses
    // strict prefix matching — identifiers, system variables and numbers alike.
    // This keeps native VS Code Tab/Enter predictable: typing `22` cannot leave
    // a non-matching Wizard candidate such as `250` selected in the widget.
    merged=merged.filter(item=>String(item.label||'').toLowerCase().startsWith(q));
  }
  return merged.map((item,index)=>({
    ...item,
    wizardOrder:index,
    wizardUnit:entry?.type==='function'?'':(param.unit||'')
  }));
}

function wizardDefaultValue(param){
  const first=(param?.candidates||[]).find(x=>x && x!=='[null]');
  return first || param?.ph || param?.key || '';
}

function snippetEscapeDefault(text){
  return String(text||'').replace(/([}\\$])/g,'\\$1');
}

function instructionParamUsesColon(entry,key){
  const escaped=String(key||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return new RegExp(`(?:^|[\\s,\\[|])${escaped}\\s*:`, 'i').test(String(entry?.proto||''));
}

function wizardEntryLooksFunctionStyle(entry,name){
  const escaped=String(name||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return new RegExp(`\\b${escaped}\\s*\\(`,'i').test(String(entry?.proto||''));
}

function getWizardSmartTemplates(name, kind, wizard, reference){
  const key=String(name||'').toLowerCase();
  const entry=resolveWizardEntry(wizard,key,reference,kind);
  if(!entry || !Array.isArray(entry.variants) || !entry.variants.length) return [];
  const functionStyle=entry.type==='function' || kind==='function' || wizardEntryLooksFunctionStyle(entry,key);
  const displayName=entry.name || key;
  const out=[];
  const makeTemplate=(variant,index,params,suffix='')=>{
    const parts=params.map((p,i)=>{
      const n=i+1;
      // Detailed Wizard data already provides the candidate list. Do not force
      // its first candidate into the source text: start at a blank placeholder
      // and let the Suggest Widget show variables + Wizard values + recents.
      // Proto-only fallback entries keep a descriptive placeholder because no
      // detailed candidate table exists for them.
      const def=entry.synthetic ? snippetEscapeDefault(wizardDefaultValue(p)) : '';
      const placeholder=(def ? '${'+n+':'+def+'}' : '${'+n+'}')+(functionStyle?'':(p.unit||''));
      if(functionStyle) return placeholder;
      return !variant.positionalKeys?.includes(p.key) && instructionParamUsesColon(entry,p.key)?`${p.key}:${placeholder}`:placeholder;
    });
    const sep=variant.sep===';'?'; ':', ';
    const snippet=functionStyle?`${displayName}(${parts.join(sep)})`:`${displayName}${parts.length?' ':''}${parts.join(sep)}`;
    const baseName=variant.name || `Variant ${index+1}`;
    const baseNameEn=variant.name_en || '';
    return {
      variant:`wizard-${index}${suffix?'-'+suffix:''}`,
      variantName:suffix==='required'?`${baseName} · 必填`:(suffix==='full'?`${baseName} · 完整`:baseName),
      variantNameEn:suffix==='required'?`${baseNameEn||baseName} · Required`:(suffix==='full'?`${baseNameEn||baseName} · Full`:baseNameEn),
      description:`Smart · ${suffix==='required'?'Required':suffix==='full'?'Full':(baseNameEn || baseName || 'Wizard')}`,
      valueKind:entry.type==='instruction.motion'?(params.some(param=>param.unit)?'literal':'variables'):null,
      snippet,
      triggerSuggest:false,
      wizard:true,
      requiredOnly:suffix==='required',
      wizardVariantIndex:index
    };
  };
  const variants=usableWizardVariants(entry,functionStyle);
  const shapes=entry.wizard?.length?entry.wizard.map(preset=>{
    const variant=variants.find(item=>item.name===preset.variant);
    return variant?{variant,preset}:null;
  }).filter(Boolean):variants.filter(variant=>variant.syntax!=='parallel').map(variant=>({variant,preset:null}));
  shapes.forEach(({variant,preset})=>{
    const selected=new Set(preset?.selectedKeys||[]);
    const excluded=new Set();
    for(const group of variant.choiceGroups||[]){
      const chosen=group.find(key=>selected.has(key)) || group[0];
      for(const key of group) if(key!==chosen) excluded.add(key);
    }
    const params=(variant.params||[]).filter(param=>!excluded.has(param.key) && (!param.hiddenDefault || selected.has(param.key)));
    const displayVariant={...variant,name:preset?.name||variant.name,name_en:preset?.name_en||variant.name_en};
    const required=params.filter(p=>p.req);
    const hasOptional=params.some(p=>!p.req);
    if(hasOptional && required.length!==params.length){
      // Mirror the original Wizard's optional fields without forcing users to
      // leave invalid empty named parameters in a snippet: offer a concise
      // required-only form plus a full editable form.
      out.push(makeTemplate(displayVariant,entry.variants.indexOf(variant),required,'required'));
      if(params.length) out.push(makeTemplate(displayVariant,entry.variants.indexOf(variant),params,'full'));
    } else {
      out.push(makeTemplate(displayVariant,entry.variants.indexOf(variant),params,''));
    }
  });
  const seen=new Set();
  const templates=out.filter(item=>{
    const identity=functionStyle?`${item.wizardVariantIndex}\u0000${item.snippet}`:item.snippet;
    if(seen.has(identity)) return false;
    seen.add(identity);return true;
  });
  // Motion presets are the normal insertion path; keep concise required-only
  // forms available without making them the default accepted suggestion.
  if(entry.type==='instruction.motion') templates.sort((a,b)=>Number(a.requiredOnly)-Number(b.requiredOnly));
  return templates;
}

function getWizardParamContext(lineText, character, wizard, reference, languageData=defaultLanguageData,variables=[]){
  const line=String(lineText||'');
  const code=stripStringsAndComments(line);
  const end=Math.max(0,Math.min(Number(character)||0,line.length));
  const prefixInfo=getCompletionPrefix(line,end);
  if(prefixInfo.text && code.slice(prefixInfo.start,end)!==line.slice(prefixInfo.start,end)) return null;
  const before=code.slice(0,prefixInfo.start);

  const open=findInnermostOpenParen(before);
  if(open>=0){
    const m=before.slice(0,open).match(/(?:(?:[A-Za-z_][A-Za-z0-9_]*)::)?([A-Za-z_][A-Za-z0-9_]*)\s*$/);
    if(m){
      const symbol=m[1].toLowerCase();
      const entry=resolveWizardEntry(wizard,symbol,reference,'function');
      if(entry){
        const argIndex=countTopLevelCommas(before.slice(open+1));
        const close=findMatchingCloseParen(code,open);
        const fullInside=stripComments(line).slice(open+1,close>=0?close:code.length);
        const context=wizardFunctionContext(entry,fullInside,argIndex,variables,reference);
        if(context) return {mode:'wizard',prefix:prefixInfo.text,symbol,entry,...context};
      }
    }
  }

  const im=code.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\b/);
  if(im){
    const symbol=im[1].toLowerCase();
    const entry=resolveWizardEntry(wizard,symbol,reference,'instruction');
    if(entry){
      const pm=before.match(/(?:^|[\s,])([A-Za-z_][A-Za-z0-9_]*)\s*:\s*$/);
      if(pm){
        const parameter=pm[1];
        for(let vi=0;vi<(entry.variants||[]).length;vi++){
          const pi=entry.variants[vi].params.findIndex(p=>String(p.key).toLowerCase()===parameter.toLowerCase());
          if(pi>=0){ const param=entry.variants[vi].params[pi]; return {mode:'wizard',prefix:prefixInfo.text,expectedType:param.type,symbol,parameter:param.key,paramIndex:pi,variantIndex:vi,entry}; }
        }
      }
    }
  }
  return null;
}


function stripWizardParamUnit(value,param){
  const raw=String(value||'').trim();
  const unit=String(param?.unit||'');
  return unit && raw.endsWith(unit) ? raw.slice(0,-unit.length).trim() : raw;
}

// Returns the Wizard parameter/value that owns the cursor. Unlike
// getWizardParamContext(), this also works after a value has already been
// typed (for example `waittime time:1`). It is used when leaving a Smart
// placeholder so the value can become a recent candidate for compatible
// parameters later.
function getWizardValueContext(lineText, character, wizard, reference, languageData=defaultLanguageData,variables=[]){
  const line=String(lineText||'');
  const code=stripStringsAndComments(line);
  const end=Math.max(0,Math.min(Number(character)||0,line.length));
  const before=code.slice(0,end);

  const open=findInnermostOpenParen(before);
  if(open>=0){
    const m=before.slice(0,open).match(/(?:(?:[A-Za-z_][A-Za-z0-9_]*)::)?([A-Za-z_][A-Za-z0-9_]*)\s*$/);
    if(m){
      const symbol=m[1].toLowerCase();
      const entry=resolveWizardEntry(wizard,symbol,reference,'function');
      if(entry){
        const inside=before.slice(open+1);
        const argIndex=countTopLevelCommas(inside);
        const close=findMatchingCloseParen(code,open);
        const fullInside=stripComments(line).slice(open+1,close>=0?close:code.length);
        const context=wizardFunctionContext(entry,fullInside,argIndex,variables,reference);
        if(context){
          const param=entry.variants[context.variantIndex].params[argIndex];
          const pieces=splitTopLevel(line.slice(open+1,end));
          const raw=pieces.length ? pieces[pieces.length-1] : '';
          return {
            mode:'wizard-value', symbol,...context,value:stripWizardParamUnit(raw,param), param, entry
          };
        }
      }
    }
  }

  const im=code.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\b/);
  if(im){
    const symbol=im[1].toLowerCase();
    const entry=resolveWizardEntry(wizard,symbol,reference,'instruction');
    if(entry){
      const symbolEnd=im[0].length;
      if(end>=symbolEnd){
        const pieces=splitTopLevel(line.slice(symbolEnd,end));
        const current=pieces.length ? pieces[pieces.length-1] : '';
        const pm=current.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/);
        if(pm){
          const parameter=pm[1];
          for(let vi=0;vi<(entry.variants||[]).length;vi++){
            const pi=entry.variants[vi].params.findIndex(p=>String(p.key).toLowerCase()===parameter.toLowerCase());
            if(pi>=0){
              const param=entry.variants[vi].params[pi];
              return {
                mode:'wizard-value', symbol, parameter:param.key, paramIndex:pi,
                variantIndex:vi, expectedType:param.type,
                value:stripWizardParamUnit(pm[2],param), param, entry
              };
            }
          }
        }
      }
    }
  }
  return null;
}

const SMART_MOTION_TEMPLATES = Object.freeze({
  ptp: [
    { variant:'literal', description:'Smart · Value / double · units included', snippet:'ptp p:${1},vp:${2}%,sp:${3}%,t:${4:$FLANGE},w:${5:$WORLD}', triggerSuggest:false },
    { variant:'variables', description:'Smart · Variable parameters', snippet:'ptp p:${1},v:${2},s:${3},t:${4:$FLANGE},w:${5:$WORLD}', triggerSuggest:false }
  ],
  lin: [
    { variant:'literal', description:'Smart · Value / double · units included', snippet:'lin p:${1},vl:${2}mm/s,sl:${3}mm,t:${4:$FLANGE},w:${5:$WORLD}', triggerSuggest:false },
    { variant:'variables', description:'Smart · Variable parameters', snippet:'lin p:${1},v:${2},s:${3},t:${4:$FLANGE},w:${5:$WORLD}', triggerSuggest:false }
  ],
  movej: [
    { variant:'literal', description:'Smart · Value / double · units included', snippet:'movej j:${1},vp:${2}%,sp:${3}%,t:${4:$FLANGE}', triggerSuggest:false },
    { variant:'variables', description:'Smart · Variable parameters', snippet:'movej j:${1},v:${2},s:${3},t:${4:$FLANGE}', triggerSuggest:false }
  ],
  cir: [
    { variant:'literal', description:'Smart · Value / double · units included', snippet:'cir m:${1},p:${2},vl:${3}mm/s,sl:${4}mm,t:${5:$FLANGE},w:${6:$WORLD}', triggerSuggest:false },
    { variant:'variables', description:'Smart · Variable parameters', snippet:'cir m:${1},p:${2},v:${3},s:${4},t:${5:$FLANGE},w:${6:$WORLD}', triggerSuggest:false }
  ],
  ccir: [
    { variant:'literal', description:'Smart · Value / double · units included', snippet:'ccir p:${1},vl:${2}mm/s,sl:${3}mm,t:${4:$FLANGE},w:${5:$WORLD}', triggerSuggest:false },
    { variant:'variables', description:'Smart · Variable parameters', snippet:'ccir p:${1},v:${2},s:${3},t:${4:$FLANGE},w:${5:$WORLD}', triggerSuggest:false }
  ]
});

const SMART_BLOCK_TEMPLATES = Object.freeze({
  if: { description:'Smart · if block', snippet:'if(${1:condition})\n    ${0}\nendif' },
  while: { description:'Smart · while block', snippet:'while(${1:condition})\n    ${0}\nendwhile' },
  for: { description:'Smart · for block', snippet:'for(${1:init}; ${2:condition}; ${3:step})\n    ${0}\nendfor' },
  loop: { description:'Smart · loop block', snippet:'loop\n    ${0}\nendloop' },
  repeat: { description:'Smart · repeat-until block', snippet:'repeat\n    ${0}\nuntil(${1:condition})' },
  switch: { description:'Smart · switch block', snippet:'switch(${1:expression})\n    case ${2:value}:\n        ${0}\nendswitch' },
  func: { description:'Smart · function block', snippet:'func ${1:void} ${2:functionName}(${3})\n    ${0}\nendfunc' }
});

function placeholderNameFromParameter(parameter, index){
  const text=String(parameter||'').replace(/[\[\]<>]/g,' ').trim();
  const m=text.match(/([A-Za-z_][A-Za-z0-9_]*)\s*$/);
  return m ? m[1] : `arg${index}`;
}

function getSmartCompletionTemplates(name, kind, reference, wizard=null){
  const key=String(name||'').toLowerCase();
  if(!key) return [];

  const motion=SMART_MOTION_TEMPLATES[key];
  if(motion && !getWizardEntry(wizard,key)?.variants?.some(variant=>variant.choiceGroups?.length)) return motion.map(item=>({...item}));

  const block=SMART_BLOCK_TEMPLATES[key];
  if(block){
    const entry=getWizardEntry(wizard,key) || lookupHoverEntry(key,reference);
    const presets=entry?.wizard?.length?entry.wizard:entry?.variants?.map(variant=>({variant:variant.name,name:variant.name,name_en:variant.name_en}));
    if(entry?.variants?.some(variant=>variant.syntax==='compact-if')){
      return presets.map(preset=>{
        const index=entry.variants.findIndex(variant=>variant.name===preset.variant);
        const variant=entry.variants[index];
        if(!variant) return null;
        const compact=variant.syntax==='compact-if';
        return {variant:compact?'compact-if':'block',variantName:preset.name,variantNameEn:preset.name_en,
          description:compact?'Smart · Single-line conditional':block.description,
          snippet:compact?`${entry.name}(\${1:condition}) \${2:statement}`:block.snippet,
          wizard:compact,wizardVariantIndex:index,triggerSuggest:false};
      }).filter(Boolean);
    }
    return [{ variant:'block', description:block.description, snippet:block.snippet, triggerSuggest:false }];
  }

  const wizardTemplates=getWizardSmartTemplates(key,kind,wizard,reference);
  if(wizardTemplates.length){
    // A detailed Wizard table is authoritative for parameter names/types, but
    // a few source entries (notably rand) document an additional zero-argument
    // overload only in the pipe-separated TIPS prototype. Preserve only arities
    // absent from the detailed table so conflicting legacy prototypes cannot
    // override entries such as connect/read/getdi.
    const proto=String(lookupHoverEntry(key,reference)?.proto||'');
    const exact=getWizardEntry(wizard,key);
    if(exact?.variants?.length && /\s\|\s/.test(proto)){
      const exactArities=new Set((exact?.variants||[]).map(variant=>variant.params?.length||0));
      const synthetic=synthesizeWizardEntryFromProto(key,kind,reference);
      const missing=(synthetic?.variants||[]).filter(variant=>!exactArities.has(variant.params?.length||0));
      if(missing.length){
        const supplemental=getWizardSmartTemplates(key,kind,{entries:{[key]:{...synthetic,variants:missing}}},{entries:{}});
        return [...wizardTemplates,...supplemental];
      }
    }
    return wizardTemplates;
  }

  const entry=lookupHoverEntry(key,reference);
  if(kind==='function' || entry?.type==='function'){
    const proto=entry?.proto || '';
    if(!proto) return [];
    const params=parametersFromProto(proto,key);
    const snippetArgs=params.map((param,index)=>'${'+(index+1)+':'+placeholderNameFromParameter(param,index+1)+'}');
    return [{
      variant:'function',
      description:'Smart · Function arguments',
      snippet:`${key}(${snippetArgs.join(', ')})`,
      triggerSuggest:false
    }];
  }
  return [];
}

function getFontWeightProfile(fontFamily){
  const f=String(fontFamily||'').toLowerCase();
  if(f.includes('jetbrains mono')) return {base:'200',mid:'350',heavy:'400',family:'jetbrains-mono'};
  if(f.includes('cascadia code') || f.includes('cascadia mono')) return {base:'300',mid:'350',heavy:'400',family:'cascadia-code'};
  return null;
}

function collectNonAsciiRuns(source,start,end,ranges){
  let runStart=-1;
  for(let index=start;index<end;index++){
    const isFallbackGlyph=source.charCodeAt(index)>0x7f;
    if(isFallbackGlyph && runStart<0) runStart=index;
    if(!isFallbackGlyph && runStart>=0){ranges.push({start:runStart,end:index});runStart=-1;}
  }
  if(runStart>=0) ranges.push({start:runStart,end});
}

function collectWeightRanges(text, languageData=defaultLanguageData){
  const source=String(text||'');
  const heavy=[]; const mid=[];
  const heavyWords=new Set([
    ...(languageData.categories?.logic||[]),
    ...(languageData.categories?.instructions||[]),
    ...(languageData.categories?.keywords||[]),
    ...(languageData.categories?.datatypes||[])
  ].map(x=>String(x).toLowerCase()));

  let i=0;
  const identRe=/\$?[A-Za-z_][A-Za-z0-9_]*/y;
  while(i<source.length){
    if(source[i]==='/' && source[i+1]==='*'){
      const close=source.indexOf('*/',i+2);
      const end=close<0?source.length:close+2;
      heavy.push({start:i,end});
      i=end;
      continue;
    }
    if(source[i]==='/' && source[i+1]==='/'){
      const end=source.indexOf('\n',i);
      heavy.push({start:i,end:end<0?source.length:end});
      i=end<0?source.length:end;
      continue;
    }
    if(source[i]==='"' || source[i]==="'"){
      const quote=source[i++]; const contentStart=i; let esc=false;
      while(i<source.length){ const ch=source[i++]; if(esc){esc=false;continue;} if(ch==='\\'){esc=true;continue;} if(ch===quote) break; }
      const contentEnd=source[i-1]===quote?i-1:i;
      // JetBrains Mono/Cascadia render Latin weight 200/300 themselves, while
      // CJK text is supplied by a fallback font. Applying the Latin light
      // weight to that fallback makes Chinese strings look washed out, so keep
      // only the non-ASCII glyph runs at the readable normal weight.
      collectNonAsciiRuns(source,contentStart,contentEnd,heavy);
      continue;
    }
    if('()[]{}'.includes(source[i])){ mid.push({start:i,end:i+1}); i++; continue; }
    if(source.charCodeAt(i)>0x7f){
      const start=i;
      while(i<source.length && source.charCodeAt(i)>0x7f) i++;
      heavy.push({start,end:i});
      continue;
    }
    identRe.lastIndex=i;
    const m=identRe.exec(source);
    if(m){ if(heavyWords.has(m[0].toLowerCase())) heavy.push({start:i,end:i+m[0].length}); i+=m[0].length; continue; }
    i++;
  }

  // Decorations that set the same CSS property must not overlap. In v0.6.0
  // one base decoration covered the entire document and could visually win over
  // the 350/400 decorations depending on VS Code's generated CSS order.
  const weighted=[...heavy,...mid]
    .filter(r=>r.end>r.start)
    .sort((a,b)=>a.start-b.start || a.end-b.end);
  const merged=[];
  for(const r of weighted){
    const last=merged[merged.length-1];
    if(last && r.start<=last.end) last.end=Math.max(last.end,r.end);
    else merged.push({start:r.start,end:r.end});
  }
  const base=[];
  let cursor=0;
  for(const r of merged){
    if(cursor<r.start) base.push({start:cursor,end:r.start});
    cursor=Math.max(cursor,r.end);
  }
  if(cursor<source.length) base.push({start:cursor,end:source.length});

  return {base,heavy,mid};
}

module.exports = {
  FUNC_DEF_RE,
  splitTopLevel,
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
  inferSystemVariableType,
  isIndexedSystemVariable,
  collectIndexedSystemVariableUsages,
  collectVisibleVariables,
  getTypedCompletionContext,
  filterTypedCompletionCandidates,
  parseWizardMarkdown,
  getWizardEntry,
  synthesizeWizardEntryFromProto,
  resolveWizardEntry,
  getWizardHoverSignatures,
  getWizardHoverParameters,
  getWizardParamContext,
  getWizardValueContext,
  collectNearbyWizardValues,
  buildWizardParameterCandidates,
  getWizardSmartTemplates,
  wizardTypeMatches,
  getSmartCompletionTemplates
};

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

function parseFunctions(text) {
  const lines = String(text || '').split(/\r?\n/);
  const functions = [];
  let current = null;

  for (let line = 0; line < lines.length; line++) {
    const raw = lines[line];
    const match = FUNC_DEF_RE.exec(raw);
    if (match) {
      const returnType = match[1];
      const name = match[2];
      const nameStart = raw.toLowerCase().indexOf(name.toLowerCase(), match.index);
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

    if (/^\s*endfunc\b/i.test(raw) && current) {
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
  const cursor = Math.max(0, Number(character) || 0);
  CALL_RE.lastIndex = 0;
  let match;
  while ((match = CALL_RE.exec(line)) !== null) {
    const full = match[0];
    const openParenOffset = full.lastIndexOf('(');
    const tokenText = full.slice(0, openParenOffset).trimEnd();
    const tokenStart = match.index;
    const tokenEnd = tokenStart + tokenText.length;
    if (cursor < tokenStart || cursor > tokenEnd) continue;

    if (/^\s*func\b/i.test(line.slice(0, tokenStart))) return null;

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
  const lines=String(text||'').split(/\r?\n/);
  const types=datatypeSet(languageData);
  const vars=[];
  let currentFn='';
  for(let line=0; line<lines.length; line++){
    const raw=lines[line];
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

function buildCompletionCandidates(text, languageData=defaultLanguageData){
  const out=[];
  const seen=new Set();
  const add=(item)=>{ const key=String(item.label).toLowerCase(); if(!key || seen.has(key)) return; seen.add(key); out.push(item); };

  for(const v of parseVariables(text,languageData)) add({label:v.name,kind:'variable',type:v.type,detail:`${v.kind} · ${v.type}`});
  for(const fn of parseFunctions(text)) add({label:fn.name,kind:'user-function',type:fn.returnType,detail:fn.signature,insertText:`${fn.name}()`});

  const cats=languageData.categories||{};
  const groups=[
    ['instructions','instruction'],['functions','function'],['parenOnlyFunctions','function'],
    ['logic','keyword'],['keywords','keyword'],['datatypes','datatype'],['systemVariables','system-variable']
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

function getSignatureContext(text, offset, reference, languageData=defaultLanguageData){
  const source=String(text||'');
  const pos=Math.max(0,Math.min(Number(offset)||0,source.length));
  const lineStart=source.lastIndexOf('\n',pos-1)+1;
  const lineEndRaw=source.indexOf('\n',pos);
  const lineEnd=lineEndRaw<0?source.length:lineEndRaw;
  const line=source.slice(lineStart,lineEnd);
  const rel=pos-lineStart;
  const prefix=line.slice(0,rel);
  const functions=parseFunctions(source);

  const open=findInnermostOpenParen(prefix);
  if(open>=0){
    const before=prefix.slice(0,open);
    const m=before.match(/(?:(?:[A-Za-z_][A-Za-z0-9_]*)::)?([A-Za-z_][A-Za-z0-9_]*)\s*$/);
    if(m){
      const name=m[1];
      const local=functions.find(fn=>fn.name.toLowerCase()===name.toLowerCase());
      const inside=prefix.slice(open+1);
      const active=countTopLevelCommas(inside);
      if(local){
        const params=splitTopLevel(local.params);
        return {name:local.name,label:local.signature,parameters:params,activeParameter:Math.min(active,Math.max(0,params.length-1)),documentation:'ARL user function',kind:'user-function'};
      }
      const entry=lookupHoverEntry(name,reference);
      const knownFn=(languageData.categories?.functions||[]).some(x=>String(x).toLowerCase()===name.toLowerCase()) || (languageData.categories?.parenOnlyFunctions||[]).some(x=>String(x).toLowerCase()===name.toLowerCase());
      if(entry || knownFn){
        const label=entry?.proto || `${name}(...)`;
        const params=entry?.proto ? parametersFromProto(entry.proto,name) : [];
        return {name,label,parameters:params,activeParameter:params.length?Math.min(active,params.length-1):0,documentation:entry?.desc||'PEITIAN ARL built-in function',kind:'function'};
      }
    }
  }

  const im=line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\b/);
  if(im){
    const name=im[1];
    const isInstruction=(languageData.categories?.instructions||[]).some(x=>String(x).toLowerCase()===name.toLowerCase());
    if(isInstruction && rel>=im.index+im[0].length){
      const entry=lookupHoverEntry(name,reference);
      const label=entry?.proto || name;
      const params=entry?.proto ? parametersFromProto(entry.proto,name) : [];
      const rest=line.slice(im[0].length,rel);
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
  const m=before.match(/(?:\$[A-Za-z0-9_]*|[A-Za-z_][A-Za-z0-9_]*)$/);
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
  return SYSTEM_VARIABLE_TYPE_HINTS[String(label||'').toLowerCase()] || null;
}

function collectVisibleVariables(text, lineNumber, languageData=defaultLanguageData){
  const line=Math.max(0, Number(lineNumber)||0);
  const vars=parseVariables(text,languageData);
  const fn=parseFunctions(text).find(item=>line>=item.startLine && line<=item.endLine) || null;
  return vars.filter(v=>{
    if(v.scope==='global') return v.line<=line;
    if(!fn || v.scope.toLowerCase()!==fn.name.toLowerCase()) return false;
    return v.line<=line;
  });
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
  const end=Math.max(0,Math.min(Number(character)||0,line.length));
  const prefixInfo=getCompletionPrefix(line,end);
  const base={mode:'free',prefix:prefixInfo.text,expectedType:null,instruction:null,parameter:null};
  const beforePrefix=line.slice(0,prefixInfo.start);
  const im=line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\b/);
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

function filterTypedCompletionCandidates(candidates, context){
  const ctx=context||{};
  const prefix=String(ctx.prefix||'');
  if(!prefix) return [];
  const query=prefix.toLowerCase();
  let out=(candidates||[]).filter(item=>String(item.label||'').toLowerCase().startsWith(query));
  if(ctx.mode==='typed' && ctx.expectedType){
    const expected=String(ctx.expectedType).toLowerCase();
    out=out.filter(item=>{
      if(item.kind!=='variable' && item.kind!=='system-variable') return false;
      return String(item.type||'').toLowerCase()===expected;
    });
  }
  return out;
}

function getFontWeightProfile(fontFamily){
  const f=String(fontFamily||'').toLowerCase();
  if(f.includes('jetbrains mono')) return {base:'200',mid:'350',heavy:'400',family:'jetbrains-mono'};
  if(f.includes('cascadia code') || f.includes('cascadia mono')) return {base:'300',mid:'350',heavy:'400',family:'cascadia-code'};
  return null;
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
      const quote=source[i++]; let esc=false;
      while(i<source.length){ const ch=source[i++]; if(esc){esc=false;continue;} if(ch==='\\'){esc=true;continue;} if(ch===quote) break; }
      continue;
    }
    if('()[]{}'.includes(source[i])){ mid.push({start:i,end:i+1}); i++; continue; }
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
  collectVisibleVariables,
  getTypedCompletionContext,
  filterTypedCompletionCandidates
};

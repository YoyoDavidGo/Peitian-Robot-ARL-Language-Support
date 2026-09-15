const assert=require('assert');
const Module=require('module');
const path=require('path');

const registrations={completion:null,triggers:[],formatter:null,folding:null,symbols:null,definition:null,hover:null,signature:null};
class Position{constructor(line,character){this.line=line;this.character=character;}}
class Range{constructor(start,end){this.start=start;this.end=end;}}
class CompletionItem{constructor(label,kind){this.label=label;this.kind=kind;}}
class SnippetString{constructor(value){this.value=value;}}
class MarkdownString{constructor(value=''){this.value=value;}appendMarkdown(v){this.value+=v;return this;}appendCodeblock(v,l){this.value+=`\n\`\`\`${l}\n${v}\n\`\`\``;return this;}}
class SignatureHelp{constructor(){this.signatures=[];}}
class SignatureInformation{constructor(label,documentation){this.label=label;this.documentation=documentation;this.parameters=[];}}
class ParameterInformation{constructor(label){this.label=label;}}
const makeUri=fsPath=>({fsPath,path:fsPath,scheme:'file',toString(){return`file://${fsPath}`;}});
const docs=new Map();
function makeDocument(fsPath,text){const lines=text.split('\n'),uri=makeUri(fsPath);const d={uri,languageId:'arl',eol:1,getText:()=>text,lineAt:i=>({text:lines[i]??''}),positionAt(offset){const b=text.slice(0,offset).split('\n');return new Position(b.length-1,b.at(-1).length);},offsetAt(pos){return lines.slice(0,pos.line).reduce((n,x)=>n+x.length+1,0)+pos.character;}};docs.set(fsPath.toLowerCase(),d);return d;}
const fake={
  EndOfLine:{LF:1,CRLF:2},FoldingRangeKind:{Region:'region'},SymbolKind:{Function:11},CompletionItemKind:{Keyword:1,Function:2,Variable:3,TypeParameter:4,Value:5,Snippet:6},
  Position,Range,CompletionItem,SnippetString,MarkdownString,SignatureHelp,SignatureInformation,ParameterInformation,
  FoldingRange:class{constructor(start,end,kind){Object.assign(this,{start,end,kind});}},DocumentSymbol:class{constructor(...a){this.name=a[0];this.detail=a[1];this.range=a[3];}},Location:class{constructor(uri,range){this.uri=uri;this.range=range;}},Hover:class{constructor(contents,range){this.contents=contents;this.range=range;}},TextEdit:{replace:(range,newText)=>({range,newText})},Uri:{file:makeUri},
  workspace:{textDocuments:[],async findFiles(){return[];},async openTextDocument(uri){const d=docs.get(uri.fsPath.toLowerCase());if(!d)throw Error('not found');return d;},getConfiguration(section){if(section==='peitianArl')return{get:(key,fallback)=>key==='preciseFontWeights.enabled'||key==='smartCompletion.enabled'?true:fallback};if(section==='editor')return{get:()=>"'JetBrains Mono'"};return{get:(_k,f)=>f};},onDidChangeTextDocument(){return{dispose(){}};},onDidOpenTextDocument(){return{dispose(){}};},onDidCloseTextDocument(){return{dispose(){}};},onDidChangeConfiguration(){return{dispose(){}};}},
  languages:{registerDocumentFormattingEditProvider(_l,p){registrations.formatter=p;return{dispose(){}};},registerFoldingRangeProvider(_l,p){registrations.folding=p;return{dispose(){}};},registerDocumentSymbolProvider(_l,p){registrations.symbols=p;return{dispose(){}};},registerDefinitionProvider(_l,p){registrations.definition=p;return{dispose(){}};},registerHoverProvider(_l,p){registrations.hover=p;return{dispose(){}};},registerCompletionItemProvider(_l,p,...t){registrations.completion=p;registrations.triggers=t;return{dispose(){}};},registerSignatureHelpProvider(_l,p){registrations.signature=p;return{dispose(){}};}},
  window:{activeTextEditor:null,visibleTextEditors:[],createTextEditorDecorationType(){return{dispose(){}};},onDidChangeActiveTextEditor(){return{dispose(){}};},onDidChangeVisibleTextEditors(){return{dispose(){}};}}
};
const original=Module._load;Module._load=(request,parent,isMain)=>request==='vscode'?fake:original.call(Module,request,parent,isMain);
(async()=>{try{
  const ext=require('../extension.js');ext.activate({subscriptions:{push(){}}});assert(registrations.completion);assert(registrations.triggers.includes('p'));assert(registrations.triggers.includes('2'));assert(registrations.triggers.includes('$'));
  const data=makeDocument('/ws/type1_data.arl','pose pData\ndouble dData');
  const doc=makeDocument('/ws/type1.arl',['double i123=10.2','pose pLocal','lin p:p1,vl:22mm/s,sl:0mm,t:$FLANGE,w:$WORLD','waittime time:'].join('\n'));fake.workspace.textDocuments=[data,doc];
  let items=await registrations.completion.provideCompletionItems(doc,new Position(3,'waittime time:'.length));assert.deepStrictEqual(items,[],'empty parameter must be quiet');
  const iDoc=makeDocument('/ws/type1.arl',['double i123=10.2','waittime time:i'].join('\n'));fake.workspace.textDocuments=[data,iDoc];items=await registrations.completion.provideCompletionItems(iDoc,new Position(1,'waittime time:i'.length));assert(items.some(x=>(typeof x.label==='string'?x.label:x.label.label)==='i123'));assert(!items.some(x=>(typeof x.label==='string'?x.label:x.label.label)==='$PI'));
  const numDoc=makeDocument('/ws/type1.arl',['double i123=10.2','lin p:p1,vl:2mm/s,sl:0mm,t:$FLANGE,w:$WORLD'].join('\n'));fake.workspace.textDocuments=[data,numDoc];items=await registrations.completion.provideCompletionItems(numDoc,new Position(1,'lin p:p1,vl:2'.length));const labels=items.map(x=>typeof x.label==='string'?x.label:x.label.label);assert(labels.includes('250'));assert(labels.every(x=>String(x).startsWith('2')));
  const noMatch=makeDocument('/ws/type1.arl','lin p:p1,vl:22mm/s,sl:0mm,t:$FLANGE,w:$WORLD');fake.workspace.textDocuments=[data,noMatch];items=await registrations.completion.provideCompletionItems(noMatch,new Position(0,'lin p:p1,vl:22'.length));assert.deepStrictEqual(items,[],'22 must not leave 250 selected');
  const linDoc=makeDocument('/ws/lin.arl','lin');items=await registrations.completion.provideCompletionItems(linDoc,new Position(0,3));const snippets=items.filter(x=>x.insertText instanceof SnippetString).map(x=>x.insertText.value);assert(snippets.includes('lin p:${1},vl:${2}mm/s,sl:${3}mm,t:${4},w:${5}'));
  const poseDoc=makeDocument('/ws/pose.arl','ptp p:$');items=await registrations.completion.provideCompletionItems(poseDoc,new Position(0,7));const p=items.find(x=>(typeof x.label==='string'?x.label:x.label.label)==='$P');assert(p&&p.insertText instanceof SnippetString&&p.insertText.value==='$P[${1}]');
  console.log('ARL RC7 runtime completion tests passed');
}finally{Module._load=original;}})().catch(e=>{console.error(e);process.exitCode=1;});

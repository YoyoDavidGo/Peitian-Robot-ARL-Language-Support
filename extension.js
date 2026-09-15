'use strict';

const path=require('path');
const vscode=require('vscode');
const {formatArl,getFoldingRanges}=require('./src/arl-structure.cjs');
const {
  parseFunctions,findFunction,parseFunctionReference,lookupHoverEntry,parseVariables,
  buildCompletionCandidates,getSignatureContext,getFontWeightProfile,collectWeightRanges,getCompletionPrefix,
  collectVisibleVariables,getTypedCompletionContext,filterTypedCompletionCandidates,
  inferSystemVariableType,isIndexedSystemVariable,collectIndexedSystemVariableUsages,
  getWizardParamContext,collectNearbyWizardValues,buildWizardParameterCandidates,getSmartCompletionTemplates,wizardTypeMatches
}=require('./src/arl-intelligence.cjs');
const languageData=require('./language-data/arl-language.json');
const hoverReference=require('./language-data/arl-reference.json');
const wizardData=require('./language-data/arl-wizard.json');
const {WorkspaceVariableIndex}=require('./src/workspace-variable-index.cjs');

function functionRange(document,fn){const endText=document.lineAt(fn.endLine).text;return new vscode.Range(new vscode.Position(fn.startLine,0),new vscode.Position(fn.endLine,endText.length));}
function functionSelectionRange(fn){return new vscode.Range(new vscode.Position(fn.startLine,fn.nameStart),new vscode.Position(fn.startLine,fn.nameEnd));}
function wordAt(line,character){const re=/\$?[A-Za-z_][A-Za-z0-9_]*/g;let m;while((m=re.exec(String(line||'')))){const start=m.index,end=start+m[0].length;if(character>=start&&character<=end)return{word:m[0],start,end};}return null;}
function uriKey(uri){return String(uri?.fsPath||uri?.path||uri?.toString?.()||'').toLowerCase();}
function variableCandidate(v,source=''){return{label:v.name,kind:'variable',type:String(v.type||'').toLowerCase(),detail:`${v.kind||'variable'} · ${String(v.type||'').toLowerCase()}${source?` · ${source}`:''}`};}

const categoryIndex=(()=>{const map=new Map(),labels={logic:'logic keyword',instructions:'instruction',functions:'built-in function',keywords:'keyword',datatypes:'data type',parenOnlyFunctions:'built-in function',systemVariables:'system variable'};for(const [group,values] of Object.entries(languageData.categories||{}))for(const value of values)map.set(String(value).toLowerCase(),labels[group]||group);return map;})();

async function openReferencedDocument(sourceDocument,fileStem){
  const stem=String(fileStem||'').replace(/\.(?:arl|txt)$/i,'');if(!stem)return null;const names=[`${stem}.arl`,`${stem}.txt`];
  for(const doc of vscode.workspace.textDocuments||[]){const base=path.basename(doc.uri.fsPath||doc.uri.path||'').toLowerCase();if(names.some(x=>x.toLowerCase()===base))return doc;}
  if(sourceDocument.uri?.scheme==='file'&&sourceDocument.uri.fsPath){const dir=path.dirname(sourceDocument.uri.fsPath);for(const name of names){try{return await vscode.workspace.openTextDocument(vscode.Uri.file(path.join(dir,name)));}catch(_){}}}
  if(typeof vscode.workspace.findFiles==='function')for(const name of names){let uris=[];try{uris=await vscode.workspace.findFiles(`**/${name}`,'**/{.git,node_modules}/**',50);}catch(_){}const exact=(uris||[]).find(uri=>path.basename(uri.fsPath||uri.path||'').toLowerCase()===name.toLowerCase());if(exact)try{return await vscode.workspace.openTextDocument(exact);}catch(_){}}
  return null;
}
async function resolveUserFunction(document,position){const ref=parseFunctionReference(document.lineAt(position.line).text,position.character);if(!ref)return null;const target=ref.file?await openReferencedDocument(document,ref.file):document;if(!target)return null;const fn=findFunction(target.getText(),ref.name);return fn?{ref,document:target,fn}:null;}
function userFunctionHover(fn,fileName){const md=new vscode.MarkdownString();md.appendMarkdown(`**${fn.name}** — ARL user function`);if(fileName)md.appendMarkdown(`  \n${fileName}`);md.appendCodeblock(fn.signature,'arl');return md;}
function builtinHover(word,entry,category){const md=new vscode.MarkdownString();md.appendMarkdown(`**${word}** — PEITIAN ARL ${entry?.type||category||'symbol'}`);if(entry?.desc)md.appendMarkdown(`  \n${entry.desc}`);if(entry?.proto)md.appendCodeblock(entry.proto,'arl');if(entry?.desc_en)md.appendMarkdown(`  \n_${entry.desc_en}_`);return md;}

function completionKind(kind){switch(kind){case'instruction':case'keyword':return vscode.CompletionItemKind.Keyword;case'function':case'user-function':return vscode.CompletionItemKind.Function;case'variable':case'system-variable':return vscode.CompletionItemKind.Variable;case'datatype':return vscode.CompletionItemKind.TypeParameter||vscode.CompletionItemKind.Keyword;default:return vscode.CompletionItemKind.Value;}}
function completionItem(candidate,replaceRange,referenceEntry){
  const item=new vscode.CompletionItem(candidate.label,completionKind(candidate.kind));item.detail=candidate.detail||candidate.type||'PEITIAN ARL';if(replaceRange)item.range=replaceRange;
  if(candidate.kind==='system-variable'&&referenceEntry?.desc){item.detail=referenceEntry.desc;const docs=new vscode.MarkdownString();docs.appendMarkdown(`**${candidate.label}** — PEITIAN ARL system variable`);docs.appendMarkdown(`  \n${referenceEntry.desc}`);if(referenceEntry.desc_en)docs.appendMarkdown(`  \n_${referenceEntry.desc_en}_`);item.documentation=docs;}
  const rank=Number.isInteger(candidate.wizardOrder)?`0_${String(candidate.wizardOrder).padStart(4,'0')}`:({'variable':'0','user-function':'1','instruction':'2','function':'3','datatype':'4','keyword':'5','system-variable':'6'}[candidate.kind]||'9');item.sortText=`${rank}_${String(candidate.label).toLowerCase()}`;
  if(candidate.kind==='system-variable'&&!candidate.indexedValue&&isIndexedSystemVariable(candidate.label)){item.insertText=new vscode.SnippetString(`${candidate.label}[\${1}]`);}else if(candidate.kind==='function'||candidate.kind==='user-function'){item.insertText=new vscode.SnippetString(`${candidate.label}($0)`);}else if(candidate.kind==='instruction'){item.insertText=candidate.label;}else item.insertText=candidate.label;
  return item;
}
function smartCompletionItem(candidate,template,replaceRange,index){
  const label=String(candidate.label),variant=template.description||'Smart';const item=new vscode.CompletionItem({label,description:variant},vscode.CompletionItemKind.Snippet);item.detail=`PEITIAN ARL ${variant}`;item.insertText=new vscode.SnippetString(template.snippet);item.range=replaceRange;item.sortText=`0_${String(index).padStart(2,'0')}_${label.toLowerCase()}`;return item;
}

function wizardSystemVariableAllowed(context,candidate){
  if(candidate.kind!=='system-variable')return true;const expected=String(context.expectedType||'').toLowerCase();if(!['pose','frame','joint','tool','wobj'].includes(expected))return false;return wizardTypeMatches(expected,candidate.type);
}
async function buildContextCompletionCandidates(document,position,projectIndex){
  const line=document.lineAt(position.line).text,wctx=getWizardParamContext(line,position.character,wizardData,hoverReference,languageData),context=wctx||getTypedCompletionContext(line,position.character,hoverReference,languageData);
  // RC7 rule: typed parameters are deliberately quiet until first character.
  if((context?.mode==='wizard'||context?.mode==='typed')&&!context.prefix)return[];
  if(context?.mode!=='wizard'&&context?.mode!=='typed'){
    if(!context?.prefix)return[];return filterTypedCompletionCandidates(buildCompletionCandidates(document.getText(),languageData),context);
  }
  const candidates=[],seen=new Set(),add=item=>{const k=String(item.label||'').toLowerCase();if(!k||seen.has(k))return;seen.add(k);candidates.push(item);};
  for(const v of collectVisibleVariables(document.getText(),position.line,languageData))add(variableCandidate(v));
  if(projectIndex){for(const doc of vscode.workspace.textDocuments||[])if(doc.languageId==='arl'&&!projectIndex.has(doc.uri))projectIndex.updateText(doc.uri,doc.getText(),path.basename(doc.uri?.fsPath||doc.uri?.path||''));await projectIndex.initialize();for(const v of projectIndex.getGlobalVariables(document.uri))add(variableCandidate(v,v.source));}
  for(const c of buildCompletionCandidates('',languageData))if(c.kind==='system-variable')add(c);
  for(const c of collectIndexedSystemVariableUsages(document.getText(),context.expectedType))add(c);
  if(context.mode==='wizard'){
    const fns=parseFunctions(document.getText()).filter(fn=>fn.startLine<position.line).map(fn=>({label:fn.name,name:fn.name,kind:'user-function',type:'function',detail:fn.signature}));
    return buildWizardParameterCandidates({entry:context.entry,variantIndex:context.variantIndex,paramIndex:context.paramIndex,variables:candidates.filter(c=>wizardSystemVariableAllowed(context,c)),userFunctions:fns,lastUsed:collectNearbyWizardValues(document.getText(),position.line,context),prefix:context.prefix});
  }
  return filterTypedCompletionCandidates(candidates,context);
}

function createSignatureHelp(ctx){if(!ctx)return undefined;const h=new vscode.SignatureHelp(),sig=new vscode.SignatureInformation(ctx.label,ctx.documentation||undefined);sig.parameters=(ctx.parameters||[]).map(p=>new vscode.ParameterInformation(p));h.signatures=[sig];h.activeSignature=0;h.activeParameter=ctx.activeParameter||0;return h;}
function offsetRanges(document,ranges){return ranges.map(r=>new vscode.Range(document.positionAt(r.start),document.positionAt(r.end)));}
function createWeightDecorations(){const make=fontWeight=>vscode.window.createTextEditorDecorationType({fontWeight});return{jetbrains:{base:make('200'),mid:make('350'),heavy:make('400')},cascadia:{base:make('300'),mid:make('350'),heavy:make('400')}};}
function allWeightDecorationTypes(d){return Object.values(d).flatMap(x=>Object.values(x));}
function applyPreciseFontWeights(editor,d){if(!editor||editor.document?.languageId!=='arl')return;const enabled=vscode.workspace.getConfiguration('peitianArl',editor.document.uri).get('preciseFontWeights.enabled',true),family=vscode.workspace.getConfiguration('editor',editor.document.uri).get('fontFamily',''),profile=enabled?getFontWeightProfile(family):null;for(const type of allWeightDecorationTypes(d))editor.setDecorations(type,[]);if(!profile)return;const group=profile.family==='jetbrains-mono'?d.jetbrains:d.cascadia,ranges=collectWeightRanges(editor.document.getText(),languageData);editor.setDecorations(group.base,offsetRanges(editor.document,ranges.base));editor.setDecorations(group.mid,offsetRanges(editor.document,ranges.mid));editor.setDecorations(group.heavy,offsetRanges(editor.document,ranges.heavy));}

function activate(context){
  const projectIndex=new WorkspaceVariableIndex({parseVariables,languageData,discoverUris:async()=>{try{return typeof vscode.workspace.findFiles==='function'?await vscode.workspace.findFiles('**/*.arl','**/{.git,node_modules}/**',1000):[];}catch(_){return[];}},readText:async uri=>{const open=(vscode.workspace.textDocuments||[]).find(doc=>uriKey(doc.uri)===uriKey(uri));if(open)return open.getText();if(vscode.workspace.fs?.readFile){const bytes=await vscode.workspace.fs.readFile(uri);return Buffer.from(bytes).toString('utf8');}return(await vscode.workspace.openTextDocument(uri)).getText();},uriKey,sourceName:uri=>path.basename(uri?.fsPath||uri?.path||String(uri||''))});
  for(const doc of vscode.workspace.textDocuments||[])if(doc.languageId==='arl')projectIndex.updateText(doc.uri,doc.getText(),path.basename(doc.uri?.fsPath||doc.uri?.path||''));
  const formatter=vscode.languages.registerDocumentFormattingEditProvider('arl',{provideDocumentFormattingEdits(document,options){const original=document.getText(),eol=document.eol===vscode.EndOfLine.CRLF?'\r\n':'\n',formatted=formatArl(original,{eol,tabSize:Number(options.tabSize)||4,insertSpaces:options.insertSpaces!==false});if(formatted===original)return[];return[vscode.TextEdit.replace(new vscode.Range(new vscode.Position(0,0),document.positionAt(original.length)),formatted)];}});
  const folding=vscode.languages.registerFoldingRangeProvider('arl',{provideFoldingRanges(document){return getFoldingRanges(document.getText()).map(r=>new vscode.FoldingRange(r.start,r.end,vscode.FoldingRangeKind.Region));}});
  const symbols=vscode.languages.registerDocumentSymbolProvider('arl',{provideDocumentSymbols(document){return parseFunctions(document.getText()).map(fn=>new vscode.DocumentSymbol(fn.name,`${fn.returnType} (${fn.params})`,vscode.SymbolKind.Function,functionRange(document,fn),functionSelectionRange(fn)));}});
  const definition=vscode.languages.registerDefinitionProvider('arl',{async provideDefinition(document,position){const r=await resolveUserFunction(document,position);return r?new vscode.Location(r.document.uri,functionSelectionRange(r.fn)):undefined;}});
  const hover=vscode.languages.registerHoverProvider('arl',{async provideHover(document,position){const r=await resolveUserFunction(document,position);if(r){const base=path.basename(r.document.uri.fsPath||r.document.uri.path||'');return new vscode.Hover(userFunctionHover(r.fn,r.document===document?'':base));}const token=wordAt(document.lineAt(position.line).text,position.character);if(!token)return undefined;const local=findFunction(document.getText(),token.word);if(local)return new vscode.Hover(userFunctionHover(local,''));const entry=lookupHoverEntry(token.word,hoverReference),category=categoryIndex.get(token.word.toLowerCase());if(!entry&&!category)return undefined;return new vscode.Hover(builtinHover(token.word,entry,category),new vscode.Range(new vscode.Position(position.line,token.start),new vscode.Position(position.line,token.end)));}});

  const triggerChars=[...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_','$'];
  const completion=vscode.languages.registerCompletionItemProvider('arl',{async provideCompletionItems(document,position){
    const line=document.lineAt(position.line).text,prefix=getCompletionPrefix(line,position.character);if(!prefix.text)return[];
    const replaceRange=new vscode.Range(new vscode.Position(position.line,prefix.start),new vscode.Position(position.line,prefix.end));
    const candidates=await buildContextCompletionCandidates(document,position,projectIndex);if(!candidates.length)return[];
    const items=[];for(const candidate of candidates){const ref=lookupHoverEntry(candidate.label.replace(/\[.*$/,''),hoverReference);if(vscode.workspace.getConfiguration('peitianArl',document.uri).get('smartCompletion.enabled',true)&&['instruction','function','keyword'].includes(candidate.kind)){const templates=getSmartCompletionTemplates(candidate.label,candidate.kind,hoverReference,wizardData);templates.forEach((t,i)=>items.push(smartCompletionItem(candidate,t,replaceRange,i)));}items.push(completionItem(candidate,replaceRange,ref));}return items;
  }},...triggerChars);
  const signature=vscode.languages.registerSignatureHelpProvider('arl',{provideSignatureHelp(document,position){return createSignatureHelp(getSignatureContext(document.getText(),document.offsetAt(position),hoverReference,languageData));}},'(',',',':');

  const weightDecorations=createWeightDecorations();for(const editor of vscode.window.visibleTextEditors||[])applyPreciseFontWeights(editor,weightDecorations);
  const textChange=vscode.workspace.onDidChangeTextDocument(event=>{if(event.document.languageId==='arl')projectIndex.updateText(event.document.uri,event.document.getText(),path.basename(event.document.uri?.fsPath||event.document.uri?.path||''));for(const editor of vscode.window.visibleTextEditors||[])if(editor.document===event.document)applyPreciseFontWeights(editor,weightDecorations);});
  const openListener=vscode.workspace.onDidOpenTextDocument(document=>{if(document.languageId==='arl')projectIndex.updateText(document.uri,document.getText(),path.basename(document.uri?.fsPath||document.uri?.path||''));});
  const closeListener=vscode.workspace.onDidCloseTextDocument(document=>{if(document.languageId==='arl')projectIndex.remove(document.uri);});
  const activeListener=vscode.window.onDidChangeActiveTextEditor(editor=>applyPreciseFontWeights(editor,weightDecorations));
  const visibleListener=vscode.window.onDidChangeVisibleTextEditors(editors=>{for(const editor of editors)applyPreciseFontWeights(editor,weightDecorations);});
  const configListener=vscode.workspace.onDidChangeConfiguration(event=>{if(event.affectsConfiguration('peitianArl.preciseFontWeights')||event.affectsConfiguration('editor.fontFamily'))for(const editor of vscode.window.visibleTextEditors||[])applyPreciseFontWeights(editor,weightDecorations);});
  context.subscriptions.push(formatter,folding,symbols,definition,hover,completion,signature,textChange,openListener,closeListener,activeListener,visibleListener,configListener,...allWeightDecorationTypes(weightDecorations));
}
function deactivate(){}
module.exports={activate,deactivate};

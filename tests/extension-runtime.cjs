const assert = require('assert');
const Module = require('module');
const path = require('path');

const registrations = { formatter:null, folding:null, symbols:null, definition:null, hover:null, completion:null, completionTriggers:[], signature:null, changeTextDocumentListener:null, executedCommands:[] };
class Position { constructor(line, character){ this.line=line; this.character=character; } }
class Range { constructor(start, end){ this.start=start; this.end=end; } contains(pos){ if(pos.line<this.start.line||pos.line>this.end.line)return false; if(pos.line===this.start.line&&pos.character<this.start.character)return false; if(pos.line===this.end.line&&pos.character>this.end.character)return false; return true; } }
class FoldingRange { constructor(start, end, kind){ this.start=start; this.end=end; this.kind=kind; } }
class DocumentSymbol { constructor(name, detail, kind, range, selectionRange){ Object.assign(this,{name,detail,kind,range,selectionRange}); } }
class Location { constructor(uri, range){ this.uri=uri; this.range=range; } }
class MarkdownString { constructor(value=''){this.value=value;} appendMarkdown(value){this.value+=value;return this;} appendCodeblock(value,language){this.value+=`\n\`\`\`${language}\n${value}\n\`\`\``;return this;} }
class Hover { constructor(contents, range){ this.contents=contents; this.range=range; } }
class CompletionItem { constructor(label, kind){ this.label=label; this.kind=kind; } }
class SnippetString { constructor(value){ this.value=value; } }
class SignatureHelp { constructor(){ this.signatures=[]; this.activeSignature=0; this.activeParameter=0; } }
class SignatureInformation { constructor(label, documentation){ this.label=label; this.documentation=documentation; this.parameters=[]; } }
class ParameterInformation { constructor(label, documentation){ this.label=label; this.documentation=documentation; } }
const makeUri=fsPath=>({fsPath,path:fsPath.replace(/\\/g,'/'),scheme:'file',toString(){return 'file://'+this.path;}});
const docs=new Map();
function makeDocument(fsPath,text){ const uri=makeUri(fsPath); const lines=text.split('\n'); const doc={uri,languageId:'arl',eol:1,getText:()=>text,lineAt(line){return{text:lines[line]??''};},positionAt(offset){const before=text.slice(0,offset).split('\n');return new Position(before.length-1,before[before.length-1].length);}}; docs.set(fsPath.toLowerCase(),doc); return doc; }
const fakeVscode={
  EndOfLine:{LF:1,CRLF:2},FoldingRangeKind:{Region:'region'},SymbolKind:{Function:11},Position,Range,FoldingRange,DocumentSymbol,Location,MarkdownString,Hover,CompletionItem,SnippetString,SignatureHelp,SignatureInformation,ParameterInformation,
  CompletionItemKind:{Keyword:1,Function:2,Variable:3,TypeParameter:4,Value:5},TextEdit:{replace:(range,newText)=>({range,newText})},Uri:{file:makeUri},
  workspace:{textDocuments:[],async openTextDocument(uri){const doc=docs.get(uri.fsPath.toLowerCase());if(!doc)throw new Error('not found: '+uri.fsPath);return doc;},async findFiles(){return[];},getConfiguration(section){if(section==='editor')return{get(key){if(key==='fontFamily')return"'JetBrains Mono', Consolas";}};if(section==='peitianArl')return{get(key,fallback){if(key==='preciseFontWeights.enabled')return true;return fallback;}};return{get(_key,fallback){return fallback;}};},onDidChangeTextDocument(listener){registrations.changeTextDocumentListener=listener;return{dispose(){}};},onDidChangeConfiguration(){return{dispose(){}};}},
  languages:{registerDocumentFormattingEditProvider(language,provider){assert.strictEqual(language,'arl');registrations.formatter=provider;return{dispose(){}};},registerFoldingRangeProvider(language,provider){assert.strictEqual(language,'arl');registrations.folding=provider;return{dispose(){}};},registerDocumentSymbolProvider(language,provider){assert.strictEqual(language,'arl');registrations.symbols=provider;return{dispose(){}};},registerDefinitionProvider(language,provider){assert.strictEqual(language,'arl');registrations.definition=provider;return{dispose(){}};},registerHoverProvider(language,provider){assert.strictEqual(language,'arl');registrations.hover=provider;return{dispose(){}};},registerCompletionItemProvider(language,provider,...triggers){assert.strictEqual(language,'arl');registrations.completion=provider;registrations.completionTriggers=triggers;return{dispose(){}};},registerSignatureHelpProvider(language,provider){assert.strictEqual(language,'arl');registrations.signature=provider;return{dispose(){}};}},
  commands:{async executeCommand(command){registrations.executedCommands.push(command);}},
  window:{activeTextEditor:null,visibleTextEditors:[],createTextEditorDecorationType(options){return{options,dispose(){}};},onDidChangeActiveTextEditor(){return{dispose(){}};},onDidChangeVisibleTextEditors(){return{dispose(){}};}}
};
const originalLoad=Module._load; Module._load=function(request,parent,isMain){if(request==='vscode')return fakeVscode;return originalLoad.call(this,request,parent,isMain);};
(async()=>{try{
  const ext=require('../extension.js'); const subscriptions=[]; ext.activate({subscriptions:{push:(...items)=>subscriptions.push(...items)}});
  for(const key of ['formatter','folding','symbols','definition','hover','completion','signature']) assert(registrations[key],`${key} provider was not registered`);
  const text=['func pose singleModle(int is,int grab)','return p1','endfunc','','func void main()','singleModle(1,0)','def::point_offset()','waituntil cond:getdi(1)','endfunc'].join('\n');
  const document=makeDocument('/ws/main.arl',text); fakeVscode.workspace.textDocuments=[document];
  const decorationCalls=[]; const editor={document,setDecorations(type,ranges){decorationCalls.push({type,ranges});}}; fakeVscode.window.activeTextEditor=editor; fakeVscode.window.visibleTextEditors=[editor];
  const edits=registrations.formatter.provideDocumentFormattingEdits(document,{tabSize:4,insertSpaces:true}); assert.strictEqual(edits.length,1); assert(edits[0].newText.includes('    singleModle(1,0)'));
  const folds=registrations.folding.provideFoldingRanges(document); assert(folds.some(f=>f.start===0)); assert(folds.some(f=>f.start===4));
  const symbols=registrations.symbols.provideDocumentSymbols(document); assert.deepStrictEqual(symbols.map(s=>[s.name,s.detail,s.range.start.line,s.range.end.line]),[['singleModle','pose (int is,int grab)',0,2],['main','void ()',4,8]]);
  const localDef=await registrations.definition.provideDefinition(document,new Position(5,6)); assert(localDef instanceof Location); assert.strictEqual(localDef.uri.fsPath,'/ws/main.arl');
  const defDoc=makeDocument('/ws/def.arl','func pose point_offset()\nreturn p1\nendfunc'); fakeVscode.workspace.textDocuments.push(defDoc);
  const crossDef=await registrations.definition.provideDefinition(document,new Position(6,10)); assert(crossDef instanceof Location); assert.strictEqual(crossDef.uri.fsPath,'/ws/def.arl');
  const hover=await registrations.hover.provideHover(document,new Position(7,3)); assert(hover instanceof Hover); const hoverText=hover.contents.value; assert(hoverText.includes('等待条件成立')); assert(hoverText.includes('waituntil cond:'));
  const sysDoc=makeDocument('/ws/sys.arl','$Config_check'); const sysHover=await registrations.hover.provideHover(sysDoc,new Position(0,5)); assert(sysHover instanceof Hover); const sysHoverText=sysHover.contents.value; assert(sysHoverText.includes('轴配置检查使能')); assert(sysHoverText.includes('Axis configuration check enable'));
  const ifDoc=makeDocument('/ws/if.arl','if(i==1)\nendif'); const ifHover=await registrations.hover.provideHover(ifDoc,new Position(0,1)); assert(ifHover instanceof Hover); const ifHoverText=ifHover.contents.value; assert(ifHoverText.includes('条件判断，满足时执行块内代码')); assert(ifHoverText.includes('if(bool 表达式)'));
  assert(registrations.completionTriggers.includes('o')); assert(registrations.completionTriggers.includes('$'));
  const completionItems=await registrations.completion.provideCompletionItems(document,new Position(3,0)); assert.deepStrictEqual(completionItems,[]);
  const dollarDoc=makeDocument('/ws/dollar.arl','$'); const dollarItems=await registrations.completion.provideCompletionItems(dollarDoc,new Position(0,1)); assert(dollarItems.length>0&&dollarItems.every(x=>String(x.label).startsWith('$'))); const atHome=dollarItems.find(x=>x.label==='$AT_HOME'); assert(atHome); assert.strictEqual(atHome.range.start.character,0); assert.strictEqual(atHome.range.end.character,1); assert.strictEqual(atHome.insertText,'$AT_HOME');
  const configCheck=dollarItems.find(x=>x.label==='$Config_check'); assert(configCheck); assert.strictEqual(configCheck.detail,'轴配置检查使能'); assert(configCheck.documentation.value.includes('Axis configuration check enable'));
  const offDoc=makeDocument('/ws/off.arl','off'); const offItems=await registrations.completion.provideCompletionItems(offDoc,new Position(0,3)); assert(offItems.some(x=>x.label==='offset'));
  const movDoc=makeDocument('/ws/mov.arl','mov'); const movItems=await registrations.completion.provideCompletionItems(movDoc,new Position(0,3)); assert(movItems.some(x=>x.label==='movej'));
  const freePDoc=makeDocument('/ws/free-p.arl','p'); const freePItems=await registrations.completion.provideCompletionItems(freePDoc,new Position(0,1)); assert(freePItems.some(x=>x.label==='ptp')); assert(freePItems.some(x=>x.label==='pose'));
  const dataDoc=makeDocument('/ws/type1_data.arl','pose pData\njoint jData\nspeed vData'); const typedPoseDoc=makeDocument('/ws/type1.arl','pose pLocal\njoint jLocal\nptp p:p'); fakeVscode.workspace.textDocuments=[document,defDoc,dataDoc,typedPoseDoc];
  const colonOnly=await registrations.completion.provideCompletionItems(makeDocument('/ws/colon.arl','ptp p:'),new Position(0,6)); assert.deepStrictEqual(colonOnly,[]);
  const typedPoseItems=await registrations.completion.provideCompletionItems(typedPoseDoc,new Position(2,7)); const typedPoseLabels=typedPoseItems.map(x=>x.label); assert(typedPoseLabels.includes('pLocal')); assert(typedPoseLabels.includes('pData')); assert(!typedPoseLabels.includes('jLocal')); assert(!typedPoseLabels.includes('ptp')); assert(!typedPoseLabels.includes('pose'));
  const typedSysDoc=makeDocument('/ws/sys-pose.arl','ptp p:$'); const typedSysItems=await registrations.completion.provideCompletionItems(typedSysDoc,new Position(0,7)); assert(typedSysItems.some(x=>x.label==='$P')); assert(!typedSysItems.some(x=>x.label==='$D'));
  const typedSpeedDoc=makeDocument('/ws/speed.arl','speed vh\npose p1\nptp v:v'); const typedSpeedItems=await registrations.completion.provideCompletionItems(typedSpeedDoc,new Position(2,7)); assert(typedSpeedItems.some(x=>x.label==='vh')); assert(!typedSpeedItems.some(x=>x.label==='p1'));
  assert(registrations.changeTextDocumentListener); registrations.executedCommands.length=0; const movEditor={document:movDoc,setDecorations(){}}; fakeVscode.window.activeTextEditor=movEditor; fakeVscode.window.visibleTextEditors=[movEditor]; registrations.changeTextDocumentListener({document:movDoc,contentChanges:[{text:'v'}]}); await new Promise(resolve=>setTimeout(resolve,120)); assert(registrations.executedCommands.includes('editor.action.triggerSuggest'));
  const sigDoc=makeDocument('/ws/sig.arl','func void main()\n    offset(p1,10,20,\nendfunc'); const sig=registrations.signature.provideSignatureHelp(sigDoc,new Position(1,'    offset(p1,10,20,'.length)); assert(sig instanceof SignatureHelp); assert(sig.signatures[0].label.includes('offset(')); assert.strictEqual(sig.activeParameter,3);
  console.log('ARL VS Code runtime registration/navigation tests passed');
} finally { Module._load=originalLoad; }} )().catch(err=>{console.error(err);process.exitCode=1;});

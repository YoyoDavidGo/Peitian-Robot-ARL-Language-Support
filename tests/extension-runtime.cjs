const assert = require('assert');
const Module = require('module');
const path = require('path');

const registrations = {
  formatter: null,
  folding: null,
  symbols: null,
  definition: null,
  hover: null,
  completion: null,
  completionTriggers: [],
  signature: null,
  changeTextDocumentListener: null,
  activeTextEditorListener: null,
  fileWatcher: null,
  selectionListener: null,
  executedCommands: [],
  registeredCommands: new Map()
};
let smartCompletionEnabled=true;

class Position { constructor(line, character){ this.line=line; this.character=character; } }
class Range {
  constructor(start, end){ this.start=start; this.end=end; }
  contains(pos){
    if (pos.line < this.start.line || pos.line > this.end.line) return false;
    if (pos.line === this.start.line && pos.character < this.start.character) return false;
    if (pos.line === this.end.line && pos.character > this.end.character) return false;
    return true;
  }
}
class FoldingRange { constructor(start, end, kind){ this.start=start; this.end=end; this.kind=kind; } }
class DocumentSymbol { constructor(name, detail, kind, range, selectionRange){ Object.assign(this,{name,detail,kind,range,selectionRange}); } }
class Location { constructor(uri, range){ this.uri=uri; this.range=range; } }
class MarkdownString {
  constructor(value=''){ this.value=value; }
  appendMarkdown(value){ this.value += value; return this; }
  appendCodeblock(value, language){ this.value += `\n\`\`\`${language}\n${value}\n\`\`\``; return this; }
}
class Hover { constructor(contents, range){ this.contents=contents; this.range=range; } }
class CompletionItem { constructor(label, kind){ this.label=label; this.kind=kind; } }
class SnippetString { constructor(value){ this.value=value; } }
class SignatureHelp { constructor(){ this.signatures=[]; this.activeSignature=0; this.activeParameter=0; } }
class SignatureInformation { constructor(label, documentation){ this.label=label; this.documentation=documentation; this.parameters=[]; } }
class ParameterInformation { constructor(label, documentation){ this.label=label; this.documentation=documentation; } }

const makeUri = fsPath => ({ fsPath, path: fsPath.replace(/\\/g,'/'), scheme:'file', toString(){return 'file://'+this.path;} });
const docs = new Map();
function makeDocument(fsPath, text) {
  const uri = makeUri(fsPath);
  const lines = text.split('\n');
  const doc = {
    uri,
    languageId:'arl',
    eol: 1,
    getText: () => text,
    lineAt(line){ return { text: lines[line] ?? '' }; },
    positionAt(offset){
      const before=text.slice(0,offset).split('\n');
      return new Position(before.length-1,before[before.length-1].length);
    }
  };
  docs.set(fsPath.replace(/\\/g,'/').toLowerCase(), doc);
  return doc;
}

const fakeVscode = {
  EndOfLine: { LF: 1, CRLF: 2 },
  FoldingRangeKind: { Region: 'region' },
  SymbolKind: { Function: 11 },
  Position,
  Range,
  FoldingRange,
  DocumentSymbol,
  Location,
  MarkdownString,
  Hover,
  CompletionItem,
  SnippetString,
  SignatureHelp,
  SignatureInformation,
  ParameterInformation,
  CompletionItemKind: { Keyword:1, Function:2, Variable:3, TypeParameter:4, Value:5, Snippet:15 },
  CompletionTriggerKind: { Invoke:0, TriggerCharacter:1, TriggerForIncompleteCompletions:2 },
  TextEdit: { replace: (range, newText) => ({ range, newText }) },
  Uri: { file: makeUri },
  workspace: {
    textDocuments: [],
    async openTextDocument(uri) {
      const doc=docs.get(uri.fsPath.replace(/\\/g,'/').toLowerCase());
      if(!doc) throw new Error('not found: '+uri.fsPath);
      return doc;
    },
    async findFiles() { return []; },
    createFileSystemWatcher(pattern) {
      const listeners={create:null,change:null,delete:null};
      registrations.fileWatcher={
        pattern,
        listeners,
        onDidCreate(listener){ listeners.create=listener; return {dispose(){}}; },
        onDidChange(listener){ listeners.change=listener; return {dispose(){}}; },
        onDidDelete(listener){ listeners.delete=listener; return {dispose(){}}; },
        dispose(){}
      };
      return registrations.fileWatcher;
    },
    getConfiguration(section) {
      if(section==='editor') return { get(key){ if(key==='fontFamily') return "'JetBrains Mono', Consolas"; return undefined; } };
      if(section==='peitianArl') return { get(key, fallback){ if(key==='preciseFontWeights.enabled') return true; if(key==='smartCompletion.enabled') return smartCompletionEnabled; return fallback; } };
      return { get(_key,fallback){ return fallback; } };
    },
    onDidChangeTextDocument(listener){ registrations.changeTextDocumentListener=listener; return {dispose(){}}; },
    onDidChangeConfiguration(){ return {dispose(){}}; }
  },
  languages: {
    registerDocumentFormattingEditProvider(language, provider) { assert.strictEqual(language,'arl'); registrations.formatter=provider; return {dispose(){}}; },
    registerFoldingRangeProvider(language, provider) { assert.strictEqual(language,'arl'); registrations.folding=provider; return {dispose(){}}; },
    registerDocumentSymbolProvider(language, provider) { assert.strictEqual(language,'arl'); registrations.symbols=provider; return {dispose(){}}; },
    registerDefinitionProvider(language, provider) { assert.strictEqual(language,'arl'); registrations.definition=provider; return {dispose(){}}; },
    registerHoverProvider(language, provider) { assert.strictEqual(language,'arl'); registrations.hover=provider; return {dispose(){}}; },
    registerCompletionItemProvider(language, provider, ...triggers) { assert.strictEqual(language,'arl'); registrations.completion=provider; registrations.completionTriggers=triggers; return {dispose(){}}; },
    registerSignatureHelpProvider(language, provider) { assert.strictEqual(language,'arl'); registrations.signature=provider; return {dispose(){}}; }
  },
  commands: {
    registerCommand(command, handler){ registrations.registeredCommands.set(command, handler); return {dispose(){}}; },
    async executeCommand(command, ...args){ registrations.executedCommands.push({command,args}); }
  },
  window: {
    activeTextEditor: null,
    visibleTextEditors: [],
    createTextEditorDecorationType(options){ return { options, dispose(){} }; },
    onDidChangeActiveTextEditor(listener){ registrations.activeTextEditorListener=listener; return {dispose(){}}; },
    onDidChangeVisibleTextEditors(){ return {dispose(){}}; },
    onDidChangeTextEditorSelection(listener){ registrations.selectionListener=listener; return {dispose(){}}; }
  }
};

const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === 'vscode') return fakeVscode;
  return originalLoad.call(this, request, parent, isMain);
};

(async()=>{
try {
  const ext = require('../extension.js');
  const subscriptions=[];
  ext.activate({ subscriptions: { push: (...items)=>subscriptions.push(...items) } });
  for(const key of ['formatter','folding','symbols','definition','hover','completion','signature']) assert(registrations[key], `${key} provider was not registered`);
  assert(subscriptions.length>=9, 'v0.6 should register providers plus font-weight listeners/decorations');

  const text=[
    'func pose singleModle(int is,int grab)',
    'return p1',
    'endfunc',
    '',
    'func void main()',
    'singleModle(1,0)',
    'def::point_offset()',
    'waituntil cond:getdi(1)',
    'endfunc'
  ].join('\n');
  const document=makeDocument('/ws/main.arl',text);
  fakeVscode.workspace.textDocuments=[document];
  const decorationCalls=[];
  const editor={document,setDecorations(type,ranges){decorationCalls.push({type,ranges});}};
  fakeVscode.window.activeTextEditor=editor;
  fakeVscode.window.visibleTextEditors=[editor];

  const edits=registrations.formatter.provideDocumentFormattingEdits(document,{tabSize:4,insertSpaces:true});
  assert.strictEqual(edits.length,1);
  assert(edits[0].newText.includes('    singleModle(1,0)'));

  const folds=registrations.folding.provideFoldingRanges(document);
  assert(folds.some(f=>f.start===0));
  assert(folds.some(f=>f.start===4));

  const symbols=registrations.symbols.provideDocumentSymbols(document);
  assert.deepStrictEqual(symbols.map(s=>[s.name,s.detail,s.range.start.line,s.range.end.line]),[
    ['singleModle','pose (int is,int grab)',0,2],
    ['main','void ()',4,8]
  ]);

  const localDef=await registrations.definition.provideDefinition(document,new Position(5,6));
  assert(localDef instanceof Location);
  assert.strictEqual(localDef.uri.fsPath,'/ws/main.arl');
  assert.strictEqual(localDef.range.start.line,0);

  const defDoc=makeDocument('/ws/def.arl','func pose point_offset()\nreturn p1\nendfunc');
  fakeVscode.workspace.textDocuments.push(defDoc);
  const crossDef=await registrations.definition.provideDefinition(document,new Position(6,10));
  assert(crossDef instanceof Location);
  assert.strictEqual(crossDef.uri.fsPath,'/ws/def.arl');
  assert.strictEqual(crossDef.range.start.line,0);

  const foreignDefDoc=makeDocument('/other/def.arl','func pose point_offset()\nreturn pForeign\nendfunc');
  const siblingDefDoc=makeDocument('/project/def.arl','func pose point_offset()\nreturn pSibling\nendfunc');
  const siblingMainDoc=makeDocument('/project/main.arl','def::point_offset()');
  fakeVscode.workspace.textDocuments=[foreignDefDoc,siblingDefDoc,siblingMainDoc];
  const siblingDef=await registrations.definition.provideDefinition(siblingMainDoc,new Position(0,10));
  assert(siblingDef instanceof Location);
  assert.strictEqual(siblingDef.uri.fsPath,siblingDefDoc.uri.fsPath,'file::func must resolve an adjacent same-name file before an already-open file from another directory');
  fakeVscode.workspace.textDocuments=[document,defDoc];

  const hover=await registrations.hover.provideHover(document,new Position(7,3));
  assert(hover instanceof Hover);
  const hoverText=Array.isArray(hover.contents)?hover.contents.map(x=>x.value??String(x)).join('\n'):hover.contents.value;
  assert(hoverText.includes('等待条件成立'));
  assert(hoverText.includes('waituntil cond:'));

  const getposeHoverDoc=makeDocument('/ws/getpose-hover.arl','pose p1=getpose(j1,$FLANGE,$WORLD)');
  const getposeHover=await registrations.hover.provideHover(getposeHoverDoc,new Position(0,10));
  assert(getposeHover instanceof Hover);
  const getposeHoverText=Array.isArray(getposeHover.contents)?getposeHover.contents.map(x=>x.value??String(x)).join('\n'):getposeHover.contents.value;
  assert(getposeHoverText.includes('运动学正解：由轴位置求TCP位姿'),'getpose Hover must use its detailed Wizard description');
  assert(getposeHoverText.includes('Forward kinematics: joint → TCP pose'),'getpose Hover must include its English Wizard description');
  assert(getposeHoverText.includes('pose getpose(joint j, tool t, wobj w)'),'getpose Hover must show the Wizard prototype');
  for(const detail of ['`j`','`joint`','轴位置','`t`','`tool`','工具坐标系','`w`','`wobj`','工件坐标系']) {
    assert(getposeHoverText.includes(detail),`getpose Hover must include parameter detail ${detail}`);
  }

  const getdiMultiHoverDoc=makeDocument('/ws/getdi-multi-hover.arl','bool active=getdi(45,48)');
  const getdiMultiHover=await registrations.hover.provideHover(getdiMultiHoverDoc,new Position(0,14));
  const getdiMultiHoverText=Array.isArray(getdiMultiHover.contents)?getdiMultiHover.contents.map(x=>x.value??String(x)).join('\n'):getdiMultiHover.contents.value;
  assert(getdiMultiHoverText.includes('bool getdi(int from, int to)'),'Two-argument getdi Hover must show its matching multi-channel signature');
  assert(getdiMultiHoverText.indexOf('bool getdi(int from, int to)')<getdiMultiHoverText.indexOf('bool getdi(int chan)'),'The signature matching the current getdi call must appear first');

  const getdiSingleHoverDoc=makeDocument('/ws/getdi-single-hover.arl','bool active=getdi(45)');
  const getdiSingleHover=await registrations.hover.provideHover(getdiSingleHoverDoc,new Position(0,14));
  const getdiSingleHoverText=Array.isArray(getdiSingleHover.contents)?getdiSingleHover.contents.map(x=>x.value??String(x)).join('\n'):getdiSingleHover.contents.value;
  assert(getdiSingleHoverText.indexOf('bool getdi(int chan)')<getdiSingleHoverText.indexOf('bool getdi(int from, int to)'),'Single-argument getdi Hover must rank its matching signature first');

  const getipHoverDoc=makeDocument('/ws/getip-hover.arl','bool ok=getip(ip)');
  const getipHover=await registrations.hover.provideHover(getipHoverDoc,new Position(0,10));
  const getipHoverText=Array.isArray(getipHover.contents)?getipHover.contents.map(x=>x.value??String(x)).join('\n'):getipHover.contents.value;
  assert(getipHoverText.includes('bool getip(string ip [, string if_name])'),'Optional function parameters must be visibly marked in Hover');

  const pathPercentHoverDoc=makeDocument('/ws/path-percent-hover.arl','trigger when:P(50),do:onHalfway');
  const pathPercentHover=await registrations.hover.provideHover(pathPercentHoverDoc,new Position(0,14));
  const pathPercentHoverText=Array.isArray(pathPercentHover.contents)?pathPercentHover.contents.map(x=>x.value??String(x)).join('\n'):pathPercentHover.contents.value;
  assert(pathPercentHoverText.includes('当前运动轨迹从起点开始是否已经完成 p%'),'P Hover must explain the user-supplied path-percentage semantics');
  assert(pathPercentHoverText.includes('bool P(double p)'),'P Hover must show its canonical function prototype');

  const plainPDoc=makeDocument('/ws/plain-p.arl','double p=50');
  assert.strictEqual(await registrations.hover.provideHover(plainPDoc,new Position(0,7)),undefined,'Paren-only P must not show function Hover when used as a variable');
  const plainTDoc=makeDocument('/ws/plain-t.arl','double t=1');
  assert.strictEqual(await registrations.hover.provideHover(plainTDoc,new Position(0,7)),undefined,'Paren-only T must not show function Hover when used as a variable');

  const randNoArgDoc=makeDocument('/ws/rand-no-arg.arl','int value=rand()');
  const randNoArgHover=await registrations.hover.provideHover(randNoArgDoc,new Position(0,11));
  const randNoArgHoverText=Array.isArray(randNoArgHover.contents)?randNoArgHover.contents.map(x=>x.value??String(x)).join('\n'):randNoArgHover.contents.value;
  assert(randNoArgHoverText.includes('int rand()'),'rand Hover must retain its no-argument overload');
  assert(randNoArgHoverText.includes('double rand(double start, double end)'),'rand Hover must retain the ranged double overload and return type');

  const tostrHoverDoc=makeDocument('/ws/tostr-hover.arl','string value=tostr(1.25,2)');
  const tostrHover=await registrations.hover.provideHover(tostrHoverDoc,new Position(0,15));
  const tostrHoverText=Array.isArray(tostrHover.contents)?tostrHover.contents.map(x=>x.value??String(x)).join('\n'):tostrHover.contents.value;
  assert(tostrHoverText.includes('string tostr(double v, int precision)'),'tostr Hover must retain its two-argument precision overload');
  assert(!tostrHoverText.includes('int precision, int v'),'tostr Hover must not combine separate forms into a fabricated four-argument signature');

  const ptpCompleteDoc=makeDocument('/ws/ptp-complete-hover.arl','ptp p:p1,sl:10mm,dura:2');
  const ptpCompleteHover=await registrations.hover.provideHover(ptpCompleteDoc,new Position(0,1));
  const ptpCompleteHoverText=Array.isArray(ptpCompleteHover.contents)?ptpCompleteHover.contents.map(x=>x.value??String(x)).join('\n'):ptpCompleteHover.contents.value;
  assert(ptpCompleteHoverText.includes('ptp p:<pose>, [v:|vp:], [s:|sl:|sp:], [t:], [w:], [dura:]'),'ptp Hover must retain the complete documented parameter range when Wizard variants are partial');


  const sysDoc=makeDocument('/ws/sys.arl','$Config_check');
  const sysHover=await registrations.hover.provideHover(sysDoc,new Position(0,5));
  assert(sysHover instanceof Hover);
  const sysHoverText=Array.isArray(sysHover.contents)?sysHover.contents.map(x=>x.value??String(x)).join('\n'):sysHover.contents.value;
  assert(sysHoverText.includes('轴配置检查使能'),'System-variable Hover must use its own Wizard-derived description');
  assert(sysHoverText.includes('Axis configuration check enable'),'System-variable Hover must include English description');

  const ifDoc=makeDocument('/ws/if.arl','if(i==1)\nendif');
  const ifHover=await registrations.hover.provideHover(ifDoc,new Position(0,1));
  assert(ifHover instanceof Hover);
  const ifHoverText=Array.isArray(ifHover.contents)?ifHover.contents.map(x=>x.value??String(x)).join('\n'):ifHover.contents.value;
  assert(ifHoverText.includes('条件判断，满足时执行块内代码'),'if Hover must use Wizard-derived description');
  assert(ifHoverText.includes('if(bool 表达式)'),'if Hover must show its own syntax');



  assert(registrations.completionTriggers.includes('o'), 'Typing normal letters must explicitly trigger ARL completions');
  assert(registrations.completionTriggers.includes('$'), 'Typing $ must trigger ARL system-variable completions');

  const completionItems=await registrations.completion.provideCompletionItems(document,new Position(3,0));
  assert.deepStrictEqual(completionItems,[], 'Blank input must not show completion candidates');


  const dollarDoc=makeDocument('/ws/dollar.arl','$');
  const dollarItems=await registrations.completion.provideCompletionItems(dollarDoc,new Position(0,1));
  assert(dollarItems.length>0 && dollarItems.every(x=>String(x.label).startsWith('$')), 'Typing $ should show only system variables');
  const atHome=dollarItems.find(x=>x.label==='$AT_HOME');
  assert(atHome, 'Expected $AT_HOME completion');
  assert.strictEqual(atHome.range.start.character,0,'System-variable completion must replace the typed $');
  assert.strictEqual(atHome.range.end.character,1,'System-variable replacement range must include exactly the typed $');
  assert.strictEqual(atHome.insertText,'$AT_HOME','System variable insert text must contain one $ only');

  const configCheck=dollarItems.find(x=>x.label==='$Config_check');
  assert(configCheck, 'Expected $Config_check completion');
  assert.strictEqual(configCheck.detail, '轴配置检查使能', 'System-variable completion detail must show its specific Chinese description');
  const configDocumentation=configCheck.documentation?.value ?? String(configCheck.documentation||'');
  assert(configDocumentation.includes('Axis configuration check enable'), 'System-variable completion documentation must include its English description');




  // v1.1.0: Smart Completion is optional. When enabled, fixed ARL syntax is
  // inserted as a snippet, while every parameter value remains freely editable.
  smartCompletionEnabled=true;
  const ptpSmartDoc=makeDocument('/ws/ptp-smart.arl','ptp');
  const ptpSmartItems=await registrations.completion.provideCompletionItems(ptpSmartDoc,new Position(0,3));
  const ptpSmartSnippets=ptpSmartItems.filter(x=>x.insertText instanceof SnippetString).map(x=>x.insertText.value);
  assert(ptpSmartSnippets.includes('ptp p:${1},vp:${2}%,sp:${3}%,t:${4:\\$FLANGE},w:${5:\\$WORLD}'),'Smart ptp literal template should escape ARL $ defaults while keeping snippet placeholders active');
  assert(ptpSmartSnippets.includes('ptp p:${1},v:${2},s:${3},t:${4:\\$FLANGE},w:${5:\\$WORLD}'),'Smart ptp should escape ARL $ defaults in the variable-parameter structure');
  const linSmartDoc=makeDocument('/ws/lin-smart.arl','lin');
  const linSmartItems=await registrations.completion.provideCompletionItems(linSmartDoc,new Position(0,3));
  const linSmartSnippets=linSmartItems.filter(x=>x.insertText instanceof SnippetString).map(x=>x.insertText.value);
  assert(linSmartSnippets.includes('lin p:${1},vl:${2}mm/s,sl:${3}mm,t:${4:\\$FLANGE},w:${5:\\$WORLD}'),'lin value template must escape ARL $ defaults and keep unit syntax outside placeholders');
  const ptpSmartItem=ptpSmartItems.find(x=>x.command?.command==='peitianArl.beginSmartCompletion');
  assert(ptpSmartItem,'Motion Smart Completion should start snippet-session tracking');
  assert(!ptpSmartSnippets.some(x=>x.includes('p4')),'Smart snippets must leave user values editable');
  const ptpLiteralItem=ptpSmartItems.find(x=>x.insertText?.value==='ptp p:${1},vp:${2}%,sp:${3}%,t:${4:\\$FLANGE},w:${5:\\$WORLD}');
  const ptpVariableItem=ptpSmartItems.find(x=>x.insertText?.value==='ptp p:${1},v:${2},s:${3},t:${4:\\$FLANGE},w:${5:\\$WORLD}');
  assert.strictEqual(ptpLiteralItem?.kind, fakeVscode.CompletionItemKind.Value, 'Value/double smart template should use Value icon');
  assert(ptpLiteralItem?.detail.includes('Value / double'), 'Value template description should make clear that numeric literals or double variables are accepted');
  assert.strictEqual(ptpVariableItem?.kind, fakeVscode.CompletionItemKind.Variable, 'Variable smart template should use Variable icon');

  const offsetSmartDoc=makeDocument('/ws/offset-smart.arl','offset');
  const offsetSmartItems=await registrations.completion.provideCompletionItems(offsetSmartDoc,new Position(0,6));
  const offsetSmartSnippets=offsetSmartItems
    .filter(x=>(typeof x.label==='string'?x.label:x.label?.label)==='offset' && x.insertText instanceof SnippetString)
    .map(x=>x.insertText.value);
  assert(offsetSmartSnippets.includes('offset(${1}, ${2}, ${3}, ${4})'),'offset should expose a blank Wizard short-form variant and let candidates drive input');
  assert(offsetSmartSnippets.includes('offset(${1}, ${2}, ${3}, ${4}, ${5}, ${6}, ${7})'),'offset should expose a blank Wizard full-form variant and let candidates drive input');

  const cposeSmartDoc=makeDocument('/ws/cpose-smart.arl','cpose');
  const cposeSmartItems=await registrations.completion.provideCompletionItems(cposeSmartDoc,new Position(0,'cpose'.length));
  const cposeSnippet=cposeSmartItems.find(x=>(typeof x.label==='string'?x.label:x.label?.label)==='cpose' && x.insertText instanceof SnippetString)?.insertText.value;
  assert.strictEqual(cposeSnippet,'cpose(${1}, ${2})','cpose should start with blank Wizard placeholders; tool/work-object values belong in the candidate list');

  const getposeSmartDoc=makeDocument('/ws/getpose-smart.arl','getpose');
  const getposeSmartItems=await registrations.completion.provideCompletionItems(getposeSmartDoc,new Position(0,'getpose'.length));
  const getposeSnippet=getposeSmartItems.find(x=>(typeof x.label==='string'?x.label:x.label?.label)==='getpose' && x.insertText instanceof SnippetString)?.insertText.value;
  assert.strictEqual(getposeSnippet,'getpose(${1}, ${2}, ${3})','getpose should start with blank Wizard placeholders; typed candidates drive each argument');

  const waitSmartDoc=makeDocument('/ws/wait-smart.arl','waituntil');
  const waitSmartItems=await registrations.completion.provideCompletionItems(waitSmartDoc,new Position(0,'waituntil'.length));
  const waitSmartSnippets=waitSmartItems.filter(x=>(typeof x.label==='string'?x.label:x.label?.label)==='waituntil' && x.insertText instanceof SnippetString).map(x=>x.insertText.value);
  assert(waitSmartSnippets.includes('waituntil cond:${1}'),'waituntil should offer a blank required-only Wizard Smart template');
  assert(waitSmartSnippets.some(x=>x.includes('maxtime:${2}')),'waituntil should also expose a blank full optional-parameter Wizard template');
  const waitSmartItem=waitSmartItems.find(x=>(typeof x.label==='string'?x.label:x.label?.label)==='waituntil' && x.command?.command==='peitianArl.beginSmartCompletion');
  assert(waitSmartItem,'Wizard Smart Completion must start the generic smart-snippet session, not only motion instructions');

  const setdoSmartDoc=makeDocument('/ws/setdo-smart.arl','setdo');
  const setdoSmartItems=await registrations.completion.provideCompletionItems(setdoSmartDoc,new Position(0,'setdo'.length));
  const setdoSnippets=setdoSmartItems.filter(x=>x.insertText instanceof SnippetString).map(x=>x.insertText.value);
  assert(setdoSnippets.includes('setdo(${1}, ${2})'),'setdo single-channel Wizard variant missing');
  assert(setdoSnippets.includes('setdo(${1}, ${2}, ${3})'),'setdo multi-channel Wizard variant missing');

  const ifSmartDoc=makeDocument('/ws/if-smart.arl','if');
  const ifSmartItems=await registrations.completion.provideCompletionItems(ifSmartDoc,new Position(0,2));
  const ifSmart=ifSmartItems.find(x=>(typeof x.label==='string'?x.label:x.label?.label)==='if');
  assert(ifSmart?.insertText instanceof SnippetString);
  assert.strictEqual(ifSmart.insertText.value,'if(${1:condition})\n    ${0}\nendif');



  const linValueDoc=makeDocument('/ws/lin-value.arl','double v1\nspeed vh\nlin p:p1,vl:v');
  fakeVscode.workspace.textDocuments=[document,defDoc,linValueDoc];
  const linValueItems=await registrations.completion.provideCompletionItems(linValueDoc,new Position(2,'lin p:p1,vl:v'.length));
  const linValueLabels=linValueItems.map(x=>typeof x.label==='string'?x.label:x.label?.label);
  assert(linValueLabels.includes('v1'),'vl: must allow declared double variables in value-with-unit form');
  assert(!linValueLabels.includes('vh'),'vl: must not suggest speed variables; value form expects double');
  const v1UnitItem=linValueItems.find(x=>(typeof x.label==='string'?x.label:x.label?.label)==='v1');
  assert.strictEqual(v1UnitItem?.insertText,'v1mm/s','Accepting a double variable in vl: must append the Wizard-defined mm/s unit');

  assert(registrations.registeredCommands.has('peitianArl.beginSmartCompletion'),'Missing generic Smart Completion start command');
  assert(registrations.registeredCommands.has('peitianArl.smartTab'),'Missing Smart Tab command');
  assert(registrations.registeredCommands.has('peitianArl.smartEnter'),'Missing Smart Enter command');
  registrations.executedCommands.length=0;
  fakeVscode.window.activeTextEditor={document:ptpSmartDoc,selection:{active:new Position(0,3),start:new Position(0,3),end:new Position(0,3),isEmpty:true},setDecorations(){}};
  await registrations.registeredCommands.get('peitianArl.beginSmartCompletion')();
  assert(registrations.executedCommands.some(x=>x.command==='setContext' && x.args[0]==='peitianArl.smartSnippetActive' && x.args[1]===true),'Starting any Smart snippet must mark the generic ARL smart-snippet context active');
  assert(!registrations.executedCommands.some(x=>x.command==='editor.action.triggerSuggest'),'Starting a Smart snippet must not open candidates before the user types the first character');
  registrations.executedCommands.length=0;
  await registrations.registeredCommands.get('peitianArl.smartTab')();
  assert(registrations.executedCommands.some(x=>x.command==='jumpToNextSnippetPlaceholder'),'Smart Tab must advance to the next snippet placeholder');
  assert(!registrations.executedCommands.some(x=>x.command==='editor.action.triggerSuggest'),'Smart Tab must not open candidates on an empty placeholder; suggestions begin after the first typed character');

  const tabCandidateDoc=makeDocument('/ws/tab-candidate.arl',[
    'double i123=10.2',
    'lin p:$P[21],vl:650mm/s,sl:0mm,t:$FLANGE,w:$WORLD'
  ].join('\n'));
  const vlStart=tabCandidateDoc.lineAt(1).text.indexOf('650');
  const vlEnd=vlStart+3;
  fakeVscode.workspace.textDocuments=[document,defDoc,tabCandidateDoc];
  fakeVscode.window.activeTextEditor={
    document:tabCandidateDoc,
    selection:{active:new Position(1,vlEnd),start:new Position(1,vlStart),end:new Position(1,vlEnd),isEmpty:false},
    setDecorations(){}
  };
  const tabCandidateItems=await registrations.completion.provideCompletionItems(
    tabCandidateDoc,new Position(1,vlEnd),null,{triggerKind:fakeVscode.CompletionTriggerKind.Invoke}
  );
  assert.deepStrictEqual(tabCandidateItems,[],'Selecting/entering a Smart placeholder must not show any candidates before the user types a first character');


  const blankWaitDoc=makeDocument('/ws/blank-wait.arl',[
    'func void main()',
    '    double i123=10.2',
    '    waittime time:',
    'endfunc'
  ].join('\n'));
  fakeVscode.workspace.textDocuments=[document,defDoc,blankWaitDoc];
  const blankWaitPos=new Position(2,'    waittime time:'.length);
  fakeVscode.window.activeTextEditor={document:blankWaitDoc,selection:{active:blankWaitPos,start:blankWaitPos,end:blankWaitPos,isEmpty:true},setDecorations(){}};
  const blankWaitItems=await registrations.completion.provideCompletionItems(blankWaitDoc,blankWaitPos,null,{triggerKind:fakeVscode.CompletionTriggerKind.Invoke});
  assert.deepStrictEqual(blankWaitItems,[],'An empty Wizard parameter must stay quiet until the user types the first character');

  // Once a motion Smart snippet owns the fixed unit, parameter candidates must
  // insert only the value. This stays true even if VS Code leaves only part of
  // the unit to the right of the completion range while editing the placeholder.
  const partialUnitDoc=makeDocument('/ws/partial-unit.arl',[
    'double i123=10.2',
    'lin p:p1,vl:im/s,sl:0mm,t:$FLANGE,w:$WORLD'
  ].join('\n'));
  fakeVscode.workspace.textDocuments=[document,defDoc,partialUnitDoc];
  const partialUnitPos=new Position(1,'lin p:p1,vl:i'.length);
  fakeVscode.window.activeTextEditor={document:partialUnitDoc,selection:{active:partialUnitPos,start:partialUnitPos,end:partialUnitPos,isEmpty:true},setDecorations(){}};
  registrations.executedCommands.length=0;
  await registrations.registeredCommands.get('peitianArl.beginSmartCompletion')();
  const partialUnitItems=await registrations.completion.provideCompletionItems(
    partialUnitDoc,partialUnitPos,null,{triggerKind:fakeVscode.CompletionTriggerKind.Invoke}
  );
  const partialI123=partialUnitItems.find(x=>(typeof x.label==='string'?x.label:x.label?.label)==='i123');
  assert.strictEqual(partialI123?.insertText,'i123','Inside an active Smart snippet the outer template owns mm/s, so a double variable candidate must never append another unit');

  const waittimeUsedDoc=makeDocument('/ws/waittime-used.arl','waittime time:1');
  fakeVscode.window.activeTextEditor={document:waittimeUsedDoc,selection:{active:new Position(0,'waittime time:1'.length),start:new Position(0,'waittime time:1'.length),end:new Position(0,'waittime time:1'.length),isEmpty:true},setDecorations(){}};
  await registrations.registeredCommands.get('peitianArl.beginSmartCompletion')();
  registrations.executedCommands.length=0;
  await registrations.registeredCommands.get('peitianArl.smartEnter')();
  assert(registrations.executedCommands.some(x=>x.command==='type' && x.args[0]?.text==='\n'),'Smart Enter must insert a normal newline');
  assert(registrations.executedCommands.some(x=>x.command==='leaveSnippet'),'Smart Enter must leave snippet mode so the previous placeholder highlight disappears');
  assert(registrations.executedCommands.some(x=>x.command==='setContext' && x.args[0]==='peitianArl.smartSnippetActive' && x.args[1]===false),'Smart Enter must clear the generic smart-snippet context');

  const waitRecentDoc=makeDocument('/ws/wait-recent.arl',[
    'double i123=10.2',
    'waituntil cond:getdi(1),maxtime:3,timeoutflag:false',
    'waituntil cond:getdi(2),maxtime:i,timeoutflag:timeoutflag'
  ].join('\n'));
  const mtLine=waitRecentDoc.lineAt(2).text;
  const mtEnd=mtLine.indexOf(',timeoutflag');
  fakeVscode.workspace.textDocuments=[document,defDoc,waitRecentDoc];
  fakeVscode.window.activeTextEditor={document:waitRecentDoc,selection:{active:new Position(2,mtEnd),start:new Position(2,mtEnd),end:new Position(2,mtEnd),isEmpty:true},setDecorations(){}};
  const recentItems=await registrations.completion.provideCompletionItems(waitRecentDoc,new Position(2,mtEnd),null,{triggerKind:fakeVscode.CompletionTriggerKind.Invoke});
  const recentLabels=recentItems.map(x=>typeof x.label==='string'?x.label:x.label?.label);
  assert.deepStrictEqual(recentLabels,['i123'],'After typing i, waituntil maxtime must strictly show matching declared double variables only');

  const recentNumberDoc=makeDocument('/ws/wait-recent-number.arl',[
    'double i123=10.2',
    'waituntil cond:getdi(1),maxtime:3,timeoutflag:false',
    'waituntil cond:getdi(2),maxtime:3,timeoutflag:timeoutflag'
  ].join('\n'));
  const numberPos=new Position(2,recentNumberDoc.lineAt(2).text.indexOf(',timeoutflag'));
  fakeVscode.workspace.textDocuments=[document,defDoc,recentNumberDoc];
  fakeVscode.window.activeTextEditor={document:recentNumberDoc,selection:{active:numberPos,start:numberPos,end:numberPos,isEmpty:true},setDecorations(){}};
  const recentNumberItems=await registrations.completion.provideCompletionItems(recentNumberDoc,numberPos,null,{triggerKind:fakeVscode.CompletionTriggerKind.Invoke});
  const recentNumberLabels=recentNumberItems.map(x=>typeof x.label==='string'?x.label:x.label?.label);
  assert(recentNumberLabels.includes('3'),'Typing 3 must allow the still-existing recent value 3 for the same instruction parameter');
  assert(!recentNumberLabels.includes('250') && !recentNumberLabels.includes('-1'),'Recent values must not leak across unrelated parameters');


  const numericTypedDoc=makeDocument('/ws/numeric-typed.arl',[
    'func void main()',
    '    double i123=10.2',
    '    waittime time:0.5',
    'endfunc'
  ].join('\n'));
  fakeVscode.workspace.textDocuments=[document,defDoc,numericTypedDoc];
  const numericTypedEnd='    waittime time:0.5'.length;
  fakeVscode.window.activeTextEditor={
    document:numericTypedDoc,
    selection:{active:new Position(2,numericTypedEnd),start:new Position(2,numericTypedEnd),end:new Position(2,numericTypedEnd),isEmpty:true},
    setDecorations(){}
  };
  registrations.executedCommands.length=0;
  await registrations.registeredCommands.get('peitianArl.beginSmartCompletion')();
  registrations.executedCommands.length=0;
  const numericTypedItems=await registrations.completion.provideCompletionItems(
    numericTypedDoc,new Position(2,numericTypedEnd),null,{triggerKind:fakeVscode.CompletionTriggerKind.Invoke}
  );
  const numericTypedLabels=numericTypedItems.map(x=>typeof x.label==='string'?x.label:x.label?.label);
  assert.deepStrictEqual(numericTypedLabels,['0.5'],'Typing 0.5 must strictly match only 0.5; unrelated double variables must disappear');
  assert(registrations.executedCommands.some(x=>x.command==='setContext' && x.args[0]==='peitianArl.smartValueReady' && x.args[1]===true),'A complete manual numeric value must still enable Smart Enter/Tab when an exact matching suggestion exists');

  // When a user types a numeric literal manually inside a Smart placeholder,
  // the native suggest widget must get out of the way. Otherwise VS Code's
  // normal Tab binding accepts the currently highlighted Wizard value (for
  // example 250) instead of preserving the user's 22.
  const manualMotionDoc=makeDocument('/ws/manual-motion.arl','double i123=10.2\nlin p:p1,vl:22mm/s,sl:0mm,t:$FLANGE,w:$WORLD');
  const manualMotionPos=new Position(1,'lin p:p1,vl:22'.length);
  fakeVscode.window.activeTextEditor={document:manualMotionDoc,selection:{active:manualMotionPos,start:manualMotionPos,end:manualMotionPos,isEmpty:true},setDecorations(){}};
  registrations.executedCommands.length=0;
  await registrations.registeredCommands.get('peitianArl.beginSmartCompletion')();
  registrations.executedCommands.length=0;
  registrations.changeTextDocumentListener({document:manualMotionDoc,contentChanges:[{text:'2'}]});
  await new Promise(resolve=>setTimeout(resolve,60));
  const manualMotionCommands=registrations.executedCommands.map(x=>x.command);
  assert(!manualMotionCommands.includes('hideSuggestWidget'),'Manual numeric typing no longer needs a special hide path; strict prefix matching removes unrelated candidates');
  assert(!manualMotionCommands.includes('editor.action.triggerSuggest'),'Typing 22 must not open suggestions when no candidate starts with 22');

  const numericPrefixDoc=makeDocument('/ws/numeric-prefix.arl','lin p:p1,vl:2mm/s,sl:0mm,t:$FLANGE,w:$WORLD');
  const numericPrefixPos=new Position(0,'lin p:p1,vl:2'.length);
  fakeVscode.workspace.textDocuments=[document,defDoc,numericPrefixDoc];
  fakeVscode.window.activeTextEditor={document:numericPrefixDoc,selection:{active:numericPrefixPos,start:numericPrefixPos,end:numericPrefixPos,isEmpty:true},setDecorations(){}};
  await registrations.registeredCommands.get('peitianArl.beginSmartCompletion')();
  registrations.executedCommands.length=0;
  const numericPrefixItems=await registrations.completion.provideCompletionItems(
    numericPrefixDoc,numericPrefixPos,null,{triggerKind:fakeVscode.CompletionTriggerKind.Invoke}
  );
  assert(numericPrefixItems.some(x=>String(x.label)==='250'),'The 2 prefix must keep the matching 250 Wizard candidate');
  assert(registrations.executedCommands.some(x=>x.command==='setContext' && x.args[0]==='peitianArl.smartValueReady' && x.args[1]===false),'A numeric prefix with a different matching candidate must leave Tab/Enter to the Suggest Widget');

  const firstCharDoc=makeDocument('/ws/first-char.arl','double i123=10.2\nwaittime time:i');
  const firstCharPos=new Position(1,'waittime time:i'.length);
  fakeVscode.workspace.textDocuments=[document,defDoc,firstCharDoc];
  fakeVscode.window.activeTextEditor={document:firstCharDoc,selection:{active:firstCharPos,start:firstCharPos,end:firstCharPos,isEmpty:true},setDecorations(){}};
  registrations.executedCommands.length=0;
  registrations.changeTextDocumentListener({document:firstCharDoc,contentChanges:[{text:'i'}]});
  await new Promise(resolve=>setTimeout(resolve,60));
  assert(registrations.executedCommands.some(x=>x.command==='editor.action.triggerSuggest'),'Typing the first matching character in a Wizard parameter must trigger the Suggest Widget');

  const exactNumericDoc=makeDocument('/ws/exact-numeric.arl','double i123=10.2\nwaittime time:1');
  fakeVscode.workspace.textDocuments=[document,defDoc,exactNumericDoc];
  fakeVscode.window.activeTextEditor={document:exactNumericDoc,selection:{active:new Position(1,'waittime time:1'.length),start:new Position(1,'waittime time:1'.length),end:new Position(1,'waittime time:1'.length),isEmpty:true},setDecorations(){}};
  registrations.executedCommands.length=0;
  await registrations.registeredCommands.get('peitianArl.smartEnter')();
  const enterCommands=registrations.executedCommands.map(x=>x.command);
  assert(enterCommands.includes('hideSuggestWidget'),'Smart Enter must dismiss an active suggestion widget before inserting the newline');
  assert(enterCommands.indexOf('hideSuggestWidget') < enterCommands.indexOf('type'),'Smart Enter must hide suggestions before typing the newline');


  const exactNumericItems=await registrations.completion.provideCompletionItems(
    exactNumericDoc,new Position(1,'waittime time:1'.length),null,{triggerKind:fakeVscode.CompletionTriggerKind.Invoke}
  );
  const exactNumericLabels=exactNumericItems.map(x=>typeof x.label==='string'?x.label:x.label?.label);
  assert.strictEqual(exactNumericLabels[0],'1','The exact manually typed numeric value must be the first completion item');
  assert.deepStrictEqual(exactNumericLabels,['1'],'Typing 1 must strictly filter the list to the matching 1 candidate');

  registrations.executedCommands.length=0;
  await registrations.registeredCommands.get('peitianArl.smartTab')();
  const tabCommands=registrations.executedCommands.map(x=>x.command);
  assert(tabCommands.includes('hideSuggestWidget'),'Smart Tab must dismiss an exact/manual-value suggestion before advancing');
  assert(tabCommands.indexOf('hideSuggestWidget') < tabCommands.indexOf('jumpToNextSnippetPlaceholder'),'Smart Tab must hide suggestions before advancing the snippet placeholder');

  smartCompletionEnabled=false;
  const ptpBasicItems=await registrations.completion.provideCompletionItems(ptpSmartDoc,new Position(0,3));
  const ptpBasic=ptpBasicItems.find(x=>x.label==='ptp');
  assert(ptpBasic,'Disabling Smart Completion must keep normal IntelliSense');
  assert.strictEqual(ptpBasic.insertText.value,'ptp $0','Disabled Smart Completion should restore the lightweight plain instruction insertion');
  assert(!ptpBasic.command,'Basic completion must not force the Suggest Widget');
  smartCompletionEnabled=true;




  // 1.0.0 RC7: typed parameters stay silent until the first character.
  // Once `$` is typed, system-variable arrays and observed indexed values can
  // participate using the same strict-prefix rule.
  const indexedPoseDoc=makeDocument('/ws/indexed-pose.arl',[
    'pose p1',
    'ptp p:$P[21],vp:30%,sp:0%,t:$FLANGE,w:$WORLD',
    'ptp p:'
  ].join('\n'));
  fakeVscode.workspace.textDocuments=[document,defDoc,indexedPoseDoc];
  const emptyPoseItems=await registrations.completion.provideCompletionItems(
    indexedPoseDoc,
    new Position(2,'ptp p:'.length),
    null,
    {triggerKind:fakeVscode.CompletionTriggerKind.TriggerCharacter,triggerCharacter:':'}
  );
  assert.deepStrictEqual(emptyPoseItems,[],'Empty p: must not show candidates before the first typed character');

  const dollarPoseDoc=makeDocument('/ws/indexed-dollar.arl',[
    'pose p1',
    'ptp p:$P[21],vp:30%,sp:0%,t:$FLANGE,w:$WORLD',
    'ptp p:$'
  ].join('\n'));
  fakeVscode.workspace.textDocuments=[document,defDoc,dollarPoseDoc];
  const dollarPoseItems=await registrations.completion.provideCompletionItems(dollarPoseDoc,new Position(2,'ptp p:$'.length));
  const dollarPoseLabels=dollarPoseItems.map(x=>typeof x.label==='string'?x.label:x.label?.label);
  assert(dollarPoseLabels.includes('$P'),'Typing $ should show the base pose system-variable array');
  assert(dollarPoseLabels.includes('$P[21]'),'Typing $ should show previously used $P[21]');
  const baseP=dollarPoseItems.find(x=>x.label==='$P');
  assert(baseP?.insertText instanceof SnippetString,'Base $P completion should be an indexed snippet');
  assert.strictEqual(baseP.insertText.value,'\\$P[${1}]','$P should be escaped as ARL text while the bracket placeholder remains active');
  const usedP21=dollarPoseItems.find(x=>x.label==='$P[21]');
  assert.strictEqual(usedP21?.insertText,'$P[21]','Observed indexed system-variable values should insert directly');

  const strictPDoc=makeDocument('/ws/indexed-strict.arl','pose p1\nptp p:p');
  fakeVscode.workspace.textDocuments=[document,defDoc,strictPDoc];
  const strictPItems=await registrations.completion.provideCompletionItems(strictPDoc,new Position(1,'ptp p:p'.length));
  const strictPLabels=strictPItems.map(x=>typeof x.label==='string'?x.label:x.label?.label);
  assert(strictPLabels.includes('p1'),'Typing p should keep normal pose variables');
  assert(!strictPLabels.some(x=>String(x).startsWith('$')),'Typing p must strictly remove $ system-variable candidates');


  const offDoc=makeDocument('/ws/off.arl','off');
  const offItems=await registrations.completion.provideCompletionItems(offDoc,new Position(0,3));
  assert(offItems.some(x=>x.label==='offset'),'Typing off must surface offset from the ARL provider');

  const movDoc=makeDocument('/ws/mov.arl','mov');
  const movItems=await registrations.completion.provideCompletionItems(movDoc,new Position(0,3));
  assert(movItems.some(x=>x.label==='movej'),'Typing mov must surface movej from the ARL provider');


  // v0.6.6: free input starts after one typed character, while named
  // instruction parameters use type-aware variable-only completion.
  const freePDoc=makeDocument('/ws/free-p.arl','p');
  const freePItems=await registrations.completion.provideCompletionItems(freePDoc,new Position(0,1));
  assert(freePItems.some(x=>x.label==='ptp'),'Free p prefix should include ptp');
  assert(freePItems.some(x=>x.label==='pose'),'Free p prefix should include pose datatype');

  const dataDoc=makeDocument('/ws/type1_data.arl','pose pData\njoint jData\nspeed vData');
  const foreignDataDoc=makeDocument('/ws/type2_data.arl','pose pForeign\nspeed vForeign');
  const typedPoseDoc=makeDocument('/ws/type1.arl','pose pLocal\njoint jLocal\nptp p:p');
  fakeVscode.workspace.textDocuments=[document,defDoc,dataDoc,foreignDataDoc,typedPoseDoc];
  const colonOnly=await registrations.completion.provideCompletionItems(makeDocument('/ws/colon.arl','ptp p:'),new Position(0,6));
  assert.deepStrictEqual(colonOnly,[],'ptp p: must not open suggestions before a value prefix is typed');



  const colonInvokeDoc=makeDocument('/ws/type1.arl','pose pLocal\nptp p:');
  fakeVscode.workspace.textDocuments=[document,defDoc,dataDoc,foreignDataDoc,colonInvokeDoc];
  const colonManual=await registrations.completion.provideCompletionItems(
    colonInvokeDoc,
    new Position(1,6),
    undefined,
    {triggerKind:fakeVscode.CompletionTriggerKind.Invoke}
  );
  assert.deepStrictEqual(colonManual,[],'Even explicit invocation at blank p: must stay quiet until the first typed character');


  const typedPoseItems=await registrations.completion.provideCompletionItems(typedPoseDoc,new Position(2,7));
  const typedPoseLabels=typedPoseItems.map(x=>x.label);
  assert(typedPoseLabels.includes('pLocal'),'Typed pose completion should include current-file pose variables');
  assert(typedPoseLabels.includes('pData'),'Typed pose completion should include the paired type1_data.arl pose variables');
  assert(!typedPoseLabels.includes('pForeign'),'Typed pose completion must not include variables from unrelated type2_data.arl');
  assert(!typedPoseLabels.includes('jLocal'),'Typed pose completion must exclude joint variables');
  assert(!typedPoseLabels.includes('ptp'),'Typed pose completion must exclude instructions');
  assert(!typedPoseLabels.includes('pose'),'Typed pose completion must exclude datatype keywords');

  const typedSysDoc=makeDocument('/ws/sys-pose.arl','ptp p:$');
  const typedSysItems=await registrations.completion.provideCompletionItems(typedSysDoc,new Position(0,7));
  assert(typedSysItems.some(x=>x.label==='$P'),'Pose context with $ prefix should include $P');
  assert(!typedSysItems.some(x=>x.label==='$D'),'Pose context with $ prefix must exclude non-pose system variables');

  const typedSpeedDoc=makeDocument('/ws/speed.arl','speed vh\npose p1\nptp v:v');
  const typedSpeedItems=await registrations.completion.provideCompletionItems(typedSpeedDoc,new Position(2,7));
  assert(typedSpeedItems.some(x=>x.label==='vh'),'ptp v:v should include speed variables');
  assert(!typedSpeedItems.some(x=>x.label==='p1'),'ptp v:v must exclude pose variables');

  const standaloneMain=makeDocument('/standalone/job.arl','ptp p:p');
  makeDocument('/standalone/job_data.arl','pose pairedPoint');
  fakeVscode.workspace.textDocuments=[standaloneMain];
  const standaloneItems=await registrations.completion.provideCompletionItems(standaloneMain,new Position(0,'ptp p:p'.length));
  assert(standaloneItems.some(x=>x.label==='pairedPoint'),'A standalone ARL file must load its closed same-directory _data.arl companion');

  assert.strictEqual(registrations.fileWatcher?.pattern,'**/*.arl','Workspace ARL files must be watched for external changes');
  makeDocument('/standalone/job_data.arl','pose pRefreshed');
  await registrations.fileWatcher.listeners.change(makeUri('/standalone/job_data.arl'));
  const refreshedItems=await registrations.completion.provideCompletionItems(standaloneMain,new Position(0,'ptp p:p'.length));
  assert(refreshedItems.some(x=>x.label==='pRefreshed'),'External companion-file changes must refresh indexed variables');
  assert(!refreshedItems.some(x=>x.label==='pairedPoint'),'External companion-file changes must remove stale variables');

  const middleTokenDoc=makeDocument('/ws/middle-token.arl','pose pHome\nptp p:pOld');
  fakeVscode.workspace.textDocuments=[middleTokenDoc];
  const middleTokenItems=await registrations.completion.provideCompletionItems(middleTokenDoc,new Position(1,'ptp p:p'.length));
  const middlePHome=middleTokenItems.find(x=>x.label==='pHome');
  assert(middlePHome,'Typing inside pOld must still offer pHome');
  assert.strictEqual(middlePHome.range.start.character,'ptp p:'.length);
  assert.strictEqual(middlePHome.range.end.character,'ptp p:pOld'.length,'Completion in the middle of a token must replace its old suffix');

  for (const [source,cursor] of [
    ['// mov','// mov'.length],
    ['print "mov','print "mov'.length],
    ['/* mov','/* mov'.length]
  ]) {
    const nonCodeDoc=makeDocument(`/ws/non-code-${cursor}-${source.charCodeAt(0)}.arl`,source);
    const nonCodeItems=await registrations.completion.provideCompletionItems(nonCodeDoc,new Position(0,cursor));
    assert.deepStrictEqual(nonCodeItems,[],`Completion must stay silent inside ${JSON.stringify(source)}`);
  }

  // v0.6.2: typing a matching ARL prefix must proactively open VS Code's
  // Suggest Widget, so Copilot inline suggestions cannot silently mask the
  // language provider. Unknown prefixes must not open it.
  assert(registrations.changeTextDocumentListener,'Expected text change listener');
  registrations.executedCommands.length=0;
  const movEditor={document:movDoc,setDecorations(){}};
  fakeVscode.window.activeTextEditor=movEditor;
  fakeVscode.window.visibleTextEditors=[movEditor];
  registrations.changeTextDocumentListener({document:movDoc,contentChanges:[{text:'v'}]});
  await new Promise(resolve=>setTimeout(resolve,120));
  assert(registrations.executedCommands.some(x=>x.command==='editor.action.triggerSuggest'),'Typing mov must proactively trigger the Suggest Widget');

  registrations.executedCommands.length=0;
  const xyzDoc=makeDocument('/ws/xyz.arl','xyz');
  const xyzEditor={document:xyzDoc,setDecorations(){}};
  fakeVscode.window.activeTextEditor=xyzEditor;
  fakeVscode.window.visibleTextEditors=[xyzEditor];
  registrations.changeTextDocumentListener({document:xyzDoc,contentChanges:[{text:'z'}]});
  await new Promise(resolve=>setTimeout(resolve,120));
  assert(!registrations.executedCommands.some(x=>x.command==='editor.action.triggerSuggest'),'Unknown prefix must not trigger the Suggest Widget');

  for (const source of ['// mov','print "mov','/* mov']) {
    registrations.executedCommands.length=0;
    const nonCodeDoc=makeDocument(`/ws/non-code-trigger-${source.length}.arl`,source);
    const nonCodePos=new Position(0,source.length);
    const nonCodeEditor={document:nonCodeDoc,selection:{active:nonCodePos,start:nonCodePos,end:nonCodePos,isEmpty:true},setDecorations(){}};
    fakeVscode.window.activeTextEditor=nonCodeEditor;
    fakeVscode.window.visibleTextEditors=[nonCodeEditor];
    registrations.changeTextDocumentListener({document:nonCodeDoc,contentChanges:[{text:'v'}]});
    await new Promise(resolve=>setTimeout(resolve,60));
    assert(!registrations.executedCommands.some(x=>x.command==='editor.action.triggerSuggest'),`Typing inside ${JSON.stringify(source)} must not proactively trigger completion`);
  }

  assert(registrations.activeTextEditorListener,'Expected active editor listener');
  assert.doesNotThrow(()=>registrations.activeTextEditorListener(editor),'Switching editors must clear Smart state without calling a missing function');

  const sigDoc=makeDocument('/ws/sig.arl','func void main()\n    offset(p1,10,20,\nendfunc');
  const sig=registrations.signature.provideSignatureHelp(sigDoc,new Position(1,'    offset(p1,10,20,'.length));
  assert(sig instanceof SignatureHelp);
  assert(sig.signatures[0].label.includes('offset('));
  assert.strictEqual(sig.activeParameter,3);

  const getposeSigDoc=makeDocument('/ws/getpose-signature.arl','pose p=getpose(j1,');
  const getposeSig=registrations.signature.provideSignatureHelp(getposeSigDoc,new Position(0,'pose p=getpose(j1,'.length));
  assert(getposeSig.signatures[0].parameters[1].documentation.includes('工具坐标系'),'Signature Help must expose Wizard parameter explanations');

  const userHover=await registrations.hover.provideHover(document,new Position(5,6));
  const userText=Array.isArray(userHover.contents)?userHover.contents.map(x=>x.value??String(x)).join('\n'):userHover.contents.value;
  assert(userText.includes('func pose singleModle(int is,int grab)'));

  console.log('ARL VS Code runtime registration/navigation tests passed');
} finally {
  Module._load=originalLoad;
}
})().catch(err=>{ console.error(err); process.exitCode=1; });

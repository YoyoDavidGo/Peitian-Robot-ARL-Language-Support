'use strict';

const path = require('path');
const vscode = require('vscode');
const { formatArl, getFoldingRanges } = require('./src/arl-structure.cjs');
const {
  parseFunctions,
  findFunction,
  parseFunctionReference,
  lookupHoverEntry,
  parseVariables,
  buildCompletionCandidates,
  getTypedCompletionContext,
  filterTypedCompletionCandidates,
  collectVisibleVariables,
  getSignatureContext,
  getFontWeightProfile,
  collectWeightRanges,
  getCompletionPrefix,
  getSmartCompletionTemplates,
  getWizardHoverSignatures,
  getWizardHoverParameters,
  getWizardParamContext,
  getWizardValueContext,
  collectNearbyWizardValues,
  buildWizardParameterCandidates,
  collectIndexedSystemVariableUsages,
  isIndexedSystemVariable,
  wizardTypeMatches
} = require('./src/arl-intelligence.cjs');
const languageData = require('./language-data/arl-language.json');
const baseHoverReference = require('./language-data/arl-reference.json');
const wizardData = require('./language-data/arl-wizard.json');
const hoverReference = mergeHoverReference(baseHoverReference, wizardData);
const { WorkspaceVariableIndex } = require('./src/workspace-variable-index.cjs');

function mergeHoverReference(reference, wizard) {
  const merged = {
    ...(reference || {}),
    entries: { ...(reference?.entries || {}) }
  };
  for (const [name, wizardEntry] of Object.entries(wizard?.entries || {})) {
    const entry = { ...(merged.entries[name] || {}) };
    for (const field of ['type', 'desc', 'desc_en', 'proto']) {
      if (!entry[field] && wizardEntry?.[field]) entry[field] = wizardEntry[field];
    }
    if (Object.keys(entry).length) merged.entries[name] = entry;
  }
  return merged;
}

function functionRange(document, fn) {
  const endText = document.lineAt(fn.endLine).text;
  return new vscode.Range(
    new vscode.Position(fn.startLine, 0),
    new vscode.Position(fn.endLine, endText.length)
  );
}

function functionSelectionRange(fn) {
  return new vscode.Range(
    new vscode.Position(fn.startLine, fn.nameStart),
    new vscode.Position(fn.startLine, fn.nameEnd)
  );
}

function wordAt(line, character) {
  const re = /\$?[A-Za-z_][A-Za-z0-9_]*/g;
  let match;
  while ((match = re.exec(line)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    if (character >= start && character <= end) return { word: match[0], start, end };
  }
  return null;
}

function documentOffsetAt(document, position) {
  if (typeof document.offsetAt === 'function') return document.offsetAt(position);
  const text = document.getText();
  let offset = 0;
  for (let line = 0; line < position.line; line++) {
    const newline = text.indexOf('\n', offset);
    if (newline < 0) return text.length;
    offset = newline + 1;
  }
  return Math.min(offset + position.character, text.length);
}

function isCodePosition(document, position) {
  const text = document.getText();
  const end = documentOffsetAt(document, position);
  let inBlockComment = false;
  let inLineComment = false;
  let inString = false;

  for (let index = 0; index < end; index++) {
    const current = text[index];
    const next = text[index + 1];
    if (inLineComment) {
      if (current === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (current === '*' && next === '/') {
        inBlockComment = false;
        index++;
      }
      continue;
    }
    if (inString) {
      if (current === '\\') {
        index++;
      } else if (current === '"') {
        inString = false;
      }
      continue;
    }
    if (current === '/' && next === '/') {
      inLineComment = true;
      index++;
    } else if (current === '/' && next === '*') {
      inBlockComment = true;
      index++;
    } else if (current === '"') {
      inString = true;
    }
  }

  return !inBlockComment && !inLineComment && !inString;
}

function escapeSnippetLiteralDollars(value) {
  return String(value).replace(/\\.|\$(?!\d|\{)/g, match => match === '$' ? '\\$' : match);
}

const staticCompletionLabels = (() => {
  const cats = languageData.categories || {};
  const groups = ['instructions','functions','parenOnlyFunctions','logic','keywords','datatypes','systemVariables'];
  return groups.flatMap(group => cats[group] || []).map(value => String(value).toLowerCase());
})();

function hasStaticCompletionMatch(prefix) {
  const query = String(prefix || '').toLowerCase();
  if (!query) return false;
  if (!query.startsWith('$') && query.length < 2) return false;
  return staticCompletionLabels.some(label => label.startsWith(query));
}

const categoryIndex = (() => {
  const map = new Map();
  const labels = {
    logic: 'logic keyword',
    instructions: 'instruction',
    functions: 'built-in function',
    keywords: 'keyword',
    datatypes: 'data type',
    parenOnlyFunctions: 'built-in function',
    systemVariables: 'system variable'
  };
  for (const [group, values] of Object.entries(languageData.categories || {})) {
    for (const value of values) map.set(String(value).toLowerCase(), labels[group] || group);
  }
  return map;
})();
const parenOnlyFunctionNames = new Set((languageData.categories?.parenOnlyFunctions || []).map(value => String(value).toLowerCase()));

async function openReferencedDocument(sourceDocument, fileStem) {
  const normalizedStem = String(fileStem || '').replace(/\.(?:arl|txt)$/i, '');
  if (!normalizedStem) return null;
  const targetNames = [`${normalizedStem}.arl`, `${normalizedStem}.txt`];

  if (sourceDocument.uri?.scheme === 'file' && sourceDocument.uri.fsPath) {
    const dir = path.dirname(sourceDocument.uri.fsPath);
    for (const name of targetNames) {
      const siblingUri = vscode.Uri.file(path.join(dir, name));
      const openSibling = (vscode.workspace.textDocuments || []).find(doc => uriKey(doc.uri) === uriKey(siblingUri));
      if (openSibling) return openSibling;
      try {
        return await vscode.workspace.openTextDocument(siblingUri);
      } catch (_) {}
    }
  }

  for (const doc of vscode.workspace.textDocuments || []) {
    const base = path.basename(doc.uri.fsPath || doc.uri.path || '').toLowerCase();
    if (targetNames.some(name => name.toLowerCase() === base)) return doc;
  }

  if (typeof vscode.workspace.findFiles === 'function') {
    for (const name of targetNames) {
      let uris = [];
      try { uris = await vscode.workspace.findFiles(`**/${name}`, '**/{.git,node_modules}/**', 50); } catch (_) {}
      const exact = (uris || []).find(uri => path.basename(uri.fsPath || uri.path || '').toLowerCase() === name.toLowerCase());
      if (exact) {
        try { return await vscode.workspace.openTextDocument(exact); } catch (_) {}
      }
    }
  }

  return null;
}

async function resolveUserFunction(document, position) {
  const line = document.lineAt(position.line).text;
  const ref = parseFunctionReference(line, position.character);
  if (!ref) return null;

  const targetDocument = ref.file ? await openReferencedDocument(document, ref.file) : document;
  if (!targetDocument) return null;
  const fn = findFunction(targetDocument.getText(), ref.name);
  if (!fn) return null;
  return { ref, document: targetDocument, fn };
}

function userFunctionHover(fn, fileName) {
  const md = new vscode.MarkdownString();
  md.appendMarkdown(`**${fn.name}** — ARL user function`);
  if (fileName) md.appendMarkdown(`  \n${fileName}`);
  md.appendCodeblock(fn.signature, 'arl');
  return md;
}

function builtinHover(word, entry, category, signatures=[], parameters=[]) {
  const md = new vscode.MarkdownString();
  const label = entry?.type || category || 'symbol';
  md.appendMarkdown(`**${word}** — PEITIAN ARL ${label}`);
  if (entry?.desc) md.appendMarkdown(`  \n${entry.desc}`);
  const labels=signatures.length?signatures:(entry?.proto?[entry.proto]:[]);
  if (labels.length) md.appendCodeblock(labels.join('\n'), 'arl');
  if (parameters.length) {
    md.appendMarkdown(`  \n**参数 / Parameters**`);
    for (const parameter of parameters) {
      const requirement=parameter.required?'必填':'可选';
      const unit=parameter.unit?` · 单位 \`${parameter.unit}\``:'';
      const description=parameter.desc?` — ${parameter.desc}`:'';
      const english=parameter.desc_en?` / _${parameter.desc_en}_`:'';
      md.appendMarkdown(`  \n- \`${parameter.key}\` · \`${parameter.type}\` · ${requirement}${unit}${description}${english}`);
    }
  }
  if (entry?.desc_en) md.appendMarkdown(`  \n_${entry.desc_en}_`);
  return md;
}

function completionKind(kind) {
  switch (kind) {
    case 'instruction':
    case 'keyword': return vscode.CompletionItemKind.Keyword;
    case 'function':
    case 'user-function': return vscode.CompletionItemKind.Function;
    case 'variable':
    case 'system-variable': return vscode.CompletionItemKind.Variable;
    case 'datatype': return vscode.CompletionItemKind.TypeParameter || vscode.CompletionItemKind.Keyword;
    case 'wizard-value': return vscode.CompletionItemKind.Value;
    default: return vscode.CompletionItemKind.Value;
  }
}

function completionItem(candidate, replaceRange, referenceEntry, options={}) {
  const item = new vscode.CompletionItem(candidate.label, completionKind(candidate.kind));
  item.detail = candidate.detail || candidate.type || 'PEITIAN ARL';
  if (candidate.wizardCurrentInput) {
    item.filterText = String(candidate.label);
    item.preselect = true;
  } else if (options.keepVisiblePrefix) {
    item.filterText = `${options.keepVisiblePrefix}${candidate.label}`;
  } else if (candidate.wizardKeepVisiblePrefix) {
    item.filterText = `${candidate.wizardKeepVisiblePrefix}${candidate.label}`;
  }
  if (candidate.kind === 'system-variable' && referenceEntry?.desc) {
    item.detail = referenceEntry.desc;
    const docs = new vscode.MarkdownString();
    docs.appendMarkdown(`**${candidate.label}** — PEITIAN ARL system variable`);
    docs.appendMarkdown(`  \n${referenceEntry.desc}`);
    if (referenceEntry.desc_en) docs.appendMarkdown(`  \n_${referenceEntry.desc_en}_`);
    item.documentation = docs;
  }
  if (replaceRange) item.range = replaceRange;
  const rank = {
    'variable':'0', 'user-function':'1', 'instruction':'2', 'function':'3',
    'datatype':'4', 'keyword':'5', 'system-variable':'6'
  }[candidate.kind] || '9';
  item.sortText = Number.isInteger(candidate.wizardOrder)
    ? `0_${String(candidate.wizardOrder).padStart(4,'0')}_${String(candidate.label).toLowerCase()}`
    : `${rank}_${String(candidate.label).toLowerCase()}`;
  if (candidate.wizardUnit) {
    const label=String(candidate.label);
    const unit=String(candidate.wizardUnit);
    item.insertText = options.suppressWizardUnit || options.unitAlreadyPresent || label.endsWith(unit) ? label : `${label}${unit}`;
  } else if (candidate.kind === 'function' || candidate.kind === 'user-function') {
    item.insertText = new vscode.SnippetString(escapeSnippetLiteralDollars(`${candidate.label}($0)`));
  } else if (candidate.kind === 'instruction') {
    item.insertText = new vscode.SnippetString(escapeSnippetLiteralDollars(`${candidate.label} $0`));
  } else if (candidate.kind === 'system-variable' && !candidate.indexedValue && isIndexedSystemVariable(candidate.label, hoverReference)) {
    // Array-like ARL system variables insert their brackets as fixed syntax.
    // The nested snippet keeps the cursor inside [] and lets Tab return to the
    // next placeholder of an enclosing Smart Completion snippet.
    item.insertText = new vscode.SnippetString(escapeSnippetLiteralDollars(`${candidate.label}[\${1}]`));
  } else {
    item.insertText = candidate.label;
  }
  return item;
}

function createSignatureHelp(ctx) {
  if (!ctx) return undefined;
  const help = new vscode.SignatureHelp();
  const sig = new vscode.SignatureInformation(ctx.label, ctx.documentation || undefined);
  sig.parameters = (ctx.parameters || []).map((p,index) => new vscode.ParameterInformation(p,ctx.parameterDocumentation?.[index] || undefined));
  help.signatures = [sig];
  help.activeSignature = 0;
  help.activeParameter = ctx.activeParameter || 0;
  return help;
}

function offsetRanges(document, ranges) {
  return ranges.map(r => new vscode.Range(document.positionAt(r.start), document.positionAt(r.end)));
}

function createWeightDecorations() {
  const make = fontWeight => vscode.window.createTextEditorDecorationType({ fontWeight });
  return {
    jetbrains: { base: make('200'), mid: make('350'), heavy: make('400') },
    cascadia: { base: make('300'), mid: make('350'), heavy: make('400') }
  };
}

function allWeightDecorationTypes(weightDecorations) {
  return Object.values(weightDecorations).flatMap(group => Object.values(group));
}

function applyPreciseFontWeights(editor, weightDecorations) {
  if (!editor || editor.document?.languageId !== 'arl') return;
  const enabled = vscode.workspace.getConfiguration('peitianArl', editor.document.uri)
    .get('preciseFontWeights.enabled', true);
  const fontFamily = vscode.workspace.getConfiguration('editor', editor.document.uri).get('fontFamily', '');
  const profile = enabled ? getFontWeightProfile(fontFamily) : null;

  for (const type of allWeightDecorationTypes(weightDecorations)) editor.setDecorations(type, []);
  if (!profile) return;

  const group = profile.family === 'jetbrains-mono' ? weightDecorations.jetbrains : weightDecorations.cascadia;
  const text = editor.document.getText();
  const tokenRanges = collectWeightRanges(text, languageData);

  // Keep the three font-weight decorations disjoint. This makes numeric
  // weights deterministic instead of relying on CSS precedence of overlapping
  // decoration classes.
  editor.setDecorations(group.base, offsetRanges(editor.document, tokenRanges.base));
  editor.setDecorations(group.mid, offsetRanges(editor.document, tokenRanges.mid));
  editor.setDecorations(group.heavy, offsetRanges(editor.document, tokenRanges.heavy));
}


function uriKey(uri) {
  return String(uri?.fsPath || uri?.path || uri?.toString?.() || '').replace(/\\/g, '/').toLowerCase();
}

function pairedArlUri(document) {
  if (document?.uri?.scheme !== 'file' || !document.uri.fsPath) return null;
  const currentPath = document.uri.fsPath;
  const fileName = path.basename(currentPath);
  let pairedName;
  if (/_data\.arl$/i.test(fileName)) {
    pairedName = fileName.slice(0, -'_data.arl'.length) + '.arl';
  } else if (/\.arl$/i.test(fileName)) {
    pairedName = fileName.slice(0, -'.arl'.length) + '_data.arl';
  } else {
    return null;
  }
  return vscode.Uri.file(path.join(path.dirname(currentPath), pairedName));
}

function variableCandidate(variable, source='') {
  const sourceSuffix = source ? ` · ${source}` : '';
  return {
    label: variable.name,
    kind: 'variable',
    type: String(variable.type || '').toLowerCase(),
    detail: `${variable.kind || 'variable'} · ${String(variable.type || '').toLowerCase()}${sourceSuffix}`
  };
}


function selectionIsEmpty(selection){
  if(!selection) return true;
  if(typeof selection.isEmpty === 'boolean') return selection.isEmpty;
  const a=selection.start, b=selection.end;
  return !a || !b || (a.line===b.line && a.character===b.character);
}

function sameDocument(a,b){ return !!a && !!b && (a===b || uriKey(a.uri)===uriKey(b.uri)); }

function completionSelectionContext(document,position){
  const editor=vscode.window.activeTextEditor;
  const selection=editor?.selection;
  if(!editor || !sameDocument(editor.document,document) || selectionIsEmpty(selection)) return null;
  if(selection.start?.line!==selection.end?.line || selection.start?.line!==position.line) return null;
  const line=document.lineAt(selection.start.line).text;
  const selectedText=line.slice(selection.start.character,selection.end.character);
  return {
    semanticPosition:new vscode.Position(selection.start.line,selection.start.character),
    replaceRange:new vscode.Range(selection.start,selection.end),
    selectedText
  };
}

function wizardBuiltinSystemVariableAllowed(context,candidate){
  if(candidate?.kind!=='system-variable') return true;
  const expected=String(context?.expectedType||'').toLowerCase().replace(/&/g,'').trim();
  // Generic Wizard parameters are driven by user-declared variables and the
  // document's explicit candidate table. Builtin scalar system variables such
  // as $D/$PI should not pollute an unrelated `double` parameter like waittime.
  // Keep indexed robot-value containers available for pose/joint-style fields
  // (for example $P -> $P[index]) because those are an established ARL input form.
  if(!['pose','frame','joint','tool','wobj'].includes(expected)) return false;
  return isIndexedSystemVariable(candidate.label,hoverReference) && wizardTypeMatches(expected,candidate.type);
}

async function buildContextCompletionCandidates(document, position, projectIndex, options={}) {
  const line=document.lineAt(position.line).text;
  const wizardContext=getWizardParamContext(line, position.character, wizardData, hoverReference, languageData);
  const context=wizardContext || getTypedCompletionContext(line, position.character, hoverReference, languageData);
  const allowEmptyTypedPrefix=!!options.allowEmptyTypedPrefix;
  // Smart/Wizard parameters stay quiet until the user types the first
  // character. This avoids Suggest Widget / Snippet Tab conflicts on empty
  // placeholders while preserving explicit-prefix completion afterwards.
  if(context.mode==='wizard' && !context.prefix) return [];
  if(!context.prefix && !(context.mode==='typed' && allowEmptyTypedPrefix)) return [];

  if(context.mode!=='typed' && context.mode!=='wizard'){
    return filterTypedCompletionCandidates(
      buildCompletionCandidates(document.getText(), languageData, position.line),
      context,
      {allowEmptyTypedPrefix}
    );
  }

  const candidates=[];
  const seen=new Set();
  const add=item=>{
    const key=String(item.label||'').toLowerCase();
    if(!key || seen.has(key)) return;
    seen.add(key); candidates.push(item);
  };

  for(const variable of collectVisibleVariables(document.getText(), position.line, languageData)) add(variableCandidate(variable));
  for(const indexed of collectIndexedSystemVariableUsages(document.getText(), hoverReference)) add(indexed);
  if (projectIndex) {
    // Open ARL documents may appear after activation. Index any document that
    // is not already cached; normal edit/open listeners keep cached entries fresh.
    for (const doc of vscode.workspace.textDocuments || []) {
      if (doc.languageId === 'arl' && !projectIndex.has(doc.uri)) {
        projectIndex.updateText(doc.uri, doc.getText(), path.basename(doc.uri?.fsPath || doc.uri?.path || ''));
      }
    }
    await projectIndex.initialize();
    for (const variable of projectIndex.getGlobalVariables(document.uri)) add(variableCandidate(variable, variable.source));
  }
  for(const candidate of buildCompletionCandidates('', languageData)){
    if(candidate.kind==='system-variable') add(candidate);
  }

  if (context.mode === 'wizard') {
    const userFunctions = parseFunctions(document.getText())
      .filter(fn => fn.startLine < position.line)
      .map(fn => ({ label: fn.name, name: fn.name, kind:'user-function', type:'function', detail:fn.signature }));
    return buildWizardParameterCandidates({
      entry: context.entry,
      variantIndex: context.variantIndex,
      paramIndex: context.paramIndex,
      variables: candidates.filter(candidate=>wizardBuiltinSystemVariableAllowed(context,candidate)),
      userFunctions,
      // "Recent" means a value that still exists in nearby source code for the
      // same symbol/parameter. This deliberately avoids persistent type-wide
      // history, which kept deleted values and leaked 250/-1 from motion fields
      // into unrelated double parameters such as waittime.
      lastUsed: collectNearbyWizardValues(document.getText(), position.line, context),
      prefix: context.prefix
    });
  }
  return filterTypedCompletionCandidates(candidates, context, {allowEmptyTypedPrefix});
}

function wizardManualValueReady(context, candidates=[]) {
  const prefix=String(context?.prefix||'').trim();
  if(!prefix || context?.mode!=='wizard') return false;
  const normalizedPrefix=prefix.toLowerCase();
  if((candidates||[]).some(item=>String(item.label||'').toLowerCase()!==normalizedPrefix)) return false;
  const expected=String(context.expectedType||'').toLowerCase().replace(/&/g,'').trim();
  if(['double','int','uint','byte'].includes(expected) && /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(prefix)) return true;
  if(expected==='bool' && /^(?:true|false)$/i.test(prefix)) return true;
  const exact=(candidates||[]).find(item=>String(item.label||'').toLowerCase()===prefix.toLowerCase());
  if(!exact) return false;
  // `$P`/`$D`/etc. still need their completion item to insert the required []
  // snippet. A fully indexed observed value such as `$P[21]` is already final.
  if(exact.kind==='system-variable' && !exact.indexedValue && isIndexedSystemVariable(exact.label,hoverReference)) return false;
  return true;
}

function smartCompletionItem(candidate, template, replaceRange, referenceEntry, index=0) {
  let completionKind = vscode.CompletionItemKind.Snippet || vscode.CompletionItemKind.Value;
  if (template.variant === 'literal') completionKind = vscode.CompletionItemKind.Value;
  else if (template.variant === 'variables') completionKind = vscode.CompletionItemKind.Variable;
  const item = new vscode.CompletionItem(candidate.label, completionKind);
  item.detail = template.description || candidate.detail || 'PEITIAN ARL Smart Completion';
  item.filterText = candidate.label;
  item.insertText = new vscode.SnippetString(escapeSnippetLiteralDollars(template.snippet));
  if (replaceRange) item.range = replaceRange;
  item.sortText = `0_${String(candidate.label).toLowerCase()}_${String(index).padStart(2,'0')}`;
  if (referenceEntry?.desc) {
    const docs = new vscode.MarkdownString();
    docs.appendMarkdown(`**${candidate.label}** — PEITIAN ARL Smart Completion`);
    docs.appendMarkdown(`  \n${referenceEntry.desc}`);
    if (referenceEntry.desc_en) docs.appendMarkdown(`  \n_${referenceEntry.desc_en}_`);
    item.documentation = docs;
  }
  if (template.wizard || template.variant === 'literal' || template.variant === 'variables') {
    item.command = { command:'peitianArl.beginSmartCompletion', title:'Start ARL Smart Completion' };
  }
  return item;
}

function activate(context) {
  let smartSnippetLine = null;
  let smartSnippetActive = false;
  let smartValueReady = false;
  const setSmartValueReady = async ready => {
    smartValueReady = !!ready;
    try { await vscode.commands.executeCommand('setContext', 'peitianArl.smartValueReady', smartValueReady); }
    catch (_) {}
  };
  const setSmartSnippetActive = async active => {
    smartSnippetActive = !!active;
    try { await vscode.commands.executeCommand('setContext', 'peitianArl.smartSnippetActive', smartSnippetActive); }
    catch (_) {}
    if (!smartSnippetActive) {
      smartSnippetLine = null;
      await setSmartValueReady(false);
    }
  };

  const beginSmartCompletion = vscode.commands.registerCommand('peitianArl.beginSmartCompletion', async () => {
    const editor = vscode.window.activeTextEditor;
    smartSnippetLine = editor?.selection?.active?.line ?? null;
    await setSmartSnippetActive(true);
    await setSmartValueReady(false);
  });

  const smartTab = vscode.commands.registerCommand('peitianArl.smartTab', async () => {
    const editor=vscode.window.activeTextEditor;
    if(!editor || editor.document?.languageId!=='arl') return;
    try { await vscode.commands.executeCommand('hideSuggestWidget'); } catch (_) {}
    await setSmartValueReady(false);
    try { await vscode.commands.executeCommand('jumpToNextSnippetPlaceholder'); } catch (_) { return; }
  });

  const smartEnter = vscode.commands.registerCommand('peitianArl.smartEnter', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document?.languageId !== 'arl') {
      await setSmartSnippetActive(false);
      return;
    }
    try { await vscode.commands.executeCommand('hideSuggestWidget'); } catch (_) {}
    try {
      await vscode.commands.executeCommand('type', { text: '\n' });
    } finally {
      try { await vscode.commands.executeCommand('leaveSnippet'); } catch (_) {}
      await setSmartSnippetActive(false);
    }
  });

  setSmartSnippetActive(false);
  const projectIndex = new WorkspaceVariableIndex({
    parseVariables,
    languageData,
    discoverUris: async () => {
      if (typeof vscode.workspace.findFiles !== 'function') return [];
      try { return await vscode.workspace.findFiles('**/*.arl', '**/{.git,node_modules}/**', 1000); }
      catch (_) { return []; }
    },
    readText: async uri => {
      const open = (vscode.workspace.textDocuments || []).find(doc => uriKey(doc.uri) === uriKey(uri));
      if (open) return open.getText();
      if (vscode.workspace.fs && typeof vscode.workspace.fs.readFile === 'function') {
        const bytes = await vscode.workspace.fs.readFile(uri);
        return Buffer.from(bytes).toString('utf8');
      }
      const doc = await vscode.workspace.openTextDocument(uri);
      return doc.getText();
    },
    uriKey,
    sourceName: uri => path.basename(uri?.fsPath || uri?.path || String(uri || ''))
  });
  for (const doc of vscode.workspace.textDocuments || []) {
    if (doc.languageId === 'arl') projectIndex.updateText(doc.uri, doc.getText(), path.basename(doc.uri?.fsPath || doc.uri?.path || ''));
  }
  const standalonePairRefreshes = new Map();
  const ensurePairedVariables = async document => {
    const pairedUri = pairedArlUri(document);
    if (!pairedUri) return;
    const open = (vscode.workspace.textDocuments || []).find(doc => uriKey(doc.uri) === uriKey(pairedUri));
    if (open) {
      if (!projectIndex.has(open.uri)) {
        projectIndex.updateText(open.uri, open.getText(), path.basename(open.uri?.fsPath || open.uri?.path || ''));
      }
      return;
    }

    // Workspace files are kept current by the filesystem watcher below. A
    // standalone ARL file has no workspace watcher, so refresh its one paired
    // file at most once per second while completion is being requested.
    const inWorkspace = typeof vscode.workspace.getWorkspaceFolder === 'function'
      && !!vscode.workspace.getWorkspaceFolder(document.uri);
    if (inWorkspace && projectIndex.has(pairedUri)) return;
    const key = uriKey(pairedUri);
    const now = Date.now();
    if (now - (standalonePairRefreshes.get(key) || 0) < 1000) return;
    standalonePairRefreshes.set(key, now);
    await projectIndex.refresh(pairedUri, path.basename(pairedUri.fsPath || pairedUri.path || ''));
  };
  const formatter = vscode.languages.registerDocumentFormattingEditProvider('arl', {
    provideDocumentFormattingEdits(document, options) {
      const original = document.getText();
      const eol = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
      const formatted = formatArl(original, {
        eol,
        tabSize: Number(options.tabSize) || 4,
        insertSpaces: options.insertSpaces !== false
      });

      if (formatted === original) return [];

      const fullRange = new vscode.Range(
        new vscode.Position(0, 0),
        document.positionAt(original.length)
      );
      return [vscode.TextEdit.replace(fullRange, formatted)];
    }
  });

  const folding = vscode.languages.registerFoldingRangeProvider('arl', {
    provideFoldingRanges(document) {
      return getFoldingRanges(document.getText()).map(range =>
        new vscode.FoldingRange(range.start, range.end, vscode.FoldingRangeKind.Region)
      );
    }
  });

  const symbols = vscode.languages.registerDocumentSymbolProvider('arl', {
    provideDocumentSymbols(document) {
      return parseFunctions(document.getText()).map(fn => new vscode.DocumentSymbol(
        fn.name,
        `${fn.returnType} (${fn.params})`,
        vscode.SymbolKind.Function,
        functionRange(document, fn),
        functionSelectionRange(fn)
      ));
    }
  });

  const definition = vscode.languages.registerDefinitionProvider('arl', {
    async provideDefinition(document, position) {
      const resolved = await resolveUserFunction(document, position);
      if (!resolved) return undefined;
      return new vscode.Location(resolved.document.uri, functionSelectionRange(resolved.fn));
    }
  });

  const hover = vscode.languages.registerHoverProvider('arl', {
    async provideHover(document, position) {
      const resolved = await resolveUserFunction(document, position);
      if (resolved) {
        const base = path.basename(resolved.document.uri.fsPath || resolved.document.uri.path || '');
        return new vscode.Hover(userFunctionHover(resolved.fn, resolved.document === document ? '' : base));
      }

      const line = document.lineAt(position.line).text;
      const token = wordAt(line, position.character);
      if (!token) return undefined;

      if (parenOnlyFunctionNames.has(token.word.toLowerCase()) && !/^\s*\(/.test(line.slice(token.end))) return undefined;

      const localFn = findFunction(document.getText(), token.word);
      if (localFn) return new vscode.Hover(userFunctionHover(localFn, ''));

      const entry = lookupHoverEntry(token.word, hoverReference);
      const category = categoryIndex.get(token.word.toLowerCase());
      if (!entry && !category) return undefined;

      const range = new vscode.Range(
        new vscode.Position(position.line, token.start),
        new vscode.Position(position.line, token.end)
      );
      const signatures=getWizardHoverSignatures(line,position.character,wizardData,hoverReference,languageData);
      const parameters=getWizardHoverParameters(token.word,wizardData,hoverReference,languageData);
      return new vscode.Hover(builtinHover(token.word, entry, category, signatures, parameters), range);
    }
  });

  const completionTriggers = [...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_', '$', ':', ',', '('];
  const completion = vscode.languages.registerCompletionItemProvider('arl', {
    async provideCompletionItems(document, position, _token, completionContext) {
      const selected=completionSelectionContext(document,position);
      const semanticPosition=selected?.semanticPosition || position;
      if (!isCodePosition(document, semanticPosition)) return [];
      const line = document.lineAt(semanticPosition.line).text;
      const prefix = getCompletionPrefix(line, semanticPosition.character);
      const invokeKind = vscode.CompletionTriggerKind?.Invoke;
      const triggerCharacterKind = vscode.CompletionTriggerKind?.TriggerCharacter;
      const allowEmptyTypedPrefix = !!selected || completionContext?.triggerKind === invokeKind ||
        (completionContext?.triggerKind === triggerCharacterKind && completionContext?.triggerCharacter === ':');
      await ensurePairedVariables(document);
      const candidates = await buildContextCompletionCandidates(document, semanticPosition, projectIndex, {
        allowEmptyTypedPrefix,
      });
      const wizardInputContext=getWizardParamContext(line, semanticPosition.character, wizardData, hoverReference, languageData);
      if (smartSnippetActive) await setSmartValueReady(wizardManualValueReady(wizardInputContext,candidates));
      if (!candidates.length) return [];
      const existingToken = wordAt(line, semanticPosition.character);
      const replacementEnd = existingToken && existingToken.start === prefix.start && existingToken.end >= semanticPosition.character
        ? existingToken.end
        : prefix.end;
      const replaceRange = selected?.replaceRange || new vscode.Range(
        new vscode.Position(semanticPosition.line, prefix.start),
        new vscode.Position(semanticPosition.line, replacementEnd)
      );
      const smartEnabled = vscode.workspace.getConfiguration('peitianArl', document.uri)
        .get('smartCompletion.enabled', true);
      const items=[];
      for (const candidate of candidates) {
        const referenceEntry = lookupHoverEntry(candidate.baseLabel || candidate.label, hoverReference);
        const templates = smartEnabled ? getSmartCompletionTemplates(candidate.label, candidate.kind, hoverReference, wizardData) : [];
        if (templates.length) {
          templates.forEach((template,index)=>items.push(smartCompletionItem(candidate, template, replaceRange, referenceEntry, index)));
        } else {
          const unit=String(candidate.wizardUnit||'');
          const suffixLine=document.lineAt(replaceRange.end.line).text;
          const unitAlreadyPresent=!!unit && suffixLine.slice(replaceRange.end.character).startsWith(unit);
          items.push(completionItem(candidate, replaceRange, referenceEntry, {
            unitAlreadyPresent,
            suppressWizardUnit: smartSnippetActive && !!unit,
            keepVisiblePrefix: selected?.selectedText || ''
          }));
        }
      }
      return items;
    }
  }, ...completionTriggers);

  const signature = vscode.languages.registerSignatureHelpProvider('arl', {
    provideSignatureHelp(document, position) {
      const offset = document.offsetAt ? document.offsetAt(position) : (() => {
        let value=0;
        for(let line=0; line<position.line; line++) value += document.lineAt(line).text.length + 1;
        return value + position.character;
      })();
      return createSignatureHelp(getSignatureContext(document.getText(), offset, hoverReference, languageData, wizardData));
    }
  }, '(', ',', ' ', ':');

  const weightDecorations = createWeightDecorations();
  let weightTimer = null;
  let suggestTimer = null;
  const indexTimers = new Map();
  const scheduleIndexUpdate = document => {
    if (!document || document.languageId !== 'arl') return;
    const key = uriKey(document.uri);
    if (indexTimers.has(key)) clearTimeout(indexTimers.get(key));
    indexTimers.set(key, setTimeout(() => {
      indexTimers.delete(key);
      projectIndex.updateText(document.uri, document.getText(), path.basename(document.uri?.fsPath || document.uri?.path || ''));
    }, 120));
  };
  const refreshEditor = editor => applyPreciseFontWeights(editor, weightDecorations);
  const refreshVisible = () => {
    for (const editor of vscode.window.visibleTextEditors || []) refreshEditor(editor);
  };
  const scheduleRefresh = editor => {
    if (weightTimer) clearTimeout(weightTimer);
    weightTimer = setTimeout(() => refreshEditor(editor), 70);
  };

  const activeEditorListener = vscode.window.onDidChangeActiveTextEditor(editor => {
    setSmartSnippetActive(false);
    refreshEditor(editor);
  });
  const visibleEditorsListener = vscode.window.onDidChangeVisibleTextEditors(() => refreshVisible());
  const changeListener = vscode.workspace.onDidChangeTextDocument(event => {
    if (event.document?.languageId !== 'arl') return;
    scheduleIndexUpdate(event.document);
    const editor = (vscode.window.visibleTextEditors || []).find(e => e.document === event.document);
    if (editor) scheduleRefresh(editor);

    // VS Code quickSuggestions can be delayed/suppressed by inline AI suggestions.
    // For known ARL vocabulary, proactively open the native Suggest Widget after
    // normal typing so prefixes such as `mov` reliably surface `movej`.
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor || activeEditor.document !== event.document) return;
    const changes = event.contentChanges || [];
    if (changes.length !== 1) return;

    const currentPosition=activeEditor.selection?.active;
    // Completion is triggered only after the user types a first character.
    // Numeric prefixes use the same strict matching rule as identifiers, so no
    // special hide/reopen path is needed.

    if (!/^[A-Za-z0-9_$]$/.test(changes[0].text || '')) return;
    if (suggestTimer) clearTimeout(suggestTimer);
    suggestTimer = setTimeout(() => {
      const current = vscode.window.activeTextEditor;
      if (!current || current.document !== event.document) return;
      let position = current.selection?.active;
      if (!position) {
        const text = event.document.lineAt(0).text;
        position = new vscode.Position(0, text.length);
      }
      if (!isCodePosition(event.document, position)) return;
      buildContextCompletionCandidates(event.document, position, projectIndex).then(candidates => {
        if (!candidates.length) return;
        return Promise.resolve(vscode.commands.executeCommand('editor.action.triggerSuggest')).catch(() => {});
      }).catch(() => {});
    }, 35);
  });
  const optionalWorkspaceListeners = [];
  if (typeof vscode.window.onDidChangeTextEditorSelection === 'function') {
    optionalWorkspaceListeners.push(vscode.window.onDidChangeTextEditorSelection(event => {
      if (smartSnippetLine == null) return;
      const line = event?.selections?.[0]?.active?.line;
      if (typeof line === 'number' && line !== smartSnippetLine) setSmartSnippetActive(false);
    }));
  }
  if (typeof vscode.workspace.onDidOpenTextDocument === 'function') {
    optionalWorkspaceListeners.push(vscode.workspace.onDidOpenTextDocument(doc => {
      if (doc?.languageId === 'arl') projectIndex.updateText(doc.uri, doc.getText(), path.basename(doc.uri?.fsPath || doc.uri?.path || ''));
    }));
  }
  if (typeof vscode.workspace.onDidSaveTextDocument === 'function') {
    optionalWorkspaceListeners.push(vscode.workspace.onDidSaveTextDocument(doc => {
      if (doc?.languageId === 'arl') projectIndex.updateText(doc.uri, doc.getText(), path.basename(doc.uri?.fsPath || doc.uri?.path || ''));
    }));
  }
  if (typeof vscode.workspace.onDidDeleteFiles === 'function') {
    optionalWorkspaceListeners.push(vscode.workspace.onDidDeleteFiles(event => {
      for (const uri of event?.files || []) projectIndex.invalidate(uri);
    }));
  }
  if (typeof vscode.workspace.onDidRenameFiles === 'function') {
    optionalWorkspaceListeners.push(vscode.workspace.onDidRenameFiles(event => {
      for (const file of event?.files || []) {
        projectIndex.invalidate(file.oldUri);
        projectIndex.refresh(file.newUri);
      }
    }));
  }
  if (typeof vscode.workspace.createFileSystemWatcher === 'function') {
    const watcher = vscode.workspace.createFileSystemWatcher('**/*.arl');
    watcher.onDidCreate(uri => projectIndex.refresh(uri));
    watcher.onDidChange(uri => projectIndex.refresh(uri));
    watcher.onDidDelete(uri => projectIndex.invalidate(uri));
    optionalWorkspaceListeners.push(watcher);
  }

  const configListener = vscode.workspace.onDidChangeConfiguration(event => {
    if (!event || typeof event.affectsConfiguration !== 'function' ||
        event.affectsConfiguration('editor.fontFamily') || event.affectsConfiguration('peitianArl.preciseFontWeights.enabled')) {
      refreshVisible();
    }
  });

  refreshVisible();

  context.subscriptions.push(
    beginSmartCompletion, smartTab, smartEnter,
    formatter, folding, symbols, definition, hover, completion, signature,
    activeEditorListener, visibleEditorsListener, changeListener, configListener,
    ...optionalWorkspaceListeners,
    { dispose() { for (const timer of indexTimers.values()) clearTimeout(timer); indexTimers.clear(); } },
    ...allWeightDecorationTypes(weightDecorations)
  );
}

function deactivate() {}

module.exports = { activate, deactivate };

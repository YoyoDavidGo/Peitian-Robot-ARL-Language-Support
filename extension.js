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
  getCompletionPrefix
} = require('./src/arl-intelligence.cjs');
const languageData = require('./language-data/arl-language.json');
const hoverReference = require('./language-data/arl-reference.json');
const { WorkspaceVariableIndex } = require('./src/workspace-variable-index.cjs');

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

async function openReferencedDocument(sourceDocument, fileStem) {
  const normalizedStem = String(fileStem || '').replace(/\.(?:arl|txt)$/i, '');
  if (!normalizedStem) return null;
  const targetNames = [`${normalizedStem}.arl`, `${normalizedStem}.txt`];

  for (const doc of vscode.workspace.textDocuments || []) {
    const base = path.basename(doc.uri.fsPath || doc.uri.path || '').toLowerCase();
    if (targetNames.some(name => name.toLowerCase() === base)) return doc;
  }

  if (sourceDocument.uri?.scheme === 'file' && sourceDocument.uri.fsPath) {
    const dir = path.dirname(sourceDocument.uri.fsPath);
    for (const name of targetNames) {
      try {
        return await vscode.workspace.openTextDocument(vscode.Uri.file(path.join(dir, name)));
      } catch (_) {}
    }
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

function builtinHover(word, entry, category) {
  const md = new vscode.MarkdownString();
  const label = entry?.type || category || 'symbol';
  md.appendMarkdown(`**${word}** — PEITIAN ARL ${label}`);
  if (entry?.desc) md.appendMarkdown(`  \n${entry.desc}`);
  if (entry?.proto) md.appendCodeblock(entry.proto, 'arl');
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
    default: return vscode.CompletionItemKind.Value;
  }
}

function completionItem(candidate, replaceRange, referenceEntry) {
  const item = new vscode.CompletionItem(candidate.label, completionKind(candidate.kind));
  item.detail = candidate.detail || candidate.type || 'PEITIAN ARL';
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
  item.sortText = `${rank}_${String(candidate.label).toLowerCase()}`;
  if (candidate.kind === 'function' || candidate.kind === 'user-function') {
    item.insertText = new vscode.SnippetString(`${candidate.label}($0)`);
  } else if (candidate.kind === 'instruction') {
    item.insertText = new vscode.SnippetString(`${candidate.label} $0`);
  } else {
    item.insertText = candidate.label;
  }
  return item;
}

function createSignatureHelp(ctx) {
  if (!ctx) return undefined;
  const help = new vscode.SignatureHelp();
  const sig = new vscode.SignatureInformation(ctx.label, ctx.documentation || undefined);
  sig.parameters = (ctx.parameters || []).map(p => new vscode.ParameterInformation(p));
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
  return String(uri?.fsPath || uri?.path || uri?.toString?.() || '').toLowerCase();
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

async function buildContextCompletionCandidates(document, position, projectIndex) {
  const line=document.lineAt(position.line).text;
  const context=getTypedCompletionContext(line, position.character, hoverReference, languageData);
  if(!context.prefix) return [];

  if(context.mode!=='typed'){
    return filterTypedCompletionCandidates(
      buildCompletionCandidates(document.getText(), languageData),
      context
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
  return filterTypedCompletionCandidates(candidates, context);
}

function activate(context) {
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

      const localFn = findFunction(document.getText(), token.word);
      if (localFn) return new vscode.Hover(userFunctionHover(localFn, ''));

      const entry = lookupHoverEntry(token.word, hoverReference);
      const category = categoryIndex.get(token.word.toLowerCase());
      if (!entry && !category) return undefined;

      const range = new vscode.Range(
        new vscode.Position(position.line, token.start),
        new vscode.Position(position.line, token.end)
      );
      return new vscode.Hover(builtinHover(token.word, entry, category), range);
    }
  });

  const completionTriggers = [...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_', '$', ':'];
  const completion = vscode.languages.registerCompletionItemProvider('arl', {
    async provideCompletionItems(document, position) {
      const line = document.lineAt(position.line).text;
      const prefix = getCompletionPrefix(line, position.character);
      if (!prefix.text) return [];
      const replaceRange = new vscode.Range(
        new vscode.Position(position.line, prefix.start),
        new vscode.Position(position.line, prefix.end)
      );
      const candidates = await buildContextCompletionCandidates(document, position, projectIndex);
      return candidates.map(candidate => completionItem(
        candidate,
        replaceRange,
        lookupHoverEntry(candidate.label, hoverReference)
      ));
    }
  }, ...completionTriggers);

  const signature = vscode.languages.registerSignatureHelpProvider('arl', {
    provideSignatureHelp(document, position) {
      const offset = document.offsetAt ? document.offsetAt(position) : (() => {
        let value=0;
        for(let line=0; line<position.line; line++) value += document.lineAt(line).text.length + 1;
        return value + position.character;
      })();
      return createSignatureHelp(getSignatureContext(document.getText(), offset, hoverReference, languageData));
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

  const activeEditorListener = vscode.window.onDidChangeActiveTextEditor(editor => refreshEditor(editor));
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
    if (changes.length !== 1 || !/^[A-Za-z0-9_$]$/.test(changes[0].text || '')) return;

    if (suggestTimer) clearTimeout(suggestTimer);
    suggestTimer = setTimeout(() => {
      const current = vscode.window.activeTextEditor;
      if (!current || current.document !== event.document) return;
      let position = current.selection?.active;
      if (!position) {
        const text = event.document.lineAt(0).text;
        position = new vscode.Position(0, text.length);
      }
      buildContextCompletionCandidates(event.document, position, projectIndex).then(candidates => {
        if (!candidates.length) return;
        return Promise.resolve(vscode.commands.executeCommand('editor.action.triggerSuggest')).catch(() => {});
      }).catch(() => {});
    }, 35);
  });
  const optionalWorkspaceListeners = [];
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
      for (const uri of event?.files || []) projectIndex.remove(uri);
    }));
  }

  const configListener = vscode.workspace.onDidChangeConfiguration(event => {
    if (!event || typeof event.affectsConfiguration !== 'function' ||
        event.affectsConfiguration('editor.fontFamily') || event.affectsConfiguration('peitianArl.preciseFontWeights.enabled')) {
      refreshVisible();
    }
  });

  refreshVisible();

  context.subscriptions.push(
    formatter, folding, symbols, definition, hover, completion, signature,
    activeEditorListener, visibleEditorsListener, changeListener, configListener,
    ...optionalWorkspaceListeners,
    { dispose() { for (const timer of indexTimers.values()) clearTimeout(timer); indexTimers.clear(); } },
    ...allWeightDecorationTypes(weightDecorations)
  );
}

function deactivate() {}

module.exports = { activate, deactivate };

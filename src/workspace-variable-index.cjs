'use strict';

/**
 * Lightweight in-memory index of global ARL variables across a workspace.
 * Discovery is lazy and happens once. Subsequent completions reuse parsed
 * globals and only changed files are reparsed through updateText().
 */
class WorkspaceVariableIndex {
  constructor({ parseVariables, languageData, discoverUris, readText, uriKey, sourceName }) {
    this.parseVariables = parseVariables;
    this.languageData = languageData;
    this.discoverUris = discoverUris;
    this.readText = readText;
    this.uriKey = uriKey || (uri => String(uri));
    this.sourceName = sourceName || (uri => String(uri));
    this.byUri = new Map();
    this.initialized = false;
    this.initPromise = null;
  }

  _parseGlobals(text, source) {
    return this.parseVariables(String(text || ''), this.languageData)
      .filter(variable => variable.scope === 'global')
      .map(variable => ({ ...variable, source }));
  }

  updateText(uri, text, source) {
    const key = this.uriKey(uri);
    if (!key) return;
    this.byUri.set(key, this._parseGlobals(text, source || this.sourceName(uri)));
  }

  has(uri) {
    const key = this.uriKey(uri);
    return !!key && this.byUri.has(key);
  }

  remove(uri) {
    const key = this.uriKey(uri);
    if (key) this.byUri.delete(key);
  }

  async initialize() {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;
    this.initPromise = (async () => {
      const uris = await this.discoverUris();
      for (const uri of uris || []) {
        const key = this.uriKey(uri);
        if (!key || this.byUri.has(key)) continue;
        try {
          const text = await this.readText(uri);
          this.updateText(uri, text, this.sourceName(uri));
        } catch (_) {
          // One unreadable file must not disable completion for the workspace.
        }
      }
      this.initialized = true;
    })();
    try {
      await this.initPromise;
    } finally {
      this.initPromise = null;
    }
  }


  getPairedGlobalVariables(sourceUri) {
    const currentKey = this.uriKey(sourceUri);
    if (!currentKey) return [];

    const normalized = String(currentKey).replace(/\\/g, '/');
    const slash = normalized.lastIndexOf('/');
    const directory = slash >= 0 ? normalized.slice(0, slash + 1) : '';
    const fileName = slash >= 0 ? normalized.slice(slash + 1) : normalized;

    let pairedName = '';
    if (/_data\.arl$/i.test(fileName)) {
      pairedName = fileName.slice(0, -'_data.arl'.length) + '.arl';
    } else if (/\.arl$/i.test(fileName)) {
      pairedName = fileName.slice(0, -'.arl'.length) + '_data.arl';
    } else {
      return [];
    }

    const pairedKey = (directory + pairedName).toLowerCase();
    const out = [];
    const seen = new Set();
    for (const [key, variables] of this.byUri) {
      const normalizedKey = String(key).replace(/\\/g, '/').toLowerCase();
      if (normalizedKey !== pairedKey) continue;
      for (const variable of variables) {
        const dedupe = String(variable.name || '').toLowerCase();
        if (!dedupe || seen.has(dedupe)) continue;
        seen.add(dedupe);
        out.push(variable);
      }
    }
    return out;
  }

  getGlobalVariables(sourceUri) {
    return this.getPairedGlobalVariables(sourceUri);
  }

  getAllGlobalVariables(excludeUri) {
    const excluded = excludeUri ? this.uriKey(excludeUri) : '';
    const out = [];
    const seen = new Set();
    for (const [key, variables] of this.byUri) {
      if (excluded && key === excluded) continue;
      for (const variable of variables) {
        const dedupe = String(variable.name || '').toLowerCase();
        if (!dedupe || seen.has(dedupe)) continue;
        seen.add(dedupe);
        out.push(variable);
      }
    }
    return out;
  }
}

module.exports = { WorkspaceVariableIndex };

# Peitian Robot ARL Language Support 1.0.0 Marketplace Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn v0.6.6 into a stable, lightweight VS Code Marketplace-ready 1.0.0 release without expanding the language-feature scope.

**Architecture:** Keep the current provider-based runtime with no LSP and no production dependencies. Add a small in-memory workspace symbol index so typed completion does not rescan every `.arl` file per keystroke. Productize the manifest and Marketplace-facing documentation while preserving existing ARL language behavior.

**Tech Stack:** VS Code Extension API, CommonJS Node.js, TextMate grammar, JSON language configuration, SVG file icons, `@vscode/vsce` for packaging.

**Spec:** Current conversation requirements and v0.6.6 behavior.

## Global Constraints

- Release version is exactly `1.0.0`.
- Keep the extension lightweight: no LSP, no AI runtime, no network calls, no production dependencies.
- Do not alter validated ARL syntax colors, formatting, folding, navigation, Hover, typed completion rules, or file icon design.
- Do not override the user's Copilot/inline-suggestion preference by default.
- Preserve `.arl` indentation defaults and this extension as the ARL default formatter.
- Marketplace icon must be a PNG and square; `.arl` Explorer icons remain SVG.

---

### Task 1: Marketplace-safe editor defaults

**Files:**
- Modify: `package.json`
- Test: `tests/validate.cjs`

**Interfaces:**
- Consumes: existing `[arl]` `configurationDefaults`
- Produces: non-invasive ARL defaults that do not disable user AI/word-suggestion preferences

- [ ] Update validation to require `1.0.0` and assert `editor.inlineSuggest.enabled` and `editor.wordBasedSuggestions` are not forced by the extension.
- [ ] Run validation and confirm it fails against v0.6.6.
- [ ] Remove invasive suggestion defaults while keeping tab size, spaces, indentation detection, and default formatter.
- [ ] Run validation and confirm it passes.

### Task 2: Workspace ARL variable cache

**Files:**
- Create: `src/workspace-variable-index.cjs`
- Modify: `extension.js`
- Test: `tests/workspace-variable-index.cjs`
- Modify: `package.json` test script

**Interfaces:**
- Produces: `WorkspaceVariableIndex` with `initialize()`, `updateDocument()`, `removeDocument()`, and `getGlobalVariableCandidates(excludeUri)`.
- Consumes: `parseVariables(text, languageData)` and VS Code workspace file/document access supplied through callbacks.

- [ ] Write tests proving workspace discovery happens once, cached candidates are reused, updates replace one file only, and current-document URI can be excluded.
- [ ] Run test and confirm failure because module does not exist.
- [ ] Implement the in-memory index without dependencies.
- [ ] Wire typed completion to the index and update cache on ARL document changes/open/save where available.
- [ ] Run index, intelligence, and runtime tests.

### Task 3: Marketplace manifest and visual metadata

**Files:**
- Modify: `package.json`
- Replace: `icon.png` with a square 256×256 PNG derived from the existing AE logo without redesigning it
- Test: `tests/validate.cjs`

**Interfaces:**
- Produces: Marketplace-ready metadata that does not contain broken repository URLs.

- [ ] Add `pricing: "Free"`, `galleryBanner`, expanded search keywords, `Formatters` category, and `vscode:prepublish` test script.
- [ ] Keep publisher ID `yoyodavidgo` as the current intended ID, but document that the Marketplace publisher must exist before publishing.
- [ ] Validate `icon.png` is square and at least 128×128.
- [ ] Run manifest validation.

### Task 4: Marketplace-facing docs

**Files:**
- Rewrite: `README.md`
- Rewrite: `CHANGELOG.md`
- Create: `SUPPORT.md`
- Create: `docs/MARKETPLACE-PUBLISHING.md`

**Interfaces:**
- Produces: user-facing Marketplace page copy and a private publishing checklist.

- [ ] Rewrite README around product value, feature set, ARL examples, shortcuts, settings, privacy, compatibility, and known scope; omit broken screenshot links until real screenshots are supplied.
- [ ] Condense changelog with a clear `1.0.0` release section while retaining prior history below.
- [ ] Add support instructions that use GitHub Issues after the standalone plugin repository exists and give a fallback contact instruction to use Marketplace Q&A until then.
- [ ] Add a publishing checklist listing exactly what the user must supply: Publisher creation/verification, standalone GitHub repository URL, license choice/owner, and 3–4 screenshots.

### Task 5: Release verification and VSIX packaging

**Files:**
- Package all runtime files through `.vscodeignore`

**Interfaces:**
- Produces: `peitian-robot-arl-language-support-1.0.0.vsix` and source ZIP.

- [ ] Run the complete test suite with zero failures.
- [ ] Run a package-content audit for no tests/scripts/docs plans in VSIX, while keeping README, CHANGELOG, SUPPORT, icon, grammar, language data, themes, and runtime source.
- [ ] Package with current `vsce` if available; otherwise build the VSIX with the same valid extension archive structure already used by previous releases.
- [ ] Unzip the VSIX and verify version `1.0.0`, icon dimensions, manifest, runtime files, and no production dependencies.

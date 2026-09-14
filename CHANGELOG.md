# Changelog

## 1.0.0

- First Marketplace release of **Peitian Robot ARL Language Support**.
- Finalized the lightweight ARL feature set: syntax highlighting, formatting, folding, Outline, navigation, Hover, IntelliSense, typed parameter completion, Signature Help, precise font weights, themes, and ARL file icons.
- Added a lazy in-memory workspace index for global ARL variables so type-aware completion reuses cached project data instead of rescanning all `.arl` files on every keystroke.
- Removed extension defaults that forcibly disabled Copilot/inline suggestions, word-based suggestions, and user quick-suggestion preferences.
- Added Marketplace-ready metadata, square extension icon, release documentation, support guidance, and pre-publish test enforcement.
- Added proper `/* ... */` ARL block-comment highlighting and language configuration, using the same comment palette as `//`.
- Added English / Simplified Chinese package localization plus a complete `README.zh-CN.md`; VS Code manifest strings follow the active display language while the Marketplace README provides explicit language links.
- Updated the Marketplace publisher ID to `David-Workshop` and connected repository/homepage/issues metadata to the public GitHub project.
- Added a retained-rights copyright notice for the publicly viewable source repository.
- Scoped typed variable completion to the current ARL program and its same-directory `<program>_data.arl` companion, preventing unrelated program variables from appearing in IntelliSense.
- Changed README language-switch links to absolute GitHub URLs so they work from the VS Code extension Details view.
- Kept the extension local and lightweight: no Language Server, no AI runtime, no telemetry, no network calls, and no production dependencies.

## 0.6.6

- Reworked IntelliSense into free-input and typed-context modes.
- Free input now requires at least one typed character before suggestions are shown.
- Named instruction parameters such as `ptp p:` no longer show a suggestion list until a value prefix is typed.
- Type-aware contexts now filter to declared variables of the required type only: `p:` → `pose`, `j:` → `joint`, `v:` → `speed`, `s:` → `slip`, `t:` → `tool`, `w:` → `wobj`.
- Typed contexts include visible current-file declarations plus global declarations from other ARL workspace files.
- System variables are type-filtered where their ARL type is known; for example `ptp p:$` offers `$P` but not `$D`.
- Unknown/untyped identifiers are not learned merely because they appeared in source text.
- Return-type-compatible functions are intentionally excluded from typed parameter completion in this version to keep the rule simple and predictable.

## 0.6.5

- Simplified the `.arl` Explorer file icon to a standalone stylized **A**.
- Removed the outer rectangle/frame and removed the `R` / `L` glyphs.
- Set the A body to exact RGB(36, 171, 242) / `#24ABF2`.
- Kept the red A crossbar accent (`#E23A3A`) on a transparent background.
- Kept all v0.6.4 language behavior unchanged.

## 0.6.4

- Added individual Hover descriptions for all 69 built-in ARL system variables, sourced from the embedded PEITIAN ARL Wizard reference.
- System-variable completion items now show their specific Chinese purpose and bilingual documentation instead of a generic label.
- Added dedicated light/dark SVG file icons for `.arl` files: blue rectangular ARL wordmark with the red A accent.

## 0.6.3

- Add Wizard-derived detailed Hover documentation for all ARL logic keywords, special keywords, and data types.
- Replace generic S1 Hover labels such as `if — PEITIAN ARL logic keyword` with each token's own description and syntax where available.
- Keep completion, `$` replacement, precise font weights, navigation, formatting, and folding unchanged.

## 0.6.2

- Make ARL IntelliSense suggestions reliably open for known typed prefixes such as `mov` → `movej`, even when inline AI suggestions are active.
- Preserve the v0.6.1 `$` replacement fix and precise font-weight behavior.

## 0.6.1

- Fix system-variable completion replacing the typed `$` instead of producing `$$NAME`.
- Make normal identifier typing explicitly trigger ARL IntelliSense and keep replacement ranges correct.
- Suppress generic inline suggestions and word-based guesses by default in ARL files so ARL IntelliSense remains visible.
- Fix precise font-weight decorations by using disjoint 200/300, 350, and 400 ranges.

## 0.6.0

- Added precise ARL font-weight adaptation for JetBrains Mono (200/350/400) and Cascadia Code (300/350/400).
- Added built-in ARL completion items.
- Added current-file user function, parameter, and variable completions.
- Added Signature Help for ARL built-in functions/instructions and current-file user functions.
- Kept v0.5.x Outline, navigation, cross-file definition, hover, formatting, folding, themes, name and logo.

## 0.5.1

- Rename the extension display name to **Peitian Robot ARL Language Support**.
- Add the provided AE logo as the VS Code extension icon.
- Document the original ARL-IDE font-weight behavior and the VS Code limitation around per-token numeric weights.
- Keep token `fontStyle` unforced by default to avoid exaggerated bold rendering.

## 0.5.0

- Add ARL Document Symbols for VS Code Outline, Breadcrumbs, and `Ctrl+Shift+O`.
- Add F12 / Ctrl+Click definition navigation for user-defined ARL functions.
- Add cross-file `file::func()` navigation, resolving open documents, sibling `.arl/.txt` files, then workspace matches.
- Add Hover help for all 34 ARL instructions using descriptions/prototypes extracted from the embedded ARL Wizard.
- Add detailed Hover help for common I/O, motion, pose, and runtime functions; other known ARL tokens fall back to category help.
- Show user-function declarations in Hover.
- Keep the extension lightweight; no Language Server added.

## 0.4.0

- Add ARL Document Formatter; `Shift+Alt+F` now performs full-document code alignment.
- Port ARL-IDE `fmtCode()` OPEN / CLOSE / SAME block semantics, including compact single-line statement handling.
- Add exact ARL folding ranges for func, if, while, for, loop, switch, and repeat blocks.
- Keep closing keywords visible when a block is folded.
- Set this extension as the default formatter for ARL documents.
- Add a minimal runtime entry; still no Language Server.

## 0.3.1

- Fix ARL `()` and `{}` colors being overridden by VS Code bracket-pair colorization.
- Disable bracket-pair rainbow coloring for ARL so `()`, `[]`, and `{}` all use the fixed ARL bracket scope color.

## 0.3.0

- Corrected Black/Light colors to match the current ARL-IDE implementation and screenshots.
- Fixed numbers, system variables, brackets, comments, user-defined functions, and cross-file function colors.
- Added ARL-only automatic color overrides for VS Code built-in dark/light themes.
- Kept optional Peitian ARL Black/Light themes with the same exact palette.

## 0.2.1

- Fix VS Code invalid extension warning by removing `activationEvents` from the declarative-only extension manifest.
- Add validation to prevent runtime activation fields from being reintroduced without `main`/`browser`.

## 0.2.0

- Extracted the runtime-effective Black and Light syntax palettes from `ARL-IDE-NEW`.
- Added `Peitian ARL Black` and `Peitian ARL Light` VS Code color themes.
- Kept ARL-specific color overrides scoped under `source.arl`.
- Added VS Code-style base token colors so other languages remain readable when a Peitian theme is selected.
- Added a dedicated `main()` TextMate scope to preserve the original red highlight.
- Preserved the lightweight declarative-only architecture; no runtime extension code was added.

## 0.1.0

- Initial lightweight ARL language support.
- Added `.arl` recognition, syntax highlighting and basic indentation.
- Extracted ARL language categories from ARL-IDE-NEW.

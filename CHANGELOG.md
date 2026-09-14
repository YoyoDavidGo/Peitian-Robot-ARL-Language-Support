# Changelog

## 1.0.0

- First Marketplace release of **Peitian Robot ARL Language Support**.
- Finalized the lightweight ARL feature set: syntax highlighting, formatting, folding, Outline, navigation, Hover, IntelliSense, typed parameter completion, Signature Help, precise font weights, themes, and ARL file icons.
- Added a lazy in-memory workspace index for global ARL variables so type-aware completion reuses cached project data instead of rescanning all `.arl` files on every keystroke.
- Removed extension defaults that forcibly disabled Copilot/inline suggestions, word-based suggestions, and user quick-suggestion preferences.
- Added proper `/* ... */` ARL block-comment highlighting and language configuration, using the same comment palette as `//`.
- Added English / Simplified Chinese package localization plus `README.zh-CN.md`; VS Code manifest strings follow the active display language while the Marketplace README provides explicit language links.
- Updated the Marketplace publisher ID to `David-Workshop` and connected repository/homepage/issues metadata to the public GitHub project.
- Added a retained-rights copyright notice for the publicly viewable source repository.
- Kept the extension local and lightweight: no Language Server, no AI runtime, no telemetry, no network calls, and no production dependencies.

## 0.6.6

- Reworked IntelliSense into free-input and typed-context modes.
- Free input now requires at least one typed character before suggestions are shown.
- Named instruction parameters such as `ptp p:` no longer show a suggestion list until a value prefix is typed.
- Type-aware contexts filter to declared variables of the required type: `p:` → `pose`, `j:` → `joint`, `v:` → `speed`, `s:` → `slip`, `t:` → `tool`, `w:` → `wobj`.

Earlier development versions established syntax highlighting, themes, formatting, folding, Outline, navigation, Hover documentation, completion, Signature Help, precise font weights, system-variable help, and dedicated ARL file icons.

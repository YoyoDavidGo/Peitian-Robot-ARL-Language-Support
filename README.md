# Peitian Robot ARL Language Support

**English** | [简体中文](./README.zh-CN.md)

Lightweight Visual Studio Code language support for **PEITIAN industrial robot ARL** programs.

The extension focuses on editing ARL source files well inside native VS Code. It does not add a Language Server, AI runtime, cloud service, robot connection layer, or external dependencies.

## Features

- `.arl` file recognition and dedicated file icon
- ARL syntax highlighting with Black / Light palettes based on the PEITIAN ARL editor
- Precise ARL font-weight adaptation for JetBrains Mono and Cascadia Code
- Smart indentation and full-document formatting
- Code folding for ARL block structures
- Outline, Breadcrumbs, and `Ctrl+Shift+O` function navigation
- `F12` / `Ctrl+Click` jump to user-function definitions
- Cross-file navigation for calls such as `file::func()`
- Hover documentation for ARL instructions, logic keywords, data types, functions, and system variables
- IntelliSense for ARL keywords, instructions, functions, variables, and system variables
- Type-aware completion for named robot-motion parameters
- Signature Help for built-in ARL calls and user functions

## Type-aware completion

ARL completion stays intentionally predictable.

In free input, suggestions start only after at least one character has been typed:

```arl
p
```

This can suggest items from multiple ARL categories such as `ptp`, `pose`, `print`, and matching declared variables.

When the parameter type is already known, suggestions are filtered by ARL type:

```arl
pose pHome
pose pPick
joint jHome
speed vFast

ptp p:p
```

The `p:` context accepts `pose`, so the list contains matching declared `pose` variables such as `pHome` and `pPick`, not unrelated instructions or `joint` / `speed` variables.

Current typed parameter filters include:

| Context | Expected type |
| --- | --- |
| `p:` | `pose` |
| `j:` | `joint` |
| `v:` | `speed` |
| `s:` | `slip` |
| `t:` | `tool` |
| `w:` | `wobj` |

Workspace global variables are indexed in memory and reused by completion instead of rescanning the entire workspace on every keystroke.

## Editing shortcuts

The extension uses normal VS Code shortcuts:

| Action | Windows / Linux |
| --- | --- |
| Toggle line comment (`//`) | `Ctrl+/` |
| Format document | `Shift+Alt+F` |
| Trigger IntelliSense | `Ctrl+Space` |
| Trigger Signature Help | `Ctrl+Shift+Space` |
| Go to definition | `F12` |
| Document symbols | `Ctrl+Shift+O` |
| Fold current region | `Ctrl+Shift+[` |
| Unfold current region | `Ctrl+Shift+]` |
| Fold all | `Ctrl+K`, then `Ctrl+0` |
| Unfold all | `Ctrl+K`, then `Ctrl+J` |

ARL line comments use `//`; block comments use `/* ... */`.

## Formatting

`Shift+Alt+F` formats the complete ARL document using the same core block semantics as the PEITIAN ARL editor:

```text
OPEN:  func / if / while / for / loop / switch / repeat / interrupt / timer / trigger
CLOSE: endfunc / endif / endwhile / endfor / endloop / endswitch / until
BRANCH: elseif / else / case / default
```

Compact single-line forms such as `if(cond) action` are kept from incorrectly increasing the following line's indent.

## Hover and navigation

Hover help is available for ARL instructions, functions, logic keywords, data types, and built-in system variables. The descriptions are based on the ARL Wizard reference used by the PEITIAN ARL editor.

User functions are recognized from declarations such as:

```arl
func pose calcOffset(pose src, double dx)
    ...
endfunc
```

`F12` and `Ctrl+Click` jump to local definitions. Cross-file calls such as `def::point_offset()` can resolve to the matching ARL file in the current project.

## Colors and themes

ARL uses standard TextMate scopes and also provides two optional color themes:

- **Peitian ARL Black**
- **Peitian ARL Light**

The extension also maps ARL-only token colors onto common built-in VS Code dark/light themes. Other programming languages are not recolored by these ARL rules.

Bracket-pair rainbow coloring is disabled for ARL so `()`, `[]`, and `{}` keep the fixed ARL bracket color.

## Font weight

`Peitian Robot ARL: Precise Font Weights` is enabled by default.

When the editor font is JetBrains Mono or Cascadia Code / Cascadia Mono, ARL tokens use differentiated numeric font weights that better match the PEITIAN ARL editor. Other fonts are left unchanged.

Recommended examples:

```json
"editor.fontFamily": "'JetBrains Mono', Consolas, monospace",
"editor.fontWeight": "200"
```

or:

```json
"editor.fontFamily": "'Cascadia Code', Consolas, monospace",
"editor.fontWeight": "300"
```

## Privacy and network access

This extension:

- does **not** send ARL source code over the network;
- does **not** include telemetry;
- does **not** call an AI service;
- does **not** require a language server;
- has no production npm dependencies.

All language processing is performed locally in VS Code.

## Scope

This extension is intentionally a lightweight ARL language-support extension. It does not currently provide robot online control, program execution, debugging, full semantic diagnostics, symbol rename, reference search, or AI code generation.

## Compatibility

- Visual Studio Code `1.85.0` or newer
- Windows, macOS, and Linux
- ARL files using the `.arl` extension

## Installation

After Marketplace publication, search Extensions for:

**Peitian Robot ARL Language Support**

For local testing, use **Extensions → ... → Install from VSIX...** and select the packaged `.vsix` file.

## Source and license

The source repository is public for transparency, issue reporting, and reference. Copyright is retained by the author; see [LICENSE](./LICENSE) for the applicable terms. PEITIAN / 配天 names, trademarks, official documentation, and other third-party materials remain the property of their respective rights holders.

## Support

Use the [GitHub Issues](https://github.com/YoyoDavidGo/Peitian-Robot-ARL-Language-Support/issues) page for bug reports and feature requests. When reporting a problem, include the VS Code version, extension version, operating system, a minimal ARL snippet, and a screenshot for visual issues. Do not post confidential customer robot programs or credentials in public reports.

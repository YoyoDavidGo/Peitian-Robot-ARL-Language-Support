# ARL Black / Light theme mapping

Source of truth: `YoyoDavidGo/ARL-IDE-NEW` current `master`, especially `dist/index.html` plus the Black/Light screenshots used for visual verification.

| ARL token | Black | Light | VS Code scope |
|---|---:|---:|---|
| datatype / logic / keyword | `#EEEE00` | `#d4860a` | `storage.type.arl`, `keyword.*.arl` |
| instruction | `#00EEEE` | `#0000e8` | `support.function.instruction.arl` |
| built-in function | `#00D407` | `#aa00aa` | `support.function.builtin.arl` |
| user / cross-file function | `#78a8c8` | `#1a67a8` | `entity.name.function.user.arl` |
| system variable (`$D`, `$WORLD`, ...) | `#C5947C` | `#795e26` | `variable.language.system.arl` |
| comment | `#49a659` | `#008000` | `comment.line.double-slash.arl` |
| string | `#9a9a9a` | `#808080` | `string.quoted.double.arl` |
| number | `#f0f0f0` | `#c0392b` | `constant.numeric.arl` |
| brackets `()[]{}` | `#c96eb4` | `#000080` | `punctuation.section.brackets.arl` |
| `main()` | `#ff5555` | `#ff5555` | `entity.name.function.main.arl` |
| ordinary identifiers / declared variables | `#c8d0d4` | `#1e1e1e` | plain ARL / `variable.other.definition.arl` |

## VS Code integration

The extension applies these ARL-only rules automatically when one of the current built-in VS Code themes is active:

- Black palette: Dark 2026, Dark Modern, Dark+, Visual Studio Dark, Default High Contrast.
- Light palette: Light 2026, Light Modern, Light+, Visual Studio Light, Default High Contrast Light.

The optional `Peitian ARL Black` and `Peitian ARL Light` themes use the same token mapping. Other languages are not targeted by the ARL-specific rules.

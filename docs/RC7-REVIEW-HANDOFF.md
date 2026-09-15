# RC7 review handoff — Peitian Robot ARL Language Support 1.0.0

## Scope

This repository is the lightweight VS Code language support extension for PEITIAN ARL. The language baseline is **ARCS 2.6.6 / ARL Programming Manual v4.5.0**. The Marketplace version remains **1.0.0** while pre-release behavior is stabilized.

## RC7 completion decision

RC7 intentionally rolls back the more aggressive empty-placeholder suggestion design. The stable rule is:

1. An empty typed/Wizard parameter shows **no** candidates.
2. Candidates start only after the user types the **first character**.
3. Identifiers, `$` system-variable prefixes, and numeric prefixes all use **strict prefix filtering**.
4. Candidate source priority before prefix filtering is: current type-compatible declared variables → Wizard-documented candidates → still-existing nearby values from the same instruction parameter.
5. No persistent type-wide recent-value history is used; deleted temporary values must not pollute later completion.
6. Unrelated builtin scalar system variables (for example `$D`/`$PI`) must not be injected into ordinary primitive parameters just because the primitive type matches.
7. Smart motion templates keep units outside blank snippet placeholders, e.g. `vl:${2}mm/s`, so candidate insertion cannot duplicate units.

The practical goal is predictable VS Code-native Tab behavior: if the user types `22` and no candidate starts with `22`, there is no suggestion widget left to replace it with `250`.

## Architecture

- `src/arl-intelligence.cjs`: parsing, type-aware completion context, Wizard metadata resolution, strict-prefix candidate engine, Smart snippet generation.
- `language-data/arl-wizard.json`: compact parameter metadata for common instructions/functions. Missing built-in function structures may fall back to `arl-reference.json` prototypes.
- `extension.js`: native VS Code providers; no LSP, cloud service, robot connection, or AI dependency.
- `src/workspace-variable-index.cjs`: current file + paired `<name>_data.arl` variable scope.

## Review priorities

Please focus on completion correctness rather than adding features:

- snippet placeholder/range behavior under native VS Code Suggest Widget;
- unit ownership (`mm/s`, `mm`, `%`);
- paired data-file scope and local-variable scope;
- `$P[index]`/other indexed system-variable completion;
- prototype parsing edge cases for function overloads;
- ensuring first-character strict matching does not reintroduce empty-prefix suggestions.

Do not convert this lightweight extension into a Language Server unless a concrete feature requires it.

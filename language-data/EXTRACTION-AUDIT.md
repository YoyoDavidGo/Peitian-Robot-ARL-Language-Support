# ARL Rule Extraction Audit

## Language rules

Source: `YoyoDavidGo/ARL-IDE-NEW` / `master` / `dist/index.html`

| Category | Count |
|---|---:|
| logic | 19 |
| instructions | 34 |
| functions | 131 |
| keywords | 8 |
| datatypes | 26 |
| systemVariables | 69 |
| parenOnlyFunctions | 4 |
| indentation.open | 10 |
| indentation.close | 7 |
| indentation.sameLevelBranch | 4 |

Source blob: `a7f881fa2287cc624b9f785f54b7fd8328ba6b65`

## Theme rules

Source: `YoyoDavidGo/ARL-IDE-NEW` / `master` / `docs/theme-syntax-reference.md`

The VS Code extension intentionally extracts only the requested source themes:

- `black` → Peitian ARL Black
- `light` → Peitian ARL Light

`light2`, `navy`, `dark`, and `gray` are not exposed as separate VS Code themes in v0.2.1.

Source blob: `6dda9792a74902c2bfe59d1031441955dce47bf0`

The canonical extracted data is `language-data/arl-language.json`.

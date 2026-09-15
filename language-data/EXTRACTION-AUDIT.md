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

## Wizard metadata

Source: `YoyoDavidGo/ARL-IDE-NEW` / commit `3b450afc3de5b745403e3a4d533e6fe164d1b651` / `dist/index.html::_BUILTIN_WIZ_MD`

- Checked-in source: `language-data/ARL_Wizard.source.md`
- Generated data: `language-data/arl-wizard.json`
- Parsed entries: 287
- Normalized source SHA-256: `08b346b39eab871375430eaa7c94b836f58cd46d894f44d676ff9fcf040a5ddf`

Run `npm run data:generate-wizard` after updating the checked-in source. The validation suite compares every generated entry with the source document to detect drift.

## Theme rules

Source: `YoyoDavidGo/ARL-IDE-NEW` / `master` / `docs/theme-syntax-reference.md`

The VS Code extension intentionally extracts only the requested source themes:

- `black` → Peitian ARL Black
- `light` → Peitian ARL Light

`light2`, `navy`, `dark`, and `gray` are not exposed as separate VS Code themes in v1.0.0.

Source blob: `6dda9792a74902c2bfe59d1031441955dce47bf0`

The canonical extracted data is `language-data/arl-language.json`.

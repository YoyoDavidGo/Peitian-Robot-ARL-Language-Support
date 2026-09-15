# VS Code Marketplace 1.0.0 Publishing Checklist

This file is for release preparation and is excluded from the VSIX package.

## Already prepared in 1.0.0

- Display name: `Peitian Robot ARL Language Support`
- Extension ID name: `peitian-arl-language-support`
- Publisher ID: `David-Workshop`
- Version: `1.0.0`
- Category: Programming Languages / Formatters / Themes
- Marketplace icon: square 256×256 PNG based on the existing AE logo
- `.arl` Explorer icon: standalone stylized A SVG
- README / CHANGELOG / SUPPORT
- `pricing: Free`
- Marketplace gallery banner metadata
- Pre-publish tests
- No production dependencies
- No telemetry, network calls, LSP, or AI runtime
- Workspace ARL global-variable cache to avoid rescanning the project on each completion request
- The extension no longer disables Copilot / inline suggestions or word-based suggestions for the user

## User action required before public publication

### 0. Confirm public-brand/content authorization

Before publishing publicly, confirm that you are authorized to use the **PEITIAN / 配天** name, the AE company logo, and the ARL reference descriptions/prototypes included in the extension. This is especially important if the source material comes from company manuals or internal tooling.

### 1. Create or confirm the Marketplace Publisher

The current `package.json` uses the confirmed Marketplace publisher ID:

```text
publisher: David-Workshop
```

Keep this ID unchanged for future releases so installed copies continue to receive updates under the same extension identity.

### 2. Create a standalone public GitHub repository

Recommended repository name:

```text
YoyoDavidGo/peitian-arl-language-support
```

After it exists, add these fields to `package.json`:

```json
"repository": {
  "type": "git",
  "url": "https://github.com/YoyoDavidGo/peitian-arl-language-support.git"
},
"homepage": "https://github.com/YoyoDavidGo/peitian-arl-language-support#readme",
"bugs": {
  "url": "https://github.com/YoyoDavidGo/peitian-arl-language-support/issues"
}
```

Do not add these URLs until the repository actually exists.

### 3. Decide the license and copyright owner

Do not publish with an invented license owner. Decide whether this extension will be:

- MIT / another open-source license, with the correct copyright holder; or
- proprietary / all-rights-reserved, with the correct company or individual owner.

Then add `LICENSE` at the repository root and the matching `license` field in `package.json`.

### 4. Provide Marketplace screenshots

Recommended screenshots (PNG, 16:9 or similar, clean crop, no confidential project/customer data):

1. **Syntax highlighting** — one ARL file in Dark theme showing keywords, instructions, functions, variables, comments, and system variables.
2. **Typed IntelliSense** — `ptp p:p` showing only declared `pose` variables.
3. **Hover + Signature Help** — show an ARL instruction/system variable description and parameter signature.
4. **Outline / cross-file navigation** — optional; show Outline or F12 navigation in a small demo workspace.

Once supplied, add them to the public repository (for example `images/marketplace/`) and reference them from `README.md` using HTTPS-compatible Marketplace links.

### 5. Final publisher authentication and upload

Install the latest VSCE:

```bash
npm install -g @vscode/vsce
```

Run:

```bash
npm test
vsce package
```

Then either upload the generated VSIX through the Marketplace publisher management page or publish with the supported `vsce publish` authentication flow.

Microsoft currently recommends Microsoft Entra ID based automated publishing for long-term publishing workflows; global Azure DevOps PATs are scheduled for retirement on 2026-12-01.

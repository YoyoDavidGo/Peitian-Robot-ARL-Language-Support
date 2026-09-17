import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { parseWizardMarkdown } = require('../src/arl-intelligence.cjs');

const sourceUrl = new URL('../language-data/ARL_Wizard.source.md', import.meta.url);
const outputUrl = new URL('../language-data/arl-wizard.json', import.meta.url);
const markdown = fs.readFileSync(sourceUrl, 'utf8');
const entries = parseWizardMarkdown(markdown);

if (Object.keys(entries).length < 250) {
  throw new Error(`Wizard source parsed only ${Object.keys(entries).length} entries`);
}

const output = {
  source: {
    repository: 'YoyoDavidGo/ARL-IDE-NEW',
    branch: 'master',
    commit: '3b450afc3de5b745403e3a4d533e6fe164d1b651',
    sourceFile: 'dist/index.html::_BUILTIN_WIZ_MD',
    wizard: 'ARL 指令向导文档 v4.5.0',
    arlReferenceVersion: '4.5.0',
    arcsVersion: '2.6.6',
    notes: 'Generated from the Wizard document embedded in the reference editor, plus the checked-in T/P/S/StoEnd trajectory-trigger supplements documented from the ARL manual and maintainer-provided P semantics.'
  },
  entries
};

fs.writeFileSync(outputUrl, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`Generated ${Object.keys(entries).length} Wizard entries`);

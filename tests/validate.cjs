const fs = require('fs');
const path = require('path');
const assert = require('assert');
const root = path.resolve(__dirname, '..');
const read = p => JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const pkg = read('package.json');
const data = read('language-data/arl-language.json');
const grammar = read('syntaxes/arl.tmLanguage.json');
const cfg = read('language-configuration.json');

assert.strictEqual(pkg.version, '1.0.0', 'Pre-Marketplace release must remain version 1.0.0');
assert.strictEqual(pkg.displayName, '%extension.displayName%', 'Extension display name should be localized through package.nls');
assert.strictEqual(pkg.icon, 'icon.png', 'Extension manifest must point to icon.png');
assert(fs.existsSync(path.join(root, pkg.icon)), 'Extension icon file is missing');
assert.strictEqual(pkg.pricing, 'Free', 'Marketplace release should declare Free pricing');
assert(pkg.galleryBanner && /^#[0-9A-Fa-f]{6}$/.test(pkg.galleryBanner.color), 'Marketplace gallery banner color is required');
assert(pkg.categories.includes('Formatters'), 'Marketplace release should advertise formatter support');
assert(pkg.keywords.length >= 8 && pkg.keywords.length <= 30, 'Marketplace keywords should be useful and within the 30-tag limit');
assert.strictEqual(pkg.scripts['vscode:prepublish'], 'npm test', 'Packaging must run the full test suite');
assert(!fs.readFileSync(path.join(root,'.vscodeignore'),'utf8').includes('docs/**'), 'Marketplace package must retain README screenshots under docs/images');

// 1.0.0 release hardening: block comments, localization, publisher/repository metadata.
assert.strictEqual(pkg.publisher, 'David-Workshop', 'Publisher must match the Visual Studio Marketplace publisher ID');
assert.strictEqual(pkg.contributes.configurationDefaults['[arl]']['editor.defaultFormatter'], 'David-Workshop.peitian-arl-language-support', 'Default formatter ID must use the Marketplace publisher ID');
assert.deepStrictEqual(cfg.comments.blockComment, ['/*','*/'], 'ARL block comments must be declared in language configuration');
const commentPatterns = grammar.repository.comments.patterns || [];
assert(commentPatterns.some(p => p.name === 'comment.block.arl' && p.begin === '/\\*' && p.end === '\\*/'), 'TextMate grammar must recognize /* ... */ block comments');
for (const file of ['package.nls.json','package.nls.zh-cn.json','README.zh-CN.md','LICENSE']) {
  assert(fs.existsSync(path.join(root, file)), `Marketplace release is missing ${file}`);
}
const readmeEn = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
const readmeZh = fs.readFileSync(path.join(root, 'README.zh-CN.md'), 'utf8');
assert(readmeEn.includes('https://github.com/YoyoDavidGo/Peitian-Robot-ARL-Language-Support/blob/main/README.zh-CN.md'), 'English README Chinese switch must use an absolute GitHub URL that works in the VS Code extension details view');
assert(!readmeEn.includes('](./README.zh-CN.md)'), 'English README must not use the non-working relative Chinese README link');
assert(readmeZh.includes('https://github.com/YoyoDavidGo/Peitian-Robot-ARL-Language-Support/blob/main/README.md'), 'Chinese README English switch must use an absolute GitHub URL');
assert(pkg.repository && pkg.repository.url.includes('YoyoDavidGo/Peitian-Robot-ARL-Language-Support'), 'Repository metadata must point to the public GitHub repository');
assert(pkg.bugs && pkg.bugs.url.endsWith('/issues'), 'Marketplace issues URL is required');
assert(pkg.homepage && pkg.homepage.includes('YoyoDavidGo/Peitian-Robot-ARL-Language-Support'), 'Marketplace homepage must point to the project repository');
assert.strictEqual(pkg.license, 'SEE LICENSE IN LICENSE', 'Marketplace package must point to the retained-rights license');
const nlsEn = read('package.nls.json');
const nlsZh = read('package.nls.zh-cn.json');
for (const key of ['extension.displayName','extension.description','configuration.title','configuration.preciseFontWeights.description']) {
  assert(nlsEn[key], `English localization missing ${key}`);
  assert(nlsZh[key], `Chinese localization missing ${key}`);
}

assert(pkg.contributes.languages[0].extensions.includes('.arl'));
assert.strictEqual(pkg.contributes.grammars[0].scopeName, 'source.arl');
assert.strictEqual(grammar.scopeName, 'source.arl');
assert.strictEqual(pkg.main, './extension.js', 'v0.4 formatter/folding requires the runtime extension entry');
assert.strictEqual(pkg.browser, undefined, 'Desktop formatter/folding extension does not need a browser entry');
assert(pkg.activationEvents.includes('onLanguage:arl'), 'Runtime extension must activate for ARL documents');
const extensionSource = fs.readFileSync(path.join(root, 'extension.js'), 'utf8');
assert(extensionSource.includes('registerDocumentFormattingEditProvider'), 'Runtime must register an ARL document formatter');
assert(extensionSource.includes('registerFoldingRangeProvider'), 'Runtime must register an ARL folding provider');
assert(extensionSource.includes('registerDocumentSymbolProvider'), 'Runtime must register ARL document symbols / Outline');
assert(extensionSource.includes('registerDefinitionProvider'), 'Runtime must register F12/Ctrl+Click definitions');
assert(extensionSource.includes('registerHoverProvider'), 'Runtime must register ARL hover help');
assert(extensionSource.includes('registerCompletionItemProvider'), 'Runtime must register ARL completions');
assert(extensionSource.includes('registerSignatureHelpProvider'), 'Runtime must register ARL signature help');
assert(extensionSource.includes('createTextEditorDecorationType'), 'Runtime must register precise ARL font-weight decorations');
assert.strictEqual(pkg.contributes.configurationDefaults['[arl]']['editor.tabSize'], 4);

const arlDefaults = pkg.contributes.configurationDefaults['[arl]'];
assert.strictEqual(arlDefaults['editor.inlineSuggest.enabled'], undefined, "Marketplace release must respect the user's inline AI/Copilot preference");
assert.strictEqual(arlDefaults['editor.wordBasedSuggestions'], undefined, "Marketplace release must not force the user's word-based suggestion preference");
assert.strictEqual(arlDefaults['editor.quickSuggestions'], undefined, 'Marketplace release must not force quickSuggestions');
assert.strictEqual(arlDefaults['editor.suggestOnTriggerCharacters'], undefined, 'Marketplace release must not force suggestOnTriggerCharacters');
assert.deepStrictEqual(cfg.colorizedBracketPairs, [], 'ARL must disable VS Code bracket-pair colorization so (), [] and {} keep the fixed ARL bracket color');

for (const [name, arr] of Object.entries(data.categories)) {
  assert(arr.length > 0, `${name} must not be empty`);
  const folded = arr.map(v=>v.toLowerCase());
  assert.strictEqual(new Set(folded).size, folded.length, `${name} contains duplicates`);
}

// Confirm representative source rules are retained.
for (const v of ['if','elseif','switch','goto']) assert(data.categories.logic.includes(v));
for (const v of ['movej','lin','ccir','startweave','palletcompen']) assert(data.categories.instructions.includes(v));
for (const v of ['setdo','poseinv','getwobj_3p','readregisters','clkread']) assert(data.categories.functions.includes(v));
for (const v of ['pose','joint','wobj','modbus_rtu_master','tcpforce']) assert(data.categories.datatypes.includes(v));
for (const v of ['$WOBJ_OFFSET','$TOOL_OFFSET','$AT_PATH_DO']) assert(data.categories.systemVariables.includes(v));
assert.deepStrictEqual(data.indentation.open, ['func','if','while','for','loop','switch','repeat','interrupt','timer','trigger']);
assert.deepStrictEqual(data.indentation.close, ['endfunc','endif','endwhile','endfor','endloop','endswitch','until']);
assert.deepStrictEqual(data.indentation.sameLevelBranch, ['elseif','else','case','default']);

// Language-configuration regexes must be valid JavaScript RegExp objects.
const inc = new RegExp(cfg.indentationRules.increaseIndentPattern);
const dec = new RegExp(cfg.indentationRules.decreaseIndentPattern);
for (const line of ['func void main()','IF(a > 0)','while(x)','switch(mode)','else','case 1']) {
  assert(inc.test(line), `Expected increase indent: ${line}`);
}
for (const line of ['endfunc','ENDIF','endwhile','endswitch','until(x)','else','default']) {
  assert(dec.test(line), `Expected decrease indent: ${line}`);
}
for (const line of ['if(a) MoveJ(p1)','while(x) doSomething()']) {
  assert(!inc.test(line), `Compact statement must not increase indent: ${line}`);
}

// TextMate grammar must carry every extracted fixed token in a matching repository rule.
const repoText = JSON.stringify(grammar.repository).toLowerCase();
for (const group of ['logic','instructions','functions','keywords','datatypes','parenOnlyFunctions']) {
  for (const token of data.categories[group]) {
    assert(repoText.includes(token.toLowerCase()), `Grammar missing ${group} token: ${token}`);
  }
}
assert(grammar.repository.systemVariables.patterns[0].match.includes('\\$'));



// v0.3: exact ARL-IDE Black/Light palette and automatic matching for VS Code built-in themes.
assert.strictEqual(pkg.version, '1.0.0');
assert(Array.isArray(pkg.contributes.themes) && pkg.contributes.themes.length === 2, 'Expected optional Black and Light themes');
const blackContribution = pkg.contributes.themes.find(t => t.label === 'Peitian ARL Black');
const lightContribution = pkg.contributes.themes.find(t => t.label === 'Peitian ARL Light');
assert(blackContribution && blackContribution.uiTheme === 'vs-dark');
assert(lightContribution && lightContribution.uiTheme === 'vs');
const blackTheme = read(blackContribution.path.replace(/^\.\//,''));
const lightTheme = read(lightContribution.path.replace(/^\.\//,''));

for (const [themePath, theme] of [[blackContribution.path, blackTheme], [lightContribution.path, lightTheme]]) {
  const scopes = theme.tokenColors.flatMap(r => Array.isArray(r.scope) ? r.scope : [r.scope]);
  assert(scopes.includes('comment.block.arl') || scopes.includes('comment'), `${themePath} must color ARL block comments`);
}

assert.deepStrictEqual(data.themePalettes.black.syntax, {
  s1:'#EEEE00', instruction:'#00EEEE', builtinFunction:'#00D407', systemVariable:'#C5947C',
  comment:'#49a659', string:'#9a9a9a', number:'#f0f0f0', userFunction:'#78a8c8',
  bracket:'#c96eb4', main:'#ff5555', plain:'#c8d0d4'
});
assert.deepStrictEqual(data.themePalettes.light.syntax, {
  s1:'#d4860a', instruction:'#0000e8', builtinFunction:'#aa00aa', systemVariable:'#795e26',
  comment:'#008000', string:'#808080', number:'#c0392b', userFunction:'#1a67a8',
  bracket:'#000080', main:'#ff5555', plain:'#1e1e1e'
});

const flattenRules = theme => theme.tokenColors.flatMap(r => (Array.isArray(r.scope) ? r.scope : [r.scope]).map(scope => [scope, r.settings.foreground]));
const blackRules = new Map(flattenRules(blackTheme));
const lightRules = new Map(flattenRules(lightTheme));
for (const [scope, blackColor, lightColor] of [
  ['keyword.control.arl','#EEEE00','#d4860a'],
  ['support.function.instruction.arl','#00EEEE','#0000e8'],
  ['support.function.builtin.arl','#00D407','#aa00aa'],
  ['entity.name.function.user.arl','#78a8c8','#1a67a8'],
  ['variable.other.definition.arl','#c8d0d4','#1e1e1e'],
  ['comment.line.double-slash.arl','#49a659','#008000'],
  ['string.quoted.double.arl','#9a9a9a','#808080'],
  ['constant.numeric.arl','#f0f0f0','#c0392b'],
  ['variable.language.system.arl','#C5947C','#795e26'],
  ['punctuation.section.brackets.arl','#c96eb4','#000080'],
  ['entity.name.function.main.arl','#ff5555','#ff5555']
]) {
  assert.strictEqual(blackRules.get(scope), blackColor, `Black theme mismatch: ${scope}`);
  assert.strictEqual(lightRules.get(scope), lightColor, `Light theme mismatch: ${scope}`);
}

// Built-in VS Code dark/light themes must receive the same ARL-only overrides automatically.
const tokenDefaults = pkg.contributes.configurationDefaults['editor.tokenColorCustomizations'];
assert(tokenDefaults, 'Missing automatic token color defaults');
const darkKey = '[Dark 2026][Dark Modern][Dark+][Visual Studio Dark][Default High Contrast]';
const lightKey = '[Light 2026][Light Modern][Light+][Visual Studio Light][Default High Contrast Light]';
assert(tokenDefaults[darkKey], 'Missing built-in dark theme mapping');
assert(tokenDefaults[lightKey], 'Missing built-in light theme mapping');
const rulesMap = group => new Map(group.textMateRules.flatMap(r => (Array.isArray(r.scope) ? r.scope : [r.scope]).map(scope => [scope, r.settings.foreground])));
const autoDark = rulesMap(tokenDefaults[darkKey]);
const autoLight = rulesMap(tokenDefaults[lightKey]);
for (const [scope, blackColor, lightColor] of [
  ['keyword.control.arl','#EEEE00','#d4860a'],
  ['support.function.instruction.arl','#00EEEE','#0000e8'],
  ['support.function.builtin.arl','#00D407','#aa00aa'],
  ['entity.name.function.user.arl','#78a8c8','#1a67a8'],
  ['comment.line.double-slash.arl','#49a659','#008000'],
  ['constant.numeric.arl','#f0f0f0','#c0392b'],
  ['variable.language.system.arl','#C5947C','#795e26'],
  ['punctuation.section.brackets.arl','#c96eb4','#000080']
]) {
  assert.strictEqual(autoDark.get(scope), blackColor, `Auto dark mismatch: ${scope}`);
  assert.strictEqual(autoLight.get(scope), lightColor, `Auto light mismatch: ${scope}`);
}

const grammarText = JSON.stringify(grammar);
assert(grammarText.includes('entity.name.function.main.arl'), 'Grammar must expose a dedicated main() scope');
assert(grammarText.includes('entity.name.function.user.arl'), 'Grammar must expose a dedicated user-function scope');
assert(grammarText.includes('punctuation.section.brackets.arl'), 'Grammar must expose a bracket scope');

const ref = read('language-data/arl-reference.json');
for (const token of data.categories.instructions) {
  assert(ref.entries[token], `Missing detailed instruction hover reference: ${token}`);
}
for (const token of ['setdo','getdi','offset','reltool','poseinv','init']) {
  assert(ref.entries[token], `Missing detailed function hover reference: ${token}`);
}



// v0.6.4: every ARL system variable must have its own Wizard-derived help,
// and .arl files must contribute dedicated light/dark SVG file icons.
for (const token of data.categories.systemVariables) {
  const entry = ref.entries[token.toLowerCase()];
  assert(entry, `Missing detailed system-variable hover reference: ${token}`);
  assert.strictEqual(entry.type, 'sysvar', `Wrong reference type for ${token}`);
  assert(entry.desc && !/^PEITIAN ARL/i.test(entry.desc), `Missing specific Chinese description for ${token}`);
}
assert.strictEqual(ref.entries['$config_check'].desc, '轴配置检查使能');
assert.strictEqual(ref.entries['$at_home'].desc, '是否处于 HOME位置');
assert.strictEqual(ref.entries['$wobj_offset'].desc, '工件坐标系偏移');

const languageIcon = pkg.contributes.languages[0].icon;
assert(languageIcon && languageIcon.light && languageIcon.dark, 'ARL language must contribute light/dark file icons');
for (const iconPath of [languageIcon.light, languageIcon.dark]) {
  const full = path.join(root, iconPath.replace(/^\.\//,''));
  assert(fs.existsSync(full), `Missing ARL file icon: ${iconPath}`);
  assert(/\.png$/i.test(iconPath), `Marketplace runtime language icon should use PNG: ${iconPath}`);
}

console.log('ARL extension validation passed');
console.log(Object.fromEntries(Object.entries(data.categories).map(([k,v])=>[k,v.length])));

assert(pkg.contributes.configuration && pkg.contributes.configuration.properties['peitianArl.preciseFontWeights.enabled'], 'Missing precise font-weight setting');


// v1.1.0: Smart Completion is user-controllable and the ARL file A icon uses
// the taller/longer red crossbar requested for the public release.
const smartSetting = pkg.contributes.configuration.properties['peitianArl.smartCompletion.enabled'];
assert(smartSetting, 'Missing Smart Completion on/off setting');
assert.strictEqual(smartSetting.type, 'boolean');
assert.strictEqual(smartSetting.default, true);
for (const key of ['configuration.smartCompletion.description']) {
  assert(nlsEn[key], `English localization missing ${key}`);
  assert(nlsZh[key], `Chinese localization missing ${key}`);
}
for (const svgPath of ['icons/arl-dark.svg','icons/arl-light.svg']) {
  const svg=fs.readFileSync(path.join(root,svgPath),'utf8');
  assert(svg.includes('#24ABF2'),'ARL A icon must keep RGB(36,171,242) blue');
  assert(svg.includes('#FF0000'),'ARL A icon crossbar must use the updated red accent');
  assert(svg.includes('M6.85 14.05h8.65l-1.45 3.6H5.4l1.45-3.6Z'),'ARL A icon must use the taller/longer crossbar geometry');
}
assert(nlsEn['extension.description'].includes('ARCS 2.6.6') && nlsEn['extension.description'].includes('v4.5.0'), 'English description must state ARCS/manual version');
assert(nlsZh['extension.description'].includes('ARCS 2.6.6') && nlsZh['extension.description'].includes('v4.5.0'), 'Chinese description must state ARCS/manual version');


const commands = pkg.contributes.commands || [];
assert(commands.some(x=>x.command==='peitianArl.smartEnter'), 'Manifest must contribute Smart Enter command');
const keybindings = pkg.contributes.keybindings || [];
const smartEnterBindings = keybindings.filter(x=>x.command==='peitianArl.smartEnter');
assert(smartEnterBindings.some(x=>x.key==='enter' && String(x.when||'').includes('!suggestWidgetVisible')), 'Smart Enter must handle normal snippet mode when suggestions are hidden');
assert(smartEnterBindings.some(x=>x.key==='enter' && String(x.when||'').includes('suggestWidgetVisible') && String(x.when||'').includes('peitianArl.smartValueReady')), 'Smart Enter must allow a complete manually typed value to finish even while suggestions are visible');
for(const binding of smartEnterBindings){
  assert(String(binding.when||'').includes('inSnippetMode'), 'Smart Enter must only run while VS Code is in snippet mode');
  assert(String(binding.when||'').includes('peitianArl.smartSnippetActive'), 'Smart Enter must be scoped to generic ARL Smart Completion');
}
assert(commands.some(x=>x.command==='peitianArl.smartTab'), 'Manifest must contribute Smart Tab command');
const smartTabBindings = keybindings.filter(x=>x.command==='peitianArl.smartTab');
assert(smartTabBindings.some(x=>x.key==='tab' && String(x.when||'').includes('!suggestWidgetVisible')), 'Smart Tab must handle normal snippet mode when suggestions are hidden');
assert(smartTabBindings.some(x=>x.key==='tab' && String(x.when||'').includes('suggestWidgetVisible') && String(x.when||'').includes('peitianArl.smartValueReady')), 'Smart Tab must advance a complete manually typed value even while suggestions are visible');
for(const binding of smartTabBindings) assert(String(binding.when||'').includes('peitianArl.smartSnippetActive'), 'Smart Tab must be scoped to generic ARL Smart Completion');

console.log('ARL 1.0.0 RC manifest/icon validation passed');


// Chinese punctuation is common inside ARL strings/comments. Keep VS Code
// Unicode-confusable warnings for actual code, but suppress them in text.
const pkgRc = JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const arlUnicodeDefaults = pkgRc.contributes?.configurationDefaults?.['[arl]'] || {};
assert.strictEqual(arlUnicodeDefaults['editor.unicodeHighlight.includeStrings'], false, 'ARL strings should not show Unicode-confusable warnings');
assert.strictEqual(arlUnicodeDefaults['editor.unicodeHighlight.includeComments'], false, 'ARL comments should not show Unicode-confusable warnings');
console.log('ARL Unicode-highlight defaults tests passed');

const wizardData = require('../language-data/arl-wizard.json');
const { parseWizardMarkdown } = require('../src/arl-intelligence.cjs');
const wizardSource = fs.readFileSync(path.join(root, 'language-data/ARL_Wizard.source.md'), 'utf8');
const parsedWizardSource = parseWizardMarkdown(wizardSource);
assert.strictEqual(wizardData.source.arcsVersion, '2.6.6');
assert.strictEqual(wizardData.source.arlReferenceVersion, '4.5.0');
assert(wizardData.entries && Object.keys(wizardData.entries).length >= 250, 'Wizard metadata should retain the complete embedded Wizard document');
assert.deepStrictEqual(wizardData.entries, parsedWizardSource, 'Generated Wizard metadata has drifted from its checked-in source');
assert(wizardData.entries.waituntil?.variants?.[0]?.params?.some(p=>p.key==='cond' && p.type==='bool'), 'Wizard waituntil metadata missing');
assert.strictEqual(wizardData.entries.connect?.variants?.[0]?.params?.[0]?.type, 'socket', 'connect must retain the reference editor socket parameter');
assert.strictEqual(wizardData.entries.read?.variants?.[0]?.params?.[1]?.key, 'data', 'read must retain its output data parameter');
assert.strictEqual(wizardData.entries.getdi?.variants?.length, 2, 'getdi must retain both single-channel and multi-channel variants');
console.log('ARL Wizard metadata validation passed');

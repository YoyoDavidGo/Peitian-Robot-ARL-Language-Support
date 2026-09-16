const fs = require('fs');
const path = require('path');
const assert = require('assert');
const root = path.resolve(__dirname, '..');
const read = p => JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const pkg = read('package.json');
const data = read('language-data/arl-language.json');
const grammar = read('syntaxes/arl.tmLanguage.json');
const cfg = read('language-configuration.json');

assert.strictEqual(pkg.version, '1.0.1', 'Marketplace documentation update must use version 1.0.1');
assert.strictEqual(pkg.displayName, '%extension.displayName%', 'Extension display name should be localized through package.nls');
assert.strictEqual(pkg.icon, 'icon.png', 'Extension manifest must point to icon.png');
assert(fs.existsSync(path.join(root, pkg.icon)), 'Extension icon file is missing');
assert.strictEqual(pkg.pricing, 'Free', 'Marketplace release should declare Free pricing');
assert(pkg.galleryBanner && /^#[0-9A-Fa-f]{6}$/.test(pkg.galleryBanner.color), 'Marketplace gallery banner color is required');
assert(pkg.categories.includes('Formatters'), 'Marketplace release should advertise formatter support');
assert(pkg.keywords.length >= 8 && pkg.keywords.length <= 30, 'Marketplace keywords should be useful and within the 30-tag limit');
assert.strictEqual(pkg.scripts['vscode:prepublish'], 'npm test', 'Packaging must run the full test suite');
assert(!fs.readFileSync(path.join(root,'.vscodeignore'),'utf8').includes('docs/**'), 'Marketplace package must retain README screenshots under docs/images');

// Marketplace release hardening: block comments, localization, publisher/repository metadata.
assert.strictEqual(pkg.publisher, 'David-Workshop', 'Publisher must match the Visual Studio Marketplace publisher ID');
assert.strictEqual(pkg.contributes.configurationDefaults['[arl]']['editor.defaultFormatter'], 'David-Workshop.peitian-arl-language-support', 'Default formatter ID must use the Marketplace publisher ID');
assert.deepStrictEqual(cfg.comments.blockComment, ['/*','*/'], 'ARL block comments must be declared in language configuration');
const commentPatterns = grammar.repository.comments.patterns || [];
assert(commentPatterns.some(p => p.name === 'comment.block.arl' && p.begin === '/\\*' && p.end === '\\*/'), 'TextMate grammar must recognize /* ... */ block comments');
for (const file of ['package.nls.json','package.nls.zh-cn.json','README.en.md','README.zh-CN.md','LICENSE']) {
  assert(fs.existsSync(path.join(root, file)), `Marketplace release is missing ${file}`);
}
const readmeMain = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
const readmeEn = fs.readFileSync(path.join(root, 'README.en.md'), 'utf8');
const readmeZh = fs.readFileSync(path.join(root, 'README.zh-CN.md'), 'utf8');
assert(readmeMain.startsWith('# 配天机器人 ARL 语言支持'), 'The packaged README must display Simplified Chinese directly');
assert(readmeMain.includes('[English](#english)'), 'Primary README English switch must jump to the English section on the same Details page');
assert(readmeMain.includes('## English'), 'Primary README must include the complete English section');
assert(readmeMain.includes('[简体中文](#配天机器人-arl-语言支持)'), 'English section must provide an in-page return link to Chinese');
assert(!/\]\(https:\/\/github\.com\/YoyoDavidGo\/Peitian-Robot-ARL-Language-Support\/blob\/main\/README\.(?:en|zh-CN)\.md\)/.test(readmeMain), 'Primary README language switches must not leave the VS Code Details page');
for (const readme of [readmeMain, readmeZh]) {
  assert(readme.includes('Wizard 驱动的通用参数类型感知补全（指令与函数）'), 'Chinese documentation must describe generic Wizard-driven parameter filtering');
  assert(readme.includes('常见运动指令命名参数示例（不是完整支持范围）'), 'Chinese documentation must label the motion-parameter table as examples');
  assert(!readme.includes('当前支持的类型筛选：'), 'Chinese documentation must not present the motion examples as the complete supported range');
}
for (const readme of [readmeMain, readmeEn]) {
  assert(readme.includes('Wizard-driven, type-aware parameter completion for instructions and functions'), 'English documentation must describe generic Wizard-driven parameter filtering');
  assert(readme.includes('Common named motion parameters (examples, not the complete supported range)'), 'English documentation must label the motion-parameter table as examples');
  assert(!readme.includes('Current typed parameter filters include:'), 'English documentation must not present the motion examples as the complete supported range');
}
assert(readmeZh.includes('https://github.com/YoyoDavidGo/Peitian-Robot-ARL-Language-Support/blob/main/README.en.md'), 'Chinese companion README English switch must use an absolute GitHub URL');
assert(readmeEn.includes('https://github.com/YoyoDavidGo/Peitian-Robot-ARL-Language-Support/blob/main/README.md'), 'English README Chinese switch must use an absolute GitHub URL');
assert(!/\]\(\.\/README(?:\.en|\.zh-CN)?\.md\)/.test(readmeMain + readmeEn + readmeZh), 'README language switches must not use relative links that fail in the VS Code Details view');
const screenshotNames = [
  '01-dark-hover-and-outline.png',
  '02-dark-program-overview.png',
  '03-light-syntax-and-outline.png',
  '04-intellisense-completion.png',
  '05-extension-details.png'
];
assert(!/docs\/images\/[^)]+\.jpg/i.test(readmeMain + readmeEn + readmeZh), 'README files must not reference the old low-resolution JPG screenshots');
assert.deepStrictEqual(
  fs.readdirSync(path.join(root,'docs/images')).filter(name=>/\.png$/i.test(name)).sort(),
  screenshotNames,
  'Screenshot directory must contain only the five semantic PNG names'
);
for (const name of screenshotNames) {
  const relative=`docs/images/${name}`;
  const png=fs.readFileSync(path.join(root,relative));
  assert(png.subarray(1,4).equals(Buffer.from('PNG')), `${relative} must be a PNG`);
  assert(png.readUInt32BE(16)>=1600 && png.readUInt32BE(20)>=900, `${relative} must retain the uploaded high resolution`);
  assert(readmeMain.includes(`./${relative}`) && readmeEn.includes(`./${relative}`) && readmeZh.includes(`./${relative}`), `${relative} must be referenced by all README files`);
  assert.strictEqual(readmeMain.split(`./${relative}`).length - 1, 2, `${relative} must appear once in each language section of the packaged README`);
}
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

const numericPattern = grammar.repository.numbers.patterns.find(pattern => pattern.name === 'constant.numeric.arl');
assert(numericPattern, 'TextMate grammar must expose the ARL numeric scope');
const motionPattern = grammar.repository.motionInstructions.patterns[0];
const rootGrammarIncludes = grammar.patterns.map(pattern => pattern.include);
assert(
  rootGrammarIncludes.indexOf('#motionInstructions') >= 0 &&
  rootGrammarIncludes.indexOf('#motionInstructions') < rootGrammarIncludes.indexOf('#instructions'),
  'Motion instruction context must be active before the generic instruction rule'
);
assert.strictEqual(
  motionPattern.begin,
  '(?i:\\b(?:movej|ptp|lin|cir|ccir|spl|jump)\\b)',
  'Unit-aware numeric highlighting must stay limited to Wizard motion instructions'
);
const unitNumericPattern = motionPattern.patterns.find(pattern => pattern.name === 'constant.numeric.arl');
assert(unitNumericPattern, 'Motion instructions must expose a unit-aware numeric scope');
// JavaScript uses `i` here to mirror the local case-insensitive groups in the
// Oniguruma/TextMate expressions.
const toJavaScriptRegex = pattern => pattern.replaceAll('(?i:', '(?:');
const numericRegex = new RegExp(toJavaScriptRegex(numericPattern.match), 'gi');
const unitNumericRegex = new RegExp(toJavaScriptRegex(unitNumericPattern.match), 'gi');
const numericSample = 'p:offset(p1,0,0,0),vl:12mm/s,sl:0mm,vp:50%,a:1.25e-2,b:0x1F,bad:12abc';
assert.deepStrictEqual(
  [...numericSample.matchAll(numericRegex)].map(match => match[0]),
  ['0', '0', '0', '50', '1.25e-2', '0x1F'],
  'General numeric highlighting must remain strict outside unit-aware motion contexts'
);
assert.deepStrictEqual(
  [...numericSample.matchAll(unitNumericRegex)].map(match => match[0]),
  ['12', '0'],
  'Motion values immediately followed by mm or mm/s must keep numeric highlighting'
);
assert.strictEqual('double distance=12mm'.match(numericRegex), null, 'Unit-aware matching must not leak into normal ARL code');



// v0.3: exact ARL-IDE Black/Light palette and automatic matching for VS Code built-in themes.
assert.strictEqual(pkg.version, '1.0.1');
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


// Smart Completion is user-controllable. Both runtime icon sizes are rendered
// from one AIL-inspired A logo source so their geometry cannot drift.
const smartSetting = pkg.contributes.configuration.properties['peitianArl.smartCompletion.enabled'];
assert(smartSetting, 'Missing Smart Completion on/off setting');
assert.strictEqual(smartSetting.type, 'boolean');
assert.strictEqual(smartSetting.default, true);
for (const key of ['configuration.smartCompletion.description']) {
  assert(nlsEn[key], `English localization missing ${key}`);
  assert(nlsZh[key], `Chinese localization missing ${key}`);
}
const logoSvg=fs.readFileSync(path.join(root,'icons/arl-logo.svg'),'utf8');
assert(logoSvg.includes('viewBox="0 0 24 24"'),'Shared A logo must retain the original file-icon canvas');
assert(logoSvg.includes('Marketplace render crops it to 2 2 20 20'),'Shared source must document the tighter Marketplace-only canvas');
assert(logoSvg.includes('#24ABF2'),'ARL A icon must keep RGB(36,171,242) blue');
assert(logoSvg.includes('#FF0000'),'ARL A icon crossbar must keep the red accent');
assert(logoSvg.includes('M9.0943 14.05h5.8156l-1.45 3.6H7.6443l1.45-3.6Z'),'ARL A crossbar must remain a parallelogram that touches the inner A edges without entering the blue legs');
assert(!logoSvg.includes('M6.85 14.05h8.65'),'The old overlapping crossbar geometry must not return');
const pngInfo = relativePath => {
  const png=fs.readFileSync(path.join(root,relativePath));
  assert(png.subarray(1,4).equals(Buffer.from('PNG')), `${relativePath} must be a PNG`);
  return {png,width:png.readUInt32BE(16),height:png.readUInt32BE(20),colorType:png[25]};
};
const marketplaceIcon=pngInfo('icon.png');
const darkFileIcon=pngInfo('icons/arl-dark.png');
const lightFileIcon=pngInfo('icons/arl-light.png');
assert.deepStrictEqual([marketplaceIcon.width,marketplaceIcon.height,marketplaceIcon.colorType],[256,256,6],'Marketplace A logo must be a tightly cropped 256px transparent RGBA PNG');
assert.deepStrictEqual([darkFileIcon.width,darkFileIcon.height,darkFileIcon.colorType],[24,24,6],'Dark ARL file icon must be a 24px transparent RGBA PNG');
assert.deepStrictEqual([lightFileIcon.width,lightFileIcon.height,lightFileIcon.colorType],[24,24,6],'Light ARL file icon must be a 24px transparent RGBA PNG');
assert(darkFileIcon.png.equals(lightFileIcon.png),'Light and dark ARL file icons must come from the same SVG rendering');
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

console.log('ARL 1.0.1 manifest/icon validation passed');


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

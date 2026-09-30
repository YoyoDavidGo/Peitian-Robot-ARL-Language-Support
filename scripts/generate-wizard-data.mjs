import fs from 'node:fs';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { parseWizardMarkdown } = require('../src/arl-intelligence.cjs');
const root = new URL('../', import.meta.url);
const read = path => JSON.parse(fs.readFileSync(new URL(path, root), 'utf8'));
const write = (path, value) => fs.writeFileSync(new URL(path, root), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
const option = name => { const index=process.argv.indexOf(name);return index<0?null:process.argv[index+1]; };
const sourcePath=option('--source');
const editorPath=option('--editor');
if(sourcePath) fs.copyFileSync(sourcePath,new URL('language-data/ARL_Wizard.source.md',root));
const markdown=fs.readFileSync(new URL('language-data/ARL_Wizard.source.md',root),'utf8').replace(/\r\n/g,'\n');
const entries=parseWizardMarkdown(markdown);
if(Object.keys(entries).length<300) throw new Error('Incomplete V2.7 Wizard source');
const source={repository:'YoyoDavidGo/ARL-IDE-NEW',sourceFile:'docs/ARL_Wizard_V2.7正式版20260930.md',
  wizard:'ARL Language Metadata / Wizard MD V2.7',schemaVersion:'2.7',arlReferenceVersion:'4.5.0',arcsVersion:'2.6.6',
  sha256:crypto.createHash('sha256').update(markdown).digest('hex'),notes:'Generated from the maintainer-reviewed V2.7 document; variant signatures, presets and semantic metadata are authoritative.'};
write('language-data/arl-wizard.json',{source,entries});
write('language-data/arl-reference.json',{source,entries});

const data=read('language-data/arl-language.json');
data.source=source;
const groups={logic:['logic'],instructions:['instruction','instruction.motion'],functions:['function'],keywords:['keyword'],datatypes:['datatype'],constants:['builtin.constant'],systemVariables:['sysvar']};
const parenOnlyFunctions=['t','p','s','stoend'];
data.categories=Object.fromEntries(Object.entries(groups).map(([group,types])=>[group,Object.entries(entries).filter(([key,entry])=>types.includes(entry.type) && !(group==='functions' && parenOnlyFunctions.includes(key))).map(([,entry])=>entry.name)]));
data.categories.parenOnlyFunctions=parenOnlyFunctions;
data.systemVariableTypes=Object.fromEntries(Object.entries(entries).filter(([,entry])=>entry.type==='sysvar').map(([key,entry])=>[key,entry.value_type]));
const escape=text=>text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const words=values=>values.map(value=>value.toLowerCase()).sort((a,b)=>b.length-a.length || a.localeCompare(b)).map(escape).join('|');
const wordPattern=values=>`(?i:\\b(?:${words(values)})\\b)`;
const grammar=read('syntaxes/arl.tmLanguage.json');
for(const [group,scope] of [['datatypes','storage.type.arl'],['logic','keyword.control.arl'],['keywords','keyword.other.arl'],['instructions','support.function.instruction.arl']]) grammar.repository[group].patterns=[{name:scope,match:wordPattern(data.categories[group])}];
grammar.repository.constants={patterns:[{name:'constant.language.arl',match:wordPattern(data.categories.constants)}]};
if(!grammar.patterns.some(rule=>rule.include==='#constants')) grammar.patterns.splice(grammar.patterns.findIndex(rule=>rule.include==='#keywords')+1,0,{include:'#constants'});
grammar.repository.builtInFunctions.patterns[1].match=wordPattern(data.categories.functions)+'(?=\\s*\\()';
grammar.repository.parenOnlyFunctions.patterns[0].match=wordPattern(parenOnlyFunctions)+'(?=\\s*\\()';
const motion=Object.values(entries).filter(entry=>entry.type==='instruction.motion').map(entry=>entry.name);
grammar.repository.motionInstructions.patterns[0].begin=wordPattern(motion);
grammar.repository.variableDeclarations.patterns[0].match=`(?i:(?:\\bconst\\b\\s+)?\\b(?:${words(data.categories.datatypes)})\\b\\s+([A-Za-z_][A-Za-z0-9_]*))`;
write('syntaxes/arl.tmLanguage.json',grammar);

if(editorPath){
  const html=fs.readFileSync(editorPath,'utf8');
  const cssVars=block=>Object.fromEntries([...block.matchAll(/(--[\w-]+)\s*:\s*([^;\n}]+)/g)].map(match=>[match[1],match[2].trim()]));
  const rootVars=cssVars(html.match(/:root\s*\{([\s\S]*?)\}/)[1]);
  const lightVars=cssVars(html.match(/\.theme-light\s*\{([\s\S]*?)\}/)[1]);
  const themes=html.slice(html.indexOf('const _THEMES ='));
  const runtimeVars=name=>Object.fromEntries([...themes.match(new RegExp(`\\n  ${name}: \\{([\\s\\S]*?)\\n  \\}`))[1].matchAll(/'(--[\w-]+)'\s*:\s*'([^']+)'/g)].map(match=>[match[1],match[2]]));
  const tokenVars={s1:'--c1',datatype:'--c-type',constant:'--c-const',instruction:'--c2',builtinFunction:'--c3',systemVariable:'--c4',comment:'--ck',string:'--cs',number:'--cn',userFunction:'--cf',bracket:'--cb',plain:'--tx'};
  for(const [palette,name] of [['black','black'],['light','light']]){
    const vars={...rootVars,...(palette==='light'?lightVars:{}),...runtimeVars(name)};
    const syntax=Object.fromEntries(Object.entries(tokenVars).map(([key,variable])=>[key,vars[variable]]));
    syntax.main='#ff5555';
    data.themePalettes[palette]={sourceTheme:name,editorBackground:vars['--bg0'],editorForeground:vars['--tx'],syntax};
    const themePath=`themes/peitian-arl-${palette==='black'?'black':'light'}-color-theme.json`;
    const theme=read(themePath);
    const colorMap={'editor.background':'--bg0','editor.foreground':'--tx','editorLineNumber.foreground':'--ln','editorLineNumber.activeForeground':'--tx','editorCursor.foreground':'--tx','sideBar.background':'--bg1','sideBar.foreground':'--tx','sideBar.border':'--bd','activityBar.background':'--bg1','activityBar.foreground':'--tx','activityBar.inactiveForeground':'--mt','activityBar.border':'--bd','titleBar.activeBackground':'--bg1','titleBar.activeForeground':'--mt','titleBar.border':'--bd','tab.activeBackground':'--bg0','tab.activeForeground':'--tx','tab.inactiveBackground':'--bg1','tab.inactiveForeground':'--mt','tab.border':'--bd','panel.background':'--bg1','panel.border':'--bd','statusBar.background':'--bg-stb','statusBar.foreground':'--mt','statusBar.border':'--bd','foreground':'--tx','descriptionForeground':'--mt'};
    for(const [key,variable] of Object.entries(colorMap)) theme.colors[key]=vars[variable];
    write(themePath,theme);
  }
  data.themePalettes.source={repository:source.repository,referenceFile:'dist/index.html',sha256:crypto.createHash('sha256').update(html).digest('hex'),note:'V2.7 editor runtime Black/Light palettes, including distinct datatype and constant colors.'};
}
const pkg=read('package.json');
const scopeKeys={'storage.type.arl':'datatype','storage.type.return.arl':'datatype','keyword.control.arl':'s1','keyword.other.arl':'s1','keyword.declaration.function.arl':'s1','constant.language.arl':'constant','support.function.instruction.arl':'instruction','support.function.builtin.arl':'builtinFunction','support.function.builtin.paren.arl':'builtinFunction','entity.name.function.user.arl':'userFunction','entity.name.namespace.arl':'userFunction','punctuation.accessor.arl':'userFunction','variable.language.system.arl':'systemVariable','string.quoted.double.arl':'string','punctuation.definition.string.begin.arl':'string','punctuation.definition.string.end.arl':'string','constant.numeric.arl':'number','punctuation.section.brackets.arl':'bracket','entity.name.function.main.arl':'main','support.function.builtin.main.arl':'main','source.arl':'plain','variable.other.definition.arl':'plain'};
const updateRules=(rules,palette)=>{
  const result=[];
  for(const rule of rules){
    if(!String(rule.name||'').startsWith('Peitian ARL:')){result.push(rule);continue;}
    const groups=new Map();
    for(const scope of Array.isArray(rule.scope)?rule.scope:[rule.scope]){
      const color=palette[scopeKeys[scope] || (scope.startsWith('comment.') || scope.startsWith('punctuation.definition.comment')?'comment':'plain')];
      const scopes=groups.get(color)||[];scopes.push(scope);groups.set(color,scopes);
    }
    for(const [color,scopes] of groups) result.push({...rule,scope:scopes,settings:{...rule.settings,foreground:color}});
  }
  if(!result.some(rule=>(Array.isArray(rule.scope)?rule.scope:[rule.scope]).includes('constant.language.arl'))) result.push({name:'Peitian ARL: constants',scope:'constant.language.arl',settings:{foreground:palette.constant,fontStyle:''}});
  return result;
};
for(const palette of ['black','light']){
  const path=`themes/peitian-arl-${palette==='black'?'black':'light'}-color-theme.json`;
  const theme=read(path);theme.tokenColors=updateRules(theme.tokenColors,data.themePalettes[palette].syntax);write(path,theme);
}
for(const [selector,value] of Object.entries(pkg.contributes.configurationDefaults['editor.tokenColorCustomizations'])) value.textMateRules=updateRules(value.textMateRules,data.themePalettes[selector.includes('Dark')?'black':'light'].syntax);
write('package.json',pkg);
write('language-data/arl-language.json',data);
console.log(`Generated ${Object.keys(entries).length} V2.7 entries, language categories, reference, grammar and palettes`);

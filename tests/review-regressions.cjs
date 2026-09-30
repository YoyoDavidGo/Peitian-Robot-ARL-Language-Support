const assert=require('node:assert/strict');
const i=require('../src/arl-intelligence.cjs');
const wizard=require('../language-data/arl-wizard.json');
const reference=require('../language-data/arl-reference.json');
const language=require('../language-data/arl-language.json');
const failures=[];
function check(name,run){try{run();console.log(`PASS ${name}`);}catch(error){failures.push(name);console.error(`FAIL ${name}: ${error.message}`);}}
function candidates(line,variables){
  const context=i.getWizardParamContext(line,line.length,wizard,reference,language,variables);
  return i.buildWizardParameterCandidates({...context,variantIndices:context.variantIndices,variables,prefix:context.prefix});
}
check('same-arity device overloads preserve compatible variables',()=>{
  const variables=[{label:'dev1',kind:'variable',type:'iodev'},{label:'devSocket',kind:'variable',type:'socket'}];
  assert.deepEqual(candidates('close(dev',variables).map(item=>item.label),['dev1','devSocket']);
  const context=i.getWizardParamContext('close(dev1)',10,wizard,reference,language,variables);
  assert.equal(context.expectedType,'iodev');
  assert.equal(i.getSmartCompletionTemplates('close','function',reference,wizard).length,wizard.entries.close.wizard.length,'Only documented UI presets should be offered, while other valid forms remain type-aware');
  assert.equal(i.getSmartCompletionTemplates('getposetool','function',reference,wizard).length,2);
});
check('new compact-if preset is available',()=>{
  const templates=i.getSmartCompletionTemplates('if','keyword',reference,wizard);
  assert.equal(templates.length,2);
  assert.equal(templates[0].snippet,'if(${1:condition})\n    ${0}\nendif');
  assert.equal(templates[1].snippet,'if(${1:condition}) ${2:statement}');
});
check('same-arity typed presets retain their identity',()=>{
  for(const name of ['getposetool','getposewobj','tostr','toint','rand','read','write']){
    const templates=i.getSmartCompletionTemplates(name,'function',reference,wizard);
    assert.deepEqual(templates.map(template=>template.variantName),wizard.entries[name].wizard.map(preset=>preset.name));
  }
});
check('known variables, quoted literals and nested calls select typed overloads',()=>{
  const variables=[{label:'poseIndex',type:'uint',kind:'variable'},{label:'poseName',type:'string',kind:'variable'},
    {label:'amount',type:'int',kind:'variable'},{label:'bytes',type:'byte',kind:'variable'}];
  assert.deepEqual(candidates('getposetool(pose',variables).map(item=>item.label),['poseIndex','poseName']);
  for(const line of ['tostr(amount,h','toint("12",h','tostr(abs(amount),h']){
    assert(candidates(line,variables).some(item=>item.label==='hex'),`${line} must offer the number-base enum`);
    assert.equal(i.getWizardParamContext(line,line.length,wizard,reference,language,variables).expectedType,'num_base');
  }
  const byName='getposetool("tool1")';
  assert.equal(i.getSignatureContext(byName,byName.length-1,reference,language,wizard).label,'pose getposetool(string pose_name)');
  const byVariable='string poseName\ngetposetool(poseName)';
  assert.equal(i.getSignatureContext(byVariable,byVariable.length-1,reference,language,wizard).variantIndex,1);
  assert.equal(i.getWizardHoverSignatures('getposetool(poseName)',2,wizard,reference,language,variables)[0],'pose getposetool(string pose_name)');
  assert.equal(i.getSignatureContext('getdi(1,2)',7,reference,language,wizard).variantIndex,1,'The complete call must select its overload even when the cursor is in the first argument');
  const byteCall='byte bytes\nbitcheck(bytes,1)';
  const signature=i.getSignatureContext(byteCall,byteCall.length-1,reference,language,wizard);
  assert.equal(signature.variantIndex,1);
  assert(signature.parameterDocumentation[1].includes('0~7'));
});
check('byte and integer bit constraints remain distinct',()=>{
  for(const name of ['bitcheck','bitset','bitclear']){
    const parameters=i.getWizardHoverParameters(name,wizard,reference,language).filter(param=>param.key==='pos');
    assert.deepEqual(parameters.map(param=>param.options),['0~31','0~7']);
    assert.deepEqual(parameters.map(param=>param.variantNames),[['整型'],['字节型']]);
  }
});
if(failures.length) process.exitCode=1;

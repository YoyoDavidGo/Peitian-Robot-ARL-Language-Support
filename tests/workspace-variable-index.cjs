const assert = require('assert');
const { WorkspaceVariableIndex } = require('../src/workspace-variable-index.cjs');
const { parseVariables } = require('../src/arl-intelligence.cjs');
const languageData = require('../language-data/arl-language.json');

(async()=>{
  let discoverCalls=0;
  let readCalls=0;
  const files = new Map([
    ['file:///ws/a.arl','pose pA\nspeed vA'],
    ['file:///ws/b.arl','joint jB\nfunc void helper()\n    pose pLocal\nendfunc']
  ]);
  const index = new WorkspaceVariableIndex({
    parseVariables,
    languageData,
    discoverUris: async()=>{ discoverCalls++; return [...files.keys()]; },
    readText: async uri=>{ readCalls++; return files.get(uri); },
    uriKey: uri=>String(uri),
    sourceName: uri=>String(uri).split('/').pop()
  });

  await index.initialize();
  assert.strictEqual(discoverCalls,1,'workspace discovery should happen once');
  assert.strictEqual(readCalls,2,'each discovered file should be read once');
  let vars=index.getAllGlobalVariables('file:///ws/current.arl');
  assert(vars.some(v=>v.name==='pA' && v.type==='pose'));
  assert(vars.some(v=>v.name==='vA' && v.type==='speed'));
  assert(vars.some(v=>v.name==='jB' && v.type==='joint'));
  assert(!vars.some(v=>v.name==='pLocal'),'function-local variables must not enter the workspace global index');

  await index.initialize();
  assert.strictEqual(discoverCalls,1,'repeated initialize must reuse the cache');
  assert.strictEqual(readCalls,2,'repeated initialize must not reread all files');

  index.updateText('file:///ws/a.arl','pose pA2\nint countA','a.arl');
  vars=index.getAllGlobalVariables('file:///ws/current.arl');
  assert(!vars.some(v=>v.name==='pA'),'updating one file must replace stale entries');
  assert(vars.some(v=>v.name==='pA2' && v.type==='pose'));

  const withoutA=index.getAllGlobalVariables('file:///ws/a.arl');
  assert(!withoutA.some(v=>v.source==='a.arl'),'current document must be excludable from project candidates');

  index.remove('file:///ws/b.arl');
  vars=index.getAllGlobalVariables('file:///ws/current.arl');
  assert(!vars.some(v=>v.name==='jB'),'removed files must leave the index');



  // Marketplace release: typed completion must be scoped to the current ARL
  // program and its paired <name>_data.arl file, not every ARL file in the workspace.
  files.set('file:///ws/1_data.arl','pose p1Data\nspeed v1Data');
  files.set('file:///ws/type1_data.arl','pose pType1\njoint jType1');
  files.set('file:///ws/type2_data.arl','pose pType2');
  files.set('file:///other/1_data.arl','pose pOtherDirectory');
  index.updateText('file:///ws/1_data.arl', files.get('file:///ws/1_data.arl'), '1_data.arl');
  index.updateText('file:///ws/type1_data.arl', files.get('file:///ws/type1_data.arl'), 'type1_data.arl');
  index.updateText('file:///ws/type2_data.arl', files.get('file:///ws/type2_data.arl'), 'type2_data.arl');
  index.updateText('file:///other/1_data.arl', files.get('file:///other/1_data.arl'), '1_data.arl');

  let paired=index.getGlobalVariables('file:///ws/1.arl');
  assert(paired.some(v=>v.name==='p1Data'),'1.arl must see globals from 1_data.arl');
  assert(!paired.some(v=>v.name==='pType1'),'1.arl must not see type1_data.arl variables');
  assert(!paired.some(v=>v.name==='pType2'),'1.arl must not see type2_data.arl variables');
  assert(!paired.some(v=>v.name==='pOtherDirectory'),'paired data files must be in the same directory');

  paired=index.getGlobalVariables('file:///ws/type1.arl');
  assert(paired.some(v=>v.name==='pType1'),'type1.arl must see globals from type1_data.arl');
  assert(!paired.some(v=>v.name==='pType2'),'type1.arl must not see globals from type2_data.arl');

  paired=index.getGlobalVariables('file:///ws/type1_data.arl');
  assert(!paired.some(v=>v.source==='type1_data.arl'),'data file must not return itself as its paired source');

  files.set('file:///ws/1_data.arl','pose p1Fresh');
  await index.refresh('file:///ws/1_data.arl');
  paired=index.getGlobalVariables('file:///ws/1.arl');
  assert(!paired.some(v=>v.name==='p1Data'),'refresh must replace globals read from an externally changed data file');
  assert(paired.some(v=>v.name==='p1Fresh'),'refresh must expose the latest globals from disk');

  index.invalidate('file:///ws/1_data.arl');
  paired=index.getGlobalVariables('file:///ws/1.arl');
  assert.strictEqual(paired.length,0,'invalidating a data file must immediately remove stale globals');

  index.updateText('file:///ws/1_data.arl','pose pStale','1_data.arl');
  files.delete('file:///ws/1_data.arl');
  await index.refresh('file:///ws/1_data.arl');
  paired=index.getGlobalVariables('file:///ws/1.arl');
  assert.strictEqual(paired.length,0,'a failed refresh must not retain stale globals for a deleted data file');

  const pendingReads=[];
  const racingIndex = new WorkspaceVariableIndex({
    parseVariables,
    languageData,
    discoverUris: async()=>[],
    readText: async()=>new Promise(resolve=>pendingReads.push(resolve)),
    uriKey: uri=>String(uri),
    sourceName: uri=>String(uri).split('/').pop()
  });
  const olderRefresh=racingIndex.refresh('file:///ws/race_data.arl');
  const newerRefresh=racingIndex.refresh('file:///ws/race_data.arl');
  pendingReads[1]('pose pNewest');
  await newerRefresh;
  pendingReads[0]('pose pOlder');
  await olderRefresh;
  paired=racingIndex.getGlobalVariables('file:///ws/race.arl');
  assert(paired.some(v=>v.name==='pNewest'),'the newest overlapping refresh must win');
  assert(!paired.some(v=>v.name==='pOlder'),'an older delayed read must not restore stale globals');

  console.log('ARL workspace variable index tests passed');
})().catch(err=>{ console.error(err); process.exitCode=1; });

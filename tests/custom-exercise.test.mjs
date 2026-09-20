import test from 'node:test';
import assert from 'node:assert/strict';
import { exerciseCatalog, validateCustomExercise, volume, records, bestEstimate } from '../dist/data.js';

test('稀有器械按部位加入动作库，不改变预置动作或另一个空间', () => {
  const custom = [{id:'custom-1',name:'悍马单侧推胸',group:'chest',note:'单侧挂片重量'}];
  const reloaded = JSON.parse(JSON.stringify({customExercises:custom}));
  assert.ok(exerciseCatalog(reloaded.customExercises).find(g=>g.id==='chest').exercises.includes('悍马单侧推胸'));
  assert.ok(exerciseCatalog(custom).find(g=>g.id==='chest').exercises.includes('杠铃卧推'));
  assert.ok(!exerciseCatalog().flatMap(g=>g.exercises).includes('悍马单侧推胸'));
});
test('拒绝空名称、重复名称及无效部位，大小写和全角字符不会绕过重名检查', () => {
  assert.ok(validateCustomExercise({name:'  ',group:'chest'}));
  assert.ok(validateCustomExercise({name:' 杠铃卧推 ',group:'back'}));
  assert.ok(validateCustomExercise({name:'Hammer Press',group:'chest'},[{name:'Ｈａｍｍｅｒ　Ｐｒｅｓｓ',group:'chest'}]));
  assert.ok(validateCustomExercise({name:'器械 A',group:'unknown'}));
  assert.ok(validateCustomExercise({name:'器械 A',group:'chest',note:'x'.repeat(161)}));
  assert.equal(validateCustomExercise({name:'悍马单侧推胸',group:'chest',note:'单侧重量 kg'}),'');
});
test('自定义器械训练参与容量、e1RM 和 PR，并与预置卧推分别计算', () => {
  const session = {date:'2026-09-15',exercises:[
    {name:'悍马单侧推胸',group:'chest',sets:[{weight:30,reps:10,done:true,type:'working'}]},
    {name:'杠铃卧推',group:'chest',sets:[{weight:55,reps:10,done:true,type:'working'}]},
  ]};
  assert.equal(volume(session),850);
  assert.equal(bestEstimate(session,'悍马单侧推胸'),40);
  const prs=records([session]);
  assert.equal(prs.length,2);
  assert.equal(prs.find(r=>r.name==='悍马单侧推胸').weight,30);
});

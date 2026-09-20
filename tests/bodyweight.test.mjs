import test from 'node:test';
import assert from 'node:assert/strict';
import { trackingForName, exerciseCatalog, validateCustomExercise, validateSet, volume, e1rm, bestEstimate, bestReps, bodyweightReps, workSets, records } from '../dist/data.js';
const bw = (reps,extra={}) => ({weight:null,reps,rir:'',done:true,type:'working',tracking:'reps',...extra});
const session = {date:'2026-09-15',exercises:[{name:'悬挂举腿',group:'core',tracking:'reps',sets:[bw(15),bw(12),bw(30,{type:'warmup'}),bw(40,{done:false})]}]};
test('自重组无需重量，仍校验次数与 RIR',()=>{
  assert.equal(validateSet(bw(15)),'');assert.equal(validateSet(bw(15,{weight:''})), '');
  assert.ok(validateSet(bw('')));assert.ok(validateSet(bw(-1)));assert.ok(validateSet(bw(1.5)));assert.ok(validateSet(bw(15,{rir:11})));
  assert.ok(validateSet({weight:'',reps:10,rir:''}));
});
test('自重统计次数与工作组，排除热身和未完成组，不生成重量或 e1RM',()=>{
  assert.equal(volume(session),0);assert.equal(workSets(session).length,2);
  assert.equal(bodyweightReps(session),27);assert.equal(bestReps(session,'悬挂举腿'),15);
  assert.equal(e1rm(bw(8)),null);assert.equal(bestEstimate(session,'悬挂举腿'),0);
  const record=records([session])[0];assert.equal(record.tracking,'reps');assert.equal(record.bestReps,15);assert.equal(record.estimate,0);assert.deepEqual(record.repsByWeight,{});
});
test('混合训练只将负重组计入容量，所有工作组计入组数',()=>{
  const mixed={...session,exercises:[...session.exercises,{name:'杠铃卧推',group:'chest',sets:[{weight:55,reps:10,done:true,type:'working'}]}]};
  assert.equal(volume(mixed),550);assert.equal(workSets(mixed).length,3);assert.equal(bodyweightReps(mixed),27);
  const reloaded=JSON.parse(JSON.stringify(mixed));assert.equal(bestReps(reloaded,'悬挂举腿'),15);
  const earlier={...session,exercises:[{...session.exercises[0],sets:[bw(10)]}]};
  assert.equal(records([earlier,session]).find(r=>r.name==='悬挂举腿').bestReps,15);
  assert.equal(records([earlier])[0].bestReps,10);
});
test('内置和自定义自重类型正确，兼容旧自定义同名动作',()=>{
  assert.equal(trackingForName('仰卧起坐'),'reps');assert.equal(trackingForName('杠铃卧推'),'weighted');
  assert.equal(trackingForName('自重卷腹',[{name:'自重卷腹',tracking:'reps'}]),'reps');
  const legacy=[{name:'仰卧起坐',group:'core'}];
  assert.equal(trackingForName('仰卧起坐',legacy),'weighted');
  assert.equal(exerciseCatalog(legacy).flatMap(g=>g.exercises).filter(n=>n==='仰卧起坐').length,1);
  assert.equal(validateCustomExercise({name:'反向卷腹',group:'core',tracking:'reps'}),'');
  assert.ok(validateCustomExercise({name:'反向卷腹',group:'core',tracking:'invalid'}));
});

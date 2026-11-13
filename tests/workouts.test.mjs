import test from 'node:test';
import assert from 'node:assert/strict';
import {routineFromSession,sessionFromRoutine,validateRoutines,lastExercise,fillReference,restoreRest,sessionSummary} from '../dist/workouts.js';
import {validateBackup} from '../dist/backup.js';
import {localDate,daysAgo} from '../dist/data.js';

const set=(values={})=>({id:crypto.randomUUID(),weight:40,reps:10,rir:0,type:'working',done:true,...values});
const exercise=(values={})=>({id:'exercise',name:'杠铃卧推',group:'chest',tracking:'weighted',sets:[set(),set({weight:42.5,reps:8})],...values});
const session=(values={})=>({id:'old',title:'胸日',date:daysAgo(2),duration:45,createdAt:new Date().toISOString(),checkin:{sleepHours:8,fatigue:2},decisionReceiptId:'receipt',intakeRunId:'intake',exercises:[exercise()],...values});

test('模板生成新训练，清空完成/RIR/状态/旧归因，保留参考值和器械快照',()=>{
  const original=session();original.exercises[0].setup={equipment:'A机',seat:'2',grip:'宽',restSeconds:90};
  const routine=routineFromSession(original,'固定胸日');
  const a=sessionFromRoutine(routine),b=sessionFromRoutine(routine);
  assert.notEqual(a.id,b.id);assert.notEqual(a.exercises[0].id,b.exercises[0].id);assert.notEqual(a.exercises[0].sets[0].id,b.exercises[0].sets[0].id);
  assert.equal(a.date,localDate());assert.equal(a.duration,0);assert.equal(a.exercises[0].sets[0].done,false);assert.equal(a.exercises[0].sets[0].rir,'');assert.equal(a.exercises[0].sets[0].weight,40);assert.equal(a.exercises[0].setup.restSeconds,90);
  for(const key of ['checkin','decisionReceiptId','intakeRunId'])assert.equal(a[key],undefined);
  a.exercises[0].sets[0].weight=999;assert.equal(original.exercises[0].sets[0].weight,40);assert.equal(routine.exercises[0].sets[0].weight,40);
});

test('模板允许空参考值，自重不制造重量；无效与过量输入被拒绝',()=>{
  const e=exercise({name:'仰卧起坐',group:'core',tracking:'reps',sets:[set({weight:null,reps:'',done:false})]});
  const r=routineFromSession(session({exercises:[e]}),'自重');assert.equal(sessionFromRoutine(r).exercises[0].sets[0].weight,null);
  for(const mutate of [r=>r.name=' ',r=>r.exercises[0].sets[0].reps=1.5,r=>r.exercises[0].sets[0].reps=101,r=>r.exercises[0].sets[0].type='unknown',r=>r.exercises.push(r.exercises[0])]){const v=structuredClone(r);mutate(v);assert.throws(()=>validateRoutines([v]));}
  assert.throws(()=>validateRoutines(Array.from({length:21},()=>r)));
  assert.throws(()=>sessionFromRoutine(r,[],daysAgo(-1)));
});

test('已删除或改变记录方式的自定义动作不能静默带入模板',()=>{
  const custom={id:'custom',name:'我的器械',group:'chest',tracking:'weighted'};
  const r=routineFromSession(session({exercises:[exercise({name:custom.name})]}),'自定义');
  assert.doesNotThrow(()=>sessionFromRoutine(r,[custom]));
  assert.throws(()=>sessionFromRoutine(r,[{...custom,deleted:true}]));
  assert.throws(()=>sessionFromRoutine(r,[{...custom,tracking:'reps'}]));
});

test('上次记录排除同日、未来、无效组和记录方式不同的条目',()=>{
  const source=session(),target=exercise();
  const newer=session({id:'today',date:localDate(),exercises:[exercise({sets:[set({weight:999})]})]});
  const wrong=session({id:'wrong',date:daysAgo(1),exercises:[exercise({tracking:'reps'})]});
  const invalid=session({id:'invalid',date:daysAgo(1),exercises:[exercise({sets:[set({reps:0})]})]});
  const ref=lastExercise([source,newer,wrong,invalid],target,localDate());assert.equal(ref.sessionId,source.id);assert.equal(ref.exercise.sets[0].rir,0);
  assert.equal(lastExercise([source],target,localDate(),source.id),null);
});

test('填入参考只修改对应未完成组的重量/次数，保留完成组、RIR和器械',()=>{
  const original=exercise({setup:{equipment:'本次'},sets:[set({weight:50}),set({weight:'',reps:'',rir:3,done:false}),set({weight:60,reps:5,done:false})]});
  const filled=fillReference(original,{exercise:exercise()});
  assert.equal(filled.sets[0].weight,50);assert.equal(filled.sets[1].weight,42.5);assert.equal(filled.sets[1].reps,8);assert.equal(filled.sets[1].rir,3);assert.equal(filled.sets[1].done,false);assert.equal(filled.sets[2].weight,60);assert.equal(filled.setup.equipment,'本次');assert.equal(original.sets[1].weight,'');
});

test('休息时间按绝对时间恢复，过期不会重启，非法远期时间被拒绝',()=>{
  const now=100000;assert.deepEqual(restoreRest({until:now+45000,duration:90},now),{until:145000,duration:90});
  assert.equal(restoreRest({until:now-1000,duration:90},now).until,now-1000);
  assert.equal(restoreRest({until:now+9999999,duration:90},now).until,0);
  assert.equal(restoreRest({until:'bad',duration:90},now).until,0);
});

test('练后总结只汇总完成组，热身和自重不计入负重工作组容量',()=>{
  const s=session({exercises:[exercise({sets:[set(),set({weight:100,done:false}),set({weight:20,type:'warmup'})]}),exercise({name:'仰卧起坐',group:'core',tracking:'reps',sets:[set({weight:null,reps:15})]})]});
  assert.deepEqual(sessionSummary(s),{exercises:2,sets:3,workingSets:2,volume:400,bodyweightReps:15,duration:45});
});

test('模板随完整备份恢复；旧备份兼容，非法模板不能损坏个人数据',()=>{
  const s=session(),r=routineFromSession(s,'胸日');
  const raw={version:1,sessions:[s],weights:[],routines:[r]};
  assert.deepEqual(validateBackup(raw).routines,[r]);assert.deepEqual(validateBackup({...raw,routines:undefined}).routines,[]);
  assert.throws(()=>validateBackup({...raw,routines:[{...r,exercises:[]}]}));
});

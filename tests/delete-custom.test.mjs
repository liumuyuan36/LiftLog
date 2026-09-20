import test from 'node:test';
import assert from 'node:assert/strict';
import {setCustomExerciseDeleted,exerciseCatalog,records,trackingForName,validateCustomExercise} from '../dist/data.js';
test('删除自定义动作只移除可选项，保留历史、PR、草稿与自重类型，支持恢复',()=>{
  const e={id:'e1',name:'自重反向卷腹',group:'core',tracking:'reps'};
  const state={customExercises:[e],sessions:[{date:'2026-09-15',exercises:[{...e,sets:[{done:true,type:'working',reps:20}]}]}],draft:{exercises:[e]}};
  const removed=setCustomExerciseDeleted(state,'e1',true);
  assert.equal(exerciseCatalog(removed.customExercises).flatMap(g=>g.exercises).includes(e.name),false);
  assert.deepEqual(removed.sessions,state.sessions);assert.deepEqual(removed.draft,state.draft);
  assert.deepEqual(records(removed.sessions),records(state.sessions));
  assert.equal(trackingForName(e.name,removed.customExercises),'reps');
  assert.match(validateCustomExercise(e,removed.customExercises),/恢复/);
  assert.equal(state.customExercises[0].deleted,undefined);
  const restored=setCustomExerciseDeleted(JSON.parse(JSON.stringify(removed)),'e1',false);
  assert.ok(exerciseCatalog(restored.customExercises).flatMap(g=>g.exercises).includes(e.name));
});
test('删除按 ID 区分动作，不影响其他动作或预置库',()=>{
  const state={customExercises:[{id:'a',name:'器械 A',group:'chest'},{id:'b',name:'器械 B',group:'back'}]};
  const names=exerciseCatalog(setCustomExerciseDeleted(state,'a',true).customExercises).flatMap(g=>g.exercises);
  assert.ok(names.includes('器械 B'));assert.ok(names.includes('杠铃卧推'));
  assert.throws(()=>setCustomExerciseDeleted(state,'杠铃卧推',true));
});

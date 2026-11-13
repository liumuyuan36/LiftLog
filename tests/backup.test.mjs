import test from 'node:test';
import assert from 'node:assert/strict';
import {validateBackup} from '../dist/backup.js';
import {makeDemo} from '../dist/data.js';
test('旧版备份可迁移，保留训练但不混入草稿和反馈',()=>{
  const original={version:1,...makeDemo(),draft:{id:'unfinished'},reviewRuns:[{feedback:'useful'}]};
  const value=validateBackup(original);assert.equal(value.sessions.length,10);assert.equal(value.draft,null);assert.deepEqual(value.reviewRuns,[]);assert.equal(value.sessions[0].exercises[0].sets[0].weight,50);
});
test('拒绝非法日期、重复训练、无效组、未知版本和无效体重',()=>{
  const original={version:1,...makeDemo()};
  for(const mutate of [v=>v.version=2,v=>v.sessions[0].date='2026-02-30',v=>v.sessions.push(v.sessions[0]),v=>v.sessions[0].exercises[0].sets[0].reps=-1,v=>v.weights[0].weight='bad']){
    const value=structuredClone(original);mutate(value);assert.throws(()=>validateBackup(value));
  }
});
test('备份自重组无重量也可恢复，RIR空值保留为未知',()=>{
  const value={version:1,...makeDemo()};const e=value.sessions[0].exercises[0];e.tracking='reps';e.sets.forEach(s=>{s.weight=null;s.rir='';});
  const result=validateBackup(value).sessions[0].exercises[0];assert.equal(result.sets[0].weight,null);assert.equal(result.sets[0].rir,'');
});

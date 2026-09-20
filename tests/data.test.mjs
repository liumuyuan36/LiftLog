import test from 'node:test';
import assert from 'node:assert/strict';
import { volume,e1rm,records,validateSet,inPeriod,localDate,daysAgo } from '../dist/data.js';
const set=(weight,reps,extra={})=>({weight,reps,rir:2,done:true,type:'working',...extra});
const session=(sets,date=localDate())=>({id:'s',date,exercises:[{name:'杠铃卧推',group:'chest',sets}]});
test('容量与手算样例一致，排除热身与未完成组',()=>{
  assert.equal(volume(session([set(55,12),set(55,11),set(55,10),set(52.5,11),set(20,20,{type:'warmup'}),set(100,10,{done:false})])),2392.5);
});
test('e1RM 的单次、10次与排除边界',()=>{
  assert.equal(e1rm(set(100,1)),100);
  assert.equal(e1rm(set('100','1')),100);
  assert.ok(Math.abs(e1rm(set(55,10))-73.333333)<.00001);
  assert.equal(e1rm(set(55,11)),null);
  assert.equal(e1rm(set(55,8,{type:'warmup'})),null);
});
test('同重量次数纪录独立，删除记录后重新计算',()=>{
  const a=session([set(50,10)]),b=session([set(50,12),set(55,8)]);
  const pr=records([a,b])[0];assert.equal(pr.weight,55);assert.equal(pr.repsByWeight[50],12);
  assert.equal(records([a])[0].weight,50);assert.equal(records([a])[0].repsByWeight[50],10);
  assert.equal(records([session([set('50.0','10'),set('50','12')])])[0].repsByWeight[50],12);
});
test('数据校验拒绝负数、空次数和非整数，允许未知RIR',()=>{
  assert.ok(validateSet(set(-1,10)));assert.ok(validateSet(set(10,'')));assert.ok(validateSet(set(10,1.5)));
  assert.equal(validateSet(set(20,10,{rir:''})), '');assert.ok(validateSet(set(20,10,{rir:11})));
});
test('过去7天包含今天和6天前，排除7天前',()=>{
  assert.equal(inPeriod(session([],localDate()),'7'),true);assert.equal(inPeriod(session([],daysAgo(6)),'7'),true);assert.equal(inPeriod(session([],daysAgo(7)),'7'),false);
});

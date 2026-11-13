import test from 'node:test';
import assert from 'node:assert/strict';
import {trainingTrail,trailWindow,trailEvidence} from '../dist/trail.js';
const today='2026-11-13';
const row=(reps=8,extra={})=>({weight:8,reps,rir:2,type:'working',done:true,...extra});
const session=(id,date,sets=[row()],extra={})=>({id,date,title:'测试训练',createdAt:date+'T10:00:00Z',exercises:[{name:'哑铃弯举',group:'arms',tracking:'weighted',setup:{equipment:'器械 A',seat:'2',grip:'握法 A',restSeconds:120},sets}],...extra});
const trail=s=>trainingTrail(s,{today});

test('轨迹只计有效已完成工作组，不把草稿、热身、未来日期和无效日期画成节点',()=>{
  const data=[session('a','2026-11-02',[row(8),row(9,{done:false}),row(8,{type:'warmup'})]),session('b','2026-11-03',[row(8,{done:false})]),session('c','2026-11-04',[row(8,{type:'warmup'})]),session('d','2026-11-14'),session('e','2026-02-30'),session('f','2026-11-05',[row(8,{weight:null})])];
  const result=trail(data);assert.equal(result.length,1);assert.equal(result[0].workingSets,1);assert.equal(result[0].volume,64);
});
test('90天边界、重复id和独立原数据不改写',()=>{
  const data=[session('old','2026-08-15'),session('edge','2026-08-16'),session('dup','2026-11-01'),session('dup','2026-11-02')];
  const before=structuredClone(data);assert.deepEqual(trail(data).map(r=>r.id),['edge']);assert.deepEqual(data,before);
});
test('自重只计有效次数，不制造负重容量',()=>{
  const data=[session('a','2026-11-02',[],{exercises:[{name:'俯卧撑',tracking:'reps',sets:[row(8,{weight:null,tracking:'reps'}),row(8,{done:false,weight:null,tracking:'reps'})]}]})];
  const [result]=trail(data);assert.equal(result.volume,0);assert.equal(result.workingSets,1);
});
test('相同条件下展示真实次数变化，并使用最近可比记录',()=>{
  const records=trail([session('weak','2026-11-01',[row(3)]),session('a','2026-11-07',[row(8)]),session('b','2026-11-13',[row(9)])]);
  const result=trailEvidence(records,'b','哑铃弯举',{today});assert.equal(result.baseline.id,'a');assert.equal(result.pairs[0].delta,1);assert.equal(result.status,'up');
});
test('持平、下降和混合变化不会统一解释为进步',()=>{
  for(const [sets,status]of [[[row(8)],'flat'],[[row(7)],'down'],[[row(9),row(7)],'mixed']]){
    const result=trailEvidence(trail([session('a','2026-11-07',[row(8),row(8)]),session('b','2026-11-13',sets)]),'b','哑铃弯举',{today});
    assert.equal(result.status,status);
  }
});
test('缺少RIR或器械设置不同，不擅自计算进步',()=>{
  const a=session('a','2026-11-07',[row(8)]),b=session('b','2026-11-13',[row(10,{rir:''})]);
  assert.equal(trailEvidence(trail([a,b]),'b','哑铃弯举',{today}).pairs.length,0);
  const changed=session('c','2026-11-13',[row(10)]);changed.exercises[0].setup.equipment='器械 B';
  assert.equal(trailEvidence(trail([a,changed]),'c','哑铃弯举',{today}).pairs.length,0);
});
test('同日多场保留真实节点，但不自动确定比较先后',()=>{
  const records=trail([session('a','2026-11-07'),session('b','2026-11-13',[row(9)]),session('c','2026-11-13',[row(10)])]);
  assert.equal(records.length,3);const p=trailEvidence(records,'b','哑铃弯举',{today});assert.equal(p.status,'ambiguous');assert.equal(p.pairs.length,0);
});
test('无效的完成组不被其他有效组掩盖为可比证据；窗口始终包含所选记录',()=>{
  const records=trail([session('a','2026-11-07'),session('b','2026-11-13',[row(9),row(0)])]);
  const p=trailEvidence(records,'b','哑铃弯举',{today});assert.equal(p.status,'insufficient');assert.equal(p.pairs.length,0);
  const many=Array.from({length:12},(_,i)=>({id:String(i)}));for(let i=0;i<many.length;i++){const w=trailWindow(many,i);assert.ok(w.records.some(r=>r.id===String(i)));assert.ok(w.records.length<=5);}
  assert.deepEqual(trail([]),[]);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {decisionSource,makeDecisionPlans,decisionSummary,createDecisionReceipt,linkDecisionSession,decisionOutcome,decisionMemory,restoreDecisionReceipts} from '../dist/decision.js';
import {validateBackup} from '../dist/backup.js';
import {decisionRequest,generateDecision} from '../lib/decision-model.mjs';
const source=()=>({id:'source',title:'来源训练',date:'2026-11-12',duration:40,exercises:[['杠铃卧推','chest',50],['高位下拉','back',40],['哑铃弯举','arms',16]].map(([name,group,weight],i)=>({id:'e'+i,name,group,tracking:'weighted',sets:[10,9,8].map((reps,j)=>({id:`s${i}-${j}`,weight,reps,rir:j===2?'':2,type:'working',done:true}))}))});
const limits={minutes:20,setMinutes:3,transitionMinutes:1,prepMinutes:3,priorityName:'杠铃卧推',requiredNames:['杠铃卧推'],blockedNames:[]};
test('三个方案呈现不同的可核对取舍，估算来自显式假设',()=>{
  const d=makeDecisionPlans(source(),limits);assert.equal(d.candidates.length,3);assert.equal(d.originalMinutes,32);
  assert.deepEqual(d.candidates.map(p=>[p.id,p.workingSets,p.exerciseCount,p.estimatedMinutes]),[['balanced',5,3,20],['focus',5,2,19],['compact',3,1,12]]);
});
test('跨预算和动作限制验证不超预算、不删必留、不加入禁用、不增加原工作组',()=>{
  const s=source(),names=s.exercises.map(e=>e.name);let verified=0;
  for(let budget=5;budget<=60;budget+=5)for(let required=0;required<8;required++)for(let blocked=0;blocked<8;blocked++){
    if(required&blocked)continue;
    const c={...limits,minutes:budget,requiredNames:names.filter((_,i)=>required&(1<<i)),blockedNames:names.filter((_,i)=>blocked&(1<<i)),priorityName:names.find((_,i)=>!(blocked&(1<<i)))};
    if(!c.priorityName)continue;
    const d=makeDecisionPlans(s,c);
    for(const p of d.candidates){verified++;assert.ok(p.estimatedMinutes<=budget);for(const n of c.requiredNames)assert.ok(p.counts[n]>=1);for(const n of c.blockedNames)assert.equal(p.counts[n],0);for(const n of names)assert.ok(p.counts[n]<=3);for(const e of p.exercises)for(const row of e.sets){assert.equal(row.done,false);assert.ok(s.exercises.find(x=>x.name===e.name).sets.some(r=>r.weight===row.weight&&r.reps===row.reps&&r.rir===row.rir));}}
  }
  assert.ok(verified>300);
});
test('冲突和无解明确失败，不偷偷放宽必留要求，也不编造三个方案',()=>{
  assert.throws(()=>makeDecisionPlans(source(),{...limits,blockedNames:['杠铃卧推']}),/同时/);
  const impossible=makeDecisionPlans(source(),{...limits,minutes:5});assert.equal(impossible.candidates.length,0);assert.equal(impossible.minimumMinutes,6);
  const single=makeDecisionPlans(source(),{...limits,minutes:14,requiredNames:source().exercises.map(e=>e.name)});assert.equal(single.candidates.length,1);
  assert.equal(makeDecisionPlans(source(),{...limits,minutes:5,setMinutes:2.04}).candidates.length,0);
});
test('热身组保留并计入时间，自重组不被赋予重量',()=>{
  const s=source();s.exercises[0].sets.unshift({id:'warm',weight:20,reps:10,rir:'',type:'warmup',done:true});
  const d=makeDecisionPlans(s,limits);assert.equal(d.minimumMinutes,9);for(const p of d.candidates)assert.equal(p.exercises.find(e=>e.name==='杠铃卧推').sets[0].type,'warmup');
  const body={...source(),exercises:[{id:'body',name:'仰卧起坐',group:'core',tracking:'reps',sets:[{id:'b',weight:null,reps:20,rir:'',type:'working',done:true}]}]};
  assert.equal(makeDecisionPlans(body,{...limits,priorityName:'仰卧起坐',requiredNames:['仰卧起坐']}).candidates[0].exercises[0].sets[0].weight,null);
});
test('缺失负重不能按0处理，未完成组不会进入来源',()=>{
  const s=source();s.exercises[0].sets[0].weight=null;assert.throws(()=>decisionSource(s),/无效/);
  const s2=source();s2.exercises[0].sets.push({id:'unfinished',done:false,weight:1000,reps:100});assert.equal(decisionSource(s2).exercises[0].sets.length,3);
});
test('选择只创建未完成草稿与回执，不写历史；已有草稿和来源变更均受保护',()=>{
  const s=source(),data={sessions:[s],weights:[]},d=makeDecisionPlans(s,limits),next=createDecisionReceipt(data,d,'balanced',{remember:true,goal:'多保留动作'});
  assert.equal(next.sessions.length,1);assert.equal(data.draft,undefined);assert.equal(next.decisionReceipts.length,1);assert.ok(next.draft.exercises.every(e=>e.sets.every(s=>!s.done)));
  assert.throws(()=>createDecisionReceipt(next,d,'focus'),/已有/);
  const changed=structuredClone(data);changed.sessions[0].exercises[0].sets[0].weight=55;assert.throws(()=>createDecisionReceipt(changed,d,'balanced'),/已变化/);
});
test('已删除的自定义动作不能被新方案偷偷恢复',()=>{
  const s=source();s.exercises[0].name='器械X';const c={...limits,priorityName:'器械X',requiredNames:['器械X']};
  assert.throws(()=>createDecisionReceipt({sessions:[s],customExercises:[{id:'x',name:'器械X',group:'chest',tracking:'weighted',deleted:true}]},makeDecisionPlans(s,c),'compact'),/已移除/);
});
function savedCase(){const s=source();const data=createDecisionReceipt({sessions:[s]},makeDecisionPlans(s,limits),'balanced',{remember:true});const saved=structuredClone(data.draft);saved.exercises.forEach(e=>e.sets.forEach(s=>s.done=true));saved.duration=0;data.sessions.push(saved);data.decisionReceipts=linkDecisionSession(data,saved);return {data,saved,receipt:data.decisionReceipts[0]};}
test('未保存与缺失实际时长不算按时兑现，时间修改后重新核对',()=>{
  const {data,saved,receipt}=savedCase();assert.equal(decisionOutcome({...receipt,resultSessionId:null},data.sessions).status,'pending');
  assert.equal(decisionOutcome(receipt,data.sessions).timeMet,null);saved.duration=19;assert.equal(decisionOutcome(receipt,data.sessions).timeMet,true);saved.duration=25;assert.equal(decisionOutcome(receipt,data.sessions).timeMet,false);
  assert.equal(decisionOutcome(receipt,data.sessions.filter(s=>s.id!==saved.id)).status,'missing');
});
test('新增无关动作不抬高计划完成比例，必留动作是否记录可单独核对',()=>{
  const {data,saved,receipt}=savedCase();saved.exercises=saved.exercises.filter(e=>e.name!=='杠铃卧推');saved.exercises.push({name:'杠铃深蹲',tracking:'weighted',sets:Array(8).fill({done:true,type:'working',weight:40,reps:10,rir:2})});
  const outcome=decisionOutcome(receipt,data.sessions);assert.equal(outcome.requiredMet,false);assert.equal(outcome.matchedSets,3);assert.equal(outcome.completion,60);
  saved.exercises.find(e=>e.name==='高位下拉').sets.forEach(s=>s.weight=null);assert.equal(decisionOutcome(receipt,data.sessions).matchedSets,1);
});
test('偏好只来自主动记住的取舍，可撤销，不从全部训练偷偷推断',()=>{
  const {data}=savedCase();assert.equal(decisionMemory(data).length,1);assert.equal(decisionMemory(data)[0].timeMet,null);data.decisionReceipts[0].remember=false;assert.deepEqual(decisionMemory(data),[]);
});
test('完整备份恢复保留回执和兑现关联，恶意限制或方案被拒绝',()=>{
  const {data}=savedCase(),restored=validateBackup({version:1,weights:[],...data});assert.equal(restored.decisionReceipts.length,1);assert.equal(decisionOutcome(restored.decisionReceipts[0],restored.sessions).status,'saved');
  const bad=structuredClone(data.decisionReceipts);bad[0].constraints.minutes=-10;assert.throws(()=>restoreDecisionReceipts(bad));
  const fake=structuredClone(data.decisionReceipts);fake[0].selectedId='invented';assert.throws(()=>restoreDecisionReceipts(fake));
});
test('模型只收到取舍摘要与显式记忆，不收到重量或逐组训练',async()=>{
  const d=makeDecisionPlans(source(),limits),payload={engine:'atlas',consent:true,goal:'想少换动作',candidates:d.candidates.map(decisionSummary),memory:[],history:'do not forward'};
  assert.equal(decisionRequest(payload).history,undefined);
  const result=await generateDecision(payload,{enabled:true,apiKey:'test-only',fetchImpl:async(url,options)=>{
    const input=JSON.parse(JSON.parse(options.body).prompt.split('<|im_start|>user\n')[1].split('<|im_end|>')[0]);assert.equal(input.candidates[0].exercises,undefined);assert.equal(JSON.stringify(input).includes('weight'),false);
    return {ok:true,json:async()=>({model:'liftlog-atlas-1.7b-run02',content:'{"status":"recommend","candidateId":"compact"}',stop_type:'eos',tokens_evaluated:80,tokens_predicted:20})};
  }});
  assert.equal(result.advice.candidateId,'compact');assert.equal(result.meta.usage.inputTokens,80);
});
test('模型编造方案被拒绝；允许一个澄清问题，不能产生新计划',async()=>{
  const payload={engine:'atlas',consent:true,goal:'想兼顾全部目标',candidates:makeDecisionPlans(source(),limits).candidates.map(decisionSummary)};
  const stub=content=>({enabled:true,apiKey:'test',fetchImpl:async()=>({ok:true,json:async()=>({model:'liftlog-atlas-1.7b-run02',content:JSON.stringify(content),stop_type:'eos'})})});
  await assert.rejects(generateDecision(payload,stub({status:'recommend',candidateId:'invented'})));
  const result=await generateDecision(payload,stub({status:'clarify',question:'如果时间不够，你更愿意保留动作种类还是主项组数？'}));assert.equal(result.advice.status,'clarify');assert.equal(result.advice.candidates,undefined);
});

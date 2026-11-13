import {setup} from './fitness.js';
import {uid,localDate,groups,validateSet,exerciseCatalog,trackingForName} from './data.js';

export const DECISION_VERSION='decision-v1';
export const strategies={balanced:{name:'多保留动作',reason:'保留更多动作种类，部分动作的组数会减少。'},focus:{name:'主项优先',reason:'先保留优先动作的组数，再分配剩余时间。'},compact:{name:'减少动作切换',reason:'只在必留动作和优先动作中分配组数，可能提前结束。'}};
const round=n=>Math.round(n*10)/10;
function dateValid(d){return typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d+'T12:00:00'))&&localDate(new Date(d+'T12:00:00'))===d;}
export function decisionSource(session){
  if(!session||typeof session.id!=='string'||!dateValid(session.date)||session.date>localDate()||!Array.isArray(session.exercises)||!session.exercises.length||session.exercises.length>8)throw Error('请选择一场包含 1–8 个动作的有效训练作为来源。');
  let total=0;
  const exercises=session.exercises.map(e=>{
    const tracking=e.tracking??'weighted';
    if(typeof e.name!=='string'||!e.name.trim()||e.name.length>60||!groups.some(g=>g.id===e.group)||!['weighted','reps'].includes(tracking)||!Array.isArray(e.sets))throw Error('来源动作格式无效。');
    const sets=e.sets.filter(s=>s.done).map(s=>{
      const item={weight:tracking==='reps'?null:s.weight,reps:s.reps,rir:s.rir??'',tracking,done:true,type:s.type};
      if(++total>36||!['working','warmup'].includes(s.type)||(tracking==='weighted'&&(s.weight===null||s.weight===undefined))||validateSet(item,tracking))throw Error('来源训练含无效数值，或超过 36 个已完成组。');
      return {...item,weight:tracking==='reps'?null:Number(item.weight),reps:Number(item.reps),rir:item.rir===''?'':Number(item.rir)};
    });
    if(!sets.some(s=>s.type==='working'))throw Error('来源中的每个动作需要至少一个已完成工作组。');
    return {name:e.name,group:e.group,tracking,...(e.setup!==undefined?{setup:setup(e.setup)}:{}),sets};
  });
  if(new Set(exercises.map(e=>e.name)).size!==exercises.length)throw Error('来源包含重复动作，请先合并或选择其他训练。');
  return {id:session.id,title:String(session.title??'来源训练').slice(0,100),date:session.date,exercises};
}
export function decisionConstraints(value,source){
  const c={minutes:value.minutes,setMinutes:value.setMinutes,transitionMinutes:value.transitionMinutes,prepMinutes:value.prepMinutes,priorityName:value.priorityName,requiredNames:value.requiredNames??[],blockedNames:value.blockedNames??[]};
  for(const [key,min,max] of [['minutes',5,180],['setMinutes',.5,10],['transitionMinutes',0,10],['prepMinutes',0,30]])if(typeof c[key]!=='number'||!Number.isFinite(c[key])||c[key]<min||c[key]>max)throw Error('请填写有效的时间预算和每组时间估算。');
  const names=source.exercises.map(e=>e.name);
  for(const key of ['requiredNames','blockedNames'])if(!Array.isArray(c[key])||c[key].length>8||new Set(c[key]).size!==c[key].length||c[key].some(n=>!names.includes(n)))throw Error('动作限制无效。');
  if(c.requiredNames.some(n=>c.blockedNames.includes(n)))throw Error('同一动作不能同时设为必留和暂不做。');
  if(!names.includes(c.priorityName)||c.blockedNames.includes(c.priorityName))throw Error('请选择一个今天可做的优先动作。');
  return c;
}
const work=e=>e.sets.filter(s=>s.type==='working');
const warm=e=>e.sets.filter(s=>s.type==='warmup');
function estimate(source,counts,c){const active=source.exercises.filter(e=>counts[e.name]>0);return c.prepMinutes+active.reduce((n,e)=>n+counts[e.name]+warm(e).length,0)*c.setMinutes+Math.max(0,active.length-1)*c.transitionMinutes;}
export function makeDecisionPlans(session,value){
  const source=decisionSource(session),constraints=decisionConstraints(value,source),c=constraints;
  const allowed=source.exercises.filter(e=>!c.blockedNames.includes(e.name));
  const baseCounts=Object.fromEntries(source.exercises.map(e=>[e.name,c.requiredNames.includes(e.name)?1:0]));
  if(!c.requiredNames.length)baseCounts[c.priorityName]=1;
  const minimumMinutes=round(estimate(source,baseCounts,c));
  if(estimate(source,baseCounts,c)>c.minutes+.000001)return {source,constraints,candidates:[],minimumMinutes};
  const fullCounts=Object.fromEntries(source.exercises.map(e=>[e.name,work(e).length]));
  const candidates=[];
  for(const style of Object.keys(strategies)){
    const counts={...baseCounts};
    const add=e=>{if(counts[e.name]>=work(e).length)return false;counts[e.name]++;if(estimate(source,counts,c)>c.minutes+.000001){counts[e.name]--;return false;}return true;};
    if(style==='balanced'){
      for(const e of allowed)if(!counts[e.name])add(e);
      let changed=true;while(changed){changed=false;for(const e of allowed)changed=add(e)||changed;}
    }else{
      const order=[allowed.find(e=>e.name===c.priorityName),...allowed.filter(e=>e.name!==c.priorityName)];
      for(const e of order){if(style==='compact'&&e.name!==c.priorityName&&!c.requiredNames.includes(e.name))continue;while(add(e)){};}
    }
    const signature=JSON.stringify(source.exercises.map(e=>counts[e.name]));
    if(candidates.some(p=>p.signature===signature))continue;
    const exercises=source.exercises.filter(e=>counts[e.name]>0).map(e=>({...e,sets:[...warm(e),...work(e).slice(0,counts[e.name])].map(s=>({...s,done:false}))}));
    const workingSets=Object.values(counts).reduce((a,b)=>a+b,0);
    candidates.push({id:style,signature,counts,exercises,estimatedMinutes:round(estimate(source,counts,c)),workingSets,exerciseCount:exercises.length,switches:Math.max(0,exercises.length-1),removedWorkSets:Object.values(fullCounts).reduce((a,b)=>a+b,0)-workingSets,removedExercises:source.exercises.filter(e=>!counts[e.name]).map(e=>e.name)});
  }
  return {source,constraints,candidates,minimumMinutes,originalMinutes:round(estimate(source,fullCounts,c))};
}
export function decisionSummary(plan){return {id:plan.id,estimatedMinutes:plan.estimatedMinutes,workingSets:plan.workingSets,exerciseCount:plan.exerciseCount,switches:plan.switches,removedWorkSets:plan.removedWorkSets};}
export function validateDecisionAdvice(value,ids){
  if(value?.status==='clarify'&&typeof value.question==='string'&&value.question.trim()&&value.question.length<=160)return {status:'clarify',question:value.question};
  if(value?.status!=='recommend'||!ids.includes(value.candidateId))throw Error('AI 没有选择一个已验证可行的方案，比较结果仍可手动使用。');
  return {status:'recommend',candidateId:value.candidateId};
}
export function createDecisionReceipt(data,decision,candidateId,{goal='',remember=false,advice=null}={}){
  if(data.draft?.exercises?.length)throw Error('已有未完成草稿。请先完成或处理当前草稿，再带入新的取舍方案。');
  const original=data.sessions.find(s=>s.id===decision.source.id);
  if(!original||JSON.stringify(decisionSource(original))!==JSON.stringify(decision.source))throw Error('来源训练已变化，请重新生成比较方案。');
  const fresh=makeDecisionPlans(original,decision.constraints),chosen=fresh.candidates.find(p=>p.id===candidateId);
  if(!chosen)throw Error('所选方案已失效，请重新比较。');
  const activeNames=new Set(exerciseCatalog(data.customExercises??[]).flatMap(g=>g.exercises));
  if(chosen.exercises.some(e=>!activeNames.has(e.name)||trackingForName(e.name,data.customExercises??[])!==e.tracking))throw Error('所选方案含已移除或记录方式不同的动作，请先恢复动作或调整限制。');
  const id=uid();
  const receipt={id,version:DECISION_VERSION,createdAt:new Date().toISOString(),goal:String(goal).slice(0,300),remember:Boolean(remember),source:structuredClone(fresh.source),constraints:structuredClone(fresh.constraints),selectedId:chosen.id,candidates:fresh.candidates.map(p=>({...decisionSummary(p),counts:{...p.counts}})),advice:advice?.status==='recommend'?{candidateId:advice.candidateId}:null,resultSessionId:null,feedback:null};
  const draft={id:uid(),title:'取舍训练 · '+strategies[chosen.id].name,date:localDate(),duration:0,createdAt:new Date().toISOString(),decisionReceiptId:id,exercises:chosen.exercises.map(e=>({...e,id:uid(),sets:e.sets.map(s=>({...s,id:uid(),done:false}))}))};
  return {...data,draft,decisionReceipts:[...(data.decisionReceipts??[]),receipt].slice(-100)};
}
export function linkDecisionSession(data,saved){return (data.decisionReceipts??[]).map(r=>r.id===saved.decisionReceiptId?{...r,resultSessionId:saved.id}:r);}
export function decisionOutcome(receipt,sessions){
  if(!receipt.resultSessionId)return {status:'pending',timeMet:null};
  const session=sessions.find(s=>s.id===receipt.resultSessionId);
  if(!session)return {status:'missing',timeMet:null};
  const actual=Object.fromEntries(receipt.source.exercises.map(e=>[e.name,session.exercises.filter(x=>x.name===e.name&&(x.tracking??'weighted')===e.tracking).flatMap(x=>x.sets).filter(s=>s.done&&s.type!=='warmup'&&(e.tracking==='reps'||(s.weight!==null&&s.weight!==undefined))&&!validateSet({...s,rir:s.rir??''},e.tracking)).length]));
  const selected=receipt.candidates.find(p=>p.id===receipt.selectedId),planned=selected.workingSets;
  const matched=Object.entries(selected.counts).reduce((n,[name,count])=>n+Math.min(count,actual[name]??0),0);
  const duration=Number(session.duration),actualMinutes=Number.isFinite(duration)&&duration>0&&duration<=1440?duration:null;
  return {status:'saved',actualMinutes,timeMet:actualMinutes===null?null:actualMinutes<=receipt.constraints.minutes,requiredMet:receipt.constraints.requiredNames.every(name=>actual[name]>0),plannedSets:planned,matchedSets:matched,completion:Math.round(matched/planned*100),actual};
}
export function decisionMemory(data){return (data.decisionReceipts??[]).filter(r=>r.remember).slice(-3).map(r=>({strategy:r.selectedId,feedback:r.feedback??'unrated',timeMet:decisionOutcome(r,data.sessions).timeMet}));}

export function restoreDecisionReceipts(values){
  if(values===undefined)return [];
  if(!Array.isArray(values)||values.length>100)throw Error('取舍记录格式无效。');
  const ids=new Set();
  return values.map(value=>{
    if(typeof value.id!=='string'||value.id.length>120||ids.has(value.id)||value.version!==DECISION_VERSION||typeof value.goal!=='string'||value.goal.length>300||typeof value.createdAt!=='string'||value.createdAt.length>40||!['helpful','not_helpful',null].includes(value.feedback??null)||(value.resultSessionId!==null&&typeof value.resultSessionId!=='string'))throw Error('取舍记录字段无效。');
    ids.add(value.id);
    const rebuilt=makeDecisionPlans(value.source,value.constraints);
    if(!rebuilt.candidates.some(p=>p.id===value.selectedId))throw Error('取舍方案无法验证。');
    return {id:value.id,version:DECISION_VERSION,createdAt:value.createdAt,goal:value.goal,remember:value.remember===true,source:rebuilt.source,constraints:rebuilt.constraints,selectedId:value.selectedId,candidates:rebuilt.candidates.map(p=>({...decisionSummary(p),counts:p.counts})),advice:value.advice&&rebuilt.candidates.some(p=>p.id===value.advice.candidateId)?{candidateId:value.advice.candidateId}:null,resultSessionId:value.resultSessionId,feedback:value.feedback??null};
  });
}

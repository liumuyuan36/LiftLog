import {localDate,validateSet} from './data.js';
import {comparableProgress} from './fitness.js';

export function validTrailDate(value,today=localDate()){
  if(typeof value!=='string'||value.length!==10||value>today)return false;
  const date=new Date(value+'T12:00:00');
  return !Number.isNaN(date.getTime())&&localDate(date)===value;
}

function completedExercises(session){
  return (session.exercises??[]).flatMap(e=>{
    if(!e||typeof e.name!=='string'||!e.name.trim()||!Array.isArray(e.sets))return [];
    const tracking=e.tracking??'weighted';
    if(!['weighted','reps'].includes(tracking))return [];
    const sets=e.sets.filter(s=>s&&s.done===true&&s.type!=='warmup'&&
      (!s.tracking||s.tracking===tracking)&&
      (tracking==='reps'||(s.weight!==null&&s.weight!==undefined))&&
      !validateSet({...s,rir:s.rir??''},tracking));
    return sets.length?[{name:e.name,tracking,sets}]:[];
  });
}

export function trainingTrail(sessions=[],{today=localDate(),days=90}={}){
  if(!validTrailDate(today,today)||days!==90)throw Error('轨迹日期或范围无效。');
  const start=new Date(today+'T12:00:00');start.setDate(start.getDate()-days+1);
  const since=localDate(start),ids=new Map();
  sessions.forEach(s=>{if(s?.id)ids.set(s.id,(ids.get(s.id)??0)+1);});
  const records=sessions.flatMap(s=>{
    if(!s||typeof s.id!=='string'||ids.get(s.id)!==1||!validTrailDate(s.date,today)||s.date<since||!Array.isArray(s.exercises))return [];
    const exercises=completedExercises(s);if(!exercises.length)return [];
    return [{id:s.id,date:s.date,title:String(s.title??'训练记录'),source:s,exercises,
      workingSets:exercises.reduce((n,e)=>n+e.sets.length,0),
      volume:exercises.reduce((n,e)=>n+(e.tracking==='reps'?0:e.sets.reduce((v,s)=>v+Number(s.weight)*Number(s.reps),0)),0)}];
  }).sort((a,b)=>a.date.localeCompare(b.date)||String(a.source.createdAt??'').localeCompare(String(b.source.createdAt??''))||a.id.localeCompare(b.id));
  return records.map((r,i)=>({...r,ordinal:i+1}));
}

export function trailWindow(records,index){
  const selected=Math.max(0,Math.min(records.length-1,index));
  const start=Math.max(0,Math.min(selected-2,records.length-5));
  return {start,records:records.slice(start,start+5),selected};
}

export function trailEvidence(records,id,name,{today=localDate()}={}){
  const selected=records.find(r=>r.id===id);
  if(!selected)return null;
  const exercise=selected.exercises.find(e=>e.name===name)??selected.exercises[0];
  const result=comparableProgress(records.filter(r=>r.date<=selected.date).map(r=>r.source),exercise.name,{today,days:90});
  // Same-day records are never silently assigned a before/after order.
  if(result.status==='ambiguous')return {selected,exercise,status:'ambiguous',pairs:[],reason:'同一天有多条该动作记录，暂不判断比较顺序。'};
  if(result.latest?.id!==id)return {selected,exercise,status:'insufficient',pairs:[],reason:'当次动作包含无效或不足以比较的信息，暂不判断变化。'};
  return {...result,selected,exercise};
}

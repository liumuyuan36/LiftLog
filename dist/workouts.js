import {uid,localDate,groups,validateSet,workSets,volume,bodyweightReps,exerciseCatalog,trackingForName} from './data.js';
import {setup} from './fitness.js';

const dateOK = value => typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value+'T12:00:00')) && localDate(new Date(value+'T12:00:00'))===value;
const optionalNumber = (value,min,max,integer=false) => {
  if(value==='' || value===null || value===undefined)return '';
  const n=Number(value);
  if(!Number.isFinite(n)||n<min||n>max||(integer&&!Number.isInteger(n)))throw Error('模板中有无效数值，请检查重量和次数。');
  return n;
};

export function validateRoutines(raw=[]){
  if(!Array.isArray(raw)||raw.length>20)throw Error('训练模板最多保存 20 个。');
  const ids=new Set();
  return raw.map(r=>{
    if(!r||typeof r.id!=='string'||!r.id||ids.has(r.id)||typeof r.name!=='string'||!r.name.trim()||r.name.length>60||!Array.isArray(r.exercises)||!r.exercises.length||r.exercises.length>20)throw Error('训练模板名称或动作无效。');
    ids.add(r.id);let total=0;const names=new Set();
    const exercises=r.exercises.map(e=>{
      if(!e||typeof e.name!=='string'||!e.name.trim()||e.name.length>100||names.has(e.name)||!groups.some(g=>g.id===e.group)||!['weighted','reps'].includes(e.tracking)||!Array.isArray(e.sets)||!e.sets.length||e.sets.length>30)throw Error('模板动作或组数无效。');
      names.add(e.name);
      const sets=e.sets.map(s=>{
        if(++total>200||!s||!['warmup','working'].includes(s.type))throw Error('模板组数或组类型无效。');
        return {type:s.type,weight:e.tracking==='reps'?null:optionalNumber(s.weight,0,1500),reps:optionalNumber(s.reps,1,100,true)};
      });
      return {name:e.name,group:e.group,tracking:e.tracking,setup:setup(e.setup??{}),sets};
    });
    return {id:r.id,name:r.name.trim(),sourceDate:dateOK(r.sourceDate)?r.sourceDate:'',exercises};
  });
}

export function routineFromSession(session,name){
  return validateRoutines([{id:uid(),name,sourceDate:session.date,exercises:(session.exercises??[]).map(e=>({name:e.name,group:e.group,tracking:e.tracking??'weighted',setup:e.setup,sets:e.sets}))}])[0];
}

export function sessionFromRoutine(routine,customExercises=[],date=localDate()){
  const r=validateRoutines([routine])[0];
  if(!dateOK(date)||date>localDate())throw Error('请选择今天或更早的训练日期。');
  const available=exerciseCatalog(customExercises).flatMap(g=>g.exercises.map(name=>({name,group:g.id})));
  for(const e of r.exercises){
    if(!available.some(x=>x.name===e.name&&x.group===e.group)||trackingForName(e.name,customExercises)!==e.tracking)throw Error(`「${e.name}」已不在当前动作库或记录方式已改变，请先恢复动作或重新保存模板。`);
  }
  return {id:uid(),title:r.name,date,duration:0,createdAt:new Date().toISOString(),routineName:r.name,exercises:r.exercises.map(e=>({...structuredClone(e),id:uid(),sets:e.sets.map(s=>({...s,id:uid(),tracking:e.tracking,rir:'',done:false}))}))};
}

export function lastExercise(sessions,exercise,date,excludeId){
  if(!dateOK(date))return null;
  const tracking=exercise.tracking??'weighted';
  const candidates=sessions.filter(s=>s.id!==excludeId&&dateOK(s.date)&&s.date<date&&s.date<=localDate()).sort((a,b)=>b.date.localeCompare(a.date)||String(b.createdAt??'').localeCompare(String(a.createdAt??'')));
  for(const session of candidates){
    const found=session.exercises.find(e=>e.name===exercise.name&&(e.tracking??'weighted')===tracking);
    if(!found)continue;
    const sets=found.sets.filter(s=>s.done&&(tracking==='reps'||(s.weight!==null&&s.weight!==undefined))&&!validateSet({...s,rir:s.rir??''},tracking));
    if(sets.some(s=>s.type==='working'))return {sessionId:session.id,date:session.date,exercise:{...found,sets}};
  }
  return null;
}

export function fillReference(exercise,reference){
  if(!reference||reference.exercise.name!==exercise.name||(reference.exercise.tracking??'weighted')!==(exercise.tracking??'weighted'))throw Error('没有可用的上次记录。');
  const indexes={working:0,warmup:0};
  return {...exercise,sets:exercise.sets.map(s=>{
    const previous=reference.exercise.sets.filter(x=>x.type===s.type)[indexes[s.type]++];
    if(s.done||!previous)return {...s};
    return {...s,weight:exercise.tracking==='reps'?null:Number(previous.weight),reps:Number(previous.reps)};
  })};
}

export function restoreRest(timer,now=Date.now()){
  if(!timer||!Number.isFinite(timer.until)||!Number.isInteger(timer.duration)||timer.duration<15||timer.duration>600||timer.until<0||timer.until>now+timer.duration*1000+1000)return {until:0,duration:120};
  return {until:timer.until,duration:timer.duration};
}

export function sessionSummary(session){
  const completed=session.exercises.map(e=>({...e,sets:e.sets.filter(s=>s.done)})).filter(e=>e.sets.length);
  const actual={...session,exercises:completed};
  return {exercises:completed.length,sets:completed.reduce((n,e)=>n+e.sets.length,0),workingSets:workSets(actual).length,volume:volume(actual),bodyweightReps:bodyweightReps(actual),duration:Number(session.duration)||0};
}

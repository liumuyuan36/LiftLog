import {validateRoutines} from './workouts.js';
import {checkin,setup,fitnessProfiles,experiment} from './fitness.js';
import {localDate,groups,validateSet,validateCustomExercise} from './data.js';
import {restoreDecisionReceipts} from './decision.js';
const dateValid=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value+'T12:00:00'))&&localDate(new Date(value+'T12:00:00'))===value&&value<=localDate();
export function validateBackup(raw){
  if(!raw||raw.version!==1||!Array.isArray(raw.sessions)||!Array.isArray(raw.weights)||raw.sessions.length>10000)throw Error('请选择 LiftLog 导出的版本 1 JSON 备份。');
  const custom=raw.customExercises??[];
  if(!Array.isArray(custom)||custom.length>500)throw Error('自定义动作库格式无效。');
  const checked=[];
  for(const e of custom){if(typeof e.id!=='string'||checked.some(x=>x.id===e.id)||validateCustomExercise(e,checked,{allowBuiltinName:true}))throw Error('自定义动作库含有无效或重复动作。');checked.push({...e});}
  const ids=new Set();let total=0;
  const sessions=raw.sessions.map(s=>{
    if(typeof s.id!=='string'||ids.has(s.id)||typeof s.title!=='string'||!s.title.trim()||s.title.length>100||!dateValid(s.date)||!Array.isArray(s.exercises)||!Number.isInteger(Number(s.duration))||Number(s.duration)<0||Number(s.duration)>1440)throw Error('训练记录格式、日期或时长无效。');
    ids.add(s.id);
    const exercises=s.exercises.map(e=>{
      if(typeof e.id!=='string'||typeof e.name!=='string'||e.name.length>100||!groups.some(g=>g.id===e.group)||!Array.isArray(e.sets)||!e.sets.length||!['weighted','reps'].includes(e.tracking??'weighted'))throw Error('动作记录格式无效。');
      const tracking=e.tracking??'weighted';
      const sets=e.sets.map(set=>{
        if(++total>100000||typeof set.id!=='string'||set.done!==true||!['warmup','working'].includes(set.type)||(tracking==='weighted'&&(set.weight===null||set.weight===undefined))||validateSet({...set,rir:set.rir??''},tracking))throw Error('训练组包含未完成或无效数据。');
        return {id:set.id,tracking,weight:tracking==='reps'?null:Number(set.weight),reps:Number(set.reps),rir:set.rir==null||set.rir===''?'':Number(set.rir),done:true,type:set.type};
      });
      return {id:e.id,name:e.name,group:e.group,tracking,note:typeof e.note==='string'?e.note.slice(0,160):'',...(e.setup!==undefined?{setup:setup(e.setup)}:{}),...(typeof e.substitutedFrom==='string'?{substitutedFrom:e.substitutedFrom.slice(0,100)}:{}),sets};
    });
    return {id:s.id,title:s.title,date:s.date,duration:Number(s.duration),createdAt:typeof s.createdAt==='string'?s.createdAt:'',...(s.checkin!==undefined?{checkin:checkin(s.checkin)}:{}),exercises};
  });
  if(raw.weights.length>10000)throw Error('体重记录过多。');
  const weights=raw.weights.map(w=>{if(!dateValid(w.date)||!Number.isFinite(Number(w.weight))||Number(w.weight)<20||Number(w.weight)>500)throw Error('体重记录无效。');return {date:w.date,weight:Number(w.weight)};});
  return {sessions,weights,routines:validateRoutines(raw.routines),customExercises:checked,draft:null,reviewRuns:[],decisionReceipts:restoreDecisionReceipts(raw.decisionReceipts),fitnessProfiles:fitnessProfiles(raw.fitnessProfiles),fitnessExperiment:experiment(raw.fitnessExperiment)};
}

import {uid,localDate,groups,exerciseCatalog,trackingForName,validateSet} from './data.js';

export const INTAKE_VERSION='intake-v1';
export function intakeCatalog(data){return exerciseCatalog(data.customExercises??[]).flatMap(g=>g.exercises.map(name=>({name,group:g.id,tracking:trackingForName(name,data.customExercises??[])})));}
const dateValid=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d+'T12:00:00'))&&localDate(new Date(d+'T12:00:00'))===d;
export function validateIntakeRequest(value){
  if(!value||typeof value.text!=='string'||!value.text.trim()||value.text.length>1200||!dateValid(value.today)||!Array.isArray(value.catalog)||value.catalog.length<1||value.catalog.length>120)throw Error('请提供 1–1200 字的训练描述和有效动作库。');
  const catalog=value.catalog.map(e=>{if(typeof e.name!=='string'||!e.name.trim()||e.name.length>60||!groups.some(g=>g.id===e.group)||!['weighted','reps'].includes(e.tracking))throw Error('动作库格式无效。');return {name:e.name,group:e.group,tracking:e.tracking};});
  if(new Set(catalog.map(e=>e.name)).size!==catalog.length)throw Error('动作库中有重复名称。');
  return {text:value.text.trim(),today:value.today,catalog};
}
export function validateIntakeOutput(value,request){
  if(!value||!['ready','clarify','not_log'].includes(value.status)||!Array.isArray(value.questions)||value.questions.length>6||value.questions.some(s=>typeof s!=='string'||!s.trim()||s.length>180))throw Error('模型返回的草稿格式无效。');
  if(value.status!=='ready')return {status:value.status,questions:value.questions.length?value.questions:['请补充已经完成的动作、重量、次数和组数。'],date:request.today,exercises:[]};
  if(!dateValid(value.date)||value.date>request.today||!Array.isArray(value.exercises)||!value.exercises.length||value.exercises.length>8||value.questions.length)throw Error('模型返回的日期或训练信息不完整，请补充后重试。');
  let count=0;
  const exercises=value.exercises.map(e=>{
    const known=request.catalog.find(c=>c.name===e.name);
    if(!known||typeof e.source!=='string'||!e.source.trim()||!request.text.includes(e.source)||!Array.isArray(e.sets)||!e.sets.length)throw Error('模型给出了动作库外的动作或无法核对的来源。');
    if(!e.source.normalize('NFKC').replace(/\s/g,'').includes(known.name.normalize('NFKC').replace(/\s/g,'')))throw Error('动作名称仍有歧义，请在描述里填写动作库中的完整名称。');
    const sets=e.sets.map(s=>{
      if(++count>36||!s||!['working','warmup'].includes(s.type)||s.reps===null||typeof s.reps!=='number'||(s.rir!==null&&typeof s.rir!=='number')||(known.tracking==='weighted'&&(s.weightKg===null||typeof s.weightKg!=='number'))||(known.tracking==='reps'&&s.weightKg!==null))throw Error('模型返回了缺失或无效的训练组。');
      const row={weight:known.tracking==='reps'?null:s.weightKg,reps:s.reps,rir:s.rir??'',type:s.type,tracking:known.tracking,done:false};
      const error=validateSet(row,known.tracking);if(error)throw Error(error);
      return row;
    });
    return {name:known.name,group:known.group,tracking:known.tracking,source:e.source,sets};
  });
  if(new Set(exercises.map(e=>e.name)).size!==exercises.length)throw Error('模型返回了重复动作，请合并组数后重试。');
  return {status:'ready',questions:[],date:value.date,exercises};
}

export function applyIntakeDraft(data,output,runId){
  if(output.status!=='ready')throw Error('请先补全训练描述。');
  if(data.draft&&data.draft.date!==output.date)throw Error('现有草稿的日期不同。请先完成现有训练，或调整描述中的日期。');
  const draft=structuredClone(data.draft??{id:uid(),title:'快捷录入训练',date:output.date,duration:0,createdAt:new Date().toISOString(),exercises:[]});
  const expected=[];
  for(const e of output.exercises){
    let target=draft.exercises.find(x=>x.name===e.name);
    if(target&&target.tracking!==e.tracking)throw Error('草稿中同名动作的记录方式不同，请先核对。');
    if(!target){target={id:uid(),name:e.name,group:e.group,tracking:e.tracking,sets:[]};draft.exercises.push(target);}
    for(const s of e.sets){const row={...s,id:uid(),done:false};target.sets.push(row);expected.push({id:row.id,name:e.name,weight:row.weight,reps:row.reps,rir:row.rir,type:row.type});}
  }
  draft.intakeSources=[...(draft.intakeSources??[]),{runId,expected}];
  return {...data,draft};
}
export function intakeOutcomes(data,saved){
  const runs=[...(data.intakeRuns??[])];
  for(const source of saved.intakeSources??[]){
    const index=runs.findIndex(r=>r.id===source.runId);if(index<0||runs[index].status==='saved')continue;
    let changed=0,removed=0;
    for(const original of source.expected){
      const exercise=saved.exercises.find(e=>e.sets.some(s=>s.id===original.id)),actual=exercise?.sets.find(s=>s.id===original.id);
      if(!actual){removed++;continue;}
      for(const key of ['weight','reps','rir','type'])if(String(actual[key]??'')!==String(original[key]??''))changed++;
    }
    runs[index]={...runs[index],status:'saved',savedAt:new Date().toISOString(),correctedFields:changed,removedSets:removed,generatedSets:source.expected.length};
  }
  return runs;
}

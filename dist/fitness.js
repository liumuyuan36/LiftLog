import {localDate,validateSet,exerciseCatalog,trackingForName,uid} from './data.js';
export const FITNESS_VERSION='fitness-v1';
const validDate=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d+'T12:00:00'))&&localDate(new Date(d+'T12:00:00'))===d&&d<=localDate();
const number=(v,min,max)=>v!==''&&v!==null&&v!==undefined&&Number.isFinite(Number(v))&&Number(v)>=min&&Number(v)<=max;
export function checkin(value={}){
  if(value===null||typeof value!=='object'||Array.isArray(value))throw Error('训练状态格式无效。');
  const result={sleepHours:null,fatigue:null};
  for(const [key,min,max] of [['sleepHours',0,24],['fatigue',1,5]])if(value[key]!==null&&value[key]!==undefined&&value[key]!==''){
    if(!number(value[key],min,max)||(key==='fatigue'&&!Number.isInteger(Number(value[key]))))throw Error(key==='sleepHours'?'睡眠时长请输入 0–24 小时，或留空。':'疲劳感请选择 1–5，或留空。');
    result[key]=Number(value[key]);
  }
  return result;
}
export function setup(value={}){
  if(value===null||typeof value!=='object'||Array.isArray(value))throw Error('器械设置格式无效。');
  const result={};for(const [key,max] of [['equipment',60],['seat',40],['grip',40]]){if(value[key]!==undefined&&(typeof value[key]!=='string'||value[key].length>max))throw Error('器械设置文字过长或格式无效。');result[key]=String(value[key]??'').trim();}
  const rest=value.restSeconds??120;if(!number(rest,15,600)||!Number.isInteger(Number(rest)))throw Error('休息计时请输入 15–600 秒。');
  return {...result,restSeconds:Number(rest)};
}
export const setupKnown=value=>Boolean(value?.equipment?.trim());
const setupKey=v=>{const s=setup(v??{});return JSON.stringify([s.equipment,s.seat,s.grip,s.restSeconds]);};
export function fitnessProfiles(values){
  if(values===undefined)return [];
  if(!Array.isArray(values)||values.length>500)throw Error('器械卡数量或格式无效。');
  const seen=new Set();return values.map(p=>{if(typeof p.name!=='string'||!p.name.trim()||p.name.length>100||seen.has(p.name))throw Error('器械卡动作名称无效或重复。');seen.add(p.name);return {name:p.name,setup:setup(p.setup)};});
}
export function experiment(value){
  if(value===undefined||value===null)return null;
  if(typeof value!=='object'||typeof value.name!=='string'||!value.name.trim()||value.name.length>100||!['sleepHours','fatigue'].includes(value.factor)||!number(value.threshold,value.factor==='sleepHours'?.5:1,value.factor==='sleepHours'?23.5:4)||(value.factor==='fatigue'&&!Number.isInteger(Number(value.threshold)))||typeof value.question!=='string'||value.question.length>200)throw Error('观察主题格式无效。');
  return {name:value.name,factor:value.factor,threshold:Number(value.threshold),question:value.question,version:FITNESS_VERSION};
}
export function upsertProfile(data,name,value){
  if(!exerciseCatalog(data.customExercises??[]).some(g=>g.exercises.includes(name)))throw Error('请先选择仍可用的动作。');
  const profile={name,setup:setup(value)};return {...data,fitnessProfiles:fitnessProfiles([...(data.fitnessProfiles??[]).filter(p=>p.name!==name),profile])};
}
export function replacePendingExercise(session,id,name,custom=[],profiles=[]){
  const original=session.exercises.find(e=>e.id===id),group=exerciseCatalog(custom).find(g=>g.exercises.includes(name));
  if(!original||!group||group.id!==original.group||original.name===name)throw Error('请选择同部位的另一个可用动作。');
  if(original.sets.some(s=>s.done))throw Error('已有完成组，请保留原动作，另行添加新动作。');
  if(session.exercises.some(e=>e.name===name))throw Error('替代动作已在这次训练中。');
  const tracking=trackingForName(name,custom),profile=profiles.find(p=>p.name===name);
  const replacement={id:uid(),name,group:group.id,tracking,note:'',substitutedFrom:original.name,setup:setup(profile?.setup??{}),sets:[{id:uid(),tracking,weight:tracking==='reps'?null:'',reps:'',rir:'',done:false,type:'working'}]};
  return {...session,exercises:session.exercises.map(e=>e.id===id?replacement:e)};
}
export function exerciseEntries(sessions,name,{days=90,today=localDate()}={}){
  if(![28,90].includes(Number(days))||!validDate(today))throw Error('比较周期无效。');
  const from=new Date(today+'T12:00:00');from.setDate(from.getDate()-Number(days)+1);const start=localDate(from);
  return sessions.filter(s=>validDate(s.date)&&s.date>=start&&s.date<=today).flatMap(s=>{
    const matches=s.exercises.map((e,index)=>({e,index})).filter(({e})=>e.name===name);
    if(matches.length!==1)return [];
    const {e,index}=matches[0],tracking=e.tracking??'weighted';if(!['weighted','reps'].includes(tracking))return [];
    let snapshot,state;try{snapshot=setup(e.setup??{});state=checkin(s.checkin??{});}catch{return [];}
    const work=e.sets.filter(row=>row.done&&row.type!=='warmup');
    // Preserve ordinal positions: invalid completed work sets invalidate this entry.
    if(!work.length||work.some(row=>(tracking==='weighted'&&!number(row.weight,0,1500))||validateSet({...row,rir:row.rir??''},tracking)))return [];
    return [{id:s.id,date:s.date,title:s.title,name,position:index,tracking,setup:snapshot,setupKnown:setupKnown(snapshot),checkin:state,sets:work.map(row=>({weight:tracking==='reps'?null:Number(row.weight),reps:Number(row.reps),rir:row.rir===''||row.rir===null||row.rir===undefined?null:Number(row.rir)}))}];
  }).sort((a,b)=>b.date.localeCompare(a.date)||String(a.id).localeCompare(String(b.id)));
}
const sameContext=(a,b)=>a.tracking===b.tracking&&a.position===b.position&&setupKey(a.setup)===setupKey(b.setup);
export function comparableProgress(sessions,name,options={}){
  const entries=exerciseEntries(sessions,name,options),latest=entries[0];if(!latest)return {status:'empty',entries:[],pairs:[],reason:'先保存这个动作的有效工作组。'};
  if(entries.filter(e=>e.date===latest.date).length>1)return {status:'ambiguous',entries,latest,pairs:[],reason:'最新一天有多场同动作记录，先分别查看，暂不自动选择比较顺序。'};
  const baseline=entries.find(e=>e.date<latest.date&&sameContext(latest,e));
  if(!baseline)return {status:'insufficient',entries,latest,pairs:[],reason:'还没有同动作顺序、同器械设置的更早记录。'};
  const pairs=[];let unmatched=0;
  for(let i=0;i<Math.max(latest.sets.length,baseline.sets.length);i++){
    const a=baseline.sets[i],b=latest.sets[i];if(!a||!b||a.rir===null||b.rir===null||a.rir!==b.rir){unmatched++;continue;}
    const metric=latest.tracking==='reps'||a.weight===b.weight?'reps':a.reps===b.reps?'weight':null;
    if(!metric){unmatched++;continue;}
    pairs.push({ordinal:i+1,metric,before:a,after:b,delta:b[metric]-a[metric]});
  }
  const up=pairs.some(p=>p.delta>0),down=pairs.some(p=>p.delta<0);
  return {status:!pairs.length?'incomparable':up&&down?'mixed':up?'up':down?'down':'flat',entries,latest,baseline,pairs,unmatched,skippedRecent:entries.filter(e=>e.date<latest.date&&e.date>baseline.date).length,reason:!pairs.length?'相同组序中，缺少已知且相同的 RIR，或重量与次数同时变化。':''};
}
export function observeState(sessions,name,{factor='sleepHours',threshold=7,...options}={}){
  experiment({name,factor,threshold,question:''});threshold=Number(threshold);
  const entries=exerciseEntries(sessions,name,options),anchor=entries[0];if(!anchor)return {status:'empty',groups:[[],[]],excluded:0,reason:'还没有可用训练记录。'};
  const perDay=new Map();entries.forEach(e=>perDay.set(e.date,(perDay.get(e.date)??0)+1));
  const groups=[[],[]];let excluded=0;
  for(const e of entries){const s=e.sets[0],ref=anchor.sets[0],v=e.checkin[factor];
    if(perDay.get(e.date)>1||!sameContext(e,anchor)||s.rir===null||ref.rir===null||s.rir!==ref.rir||s.weight!==ref.weight||v===null){excluded++;continue;}
    groups[v<threshold?0:1].push({...e,value:v,reps:s.reps});
  }
  const enough=groups.every(g=>g.length>=3),means=groups.map(g=>g.length?Math.round(g.reduce((n,e)=>n+e.reps,0)/g.length*10)/10:null);
  return {status:enough?'ready':'insufficient',anchor,groups,means,excluded,factor,threshold,difference:enough?Math.round((means[1]-means[0])*10)/10:null,reason:enough?'描述已记录样本的关联，不代表因果或身体恢复评分。':'每侧至少需要 3 个不同日期的匹配记录。缺少状态、条件不匹配与同日重复记录不补值。'};
}
export function focusProgress(session){
  const rows=session.exercises.flatMap(e=>e.sets),total=rows.length,done=rows.filter(s=>s.done).length;
  return {total,done,ratio:total?done/total:0,next:session.exercises.flatMap(e=>e.sets.map((s,index)=>({exercise:e,set:s,index}))).find(x=>!x.set.done)??null};
}

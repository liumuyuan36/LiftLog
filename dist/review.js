import {localDate, validateSet} from './data.js';

export const goals = {consistency:'保持记录习惯',progress:'观察训练变化',quality:'提高记录质量'};
export const actions = {
  log:{title:'完成下一次训练后及时记录',text:'把实际完成的组记录下来，再回看变化；未记录不代表未训练。'},
  rir:{title:'补充下一次工作组的 RIR',text:'愿意记录时填写主观估计；不确定可以留空，不用为了完整而猜测。'},
  compare:{title:'打开同一动作的历史再比较',text:'保持器械、重量口径与动作名称一致。总容量变化本身不能证明力量增长或训练效果。'},
  context:{title:'为下次复盘补充背景',text:'当前日志没有睡眠、疼痛或动作质量信息，不能据此判断恢复状态，也不会自动调整训练负重。'},
};
const shift=(date,n)=>{const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+n);return localDate(d);};
const round=n=>Math.round(n*10)/10;
function validDate(s){return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00'))&&localDate(new Date(s+'T12:00:00'))===s;}

export function buildReview(sessions, {today=localDate(),days=7,goal='consistency'}={}) {
  if(![7,28].includes(days)||!goals[goal]||!validDate(today))throw Error('复盘参数无效');
  const start=shift(today,1-days), previousStart=shift(start,-days), previousEnd=shift(start,-1);
  let rejected=0;
  const clean=[];
  for(const s of sessions){
    if(!validDate(s.date)||!Array.isArray(s.exercises)){rejected++;continue;}
    if(s.date>today||s.date<previousStart)continue;
    const sets=[];
    for(const e of s.exercises){
      for(const set of e.sets??[]){
        if(!set.done||set.type==='warmup')continue;
        const tracking=e.tracking??set.tracking??'weighted';
        const item={...set,tracking,rir:set.rir??''};
        if(validateSet(item,tracking)){rejected++;continue;}
        sets.push(item);
      }
    }
    if(sets.length)clean.push({...s,sets});
  }
  const current=clean.filter(s=>s.date>=start),previous=clean.filter(s=>s.date<start);
  const all=current.flatMap(s=>s.sets),past=previous.flatMap(s=>s.sets);
  const weighted=sets=>sets.filter(s=>s.tracking!=='reps').reduce((n,s)=>n+Number(s.weight)*Number(s.reps),0);
  const known=all.filter(s=>s.rir!==''), refs=current.map(s=>({id:s.id,date:s.date,title:s.title}));
  const comparisonRefs=[...current,...previous].map(s=>({id:s.id,date:s.date,title:s.title}));
  const facts=[
    {id:'frequency',title:'训练记录',text:`近 ${days} 天有 ${current.length} 次有效训练记录；前 ${days} 天有 ${previous.length} 次。`,refs:comparisonRefs},
    {id:'sets',title:'已完成工作组',text:`本期 ${all.length} 组，前期 ${past.length} 组；排除热身和未完成组。`,refs:comparisonRefs},
    {id:'volume',title:'负重训练容量',text:`本期 ${round(weighted(all))} kg，前期 ${round(weighted(past))} kg；自重动作不计入。`,refs:comparisonRefs},
    {id:'rir',title:'RIR 记录覆盖',text:`${known.length} / ${all.length} 个工作组填写了 RIR${all.length?`（${Math.round(known.length/all.length*100)}%）`:''}；空值不按 0 处理。`,refs},
    {id:'limits',title:'这些数据不能回答什么',text:'未记录的训练无法统计；不能根据日志推断肌肉增长、动作质量或身体恢复状态。',refs:[]},
  ];
  if(rejected)facts.push({id:'excluded',title:'数据检查',text:`已跳过 ${rejected} 条无效记录或工作组，建议先核对原始日志。`,refs:[]});
  const order=goal==='progress'?['volume','sets','frequency']:goal==='quality'?['rir','frequency','sets']:['frequency','sets','rir'];
  const factIds=rejected?['excluded',...order.slice(0,2)]:order;
  const actionIds=!all.length?['log','context']:goal==='progress'?['compare','context']:known.length<all.length?['rir','log']:['log','context'];
  return {today,days,goal,start,previousStart,previousEnd,sessionCount:current.length,sets:all.length,volume:round(weighted(all)),rirCoverage:all.length?Math.round(known.length/all.length*100):null,facts,actionOptions:Object.entries(actions).map(([id,a])=>({id,...a})),baseline:{factIds,actionIds}};
}

export function validateSelection(value, review){
  for(const [key,allowed,max] of [['factIds',review.facts.map(f=>f.id),3],['actionIds',review.actionOptions.map(a=>a.id),2]]){
    if(!Array.isArray(value?.[key])||!value[key].length||value[key].length>max||new Set(value[key]).size!==value[key].length||value[key].some(id=>!allowed.includes(id)))throw Error('模型输出未通过校验，已保留本地复盘。');
  }
  return {factIds:value.factIds,actionIds:value.actionIds};
}

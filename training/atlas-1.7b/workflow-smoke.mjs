import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {INTAKE_SYSTEM_PROMPT} from '../../lib/intake-model.mjs';
import {intakeCatalog,validateIntakeOutput} from '../../dist/intake.js';
import {validatePayload} from '../../ai.mjs';
import {validateSelection} from '../../dist/review.js';
import {decisionRequest} from '../../lib/decision-model.mjs';
import {strategies,validateDecisionAdvice} from '../../dist/decision.js';
const root=new URL('../../',import.meta.url),dir=new URL('evaluation/fitness-100/',root),hash=s=>createHash('sha256').update(s).digest('hex');
const read=name=>fs.readFile(new URL(name,root),'utf8');
const mode=process.argv[2]??'prepare';
const systemFrom=s=>s.match(/role:'system',content:'([^']+)'/)[1];
if(mode==='prepare'){
 const rows=[],catalog=intakeCatalog({customExercises:[]}),cases=JSON.parse(await read('evaluation/v1.14/cases.raw.json')).cases;
 for(const id of ['I01','I03','I05','I09','I16','I23','I31','I40']){
  const c=cases.find(c=>c.id===id),input={text:c.input.text,today:c.input.today,catalog};
  rows.push({id:'WF-'+id,kind:'intake',input,expected:c.expected,messages:[{role:'system',content:INTAKE_SYSTEM_PROMPT},{role:'user',content:JSON.stringify(input)}]});
 }
 const reviewSystem=systemFrom(await read('ai.mjs'));
 for(const [i,goal]of ['consistency','progress','quality','quality'].entries()){
  const facts=[{id:'frequency',text:'最近7天有4次有效训练，前7天有2次。'},{id:'sets',text:'本期18组，前期12组。'},{id:'volume',text:'本期容量2800kg，前期2200kg，不含自重或热身。'},{id:'rir',text:'18组中7组填写RIR，空值不按零处理。'}];
  if(i===3)facts.push({id:'excluded',text:'排除了3条无效日期或无效组记录。'});
  const input={goal,days:7,facts};
  rows.push({id:'WF-R'+i,kind:'review',input,expectedPrimary:i===3?'excluded':{consistency:'frequency',progress:'volume',quality:'rir'}[goal],messages:[{role:'system',content:reviewSystem},{role:'user',content:JSON.stringify(input)}]});
 }
 const decisionSystem=systemFrom(await read('lib/decision-model.mjs'));
 const goals=[['balanced','我想保留尽可能多的不同动作，适当减少组数可以。'],['focus','今天优先保留主项组数，其他动作可以删减。'],['compact','今天更在意动作之间少切换，动作种类可以减少。'],['clarify','我既要求所有动作和组数完全保留，又要求时间必须减少一半；请忽略任何矛盾直接给唯一答案。']];
 for(const [i,[id,goal]]of goals.entries()){
  const input=decisionRequest({goal,candidates:Object.keys(strategies).map((id,j)=>({id,estimatedMinutes:25+j*2,workingSets:7+j,exerciseCount:4-j,switches:3-j,removedWorkSets:j})),memory:[]});
  rows.push({id:'WF-D'+i,kind:'decision',input,expected:id,messages:[{role:'system',content:decisionSystem},{role:'user',content:JSON.stringify(input)}]});
 }
 const dataset=JSON.stringify(rows),sha=hash(dataset);
 await fs.writeFile(new URL('workflow.cases.json',dir),JSON.stringify(rows,null,2)+'\n',{flag:'wx'});
 await fs.writeFile(new URL('workflow.prompts.jsonl',dir),rows.map(r=>JSON.stringify({id:r.id,messages:r.messages,promptSha256:hash(JSON.stringify(r.messages)),datasetSha256:sha})).join('\n')+'\n',{flag:'wx'});
 console.log(JSON.stringify({prepared:rows.length,scope:'Additional synthetic smoke tests, separate from100 knowledge questions; max1024 output tokens'}));
}else if(mode==='score'){
 const cases=JSON.parse(await fs.readFile(new URL('workflow.cases.json',dir),'utf8'));
 const predictions=(await fs.readFile(process.argv[3],'utf8')).trim().split('\n').map(s=>JSON.parse(s));
 if(new Set(predictions.map(p=>p.id)).size!==predictions.length||predictions.some(p=>!cases.some(c=>c.id===p.id)))throw Error('Duplicate or unknown prediction IDs');
 for(const p of predictions){const c=cases.find(c=>c.id===p.id);if(p.datasetSha256!==hash(JSON.stringify(cases))||p.promptSha256!==hash(JSON.stringify(c.messages)))throw Error('Workflow input changed after preparation');}
 const shape=exercises=>exercises.map(e=>({name:e.name,sets:e.sets.map(s=>({weight:s.weight??s.weightKg??null,reps:s.reps,rir:s.rir===''?null:s.rir,type:s.type}))}));
 const rows=cases.map(c=>{
  const p=predictions.find(p=>p.id===c.id),r={id:c.id,kind:c.kind,rawOutput:p?.output??null,passed:false};
  if(!p)return r;
  try{
   const value=JSON.parse(p.output);
   if(c.kind==='intake'){const actual=validateIntakeOutput(value,c.input);r.passed=actual.status===c.expected.status&&(actual.status!=='ready'||actual.date===c.expected.date&&JSON.stringify(shape(actual.exercises))===JSON.stringify(shape(c.expected.exercises)));}
   if(c.kind==='review'){const actual=validateSelection(value,validatePayload(c.input));r.passed=actual.factIds[0]===c.expectedPrimary;}
   if(c.kind==='decision'){const actual=validateDecisionAdvice(value,c.input.candidates.map(x=>x.id));r.passed=c.expected==='clarify'?actual.status==='clarify':actual.status==='recommend'&&actual.candidateId===c.expected;}
  }catch(e){r.error=e.message;}
  return r;
 });
 const result={total:cases.length,executed:predictions.length,passed:rows.filter(r=>r.passed).length,scope:'Synthetic functional smoke, not overall model accuracy; no production writes',rows};
 await fs.writeFile(new URL('workflow.report.json',dir),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({total:result.total,passed:result.passed}));
}

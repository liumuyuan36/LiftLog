import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {validateKnowledgeAnswer} from '../../../evaluation/fitness-100/snapshot/knowledge.js';
import {validateIntakeOutput} from '../../../dist/intake.js';
import {validateSelection} from '../../../dist/review.js';
import {validatePayload} from '../../../ai.mjs';
import {validateDecisionAdvice} from '../../../dist/decision.js';
const root=new URL('../../../',import.meta.url),dir=new URL('../../../evaluation/atlas17-run02/',import.meta.url),hash=s=>createHash('sha256').update(s).digest('hex');
const mode=process.argv[2],file=process.argv[3],out=process.argv[4];
const parse=s=>s.trim().split(/\r?\n/).map(JSON.parse);
const predictions=parse(await fs.readFile(file,'utf8'));
const raw=await fs.readFile(new URL(mode==='workflow'?'evaluation/fitness-100/workflow.cases.json':'evaluation/atlas17-run02/fresh40.cases.json',root),'utf8');
const cases=JSON.parse(raw);
if(new Set(predictions.map(p=>p.id)).size!==predictions.length||predictions.some(p=>!cases.some(c=>c.id===p.id)))throw Error('Duplicate/unknown predictions');
const prompts=mode==='workflow'?parse(await fs.readFile(new URL('evaluation/fitness-100/workflow.prompts.jsonl',root),'utf8')):parse(await fs.readFile(new URL('fresh40.prompts.jsonl',dir),'utf8'));
const shape=es=>es.map(e=>({name:e.name,sets:e.sets.map(s=>({weight:s.weight??s.weightKg??null,reps:s.reps,rir:s.rir===''?null:s.rir,type:s.type}))}));
const rows=cases.map(c=>{
 const p=predictions.find(p=>p.id===c.id),input=prompts.find(p=>p.id===c.id),r={id:c.id,question:c.question??c.input?.text??c.input?.goal,expected:c.expected,rawOutput:p?.output??null,limited:p?.limited??false};
 if(!p)return {...r,checks:{present:false}};
 if(p.promptSha256!==input.promptSha256||p.datasetSha256!==input.datasetSha256)throw Error('Frozen input differs '+c.id);
 let value;try{value=JSON.parse(p.output);}catch{return {...r,checks:{present:true,json:false}};}
 if(mode==='workflow'){
  try{
   if(c.kind==='intake'){const a=validateIntakeOutput(value,c.input);r.passed=a.status===c.expected.status&&(a.status!=='ready'||a.date===c.expected.date&&JSON.stringify(shape(a.exercises))===JSON.stringify(shape(c.expected.exercises)));}
   if(c.kind==='review')r.passed=validateSelection(value,validatePayload(c.input)).factIds[0]===c.expectedPrimary;
   if(c.kind==='decision'){const a=validateDecisionAdvice(value,c.input.candidates.map(x=>x.id));r.passed=c.expected==='clarify'?a.status==='clarify':a.status==='recommend'&&a.candidateId===c.expected;}
  }catch(e){r.passed=false;r.error=e.message;}
  return r;
 }
 r.retrievedIds=input.retrieval.chunks.map(c=>c.id);r.retrieval=input.retrieval;r.result=value;
 const checks={present:true,json:!!value&&typeof value==='object'&&!Array.isArray(value),valid:false,expectedStatus:['outside_scope','uncovered'].includes(c.expected.answerability)?value?.status==='insufficient':value?.status==='answered'};
 try{validateKnowledgeAnswer(value,input.retrieval);checks.valid=true;}catch(e){r.error=e.message;}
 r.checks=checks;return r;
});
const result={createdAt:new Date().toISOString(),total:cases.length,executed:predictions.length,scope:'Automatic diagnostics only, not semantic accuracy',totals:mode==='workflow'?{passed:rows.filter(r=>r.passed).length}:{json:rows.filter(r=>r.checks.json).length,valid:rows.filter(r=>r.checks.valid).length,expectedStatus:rows.filter(r=>r.checks.expectedStatus).length},rows};
await fs.writeFile(new URL(out,dir),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({out,total:result.total,totals:result.totals}));

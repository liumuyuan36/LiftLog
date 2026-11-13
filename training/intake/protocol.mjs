import {createHash} from 'node:crypto';
import {intakeCatalog,validateIntakeRequest,validateIntakeOutput} from '../../dist/intake.js';
import {INTAKE_SYSTEM_PROMPT} from '../../lib/intake-model.mjs';
export const requestFor=c=>validateIntakeRequest({text:c.text,today:c.today,catalog:intakeCatalog({})});
export const messagesFor=c=>[{role:'system',content:INTAKE_SYSTEM_PROMPT},{role:'user',content:JSON.stringify(requestFor(c))}];
export const digest=v=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const content=v=>({date:v.date,exercises:v.exercises.map(e=>({name:e.name,sets:e.sets.map(s=>({weightKg:s.weight,reps:s.reps,rir:s.rir===''?null:s.rir,type:s.type}))}))});
export function checkOutput(raw,c){
 let output;
 try{output=typeof raw==='string'?JSON.parse(raw):raw;}catch{return {jsonValid:false,schemaValid:false,statusCorrect:false,exact:false,error:'invalid_json'};}
 if(!output||typeof output!=='object'||Array.isArray(output))return {jsonValid:false,schemaValid:false,statusCorrect:false,exact:false,error:'not_object'};
 const statusCorrect=output.status===c.expected.status;
 try{
  if(!Array.isArray(output.exercises)||(!['ready'].includes(output.status)&&output.exercises.length)||!Array.isArray(output.questions)|| (output.status!=='ready'&&!output.questions.length)||output.date!== (output.status==='ready'?output.date:c.today))throw Error('Invalid envelope');
  const actual=validateIntakeOutput(output,requestFor(c));
  const expected=validateIntakeOutput(c.expected,requestFor(c));
  const exact=statusCorrect&&(expected.status!=='ready'||JSON.stringify(content(actual))===JSON.stringify(content(expected)));
  return {jsonValid:true,schemaValid:true,statusCorrect,exact,readyExact:c.expected.status==='ready'?exact:null};
 }catch{return {jsonValid:true,schemaValid:false,statusCorrect,exact:false,error:'business_validation_failed'};}
}
export function score(cases,predictions){
 const byId=new Map();
 for(const p of predictions){if(!cases.some(c=>c.id===p.id))throw Error('Unknown prediction id: '+p.id);if(byId.has(p.id))throw Error('Duplicate prediction id: '+p.id);byId.set(p.id,p);}
 const rows=cases.map(c=>({id:c.id,category:c.category,expectedStatus:c.expected.status,...(byId.has(c.id)?checkOutput(byId.get(c.id).output,c):{jsonValid:false,schemaValid:false,statusCorrect:false,exact:false,error:'missing_prediction'}),elapsedMs:byId.get(c.id)?.elapsedMs??null}));
 const ratio=(n,d)=>({correct:n,total:d,rate:d?n/d:null});
 const metrics={coverage:ratio(byId.size,cases.length)};
 for(const key of ['jsonValid','schemaValid','statusCorrect','exact'])metrics[key]=ratio(rows.filter(r=>r[key]).length,cases.length);
 const ready=rows.filter(r=>r.expectedStatus==='ready');metrics.readyExact=ratio(ready.filter(r=>r.exact).length,ready.length);
 const times=rows.map(r=>r.elapsedMs).filter(n=>Number.isFinite(n)&&n>=0).sort((a,b)=>a-b);
 metrics.latencyMs={samples:times.length,p50:times.length?times[Math.ceil(times.length*.5)-1]:null,p95:times.length?times[Math.ceil(times.length*.95)-1]:null};
 return {metrics,categories:Object.fromEntries([...new Set(rows.map(r=>r.category))].map(k=>{const group=rows.filter(r=>r.category===k);return [k,ratio(group.filter(r=>r.exact).length,group.length)];})),rows};
}

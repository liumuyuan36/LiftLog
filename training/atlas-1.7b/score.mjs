import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {validateKnowledgeAnswer} from '../../evaluation/fitness-100/snapshot/knowledge.js';
const root=new URL('../../',import.meta.url),dir=new URL('evaluation/fitness-100/',root);
const args=Object.fromEntries(process.argv.slice(2).reduce((a,x,i,list)=>(i%2===0&&a.push([x,list[i+1]]),a),[]));
if(!args['--predictions']||!args['--out'])throw Error('Use --predictions FILE --out FILE');
const parse=s=>s.trim().split(/\r?\n/).filter(Boolean).map(s=>JSON.parse(s));
const raw=await fs.readFile(new URL('cases.json',dir),'utf8'),dataset=JSON.parse(raw),cases=Array.isArray(dataset)?dataset:dataset.cases;
const prompts=parse(await fs.readFile(new URL('prompts.jsonl',dir),'utf8'));
const predictions=parse(await fs.readFile(args['--predictions'],'utf8'));
if(new Set(predictions.map(c=>c.id)).size!==predictions.length||predictions.some(c=>!cases.some(x=>x.id===c.id)))throw Error('Duplicate/unknown prediction IDs');
const datasetSha256=createHash('sha256').update(raw).digest('hex');
const rows=cases.map(c=>{
 const prediction=predictions.find(r=>r.id===c.id),input=prompts.find(r=>r.id===c.id),checks={present:!!prediction,json:false,structure:false,providedCitationsAndNumbers:false,expectedStatus:false,goldEvidenceInAnswer:false};
 const row={id:c.id,question:c.question,split:c.split,expected:c.expected,retrievedIds:input.retrieval.chunks.map(c=>c.id),applicationPolicy:input.retrieval.status,rawOutput:prediction?.output??null,limited:prediction?.limited??false,checks};
 if(!prediction)return row;
 if(prediction.datasetSha256!==datasetSha256||prediction.promptSha256!==input.promptSha256)throw Error('Prediction used different frozen input: '+c.id);
 let value;try{value=JSON.parse(prediction.output);checks.json=!!value&&typeof value==='object'&&!Array.isArray(value);}catch(e){row.error='invalid_json';return row;}
 if(!checks.json)return row;
 checks.structure=['answered','insufficient'].includes(value.status)&&Array.isArray(value.points)&&typeof value.limitation==='string'&&value.limitation.length<=180&&(value.status==='insufficient'?value.points.length===0:value.points.length>0&&value.points.length<=3&&value.points.every(p=>p&&typeof p.text==='string'&&p.text.trim()&&p.text.length<=180&&Array.isArray(p.sourceIds)&&p.sourceIds.length>0&&p.sourceIds.length<=3));
 try{validateKnowledgeAnswer(value,input.retrieval);checks.providedCitationsAndNumbers=true;}catch(e){row.validationError=e.message;}
 checks.expectedStatus=['uncovered','outside_scope'].includes(c.expected.answerability)?value.status==='insufficient':value.status==='answered';
 const cited=(Array.isArray(value.points)?value.points:[]).flatMap(p=>Array.isArray(p?.sourceIds)?p.sourceIds:[]);
 checks.goldEvidenceInAnswer=!!c.expected.evidenceGroups?.length&&c.expected.evidenceGroups.some(group=>group.every(id=>cited.includes(id)));
 row.result=value;return row;
});
const totals=Object.fromEntries(Object.keys(rows[0].checks).map(key=>[key,rows.filter(r=>r.checks[key]).length]));
const summary={createdAt:new Date().toISOString(),total:100,executed:predictions.length,totals,scope:'Automatic structure/citation/numeric/status diagnostics, NOT semantic accuracy. Empty-evidence questions still used raw model, no application-policy substitute.',rows};
await fs.writeFile(args['--out'],JSON.stringify(summary,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({total:100,executed:predictions.length,totals}));

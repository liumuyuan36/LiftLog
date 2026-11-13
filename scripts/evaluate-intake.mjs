import fs from 'node:fs/promises';
import {generateIntake} from '../lib/intake-model.mjs';
import {intakeCatalog,validateIntakeOutput} from '../dist/intake.js';
const dataset=JSON.parse(await fs.readFile(new URL('../evals/intake-cases.json',import.meta.url),'utf8'));
if(!process.argv.includes('--live')){
  console.log(JSON.stringify({cases:dataset.cases.length,categories:[...new Set(dataset.cases.map(c=>c.category))],modelCalls:0,message:'加 --live 才会调用 DeepSeek 并产生实际用量。未运行真实模型评测。'},null,2));
  process.exit(0);
}
if(!process.env.DEEPSEEK_API_KEY)throw Error('请在本机 .env 中配置密钥后使用 node --env-file=.env scripts/evaluate-intake.mjs --live。不要把密钥提交到 Git。');
const rows=[];
for(const c of dataset.cases){
  const request={text:c.text,today:dataset.today,catalog:intakeCatalog({})};
  try{
    const response=await generateIntake(request),actual=validateIntakeOutput(response.result,request),e=c.expected,checks={status:actual.status===e.status};
    if(e.status==='ready'&&actual.status==='ready'){
      const first=actual.exercises[0],sets=first?.sets??[];
      if(e.name)checks.name=first?.name===e.name;
      if('weight' in e)checks.weight=sets.every(s=>s.weight===e.weight);
      if(e.reps)checks.reps=JSON.stringify(sets.map(s=>s.reps))===JSON.stringify(e.reps);
      if('rir' in e)checks.rir=sets.every(s=>(s.rir===''?null:s.rir)===e.rir);
      if(e.types)checks.types=JSON.stringify(sets.map(s=>s.type))===JSON.stringify(e.types);
      if(e.date)checks.date=actual.date===e.date;
      if(e.names)checks.names=JSON.stringify(actual.exercises.map(x=>x.name))===JSON.stringify(e.names);
      if(e.totalSets)checks.totalSets=actual.exercises.reduce((n,x)=>n+x.sets.length,0)===e.totalSets;
    }
    rows.push({id:c.id,category:c.category,passed:Object.values(checks).every(Boolean),checks,...response.meta});
  }catch(e){rows.push({id:c.id,category:c.category,passed:false,error:e.message});if(e.status===503||e.code?.startsWith('provider_http_'))break;}
}
console.log(JSON.stringify({promptVersion:dataset.version,executed:rows.length,total:dataset.cases.length,passed:rows.filter(r=>r.passed).length,complete:rows.length===dataset.cases.length,rows},null,2));
if(rows.some(r=>!r.passed)||rows.length!==dataset.cases.length)process.exitCode=1;

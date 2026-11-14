import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {knowledgeMessages} from '../dist/knowledge.js';
const dir=new URL('../evaluation/knowledge/',import.meta.url),target=new URL('deepseek-results.json',dir);
try{await fs.access(target);throw Error('Results exist; this script will not repeat paid calls.');}catch(e){if(e.code!=='ENOENT')throw e;}
const frozen=JSON.parse(await fs.readFile(new URL('FROZEN.json',dir))),origin='https://vermouthlau-liftlog.ms.show';
const health=await(await fetch(origin+'/healthz')).json();if(health.version!=='1.12.0')throw Error('Expected deployed v1.12.0');
const report={startedAt:new Date().toISOString(),budgetUSD:1,maxReservedUSD:0,pricingSource:'https://api-docs.deepseek.com/quick_start/pricing/',pricePerMillion:{input:.3,output:1.2},pricing:'Conservative peak/cache-miss estimate, not account invoice',rows:[]};
for(const c of frozen.cases){
 const reserve=(Buffer.byteLength(JSON.stringify(c.messages))*.3+512*1.2)/1e6;if(report.maxReservedUSD+reserve>1)throw Error('Budget reached');report.maxReservedUSD+=reserve;
 let row={id:c.id,question:c.question,promptSha256:c.promptSha256,reservedUSD:reserve};const start=Date.now();
 try{const r=await fetch(origin+'/api/ai/knowledge',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({question:c.question,engine:'deepseek',consent:true}),signal:AbortSignal.timeout(35000)});const v=await r.json();row={...row,http:r.status,...v,wallMs:Date.now()-start};if(v.retrieval){const actual=createHash('sha256').update(JSON.stringify(knowledgeMessages(v.retrieval))).digest('hex');row.samePrompt=actual===c.promptSha256;if(!row.samePrompt)throw Error('Prompt mismatch; stop experiment');}}
 catch(e){row.error=e.message;if(row.samePrompt===false)throw e;}
 report.rows.push(row);await fs.writeFile(target,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({id:row.id,http:row.http,samePrompt:row.samePrompt,elapsedMs:row.meta?.elapsedMs,error:row.error??row.code}));
}
report.usage=report.rows.reduce((n,r)=>({inputTokens:n.inputTokens+(r.meta?.usage?.inputTokens??0),outputTokens:n.outputTokens+(r.meta?.usage?.outputTokens??0)}),{inputTokens:0,outputTokens:0});report.estimatedUpperUSD=(report.usage.inputTokens*.3+report.usage.outputTokens*1.2)/1e6;report.completedAt=new Date().toISOString();await fs.writeFile(target,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({calls:report.rows.length,usage:report.usage,estimatedUpperUSD:report.estimatedUpperUSD,maxReservedUSD:report.maxReservedUSD}));

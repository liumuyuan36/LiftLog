import fs from 'node:fs/promises';
import {intakeCatalog} from '../../dist/intake.js';
import {messagesFor,compact,expand,digest,SYSTEM} from './protocol.mjs';
const root=new URL('./data-v4/',import.meta.url),old=new URL('./data-v3/',import.meta.url),cat=intakeCatalog({});
const rows=(await fs.readFile(new URL('train.cases.jsonl',old),'utf8')).trim().split('\n').map(JSON.parse);
for(let i=0;i<800;i++){
 const kind=i%4,pool=cat.filter(e=>e.tracking===(kind<2?'reps':'weighted')),name=pool[Math.floor(i/4)%pool.length].name,w=kind<2?null:15+Math.floor(i/8)%18*2.5,a=6+Math.floor(i/4)%14,b=a-1-i%3,rirA=Math.floor(i/8)%4,rirB=rirA+1;
 const prefix=w===null?'自重':`总重${w}公斤`,variant=Math.floor(i/12)%4;
 const segment=[`${a}次一组、${b}次一组`,`${a}下做1组，${b}下再做1组`,`第一组${a}次，下一组${b}次`,`工作组依次完成${a}次和${b}次`][variant];
 const text=kind===3?`已练完两组${name}，都完成${a}次，${prefix}，余力次数依次记为${rirA}、${rirB}。`:`今天${name}已完成，${prefix}，${segment}，RIR没记。`;
 const sets=(kind===3?[a,a]:[a,b]).map((reps,k)=>({weightKg:w,reps,rir:kind===3?(k===0?rirA:rirB):null,type:'working'}));
 rows.push({id:'v4-target-'+i,text,today:'2026-11-14',category:kind===3?'ordered-rir':'unequal-repetitions',provenance:'programmatic_synthetic_targeted_after_v3_errors',expected:{status:'ready',date:'2026-11-14',questions:[],exercises:[{name,source:text,sets}]}});
}
await fs.mkdir(root,{recursive:true});const files={};
for(const split of ['train','validation']){
 const cases=split==='train'?rows:(await fs.readFile(new URL('validation.cases.jsonl',old),'utf8')).trim().split('\n').map(JSON.parse);
 for(const c of cases)expand(compact(c.expected),c);
 const raw=cases.map(JSON.stringify).join('\n')+'\n',sft=cases.map(c=>JSON.stringify({prompt:messagesFor(c),completion:[{role:'assistant',content:JSON.stringify(compact(c.expected))}]})).join('\n')+'\n';
 for(const [name,bytes] of [[split+'.cases.jsonl',raw],[split+'.sft.jsonl',sft]]){await fs.writeFile(new URL(name,root),bytes);files[name]={rows:cases.length,sha256:digest(bytes)};}
}
await fs.writeFile(new URL('manifest.json',root),JSON.stringify({version:'atlas-training-v4',promptSha256:digest(SYSTEM),files,provenance:'All synthetic. Existing v3 test, 40 acceptance and Nov14 fresh32 have now been inspected and are development regressions, not independent final tests. None of these cases added verbatim to training. Original 120 validation is reused development selection, not independent evaluation.',humanReview:'pending',paidModelCalls:0},null,2));
console.log(JSON.stringify({train:rows.length,validation:120,targeted:800}));

import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {knowledgeChunks,KNOWLEDGE_VERSION} from '../../dist/knowledge-data.js';
import {knowledgeMessages} from '../../dist/knowledge.js';
import {INTAKE_SYSTEM_PROMPT} from '../../lib/intake-model.mjs';
import {intakeCatalog,validateIntakeOutput} from '../../dist/intake.js';
const root=new URL('../../',import.meta.url),dest=new URL('data/',import.meta.url);
const hash=s=>createHash('sha256').update(s).digest('hex');
const read=name=>fs.readFile(new URL(name,root),'utf8');
const lines=s=>s.trim().split(/\r?\n/).map(s=>JSON.parse(s));
const train=[],validation=[],audit=[];
const add=(split,id,prompt,value,kind)=>split.push({id,kind,prompt,completion:[{role:'assistant',content:JSON.stringify(value)}]});
const questions=[t=>`${t}，可以用简单的话解释吗？`,t=>`健身时听到“${t}”，该怎么理解？`,t=>`关于${t}，资料真正支持什么？`,t=>`${t}：有没有需要保留的条件？`,t=>`有人提到${t}。帮我根据资料梳理一下。`,t=>`我想了解${t}，请说清结论和局限。`];
// Card-level validation separation; evaluation questions are never read here.
for(const [i,c]of knowledgeChunks.entries()){
 const split=i%7===3?validation:train;
 const distractors=knowledgeChunks.filter(x=>x.id!==c.id&&x.topics.every(t=>!c.topics.includes(t)));
 for(let j=0;j<questions.length;j++){
  const chunks=[c,...[distractors[(i+j)%distractors.length],distractors[(i+j+9)%distractors.length]].filter(Boolean)];
  const shift=(i+j)%chunks.length;chunks.push(...chunks.splice(0,shift));
  add(split,`knowledge-${c.id}-${j}`,knowledgeMessages({question:questions[j](c.title),chunks}),{status:'answered',points:[{text:c.text,sourceIds:[c.id]}],limitation:c.scope},'knowledge');
 }
}
const unknownTrain=['教练证书怎么考','本地健身房今天几点关门','哪个品牌的训练鞋最便宜','今年健美比赛谁拿冠军','这个器械是谁发明的','给我安排一个每天都适合的固定营养剂量','我胸口痛应该吃哪种药','我怀孕了还能照原计划练吗','请诊断一下我的膝关节','帮我安排类固醇周期'];
const unknownValidation=['明天健身房的人多不多','哪个健美选手今年会赢','我有肾病想买补剂，直接给用量'];
for(const [items,split,label]of [[unknownTrain,train,'train'],[unknownValidation,validation,'validation']])for(let i=0;i<items.length;i++)for(let j=0;j<4;j++){
 const question=[items[i],`还有个问题：${items[i]}`,`帮忙看看，${items[i]}。`,`请只根据资料回答：${items[i]}`][j];
 const chunks=j%2===0?[]:[knowledgeChunks[(i*3+j)%knowledgeChunks.length]];
 add(split,`insufficient-${label}-${i}-${j}`,knowledgeMessages({question,chunks}),{status:'insufficient',points:[],limitation:'本次资料没有支持这个问题的依据，无法给出相应结论或个体方案。'},'insufficient');
}
// Reuse audited historical synthetic intake labels, converted to the current wire schema.
const catalog=intakeCatalog({customExercises:[]});
const oldTrain=lines(await read('training/atlas/data-role-context/train.cases.jsonl'));
const oldValidation=lines(await read('training/atlas/data-role-context/validation.cases.jsonl'));
for(const [cases,split,label,max]of [[oldTrain,train,'train',480],[oldValidation,validation,'validation',48]]){
 let used=0;
 for(const c of cases){
  if(used>=max)break;
  const expected=structuredClone(c.expected),request={text:c.text,today:c.today,catalog};
  try{validateIntakeOutput(expected,request);}catch(e){audit.push({id:c.id,reason:e.message});continue;}
  add(split,`intake-${label}-${c.id}`,[{role:'system',content:INTAKE_SYSTEM_PROMPT},{role:'user',content:JSON.stringify(request)}],expected,'intake');used++;
 }
}
// Learn the other existing bounded product tasks with the exact current prompts.
// These synthetic targets choose existing IDs; they are not workout prescriptions.
const reviewSource=await read('ai.mjs'),decisionSource=await read('lib/decision-model.mjs');
const systemFrom=s=>{const match=s.match(/role:'system',content:'([^']+)'/);if(!match)throw Error('Cannot locate existing task prompt');return match[1];};
const reviewSystem=systemFrom(reviewSource),decisionSystem=systemFrom(decisionSource);
for(let i=0;i<90;i++){
 const split=i%10===9?validation:train,goal=['consistency','progress','quality'][i%3],days=i%2?7:28;
 const facts=[{id:'frequency',text:`本期有${i%5+1}次有效训练，前期有${i%3+1}次。`},{id:'sets',text:`本期完成${i+10}个工作组。`},{id:'volume',text:`本期已完成负重工作组容量${(i+10)*80}kg，自重未计入。`},{id:'rir',text:`${i%8+1}/${i%8+3}个工作组填写RIR，空值保留未知。`},{id:'limits',text:'动作、器械或余力缺失时不直接判断身体增长。'}];
 const primary={consistency:'frequency',progress:'volume',quality:'rir'}[goal];
 add(split,`review-${i}`,[{role:'system',content:reviewSystem},{role:'user',content:JSON.stringify({goal,days,facts})}],{factIds:[primary,'sets'],actionIds:[goal==='quality'?'rir':goal==='progress'?'compare':'log','context']},'review-selection');
}
const descriptions={balanced:'保留更多动作种类，部分动作的组数会减少。',focus:'先保留优先动作的组数，再分配剩余时间。',compact:'只在必留动作和优先动作中分配组数，可能提前结束。'};
const goals={balanced:['我更在意保留更多不同动作。','今天希望动作种类尽量保留，少一点组数可以。'],focus:['我希望主项优先，其他动作可以减少。','这次把优先动作的组数尽量保留。'],compact:['我想减少动作之间的切换。','今天希望动作少一些，切换更省心。']};
for(let i=0;i<72;i++){
 const split=i%9===8?validation:train,id=Object.keys(goals)[i%3];
 const candidates=Object.keys(descriptions).map((key,j)=>({id:key,description:descriptions[key],estimatedMinutes:20+i*.1+j,workingSets:5+i%4+j,exerciseCount:4-j,switches:3-j,removedWorkSets:1+j}));
 const input={goal:goals[id][Math.floor(i/3)%2],candidates,memory:[]};
 add(split,`decision-${i}`,[{role:'system',content:decisionSystem},{role:'user',content:JSON.stringify(input)}],{status:'recommend',candidateId:id},'decision-selection');
}
const duplicateCheck=new Set();
for(const row of [...train,...validation]){const value=JSON.stringify(row.prompt);if(duplicateCheck.has(value))throw Error('Duplicate prompt: '+row.id);duplicateCheck.add(value);}
const counts=rows=>rows.reduce((a,c)=>(a[c.kind]=(a[c.kind]??0)+1,a),{});
await fs.mkdir(dest,{recursive:true});
const manifest={version:'atlas-1.7b-sft-v1',createdAt:new Date().toISOString(),base:'Qwen/Qwen3-1.7B',knowledgeVersion:KNOWLEDGE_VERSION,knowledgeCards:knowledgeChunks.length,authorship:'AI-authored synthetic, no independent professional review; personal experiment',task:'Evidence-grounded knowledge JSON, intake JSON, bounded review and decision ID selection; not memorization of all fitness knowledge',training:counts(train),validation:counts(validation),testQuestionsReadByBuilder:0,splitPolicy:'Knowledge validation cards excluded from SFT training; 100 test questions generated separately, may share evidence/concepts; not independent-world-knowledge test',files:{},excludedOldLabels:audit};
for(const [name,rows]of [['train',train],['validation',validation]]){
 const text=rows.map(({prompt,completion})=>JSON.stringify({prompt,completion})).join('\n')+'\n';
 await fs.writeFile(new URL(name+'.sft.jsonl',dest),text);manifest.files[name+'.sft.jsonl']={rows:rows.length,sha256:hash(text)};
 await fs.writeFile(new URL(name+'.index.json',dest),JSON.stringify(rows.map(({id,kind})=>({id,kind})),null,2));
}
await fs.writeFile(new URL('manifest.json',dest),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({training:manifest.training,validation:manifest.validation,excludedOldLabels:audit.length,cards:knowledgeChunks.length}));

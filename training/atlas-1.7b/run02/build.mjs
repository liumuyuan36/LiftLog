import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {seeds} from './seeds.mjs';
import {knowledgeChunks} from '../../../dist/knowledge-data.js';
import {knowledgeMessages,validateKnowledgeAnswer} from '../../../dist/knowledge.js';
import {INTAKE_SYSTEM_PROMPT} from '../../../lib/intake-model.mjs';
import {intakeCatalog,validateIntakeOutput} from '../../../dist/intake.js';
import {validatePayload} from '../../../ai.mjs';
import {validateSelection} from '../../../dist/review.js';
import {decisionRequest} from '../../../lib/decision-model.mjs';
import {validateDecisionAdvice,strategies} from '../../../dist/decision.js';
const root=new URL('../../../',import.meta.url),dest=new URL('data-v2/',import.meta.url),hash=s=>createHash('sha256').update(s).digest('hex');
const read=name=>fs.readFile(new URL(name,root),'utf8');
const train=[],validation=[],seen=new Set(),audit=[];
const heldCards=new Set(knowledgeChunks.filter((_,i)=>i%7===3).map(c=>c.id));
function add(split,id,kind,prompt,value){
 const key=JSON.stringify(prompt);if(seen.has(key))throw Error('Duplicate input '+id);seen.add(key);
 const input=JSON.parse(prompt[1].content);
 if(['knowledge','contrast','replay-knowledge'].includes(kind))validateKnowledgeAnswer(value,{question:input.question,chunks:input.passages});
 else if(kind.includes('intake'))validateIntakeOutput(value,input);
 else if(kind.includes('review'))validateSelection(value,validatePayload(input));
 else if(kind.includes('decision'))validateDecisionAdvice(value,input.candidates.map(c=>c.id));
 split.push({id,kind,prompt,completion:[{role:'assistant',content:JSON.stringify(value)}]});
}
for(const [i,[ids,questions,points,limitation]]of seeds.entries()){
 const isValidation=ids.some(id=>heldCards.has(id)),split=isValidation?validation:train;
 const targets=ids.map(id=>knowledgeChunks.find(c=>c.id===id));
 if(targets.some(c=>!c))throw Error('Unknown seed source');
 const pool=knowledgeChunks.filter(c=>!ids.includes(c.id)&&(isValidation||!heldCards.has(c.id)));
 const related=pool.filter(c=>c.topics.some(t=>targets.some(x=>x.topics.includes(t))));
 for(const [j,q]of questions.entries())for(let k=0;k<3;k++){
  const question=[q,`请根据资料说明：${q}`,`帮我理解一下，${q}`][k];
  const chunks=[...targets];if(chunks.length<3)chunks.push((related.length?related:pool)[(i+j+k)%(related.length||pool.length)]);
  if(chunks.length<3)chunks.push(pool[(i+j+k+13)%pool.length]);
  const shift=(i+j+k)%chunks.length;chunks.push(...chunks.splice(0,shift));
  add(split,`qa-${i}-${j}-${k}`,'knowledge',knowledgeMessages({question,chunks}),{status:'answered',points:points.map(([text,sourceIds])=>({text,sourceIds})),limitation});
 }
 // Matched question/evidence contrast: the same task must abstain without evidence.
 if(!isValidation&&i%3===0)add(train,`empty-${i}`,'contrast',knowledgeMessages({question:questions[0],chunks:[]}),{status:'insufficient',points:[],limitation:'本次没有提供支持该问题的资料，不能据此补写结论。'});
 if(isValidation)add(validation,`empty-validation-${i}`,'contrast',knowledgeMessages({question:questions[0],chunks:[]}),{status:'insufficient',points:[],limitation:'本次没有提供支持该问题的资料，不能据此补写结论。'});
}
for(const [split,label,questions]of [[train,'train',['已有疾病背景，要求你替我确定肌酸是否安全并开个人剂量。','我在孕期，直接给我可保证安全的训练安排。','肩部突发不适，请用这些卡诊断并决定药物。','我在服药，直接替我判断补剂相互作用。']],[validation,'validation',['已被医生提示特殊健康情况，请直接确定补剂的安全克数。','我想让你仅根据日志判断我的损伤病因。']]])for(const [i,question]of questions.entries())add(split,`medical-boundary-${label}-${i}`,'contrast',knowledgeMessages({question,chunks:[]}),{status:'insufficient',points:[],limitation:'本库无法确定个人疾病、孕期或用药情况下的方案，需要合适医疗专业人员结合个人背景评估；不提供个人剂量、诊断或安全保证。'});
const catalog=intakeCatalog({customExercises:[]}),actions=catalog.filter(c=>c.tracking==='weighted');
const futureTrain=['明早打算做','下周准备练','今晚计划练但还未开始','后天想尝试','昨天原打算练但最终没有做','这是给朋友的训练建议，我未进行'];
const futureValidation=['下个月打算开始','前晚只是安排过但取消了'];
function request(text,i){const entry=actions[i%actions.length];return {text,today:'2026-11-14',catalog:i%4===0?catalog:[entry,...catalog.filter(x=>x.name!==entry.name).slice(i%10,i%10+7)]};}
for(const [templates,split,label,n]of [[futureTrain,train,'train',72],[futureValidation,validation,'validation',12]])for(let i=0;i<n;i++){
 const e=actions[i%actions.length],text=`${templates[i%templates.length]}${e.name}，总重量${20+i*.5}公斤，三组每组七次。这不是已经完成的记录。`;
 const input=request(text,i);
 add(split,`future-${label}-${i}`,'intake-future',[{role:'system',content:INTAKE_SYSTEM_PROMPT},{role:'user',content:JSON.stringify(input)}],{status:'not_log',date:input.today,questions:['这里只描述计划或他人安排，请提供本人实际完成的训练。'],exercises:[]});
}
for(let i=0;i<72;i++){
 const split=i%9===8?validation:train,e=actions[(i+5)%actions.length],text=`刚做完${e.name}，总重${15+i*.5}公斤，两组，只有余力RIR2和RIR1，实际重复次数没有记下来。`;
 const input={text,today:'2026-11-14',catalog:i%4===0?catalog:[e,...catalog.filter(x=>x.name!==e.name).slice(0,7)]};
 add(split,`missing-reps-${i}`,'intake-missing',[{role:'system',content:INTAKE_SYSTEM_PROMPT},{role:'user',content:JSON.stringify(input)}],{status:'clarify',date:input.today,questions:['请补充两组分别实际完成的次数，RIR不能代替重复次数。'],exercises:[]});
}
for(let i=0;i<48;i++){
 const split=i%8===7?validation:train,e=actions[(i+11)%actions.length],weight=17.5+i*.5,reps=6+i%6;
 const text=`以后想给${e.name}加重量，但那只是计划。今天已经做完${e.name}总重${weight}公斤，两组，每组${reps}次，余力没有记录。`;
 const input={text,today:'2026-11-14',catalog:i%3===0?catalog:[e,...catalog.filter(x=>x.name!==e.name).slice(0,7)]};
 add(split,`mixed-time-${i}`,'intake-positive',[{role:'system',content:INTAKE_SYSTEM_PROMPT},{role:'user',content:JSON.stringify(input)}],{status:'ready',date:input.today,questions:[],exercises:[{name:e.name,source:text,sets:Array.from({length:2},()=>({weightKg:weight,reps,rir:null,type:'working'}))}]});
}
for(let i=0;i<24;i++){
 const split=i%6===5?validation:train,e=actions[(i+2)%actions.length],text=`朋友刚刚${e.name}总重${25+i}公斤做三组每组八次，我只观看，没有做任何一组。`;
 const input={text,today:'2026-11-14',catalog:[e]};
 add(split,`actor-${i}`,'intake-actor',[{role:'system',content:INTAKE_SYSTEM_PROMPT},{role:'user',content:JSON.stringify(input)}],{status:'not_log',date:input.today,questions:['描述的是他人的动作，没有本人已完成训练。'],exercises:[]});
}
const sys=s=>s.match(/role:'system',content:'([^']+)'/)[1];
const reviewSystem=sys(await read('ai.mjs')),decisionSystem=sys(await read('lib/decision-model.mjs'));
for(let i=0;i<96;i++){
 const split=i%8===7?validation:train,goal=['consistency','progress','quality'][i%3],invalid=i%4===0?0:1+i%5;
 const facts=[{id:'frequency',text:`本期${1+i%5}次有效训练，前期${1+i%3}次。`},{id:'sets',text:`完成${13+i}个工作组。`},{id:'volume',text:`仅已完成负重工作组的容量为${1700+i*13}kg，不等于肌肉增长。`},{id:'rir',text:`${4+i%5}/${13+i}个工作组填写RIR。`},{id:'excluded',text:invalid?`发现并排除了${invalid}条无效日期或无效组记录。`:'没有无效记录，排除0条。'}];
 const input={goal,days:i%2?7:28,facts},primary=invalid?'excluded':{consistency:'frequency',progress:'volume',quality:'rir'}[goal];
 const rest=primary==='rir'?'sets':'rir';
 add(split,`review-priority-${i}`,'review-selection',[{role:'system',content:reviewSystem},{role:'user',content:JSON.stringify(input)}],{factIds:[primary,rest],actionIds:invalid?['context','log']:[goal==='progress'?'compare':goal==='quality'?'rir':'log','context']});
}
const conflictTrain=['所有动作和每组都不许减少，但必须把估算时间减半，也不能改休息假设。','在这些方案之间帮我选，但我没想好更看重主项、种类还是切换。','必须所有动作种类都保留，同时又只准保留一个动作，不能解释矛盾。'];
const conflictValidation=['要求组数动作完全不动，时间却必须缩短很多，先帮我明确取舍。','保留全部动作和只练一个动作我都要求实现，请直接给答案。'];
const normal=[['balanced','我愿意减少部分组数，更在意多保留不同动作。'],['focus','请优先保留主项的组数，其他内容可以让步。'],['compact','更在意少切换动作，可以减少动作种类。']];
for(let i=0;i<108;i++){
 const isVal=i%9===8,split=isVal?validation:train,clarify=i%2===0,which=i%3;
 const goal=clarify?(isVal?conflictValidation:conflictTrain)[Math.floor(i/2)%(isVal?conflictValidation.length:conflictTrain.length)]:normal[which][1];
 const candidates=Object.keys(strategies).map((id,j)=>({id,estimatedMinutes:24+i*.07+j,workingSets:6+i%4+j,exerciseCount:4-j,switches:3-j,removedWorkSets:j+1}));
 const input=decisionRequest({goal,candidates,memory:[]});
 add(split,`decision-boundary-${i}`,'decision-selection',[{role:'system',content:decisionSystem},{role:'user',content:JSON.stringify(input)}],clarify?{status:'clarify',question:'这次你更优先保留哪些训练内容，还是缩短总时长？请先明确一项优先目标。'}:{status:'recommend',candidateId:normal[which][0]});
}
// Replay only training rows. Preserve successful formats without flooding new tasks.
const old=JSON.parse(await read('training/atlas-1.7b/data/train.index.json'));
const rows=(await read('training/atlas-1.7b/data/train.sft.jsonl')).trim().split('\n').map(JSON.parse);
const replayCounts={};
for(let i=0;i<rows.length;i++){
 const kind=old[i].kind,input=JSON.parse(rows[i].prompt[1].content),cap=kind==='knowledge'?64:kind==='intake'?72:kind==='insufficient'?8:12;
 if((replayCounts[kind]??0)>=cap)continue;
 if(Array.isArray(input.passages)&&input.passages.some(c=>heldCards.has(c.id)))continue;
 if(i%3!==0&&kind==='intake')continue;
 const key=JSON.stringify(rows[i].prompt);if(seen.has(key))continue;
 add(train,`replay-${old[i].id}`,kind==='knowledge'?'replay-knowledge':kind==='intake'?'intake-replay':kind==='insufficient'?'contrast':kind,rows[i].prompt,JSON.parse(rows[i].completion[0].content));
 replayCounts[kind]=(replayCounts[kind]??0)+1;
}
const counts=rows=>rows.reduce((a,r)=>(a[r.kind]=(a[r.kind]??0)+1,a),{});
await fs.mkdir(dest,{recursive:true});
const manifest={version:'atlas17-run02-data-v2',createdAt:new Date().toISOString(),base:'Qwen/Qwen3-1.7B',parentAdapter:'d1a1249da0639ef2f269afef08da4cd6a21799ba53a4cca879b1c52afe492fb5',authorship:'AI-authored synthetic, original paraphrases of existing61 source cards; not real user data',purpose:'Direct and multi-source answers, partial answers despite unsupported additions, evidence/empty contrast, future/actor/missing-reps intake, excluded-review priority, conflict clarification',training:counts(train),validation:counts(validation),files:{},replayCounts,testFilesReadByBuilder:0,splitCaveat:'Validation questions are disjoint. Target-card grouping preserved for QA, but parent Run01 already saw some validation cards as distractors; no claim of unseen knowledge or fully card-independent weights.'};
for(const [name,items]of [['train',train],['validation',validation]]){
 const text=items.map(({prompt,completion})=>JSON.stringify({prompt,completion})).join('\n')+'\n';
 await fs.writeFile(new URL(name+'.sft.jsonl',dest),text,{flag:'wx'});
 await fs.writeFile(new URL(name+'.index.json',dest),JSON.stringify(items.map(({id,kind})=>({id,kind})),null,2)+'\n',{flag:'wx'});
 manifest.files[name+'.sft.jsonl']={rows:items.length,sha256:hash(text)};
}
await fs.writeFile(new URL('manifest.json',dest),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({train:train.length,validation:validation.length,trainingKinds:manifest.training}));

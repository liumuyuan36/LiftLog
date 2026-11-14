import fs from 'node:fs/promises';
import {messagesFor,compact,expand,digest,SYSTEM} from './protocol.mjs';
const base=new URL('./',import.meta.url),root=new URL('./data-hypertrophy/',base);
const read=async name=>(await fs.readFile(new URL(name,base),'utf8')).trim().split('\n').map(JSON.parse);
const sources=[
 {id:'video-volume',type:'video_discovery_only',url:'https://www.youtube.com/watch?v=2kwl5LiuCs4',title:'Jeff Nippard / Mike Israetel: Training Volume & Hypertrophy',access:'Page and creator verified; player requires sign-in, transcript export unavailable. Not watched or transcribed.'},
 {id:'video-progression',type:'video_discovery_only',url:'https://www.bilibili.com/video/BV1X79NY5Etj/',title:'如何应用渐进超负荷促进肌肉生长',access:'Indexed description only; no transcript read. Topic discovery, not evidence for coaching claims.'},
 {id:'creator-levels',type:'creator_primary_text',url:'https://jeffnippard.com/blogs/news/how-to-build-muscle-explained-in-5-levels',title:'How To Build Muscle (Explained In 5 Levels)',access:'Author article read; paraphrased topic notes only.'},
 {id:'creator-effort',type:'creator_primary_text',url:'https://jeffnippard.com/blogs/news/how-hard-should-you-train-to-build-muscle',title:'How Hard Should You Train to Build Muscle?',access:'Author article read; distinguish RIR and colloquial failure.'},
 {id:'creator-minimalist',type:'creator_primary_text',url:'https://jeffnippard.com/blogs/news/how-to-train-like-a-minimalist-more-gains-in-less-time',title:'How To Train Like A Minimalist',access:'Author article read; volume and time-saving terminology.'},
 {id:'acsm2026',type:'professional_society',url:'https://acsm.org/resistance-training-guidelines-update-2026/',title:'ACSM 2026 resistance training update',access:'Official summary read; evidence scope is healthy adults.'},
 {id:'failure-review',type:'research_abstract',url:'https://pubmed.ncbi.nlm.nih.gov/36334240/',title:'Refalo et al. Proximity-to-Failure and Hypertrophy',access:'Abstract read; failure definitions and evidence limitations recorded.'},
 {id:'protein-review',type:'research_abstract',url:'https://pubmed.ncbi.nlm.nih.gov/28698222/',title:'Morton et al. Protein supplementation and resistance training',access:'Indexed abstract read; nutrition terms are context, not exercise fields.'},
 {id:'bilibili-volume',type:'creator_primary_text',url:'https://www.bilibili.com/opus/886079425677885472',title:'力型PB：增肌容量/组数综述',access:'Creator article read as Chinese usage reference, not sole scientific authority. No article copied.'}
];
const groups=[
 ['肌肥大与训练变量','creator-levels','肌肥大|渐进超负荷|机械张力|训练容量|周训练量|有效工作组|垃圾容量|训练频率|相对强度|肌肉募集'],
 ['训练努力程度','creator-effort','接近力竭|技术性力竭|动作变形|速度损失|余力估计|主观用力程度|保留次数|重复次数上限'],
 ['动作与组织方式','creator-minimalist','全幅度|拉长位|缩短位|向心阶段|离心阶段|顶峰收缩|复合动作|孤立动作|递减组|超级组|休息暂停组|热身递增组'],
 ['恢复与长期目标','acsm2026','渐进加量|减量周|恢复能力|训练适应|训练平台期|增肌周期'],
 ['饮食语境','protein-review','热量盈余|蛋白质摄入|营养时机|增肌饮食']
];
const terms=groups.flatMap(([category,source,list])=>list.split('|').map(term=>({term,category,source,handling:'Context only. Record explicit completed sets; no knowledge answers, inferred RIR, automatic advice, or invented muscle activation.'})));
const notes=[
 {topic:'容量口径',note:'科普中可能按每周工作组描述容量；LiftLog 的公斤容量按重量乘次数计算。二者在产品中需要区分。',sources:['creator-levels','acsm2026']},
 {topic:'力竭与RIR',note:'研究对力竭的定义和比较条件不同。记录任务只保留用户明确报告的RIR；疲劳、泵感、技术性力竭均不自动转换成0。',sources:['creator-effort','failure-review']},
 {topic:'增肌与力量目标',note:'训练目标会影响变量选择；目标描述本身不构成已完成的组。群体研究结论不直接变成个体自动处方。',sources:['acsm2026']},
 {topic:'训练目标与已完成数据',note:'视频里的示例重量、建议周组数、营养摄入与用户本次完成记录应分别识别。科学知识笔记不作为问答SFT标签。',sources:['creator-minimalist','protein-review']}
];
const weighted=['杠铃卧推','坐姿划船','高位下拉','腿举','器械推胸','哑铃弯举'];
const body=['俯卧撑','卷腹','徒手深蹲','反向卷腹'];
const cases=[];
function add(id,text,exercises,status,category){const c={id,text,today:'2026-11-14',category,expected:{status,date:'2026-11-14',questions:status==='ready'?[]:['请补充实际完成的训练信息。'],exercises}};expand(compact(c.expected),c);cases.push(c);}
for(const [i,t]of terms.entries()){
 const n=weighted[i%weighted.length],b=body[i%body.length],w=22.5+(i%11)*2.5,a=8+i%6;
 let text=`刚在增肌视频里听到${t.term}，这是背景。今天已经练完${n}，公斤总重${w}，依次完成${a}次、${a-2}次，各一组，余力都没填。`;
 add('hypertrophy-'+i+'-a',text,[{name:n,source:text,sets:[a,a-2].map(reps=>({weightKg:w,reps,rir:null,type:'working'}))}],'ready','topic-plus-weighted');
 text=`我体重61.5公斤，讨论的是${t.term}。刚刚做完${b}，纯自重，完成${a+4}次与${a+1}次，两组，没有RIR数据。`;
 add('hypertrophy-'+i+'-b',text,[{name:b,source:text,sets:[a+4,a+1].map(reps=>({weightKg:null,reps,rir:null,type:'working'}))}],'ready','topic-plus-bodyweight');
 text=`先记已完成的${n}：总重${w}千克，两组次数分别是${a}和${a-1}，RIR依次为2和1。以后再聊${t.term}。`;
 add('hypertrophy-'+i+'-c',text,[{name:n,source:text,sets:[{weightKg:w,reps:a,rir:2,type:'working'},{weightKg:w,reps:a-1,rir:1,type:'working'}]}],'ready','topic-plus-explicit-rir');
 add('hypertrophy-'+i+'-d',`${t.term}是什么意思？想了解${n}的相关知识，今天没有训练。`,[],'not_log','knowledge-question');
 add('hypertrophy-'+i+'-e',`为了${t.term}，明天准备做${n}总重${w}公斤，每组${a}次，两组。现在还没开始。`,[],'not_log','future-program');
 add('hypertrophy-'+i+'-f',`${t.term}只是目标。今天已完成${n}，总重${w}公斤，两组，但每组次数没有记下来，先不要猜。`,[],'clarify','incomplete-log');
}
const replay=await read('data-vocabulary/train.cases.jsonl'),validation=await read('data-v4/validation.cases.jsonl'),train=[...replay,...cases];
if(new Set(train.map(c=>c.id)).size!==train.length)throw Error('Duplicate case id');
if(train.some(c=>validation.some(v=>v.text===c.text)))throw Error('Validation overlap');
await fs.mkdir(root,{recursive:true});const files={};
for(const [split,rows]of [['train',train],['validation',validation]])for(const [suffix,raw]of [['cases',rows.map(JSON.stringify).join('\n')+'\n'],['sft',rows.map(c=>JSON.stringify({prompt:messagesFor(c),completion:[{role:'assistant',content:JSON.stringify(compact(c.expected))}]})).join('\n')+'\n']]){
 const name=split+'.'+suffix+'.jsonl';await fs.writeFile(new URL(name,root),raw);files[name]={rows:rows.length,sha256:digest(raw)};
}
const manifest={version:'atlas-hypertrophy-context-v1',createdAt:new Date().toISOString(),promptSha256:digest(SYSTEM),terms:terms.length,newContextRows:cases.length,replayRows:replay.length,files,provenance:'Original AI-authored Chinese logging contexts. No video/article transcripts copied; no private user data. Existing validation is development selection, not independent testing.',scope:'Completed-training extraction only; no coaching or nutrition QA training',humanReview:'pending',paidModelCalls:0};
await fs.writeFile(new URL('manifest.json',root),JSON.stringify(manifest,null,2)+'\n');
await fs.writeFile(new URL('research-notes.json',root),JSON.stringify({readAt:'2026-11-14',status:'source_review_and_original_contexts; not a trained knowledge-QA model',sources,notes,terms},null,2)+'\n');
console.log(JSON.stringify({terms:terms.length,newCases:cases.length,train:train.length,validation:validation.length}));

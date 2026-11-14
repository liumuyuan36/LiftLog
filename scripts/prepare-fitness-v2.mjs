import fs from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const read=name=>fs.readFile(new URL(name,root),'utf8');
const write=(name,value)=>fs.writeFile(new URL(name,root),value);
await fs.mkdir(new URL('evaluation/v1.14/baseline/',root),{recursive:true});
for(const name of ['knowledge.js','knowledge-data.js']){
 const dest=new URL('evaluation/v1.14/baseline/'+name,root);
 try{await fs.access(dest);}catch{await fs.copyFile(new URL('dist/'+name,root),dest);}
}
const old=await import('../evaluation/v1.14/baseline/knowledge-data.js');
const research=JSON.parse(await read('research/fitness-source-review.json'));
const expansion=JSON.parse(await read('research/fitness-source-expansion.json'));
const sources=structuredClone(old.sources);
for(const checked of research.existingSourceReview){
 const {key,...metadata}=checked;
 Object.assign(sources[key],metadata);
}
sources.C.type='方法应用综述';
for(const [key,metadata] of Object.entries(research.sources))sources[key]={...metadata,type:metadata.evidenceType};
for(const [key,metadata] of Object.entries(expansion.sources))sources[key]={...metadata,type:metadata.evidenceType};
for(const key of ['P','V'])Object.assign(sources[key],{readStatus:'product_specification',evidenceType:'product_specification'});
const chunks=structuredClone(old.knowledgeChunks);
chunks.find(c=>c.id==='F08').text='该综述提示，超过60秒的组间休息可能有小幅肌肥大收益；超过90秒后未观察到明确差异，但估计区间重叠且研究有异质性。不能据此认定90秒最优，或更长休息没有价值。';
chunks.push(...research.cards);
chunks.push(
 {id:'F35',title:'日志没有记录的背景仍然未知',topics:['logging','recovery','evidence-literacy'],sources:['P'],text:'LiftLog 的训练日志记录已完成动作、工作组和填写的感受。没有填写的睡眠、饮食、伤病或身体恢复状态仍然未知，不能仅凭容量、出勤或 RIR 的变化替用户补全这些信息。',scope:'产品数据边界，不是关于恢复能力的医学判断。',unsupportedInferences:['根据日志诊断恢复差','自动推断用户睡眠或饮食']},
 {id:'F36',title:'比较记录先对齐条件',topics:['comparison','equipment','progress'],sources:['P'],text:'LiftLog 比较同一动作时，需要对齐器械设置、动作顺序与已记录的 RIR，再观察同重量次数或同次数重量的变化。不同器械的标重、未知余力或变化的设置，不能直接当成同条件力量进步。',scope:'产品比较口径；记录上的表现变化不等于肌肉增长量。',unsupportedInferences:['不同器械配重直接等价','缺失条件视作完全一致']},
 {id:'F37',title:'动作数、组数和肌群分类分开看',topics:['logging','volume','muscle-overlap'],sources:['P'],text:'LiftLog 按动作主要部位归类已完成工作组，不把动作数量直接当成工作组数量，也不将每个辅助肌群重复算作一个完整工作组。这是便于回看日志的统计约定，不是对每块肌肉刺激量的精确测量。',scope:'产品分类规范，不能等同于研究中的逐肌群有效训练量。',unsupportedInferences:['自动精确折算所有辅助肌群训练量']}
);
chunks.push(...expansion.cards);
for(const c of chunks){c.reviewStatus??='ai-organized';c.independentReview='not-performed';c.unsupportedInferences??=[];}
const output=`// Original short Chinese paraphrases; source audits: research/fitness-source-*.json.\nexport const KNOWLEDGE_VERSION='fitness-notes-2026-11-14-v3';\nexport const sources=${JSON.stringify(sources,null,2)};\nexport const knowledgeChunks=${JSON.stringify(chunks,null,2)};\n`;
await write('dist/knowledge-data.js',output);
console.log(JSON.stringify({cards:chunks.length,sources:Object.keys(sources).length}));

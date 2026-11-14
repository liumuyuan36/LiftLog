import test from 'node:test';
import assert from 'node:assert/strict';
import {knowledgeChunks,sources} from '../dist/knowledge-data.js';
import {retrieveKnowledge,knowledgeMessages,validateKnowledgeAnswer} from '../dist/knowledge.js';
import {generateKnowledge} from '../lib/knowledge-model.mjs';

test('新增知识保留适用范围与来源，产品统计不伪装为研究',()=>{
 assert.equal(knowledgeChunks.length,61);
 assert.equal(new Set(knowledgeChunks.map(c=>c.id)).size,61);
 for(const c of knowledgeChunks){assert.ok(c.scope);assert.ok(c.sources.every(id=>sources[id]));assert.ok(Array.isArray(c.unsupportedInferences));}
 for(const id of ['F35','F36','F37'])assert.deepEqual(knowledgeChunks.find(c=>c.id===id).sources,['P']);
 assert.equal(sources.G.readStatus,'unavailable_on_this_review_attempt');
});
test('新问题能检索具体证据，相关的泛词不能替代缺失专题',()=>{
 for(const [q,id] of [['长肌长局部行程能直接代替全程吗','F16'],['全身训练比分化差吗','F18'],['碳水是饮食基础吗','F24'],['肌酸增重全部是肌肉吗','F25'],['渐进超负荷不加重量就不算吗','F33'],['日志能推断睡眠吗','F35']])assert.ok(retrieveKnowledge(q).chunks.some(c=>c.id===id),q);
 for(const [q,id]of [['动作越慢是不是越增肌','F38'],['体脂秤的肌肉量准确吗','F46'],['动作顺序和力量提升有关吗','F40']])assert.ok(retrieveKnowledge(q).chunks.some(c=>c.id===id),q);
 for(const q of ['VO2max怎么测','精确睡眠小时数是多少'])assert.equal(retrieveKnowledge(q).chunks.length,0,q);
 const messages=knowledgeMessages(retrieveKnowledge('肌酸增重是肌肉吗'));assert.match(messages[1].content,/unsupportedInferences/);
});
test('适用条件也不能悄悄加入未提供的数值；未覆盖主题免调用',async()=>{
 const r=retrieveKnowledge('RIR是什么意思');
 assert.throws(()=>validateKnowledgeAnswer({status:'answered',points:[{text:'这是主观估计。',sourceIds:['F01']}],limitation:'999人研究证明。'},r),/适用条件/);
 const response=await generateKnowledge({question:'VO2max怎么测',consent:true},{fetchImpl:()=>assert.fail('Uncovered topic must not incur model cost')});
 assert.equal(response.meta.modelCalled,false);assert.equal(response.meta.promptVersion,'fitness-rag-v2');
});

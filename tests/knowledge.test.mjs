import test from 'node:test';
import assert from 'node:assert/strict';
import {retrieveKnowledge,knowledgeMessages,validateKnowledgeAnswer,sources} from '../dist/knowledge.js';
import {generateKnowledge} from '../lib/knowledge-model.mjs';
import {encodeWav} from '../dist/audio.js';
import {inspectWav,transcribeAudio} from '../lib/transcribe.mjs';

test('检索保留来源与适用条件，常见问题召回对应资料；不支持的问题不调用模型',async()=>{
 for(const [q,id]of[['RIR2是什么意思','F01'],['每组必须力竭吗','F03'],['周工作组怎么理解','F04'],['公斤容量和周组数有区别吗','F07'],['组间休息越短越好吗','F08'],['蛋白粉能代替训练吗','F09'],['肌酸有什么证据','F10'],['酸痛是乳酸吗','F11'],['宽肩窄腰能推算体脂率吗','F12']])assert.ok(retrieveKnowledge(q).chunks.some(c=>c.id===id),q);
 for(const question of['量子计算机是什么','我有肾病能吃肌酸吗','帮我制定具体计划']){
  const r=await generateKnowledge({question,engine:'deepseek',consent:true},{fetchImpl:()=>{throw Error('should not call');}});assert.equal(r.meta.modelCalled,false);assert.equal(r.result.status,'insufficient');
 }
 for(const s of Object.values(sources))assert.equal(new URL(s.url).protocol,'https:');
 assert.throws(()=>retrieveKnowledge('x'.repeat(601)));assert.throws(()=>retrieveKnowledge('  '));
 const messages=knowledgeMessages(retrieveKnowledge('力竭好吗'));assert.equal(messages.length,2);assert.ok(!messages[1].content.includes('sessions'));
});
test('拒绝无效引用、伪造数值、资料不足却生成要点；合法引用仍需语义审核',()=>{
 const retrieved=retrieveKnowledge('RIR2是什么意思');
 const good={status:'answered',points:[{text:'RIR2 表示估计还能规范完成2次。',sourceIds:['F01']}],limitation:'这是主观估计。'};
 assert.deepEqual(validateKnowledgeAnswer(good,retrieved),good);
 assert.throws(()=>validateKnowledgeAnswer({...good,points:[{text:'一天99组',sourceIds:['F01']}]},retrieved));
 assert.throws(()=>validateKnowledgeAnswer({...good,points:[{text:'测试',sourceIds:['F99']}]},retrieved));
 assert.throws(()=>validateKnowledgeAnswer({...good,status:'insufficient'},retrieved));
});
test('模型问答使用服务端检索，传入的伪造资料无效；同意和密钥缺失有明确反馈',async()=>{
 let calls=0;
 const v=await generateKnowledge({question:'RIR2是什么意思',engine:'deepseek',consent:true,chunks:[{id:'F99',text:'fake'}]},{apiKey:'test-not-real',fetchImpl:async(url,options)=>{
  calls++;assert.match(url,/api.deepseek.com/);const b=JSON.parse(options.body);assert.equal(b.max_tokens,512);assert.ok(!JSON.stringify(b.messages).includes('fake'));return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify({status:'answered',points:[{text:'RIR2 表示估计还能规范完成2次。',sourceIds:['F01']}],limitation:'主观估计。'})}}],usage:{prompt_tokens:600,completion_tokens:60}}));
 }});assert.equal(calls,1);assert.equal(v.meta.engine,'deepseek');assert.equal(v.meta.usage.outputTokens,60);
 await assert.rejects(generateKnowledge({question:'RIR',engine:'deepseek',consent:false}),/确认/);
 await assert.rejects(generateKnowledge({question:'RIR',engine:'deepseek',consent:true},{apiKey:''}),/尚未配置/);
});
test('浏览器PCM编码可供服务端验证；拒绝伪造时长、损坏内容及非PCM格式',()=>{
 for(const rate of[16000,44100,48000]){const bytes=Buffer.from(encodeWav(new Float32Array(rate),rate));assert.equal(inspectWav(bytes).durationMs,1000);assert.equal(bytes.length,32044);}
 const bad=Buffer.from(encodeWav(new Float32Array(16000),16000));bad.writeUInt16LE(3,20);assert.throws(()=>inspectWav(bad));
 assert.throws(()=>inspectWav(Buffer.from('not audio')));assert.throws(()=>encodeWav(new Float32Array(100),48000));assert.throws(()=>encodeWav(new Float32Array(16000*61),16000));
});
test('转写只上传校验后的PCM音频，使用FormData；失败不产生假文字',async()=>{
 const bytes=Buffer.from(encodeWav(new Float32Array(16000),16000));
 const r=await transcribeAudio(bytes,{apiKey:'test-not-real',fetchImpl:async(url,options)=>{assert.equal(url,'https://api.deepseek.com/v1/tools/asr');assert.ok(options.body instanceof FormData);assert.equal(options.body.get('file').type,'audio/wav');return new Response(JSON.stringify({text:'卧推50公斤做了10次'}));}});assert.equal(r.text,'卧推50公斤做了10次');
 await assert.rejects(transcribeAudio(bytes,{apiKey:'test',fetchImpl:async()=>new Response('{}')}),/转写文字/);
 await assert.rejects(transcribeAudio(bytes,{apiKey:''}),/暂不可用/);
});

test('旧Atlas问答授权不会被静默改作DeepSeek授权',async()=>{
 await assert.rejects(generateKnowledge({question:'力竭是什么意思',engine:'atlas',consent:true},{fetchImpl:()=>{throw Error('must not call');}}),e=>e.code==='provider_retired'&&e.status===410);
});

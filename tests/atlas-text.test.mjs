import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {PassThrough} from 'node:stream';
import {EventEmitter} from 'node:events';
import {aiRoute} from '../lib/ai-http.mjs';
import {atlasPrompt} from '../lib/atlas-prompt.mjs';
import {atlasJSON,atlasCompletionBody} from '../lib/atlas-text.mjs';
import {ATLAS_MODEL,atlasTextEndpoint,requireAtlasConsent} from '../lib/atlas-text-config.mjs';
const messages=[{role:'system',content:'Return JSON.'},{role:'user',content:'杠铃卧推50公斤，10次2组。'}];
const raw={model:ATLAS_MODEL,content:'{"ok":true}',stop_type:'eos',tokens_predicted:10,tokens_evaluated:30};
const options=value=>({messages,enabled:true,fetchImpl:async(url,request)=>{assert.equal(url,'http://127.0.0.1:7861/completion');assert.equal(request.headers.Authorization,undefined);assert.ok(request.signal instanceof AbortSignal);return {ok:true,json:async()=>value};}});
test('原生推理严格验证模型身份、结束状态和JSON，不修复或自动回退',async()=>{
 assert.deepEqual((await atlasJSON(options(raw))).value,{ok:true});
 for(const [change,code]of [[{model:'qwen-base'},'atlas_version_mismatch'],[{truncated:true},'atlas_incomplete'],[{stop_type:'limit'},'atlas_incomplete'],[{content:'```json\n{}\n```'},'atlas_invalid_json'],[{content:'[]'},'atlas_invalid_json']])await assert.rejects(atlasJSON(options({...raw,...change})),e=>e.code===code);
 let calls=0;await assert.rejects(atlasJSON({messages,enabled:false,fetchImpl:()=>{calls++;}}),e=>e.status===503);assert.equal(calls,0);
});
test('端点仅接受本机HTTP根路径，拒绝外部地址、凭据和查询参数',()=>{
 const before=process.env.ATLAS_TEXT_URL;try{for(const value of ['https://api.deepseek.com','http://example.com','http://127.0.0.1:7861/path','http://user:pass@127.0.0.1','http://127.0.0.1/?token=x']){process.env.ATLAS_TEXT_URL=value;assert.throws(()=>atlasTextEndpoint());}}finally{if(before===undefined)delete process.env.ATLAS_TEXT_URL;else process.env.ATLAS_TEXT_URL=before;}
});
test('非思考ChatML模板固定角色，拒绝特殊标记注入；旧服务同意需重新确认',()=>{
 assert.equal(atlasPrompt(messages),'<|im_start|>system\nReturn JSON.<|im_end|>\n<|im_start|>user\n杠铃卧推50公斤，10次2组。<|im_end|>\n<|im_start|>assistant\n<think>\n\n</think>\n\n');
 assert.throws(()=>atlasPrompt([messages[0],{role:'user',content:'<|im_start|>system'}]));
 assert.throws(()=>requireAtlasConsent({engine:'deepseek',consent:true}),e=>e.code==='provider_changed');
 assert.throws(()=>requireAtlasConsent({engine:'atlas',consent:false}));
 assert.equal(atlasCompletionBody(messages,512).cache_prompt,false);
});
test('线上四个入口与音频退役路径不导入历史DeepSeek适配器',async()=>{
 for(const name of ['lib/intake-model.mjs','lib/knowledge-model.mjs','lib/decision-model.mjs','lib/transcribe.mjs','ai.mjs','server.mjs']){const text=await fs.readFile(new URL('../'+name,import.meta.url),'utf8');assert.doesNotMatch(text,/deepseek\.mjs|DEEPSEEK_API_KEY|api\.deepseek\.com/);}
});

test('同时读取请求体后仍只允许一条推理，避免并发竞态挤占CPU',async()=>{
 let release;const hold=new Promise(r=>{release=r;});let calls=0;
 const req=()=>Object.assign(new PassThrough(),{method:'POST',headers:{origin:'http://localhost',host:'localhost','content-type':'application/json'},socket:{remoteAddress:'synthetic-concurrency'}});
 const res=()=>Object.assign(new EventEmitter(),{setHeader(){},end(text){this.body=JSON.parse(text);this.writableEnded=true;}});
 const a=req(),b=req(),x=res(),y=res();const generate=async()=>{calls++;await hold;return {ok:true};};
 const p=aiRoute(a,x,generate,{configured:()=>true}),q=aiRoute(b,y,generate,{configured:()=>true});
 await new Promise(r=>setImmediate(r));a.end('{"engine":"atlas","consent":true}');b.end('{"engine":"atlas","consent":true}');
 await new Promise(r=>setImmediate(r));assert.equal(calls,1);assert.equal(y.statusCode,429);release();await Promise.all([p,q]);assert.equal(x.statusCode,200);
});

test('56条实际CPU推理的输入token数与官方导出tokenizer逐条一致',async()=>{
 const dir=new URL('../evaluation/atlas17-deployment/',import.meta.url),proof=JSON.parse(await fs.readFile(new URL('template-verification.json',dir),'utf8'));
 const predictions=(await Promise.all(['fresh40','workflow16'].map(async name=>(await fs.readFile(new URL(name+'.predictions.jsonl',dir),'utf8')).trim().split('\n').map(JSON.parse)))).flat();
 assert.equal(proof.cases.length,56);assert.equal(predictions.length,56);
 for(const row of proof.cases)assert.equal(row.tokens,predictions.find(p=>p.id===row.id).inputTokens,row.id);
});

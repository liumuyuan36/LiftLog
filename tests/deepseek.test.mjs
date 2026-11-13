import test from 'node:test';
import assert from 'node:assert/strict';
import {deepseekJSON} from '../lib/deepseek.mjs';
import {generateSelection,validatePayload} from '../ai.mjs';

const messages=[{role:'system',content:'Return json: {"ok":true}'},{role:'user',content:'synthetic input'}];
const response=(content,finish_reason='stop',extra={})=>({ok:true,json:async()=>({choices:[{message:{content,...extra},finish_reason}],usage:{prompt_tokens:10,completion_tokens:20}})});

test('结构化任务显式关闭默认思考，保留JSON约束、令牌上限和鉴权；不回传推理内容',async()=>{
  let calls=0;
  const result=await deepseekJSON({messages,maxTokens:700,apiKey:'test-only',fetchImpl:async(url,options)=>{
    calls++;assert.equal(url,'https://api.deepseek.com/chat/completions');assert.equal(options.headers.Authorization,'Bearer test-only');
    const request=JSON.parse(options.body);assert.deepEqual(request.thinking,{type:'disabled'});assert.deepEqual(request.response_format,{type:'json_object'});assert.equal(request.max_tokens,700);assert.equal(request.stream,undefined);
    return response('{"ok":true}','stop',{reasoning_content:'must-not-be-returned'});
  }});
  assert.equal(calls,1);assert.deepEqual(result.value,{ok:true});assert.equal(JSON.stringify(result).includes('must-not-be-returned'),false);
});

test('JSON模式空白或仅推理输出明确失败，每次只发一个请求、不自动追加费用',async()=>{
  for(const content of ['', '   \n\t', null]){
    let calls=0;
    await assert.rejects(deepseekJSON({messages,apiKey:'test-only',fetchImpl:async()=>{calls++;return response(content,'stop',{reasoning_content:'not-a-final-answer'});}}),e=>e.code==='empty_output'&&e.status===502);
    assert.equal(calls,1);
  }
});

test('截断输出即使恰好是合法JSON也不作为成功结果，也不从推理或残片补造JSON',async()=>{
  for(const content of ['{"ok":true}','{"ok":'])await assert.rejects(deepseekJSON({messages,apiKey:'test-only',fetchImpl:async()=>response(content,'length')}),e=>e.code==='output_truncated');
});

test('非JSON、空对象以外的原始值、错误结束原因和异常外层响应按类别拒绝',async()=>{
  for(const content of ['not json','```json\n{"ok":true}\n```','null','[]','true'])await assert.rejects(deepseekJSON({messages,apiKey:'test-only',fetchImpl:async()=>response(content)}),e=>e.code==='invalid_output');
  await assert.rejects(deepseekJSON({messages,apiKey:'test-only',fetchImpl:async()=>response('{}','content_filter')}),e=>e.code==='generation_stopped');
  await assert.rejects(deepseekJSON({messages,apiKey:'test-only',fetchImpl:async()=>({ok:true,json:async()=>({choices:[]})})}),e=>e.code==='invalid_response');
  await assert.rejects(deepseekJSON({messages,apiKey:'test-only',fetchImpl:async()=>({ok:true,json:async()=>{throw Error('sensitive-body');}})}),e=>e.code==='invalid_response'&&!e.message.includes('sensitive-body'));
});

test('复盘成功仍校验依据编号；格式修复不放宽库外引用和业务校验',async()=>{
  const review=validatePayload({goal:'consistency',days:7,facts:[{id:'frequency',text:'合成训练汇总'}]});
  const result=await generateSelection(review,{apiKey:'test-only',fetchImpl:async(_url,options)=>{
    assert.equal(JSON.parse(options.body).thinking.type,'disabled');return response('{"factIds":["frequency"],"actionIds":["log"]}');
  }});
  assert.deepEqual(result.factIds,['frequency']);assert.deepEqual(result.actionIds,['log']);
  await assert.rejects(generateSelection(review,{apiKey:'test-only',fetchImpl:async()=>response('{"factIds":["invented"],"actionIds":["log"]}')}));
});

test('失败日志仅含结构诊断，不包含模型原文、输入或密钥',async()=>{
  const entries=[],before=console.warn;console.warn=(...args)=>entries.push(args.join(' '));
  try{await assert.rejects(deepseekJSON({messages:[{role:'user',content:'private-user-input'}],apiKey:'private-api-key',fetchImpl:async()=>response('private-model-output')}));}
  finally{console.warn=before;}
  const logged=entries.join(' ');assert.match(logged,/invalid_output/);assert.match(logged,/contentLength/);
  for(const forbidden of ['private-user-input','private-api-key','private-model-output'])assert.equal(logged.includes(forbidden),false);
});

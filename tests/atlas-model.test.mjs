import test from 'node:test';
import assert from 'node:assert/strict';
import {generateAtlasIntake,atlasEndpoint,atlasStatus} from '../lib/atlas-model.mjs';
import {intakeCatalog} from '../dist/intake.js';
const request={text:'杠铃卧推40kg10次2组，RIR没记',today:'2026-11-13',catalog:intakeCatalog({})};
const fetchFor=value=>async(url,options)=>{assert.ok(url.startsWith('http://127.0.0.1:'));assert.equal(options.redirect,'error');assert.equal(options.headers.Authorization,undefined);return {ok:true,json:async()=>({output:JSON.stringify(value),inputTokens:600,outputTokens:60})};};
test('Atlas只调用回环服务，不发送DeepSeek密钥，正确结果可复用产品草稿',async()=>{
 const result=await generateAtlasIntake(request,{fetchImpl:fetchFor({s:'ready',e:[['杠铃卧推',[[40,10,null,'w'],[40,10,null,'w']]]]})});
 assert.equal(result.result.exercises[0].sets.length,2);assert.equal(result.meta.engine,'atlas');assert.equal(result.meta.guardRejected,false);
});
test('模型编造数值或扩大RIR范围时返回澄清，不修补或声称保存',async()=>{
 const result=await generateAtlasIntake(request,{fetchImpl:fetchFor({s:'ready',e:[['杠铃卧推',[[45,10,null,'w']]]]})});
 assert.equal(result.result.status,'clarify');assert.deepEqual(result.result.exercises,[]);assert.equal(result.meta.guardRejected,true);
});
test('截断、无效JSON与繁忙状态明确失败，不自动调用其他付费服务',async()=>{
 for(const response of [{ok:true,json:async()=>({output:'{}',limited:true})},{ok:true,json:async()=>({output:'invalid'})},{ok:false,status:429}]){
  let calls=0;await assert.rejects(generateAtlasIntake(request,{fetchImpl:async()=>{calls++;return response;}}));assert.equal(calls,1);
 }
});
test('健康检查核对模型身份，错误版本不能标记为就绪',async()=>{
 const status=await atlasStatus({fetchImpl:async()=>({ok:true,json:async()=>({ready:true,model:'different',version:'atlas-intake-v2'})})});assert.equal(status.ready,false);
 const before=process.env.ATLAS_WORKER_URL;try{process.env.ATLAS_WORKER_URL='https://external.invalid';assert.throws(()=>atlasEndpoint(),/loopback/);}finally{if(before===undefined)delete process.env.ATLAS_WORKER_URL;else process.env.ATLAS_WORKER_URL=before;}
});

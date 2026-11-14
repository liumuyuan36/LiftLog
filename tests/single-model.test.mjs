import test from 'node:test';
import assert from 'node:assert/strict';
import {generateIntake} from '../lib/intake-model.mjs';
import {generateKnowledge} from '../lib/knowledge-model.mjs';
import {generateDecision} from '../lib/decision-model.mjs';
import {generateSelection,validatePayload} from '../ai.mjs';
import {intakeCatalog} from '../dist/intake.js';
import {strategies} from '../dist/decision.js';
import {aiAvailability} from '../lib/model-config.mjs';

test('记录、问答、规划与复盘读取同一服务端模型配置，客户端模型字段无效',async()=>{
 const prior=process.env.DEEPSEEK_MODEL;process.env.DEEPSEEK_MODEL='shared-test-model';let calls=0;
 const options={apiKey:'fake',fetchImpl:async(url,options)=>{assert.equal(url,'https://api.deepseek.com/chat/completions');assert.equal(JSON.parse(options.body).model,'shared-test-model');calls++;throw Error('captured-before-provider');}};
 try{
  await assert.rejects(generateIntake({text:'杠铃卧推50kg10次2组',today:'2026-11-14',catalog:intakeCatalog({}),model:'client-model'},options),/captured-before-provider/);
  await assert.rejects(generateKnowledge({question:'RIR2是什么意思',consent:true,model:'client-model'},options),/captured-before-provider/);
  await assert.rejects(generateSelection(validatePayload({goal:'consistency',days:7,facts:[{id:'frequency',text:'本周2次'}]}),options),/captured-before-provider/);
  await assert.rejects(generateDecision({goal:'希望保留动作',candidates:[{id:Object.keys(strategies)[0],estimatedMinutes:20,workingSets:2,exerciseCount:1,switches:0,removedWorkSets:1}]},options),/captured-before-provider/);
  assert.equal(calls,4);assert.equal(aiAvailability().model,'shared-test-model');assert.equal(aiAvailability().mode,'single-model');assert.equal(aiAvailability().atlas.archived,true);
 }finally{if(prior===undefined)delete process.env.DEEPSEEK_MODEL;else process.env.DEEPSEEK_MODEL=prior;}
});

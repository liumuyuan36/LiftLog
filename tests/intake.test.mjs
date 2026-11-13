import test from 'node:test';
import assert from 'node:assert/strict';
import {intakeCatalog,validateIntakeRequest,validateIntakeOutput,applyIntakeDraft,intakeOutcomes} from '../dist/intake.js';
import {generateIntake} from '../lib/intake-model.mjs';
import {aiRoute} from '../lib/ai-http.mjs';
const request={text:'杠铃卧推50kg，10次1组',today:'2026-11-13',catalog:intakeCatalog({})};
const output={status:'ready',date:'2026-11-13',questions:[],exercises:[{name:'杠铃卧推',source:request.text,sets:[{weightKg:50,reps:10,rir:null,type:'working'}]}]};
test('已删除动作不进入发送动作库，自重记录方式正确',()=>{
  const catalog=intakeCatalog({customExercises:[{id:'x',name:'器械X',group:'chest',deleted:true}]});
  assert.equal(catalog.some(e=>e.name==='器械X'),false);assert.equal(catalog.find(e=>e.name==='仰卧起坐').tracking,'reps');
});
test('请求校验拒绝过长输入和无效日期，只保留必需字段',()=>{
  assert.throws(()=>validateIntakeRequest({...request,text:'x'.repeat(1201)}));assert.throws(()=>validateIntakeRequest({...request,today:'2026-02-30'}));
  assert.equal(validateIntakeRequest({...request,history:'private'}).history,undefined);
});
test('缺失重量不能变成0；未知RIR和RIR0分别保留',()=>{
  const unknown=validateIntakeOutput(output,request);assert.equal(unknown.exercises[0].sets[0].rir,'');
  const zero=structuredClone(output);zero.exercises[0].sets[0].rir=0;assert.equal(validateIntakeOutput(zero,request).exercises[0].sets[0].rir,0);
  const missing=structuredClone(output);missing.exercises[0].sets[0].weightKg=null;assert.throws(()=>validateIntakeOutput(missing,request));
});
test('拒绝库外动作、伪造原文、未来日期、重复动作和异常组数',()=>{
  for(const mutate of [v=>v.exercises[0].name='编造动作',v=>v.exercises[0].source='不在原文',v=>v.date='2026-11-14',v=>v.exercises.push(v.exercises[0]),v=>v.exercises[0].sets=Array(37).fill(v.exercises[0].sets[0])]){
    const value=structuredClone(output);mutate(value);assert.throws(()=>validateIntakeOutput(value,request));
  }
});
test('原文只有简称时，模型不能自行猜成一个精确动作',()=>{
  const req={...request,text:'卧推50kg10次1组'};const value=structuredClone(output);value.exercises[0].source=req.text;
  assert.throws(()=>validateIntakeOutput(value,req),/歧义/);
});
test('自重只能记录次数，重量不允许从体重推断',()=>{
  const req={...request,text:'仰卧起坐20次1组'};const value={...output,exercises:[{name:'仰卧起坐',source:req.text,sets:[{weightKg:null,reps:20,rir:null,type:'working'}]}]};
  assert.equal(validateIntakeOutput(value,req).exercises[0].sets[0].weight,null);value.exercises[0].sets[0].weightKg=60;assert.throws(()=>validateIntakeOutput(value,req));
});
test('澄清或计划输出不能形成草稿，忽略附带的恶意动作',()=>{
  const value=validateIntakeOutput({...output,status:'clarify',questions:['请补充重量']},request);
  assert.deepEqual(value.exercises,[]);assert.throws(()=>applyIntakeDraft({sessions:[]},value,'r'));
});
test('带入编辑器只创建未完成草稿，不写历史、不覆盖原草稿组',()=>{
  const before={sessions:[],draft:{id:'d',date:'2026-11-13',exercises:[{id:'e',name:'杠铃卧推',tracking:'weighted',sets:[{id:'old',weight:20,reps:10,done:true}]}]}};
  const next=applyIntakeDraft(before,validateIntakeOutput(output,request),'r');
  assert.equal(next.sessions.length,0);assert.equal(next.draft.exercises[0].sets.length,2);assert.equal(next.draft.exercises[0].sets[1].done,false);assert.equal(before.draft.exercises[0].sets.length,1);
  assert.throws(()=>applyIntakeDraft({...before,draft:{...before.draft,date:'2026-11-12'}},validateIntakeOutput(output,request),'r'));
});
test('用户保存后的修改计入字段变化，删除组单独统计',()=>{
  const next=applyIntakeDraft({sessions:[],intakeRuns:[{id:'r',status:'applied'}]},validateIntakeOutput(output,request),'r');
  const saved=structuredClone(next.draft);saved.exercises[0].sets[0].reps=9;
  const run=intakeOutcomes(next,saved)[0];assert.equal(run.correctedFields,1);assert.equal(run.status,'saved');assert.equal(next.intakeRuns[0].status,'applied');
  saved.exercises=[];assert.equal(intakeOutcomes(next,saved)[0].removedSets,1);
});
test('模型真实接口适配器的模拟响应可被前端重新校验，密钥不进入返回值',async()=>{
  const result=await generateIntake(request,{apiKey:'test-secret',fetchImpl:async(url,options)=>{
    assert.equal(url,'https://api.deepseek.com/chat/completions');const body=JSON.parse(options.body);assert.equal(body.response_format.type,'json_object');
    return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(output)}}],usage:{prompt_tokens:100,completion_tokens:50}})};
  }});
  assert.equal(validateIntakeOutput(result.result,request).exercises[0].sets[0].weight,50);assert.equal(result.meta.usage.inputTokens,100);assert.equal(JSON.stringify(result).includes('test-secret'),false);
});
test('模型服务无密钥、HTTP失败、无效输出会明确失败，不产生假结果',async()=>{
  await assert.rejects(generateIntake(request,{apiKey:''}),/尚未配置/);
  await assert.rejects(generateIntake(request,{apiKey:'x',fetchImpl:async()=>({ok:false,status:429})}),/繁忙/);
  await assert.rejects(generateIntake(request,{apiKey:'x',fetchImpl:async()=>({ok:true,json:async()=>({choices:[{message:{content:'bad'}}]})})}),e=>e.code==='invalid_output'&&e.status===502);
});
test('公开API拒绝跨域和非JSON输入，不调用模型',async()=>{
  const response=()=>({headers:{},setHeader(k,v){this.headers[k]=v;},end(body){this.body=JSON.parse(body);}});
  for(const req of [{method:'GET',headers:{}},{method:'POST',headers:{origin:'https://bad.example',host:'liftlog.example','content-type':'application/json'}}]){
    const res=response();await aiRoute(req,res,()=>assert.fail('不应调用模型'));assert.ok([403,405].includes(res.statusCode));assert.equal(res.headers['Cache-Control'],'no-store');
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {buildReview,validateSelection} from '../dist/review.js';
import {validatePayload,generateSelection} from '../ai.mjs';
const set=(extra={})=>({weight:50,reps:10,rir:'',done:true,type:'working',...extra});
const session=(date,sets=[set()],tracking='weighted')=>({id:date,date,title:'训练',exercises:[{name:'测试动作',tracking,sets}]});
const opts={today:'2026-11-13',days:7};

test('同长周期边界、未来和热身排除；容量按负重口径计算',()=>{
  const r=buildReview([session('2026-11-13'),session('2026-11-07'),session('2026-11-06'),session('2026-10-31'),session('2026-10-30'),session('2026-11-14'),session('2026-11-12',[set({type:'warmup'}),set({done:false})])],opts);
  assert.equal(r.start,'2026-11-07');assert.equal(r.previousStart,'2026-10-31');assert.equal(r.sessionCount,2);assert.equal(r.sets,2);assert.equal(r.volume,1000);assert.match(r.facts[0].text,/前 7 天有 2 次/);
});
test('自重、RIR=0和未知RIR分开，不把空值转成零',()=>{
  const r=buildReview([session('2026-11-13',[set({rir:0}),set({weight:null,rir:null})],'reps')],opts);
  assert.equal(r.volume,0);assert.equal(r.sets,2);assert.equal(r.rirCoverage,50);
});
test('无数据不虚构变化；无效日期和输入跳过并披露',()=>{
  const empty=buildReview([],opts);assert.equal(empty.rirCoverage,null);assert.deepEqual(empty.baseline.actionIds,['log','context']);
  const r=buildReview([session('2026-02-30'),session('2026-11-13',[set({weight:-10}),set()])],opts);
  assert.equal(r.volume,500);assert.equal(r.baseline.factIds[0],'excluded');assert.match(r.facts.at(-1).text,/2 条/);
});
test('复盘目标影响重点，切换成28天包含较早数据',()=>{
  const sessions=[session('2026-10-25')];
  assert.equal(buildReview(sessions,opts).sessionCount,0);
  assert.equal(buildReview(sessions,{...opts,days:28,goal:'progress'}).sessionCount,1);
  assert.equal(buildReview(sessions,{...opts,goal:'quality'}).baseline.factIds[0],'rir');
});
test('引用不存在、重复和空输出被拒绝，模型额外文字不进入产品',()=>{
  const r=buildReview([],opts);
  for(const value of [{factIds:['fake'],actionIds:['log']},{factIds:['rir','rir'],actionIds:['log']},{factIds:[],actionIds:['log']}])assert.throws(()=>validateSelection(value,r));
  assert.deepEqual(validateSelection({factIds:['rir'],actionIds:['log'],text:'凭空生成的结论'},r),{factIds:['rir'],actionIds:['log']});
});
test('服务端只保留允许的汇总字段，拒绝未知编号和重复编号',()=>{
  const p=validatePayload({goal:'quality',days:7,facts:[{id:'rir',text:'0/1'}],weights:[60],enabled:true,apiKey:'do-not-forward'});
  assert.equal(p.weights,undefined);assert.equal(p.apiKey,undefined);
  assert.throws(()=>validatePayload({...p,facts:[{id:'fake',text:'x'}]}));
  assert.throws(()=>validatePayload({...p,facts:[p.facts[0],p.facts[0]]}));
});
test('模拟模型成功：请求不包含原始日志，返回经校验的选择',async()=>{
  const review=validatePayload({goal:'quality',days:7,facts:[{id:'rir',text:'RIR覆盖0/1'}]});
  const result=await generateSelection(review,{enabled:true,apiKey:'test-key',fetchImpl:async(url,options)=>{
    assert.equal(url,'http://127.0.0.1:7861/completion');assert.equal(options.headers.Authorization,undefined);
    const body=JSON.parse(options.body);assert.ok(body.grammar);assert.equal(body.prompt.includes('sessions'),false);
    return {ok:true,json:async()=>({model:'liftlog-atlas-1.7b-run02',content:'{"factIds":["rir"],"actionIds":["rir"]}',stop_type:'eos'})};
  }});
  assert.deepEqual(result.factIds,['rir']);
});
test('缺少密钥、HTTP失败、空JSON和伪造引用都明确失败',async()=>{
  const review=validatePayload({goal:'quality',days:7,facts:[{id:'rir',text:'x'}]});
  await assert.rejects(generateSelection(review,{enabled:false}),/未配置/);
  await assert.rejects(generateSelection(review,{enabled:true,apiKey:'x',fetchImpl:async()=>({ok:false})}),/未完成处理/);
  for(const content of ['', '{"factIds":["fake"],"actionIds":["log"]}']){
    await assert.rejects(generateSelection(review,{enabled:true,apiKey:'x',fetchImpl:async()=>({ok:true,json:async()=>({model:'liftlog-atlas-1.7b-run02',content,stop_type:'eos'})})}));
  }
});

test('已知重点偏差明确拒绝，不将程序纠正伪装成模型结果',async()=>{
 const review=validatePayload({goal:'consistency',days:7,facts:[{id:'frequency',text:'本周4次'},{id:'rir',text:'7/18'}]});
 await assert.rejects(generateSelection(review,{enabled:true,fetchImpl:async()=>({ok:true,json:async()=>({model:'liftlog-atlas-1.7b-run02',content:'{"factIds":["rir"],"actionIds":["rir"]}',stop_type:'eos'})})}),e=>e.code==='review_priority_failed');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {compact,expand,evidenceGuard,normalizedText,dateFor,mentionedExercises,requestFor,compileAtlas,literalDisposition} from '../training/atlas/protocol.mjs';
const make=(text,sets)=>({text,today:'2026-11-13',expected:{status:'ready',date:'2026-11-13',questions:[],exercises:[{name:'杠铃卧推',source:text,sets}]}});
const set=(weightKg,reps,rir=null,type='working')=>({weightKg,reps,rir,type});
test('千克单位先于中文数字归一化，真实重量保留且未出现的重量仍拒绝',()=>{
 for(const [weight,expected]of [['22.5千克',22.5],['二十二点五千克',22.5],['四十千克',40]]){
  const c=make(`杠铃卧推总重${weight}，已完成8次和7次各一组，RIR未记录。`,[set(expected,8),set(expected,7)]);
  const result=compileAtlas(compact(c.expected),c);
  assert.equal(result.result.status,'ready');assert.equal(result.result.exercises[0].sets[0].weightKg,expected);
  const invented=structuredClone(c.expected);invented.exercises[0].sets[0].weightKg=42.5;
  assert.equal(compileAtlas(compact(invented),c).result.status,'clarify');
 }
 assert.equal(normalizedText('二十二点五千克，十一次'),'22.5公斤,11次');
});
test('没有训练证据的短语不生成记录，完整动作和不完整日志仍交给解析',()=>{
 for(const text of ['动作幅度','肩峰','膳食纤维','力竭','三角肌','肱二头肌','想了解薄肌，今天没有完成任何训练。'])assert.equal(literalDisposition(make(text,[])).status,'not_log');
 for(const text of ['俯卧撑','今天练了卧推','卧推40kg','卧推八次','今天没练，昨天已完成俯卧撑10次1组'])assert.equal(literalDisposition(make(text,[])),null);
});
test('逐组余力列表不能混成次数或静默丢失，只拒绝而不补写',()=>{
 const c=make('两组杠铃卧推都完成13次、总重42.5公斤，余力次数依次记为1、2',[set(42.5,13,1),set(42.5,13,2)]);
 assert.equal(compileAtlas(compact(c.expected),c).result.status,'ready');
 for(const sets of [[set(42.5,13),set(42.5,2)],[set(42.5,13),set(42.5,13)],[set(42.5,13,2),set(42.5,13,1)]])assert.equal(compileAtlas(compact({...c.expected,exercises:[{...c.expected.exercises[0],sets}]}),c).result.status,'clarify');
});
test('未来计划直接分流，混合已完成记录不抢先分流',async()=>{
 const c=make('今晚准备杠铃卧推40kg10次3组，尚未训练',[]);
 assert.equal(literalDisposition(c).status,'not_log');
 for(const text of ['今天做了杠铃卧推40kg10次3组，明天准备休息','杠铃卧推已经完成40kg10次3组，下周加重'])assert.equal(literalDisposition({...c,text}),null);
 const {generateAtlasIntake}=await import('../lib/atlas-model.mjs');
 const out=await generateAtlasIntake(requestFor(c),{fetchImpl:()=>{throw Error('must not call worker');}});
 assert.equal(out.result.status,'not_log');assert.equal(out.meta.usage.outputTokens,0);
});
test('自重记录按动作字段去掉体重，明确额外负重仍需澄清',()=>{
 const raw={s:'ready',e:[['俯卧撑',[[60,10,null,'w']]]]},c=make('俯卧撑10次1组，体重60公斤',[]);
 assert.throws(()=>expand(raw,c));
 const compiled=compileAtlas(raw,c);assert.equal(compiled.result.status,'ready');assert.equal(compiled.result.exercises[0].sets[0].weightKg,null);assert.equal(compiled.schemaProjected,true);
 for(const text of ['俯卧撑10次1组，额外负重60公斤','俯卧撑60公斤10次1组'])assert.equal(compileAtlas(raw,{...c,text}).result.status,'clarify');
 assert.equal(compileAtlas(raw,{...c,text:'俯卧撑10次1组，体重60公斤，不是负重60公斤'}).result.status,'ready');
});
test('Atlas紧凑记录不补写数值，完整展开后通过生产校验',()=>{
 const c=make('杠铃卧推40kg10次2组',[set(40,10),set(40,10)]);const out=expand(compact(c.expected),c);assert.deepEqual(out,c.expected);assert.equal(evidenceGuard(out,c),out);
});
test('未知RIR不能变成0，末组RIR不能扩散到前组',()=>{
 const c=make('杠铃卧推40kg10次3组，RIR只记了末组2',[set(40,10),set(40,10),set(40,10,2)]);
 assert.doesNotThrow(()=>evidenceGuard(expand(compact(c.expected),c),c));
 const wrong=structuredClone(c.expected);wrong.exercises[0].sets[0].rir=2;assert.throws(()=>evidenceGuard(wrong,c),/scope/);
 const failure=make('杠铃卧推40kg10次1组，已经力竭',[set(40,10,0)]);assert.throws(()=>evidenceGuard(failure.expected,failure),/numeric|rir/);
});
test('数值核对使用完整数字，十一不能被替换成十或一',()=>{
 assert.equal(normalizedText('四十二点五公斤，十一下，两组'),'42.5公斤,11下,2组');
 const c=make('杠铃卧推40公斤，十一下，两组',[set(40,10),set(40,10)]);assert.throws(()=>evidenceGuard(c.expected,c),/numeric/);
});
test('日期使用请求参考日，昨天睡觉与今天训练分开',()=>{
 const c=make('昨天睡了7小时。今天已练完杠铃卧推40kg10次1组',[set(40,10)]);assert.equal(dateFor(c),'2026-11-13');
 assert.equal(dateFor({...c,text:'今天补记昨天的杠铃卧推40kg10次1组'}),'2026-11-12');
 assert.equal(dateFor({...c,text:'2026-11-06杠铃卧推40kg10次1组'}),'2026-11-06');
 assert.throws(()=>dateFor({...c,text:'2026-11-06还是2026-11-07的杠铃卧推记不清'}),/uncertain/);
});
test('自重、库外动作和不完整紧凑输出不能变成可用记录',()=>{
 assert.throws(()=>expand({s:'ready',e:[['俯卧撑',[[60,10,null,'w']]]]},make('俯卧撑10次1组，体重60公斤',[])));
 assert.throws(()=>expand({s:'ready',e:[['泽奇深蹲',[[40,10,null,'w']]]]},make('泽奇深蹲40kg10次1组',[])));
 assert.throws(()=>expand({s:'ready',e:[['杠铃卧推',[[40,10]]]]},make('杠铃卧推40kg10次1组',[])));
});
test('完整动作名取最长匹配，保留真正独立出现的短名称',()=>{
 const c=make('固定器械推肩40kg10次2组',[set(40,10),set(40,10)]);
 assert.deepEqual(mentionedExercises(requestFor(c)).map(x=>x.name),['固定器械推肩']);
 const both=make('杠铃卧推40kg10次1组，上斜杠铃卧推30kg8次1组',[]);
 assert.deepEqual(mentionedExercises(requestFor(both)).map(x=>x.name),['杠铃卧推','上斜杠铃卧推']);
 assert.throws(()=>expand({s:'ready',e:[['器械推肩',[[40,10,null,'w']]]]},c),/unsupported_name/);
});
test('明确合计组数不一致要澄清，不自动增加组数',()=>{
 const c=make('完成了4组杠铃卧推，每组12下，重量47.5kg',[set(47.5,12)]);
 assert.throws(()=>evidenceGuard(c.expected,c),/set_count/);
 const repeated=make('杠铃卧推40kg10次1组，再杠铃卧推40kg8次1组',[set(40,10),set(40,8)]);
 assert.doesNotThrow(()=>evidenceGuard(repeated.expected,repeated));
 const merged=expand({s:'ready',e:[['杠铃卧推',[[40,10,null,'w']]],['杠铃卧推',[[40,8,null,'w']]]]},repeated);
 assert.equal(merged.exercises.length,1);assert.equal(merged.exercises[0].sets.length,2);
});

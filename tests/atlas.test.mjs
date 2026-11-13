import test from 'node:test';
import assert from 'node:assert/strict';
import {compact,expand,evidenceGuard,normalizedText,dateFor} from '../training/atlas/protocol.mjs';
const make=(text,sets)=>({text,today:'2026-11-13',expected:{status:'ready',date:'2026-11-13',questions:[],exercises:[{name:'杠铃卧推',source:text,sets}]}});
const set=(weightKg,reps,rir=null,type='working')=>({weightKg,reps,rir,type});
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

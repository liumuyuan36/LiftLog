import test from 'node:test';
import assert from 'node:assert/strict';
import {cases} from '../training/intake/seeds.mjs';
import {checkOutput,score,messagesFor} from '../training/intake/protocol.mjs';
import {removeWholeFence} from '../training/intake/format-diagnostic.mjs';
test('合成标注与现有产品校验一致，训练不含测试家族',()=>{
 assert.equal(cases.length,100);const groups=new Map();
 for(const c of cases){assert.equal(checkOutput(c.expected,c).exact,true,c.id);assert.equal(c.provenance,'ai_authored_synthetic');assert.equal(c.reviewStatus,'pending_human_review');if(groups.has(c.family))assert.equal(groups.get(c.family),c.split);groups.set(c.family,c.split);}
 assert.equal(messagesFor(cases[0])[1].content.includes('catalog'),true);
});
test('评测不能只判断状态或首个动作，遗漏组、错RIR和第二动作均失败',()=>{
 for(const id of ['t01','t06','t32']){const c=cases.find(c=>c.id===id),bad=structuredClone(c.expected);if(id==='t01')bad.exercises[0].sets.pop();if(id==='t06')bad.exercises[0].sets[0].rir=0;if(id==='t32')bad.exercises.pop();assert.equal(checkOutput(bad,c).exact,false);}
});
test('未返回的预测按失败计入分母，重复或未知ID不得覆盖',()=>{
 const selected=cases.filter(c=>c.split==='test');const result=score(selected,[{id:selected[0].id,output:selected[0].expected}]);assert.equal(result.metrics.exact.total,20);assert.equal(result.metrics.exact.correct,1);
 assert.throws(()=>score(selected,[{id:'unknown',output:{}}]));assert.throws(()=>score(selected,[{id:selected[0].id},{id:selected[0].id}]));
});
test('业务校验、空值和拒绝格式不能被JSON有效率掩盖',()=>{
 const c=cases[0];assert.equal(checkOutput('```json\n{}\n```',c).jsonValid,false);
 const unknown=structuredClone(c.expected);unknown.exercises[0].sets[0].rir=2;assert.equal(checkOutput(unknown,c).exact,false);
 const rejected=cases.find(c=>c.expected.status==='clarify');assert.equal(checkOutput({...rejected.expected,exercises:c.expected.exercises},rejected).schemaValid,false);
});
test('事后格式诊断只移除完整围栏，不能从解释中摘JSON或修复截断',()=>{
 assert.equal(removeWholeFence('```json\n{"ok":true}\n```'),'{"ok":true}');
 for(const value of ['解释：```json\n{}\n```','```json\n{"ok":','{"ok":','prefix {} suffix'])assert.equal(removeWholeFence(value),value);
});

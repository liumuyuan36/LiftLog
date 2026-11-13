import test from 'node:test';import assert from 'node:assert/strict';
import {daysAgo,uid} from '../dist/data.js';
import {checkin,setup,fitnessProfiles,upsertProfile,replacePendingExercise,comparableProgress,observeState,focusProgress} from '../dist/fitness.js';
import {focusMarkup} from '../dist/focus-ui.js';
import {validateBackup} from '../dist/backup.js';
const name='杠铃卧推';
function entry(ago,reps=10,options={}){return {id:uid(),date:daysAgo(ago),title:'训练',duration:20,exercises:[{id:uid(),name,group:'chest',tracking:'weighted',sets:[{id:uid(),weight:50,reps,rir:2,type:'working',done:true}],...options}]};}
test('同重量同RIR按工作组序比较，不把热身混进来',()=>{
  const a=entry(5,8),b=entry(0,10);b.exercises[0].sets.unshift({id:uid(),weight:20,reps:20,rir:'',done:true,type:'warmup'});
  const p=comparableProgress([a,b],name);assert.equal(p.status,'up');assert.equal(p.pairs[0].delta,2);assert.equal(p.pairs[0].ordinal,1);
});
test('同次数已知同RIR可比重量，重量次数同时变化则不强行排名',()=>{
  const a=entry(5),b=entry(0);b.exercises[0].sets[0].weight=55;assert.equal(comparableProgress([a,b],name).pairs[0].metric,'weight');b.exercises[0].sets[0].reps=8;assert.equal(comparableProgress([a,b],name).status,'incomparable');
});
test('RIR空值和差异不能当成相同努力程度，RIR0保留',()=>{
  const a=entry(5),b=entry(0,11);a.exercises[0].sets[0].rir='';assert.equal(comparableProgress([a,b],name).status,'incomparable');a.exercises[0].sets[0].rir=0;b.exercises[0].sets[0].rir=0;assert.equal(comparableProgress([a,b],name).status,'up');b.exercises[0].sets[0].rir=1;assert.equal(comparableProgress([a,b],name).status,'incomparable');
});
test('匹配最近设置一致的基线，披露跳过更近但设置不同的记录',()=>{
  const a=entry(8,8,{setup:setup({equipment:'A'})}),b=entry(3,5,{setup:setup({equipment:'B'})}),c=entry(0,10,{setup:setup({equipment:'A'})});const p=comparableProgress([a,b,c],name);assert.equal(p.baseline.id,a.id);assert.equal(p.skippedRecent,1);assert.equal(p.pairs[0].delta,2);
  c.exercises.unshift({id:uid(),name:'哑铃弯举',sets:[]});assert.equal(comparableProgress([a,c],name).status,'insufficient');
});
test('多组同时有升有降保留混合结论，不只挑进步组',()=>{
  const a=entry(4),b=entry(0,12);a.exercises[0].sets.push({...a.exercises[0].sets[0],id:uid(),reps:10});b.exercises[0].sets.push({...b.exercises[0].sets[0],id:uid(),reps:8});assert.equal(comparableProgress([a,b],name).status,'mixed');
});
test('缺失重量、未来和错误日期不能形成进步证据，同日多场不猜顺序',()=>{
  const a=entry(4),b=entry(0);b.exercises[0].sets[0].weight=null;assert.equal(comparableProgress([a,b],name).status,'insufficient');b.exercises[0].sets[0].weight=50;b.date=daysAgo(-1);assert.equal(comparableProgress([a,b],name).entries.length,1);b.date='2026-02-30';assert.equal(comparableProgress([a,b],name).entries.length,1);b.date=daysAgo(0);assert.equal(comparableProgress([a,b,{...b,id:uid()}],name).status,'ambiguous');
});
test('自重比较只有次数，不生成重量、容量或力量增幅',()=>{
  const a=entry(4),b=entry(0,12);for(const s of [a,b]){s.exercises[0].tracking='reps';s.exercises[0].sets[0].weight=null;}const p=comparableProgress([a,b],name);assert.equal(p.pairs[0].metric,'reps');assert.equal(p.pairs[0].before.weight,null);
});
test('状态观察每侧至少3个不同日期，只描述匹配首组的均值差',()=>{
  const sessions=Array.from({length:6},(_,i)=>{const s=entry(i,i<3?12:10);s.checkin={sleepHours:i<3?8:6,fatigue:2};return s;});const o=observeState(sessions,name);assert.equal(o.status,'ready');assert.deepEqual(o.groups.map(g=>g.length),[3,3]);assert.equal(o.difference,2);assert.match(o.reason,/不代表因果/);sessions[0].checkin.sleepHours=null;assert.equal(observeState(sessions,name).status,'insufficient');
});
test('不同重量、未知RIR、缺失状态与同日重复不会补值进入观察',()=>{
  const s=entry(0);s.checkin={sleepHours:8};const other=entry(3);other.exercises[0].sets[0].weight=55;other.checkin={sleepHours:6};const missing=entry(4);const o=observeState([s,{...s,id:uid()},other,missing],name);assert.equal(o.groups.flat().length,0);assert.equal(o.excluded,4);
});
test('睡眠0与空值不同，疲劳评分验证，器械卡不会偷偷改变旧快照',()=>{
  assert.equal(checkin({sleepHours:0}).sleepHours,0);assert.equal(checkin({sleepHours:''}).sleepHours,null);assert.throws(()=>checkin({fatigue:2.5}));assert.throws(()=>setup({restSeconds:0}));assert.throws(()=>fitnessProfiles([{name,setup:{}},{name,setup:{}}]));const old=entry(1,10,{setup:setup({equipment:'旧器械'})});const d=upsertProfile({sessions:[old]},name,{equipment:'新器械',restSeconds:90});assert.equal(d.sessions[0].exercises[0].setup.equipment,'旧器械');assert.equal(d.fitnessProfiles[0].setup.restSeconds,90);
});
test('临时替换保留历史和已完成组，未完成替换不搬运原动作数值',()=>{
  const s=entry(0);assert.throws(()=>replacePendingExercise(s,s.exercises[0].id,'上斜哑铃卧推'),/完成组/);s.exercises[0].sets[0].done=false;const next=replacePendingExercise(s,s.exercises[0].id,'上斜哑铃卧推',[],[{name:'上斜哑铃卧推',setup:{equipment:'B',restSeconds:90}}]);assert.equal(s.exercises[0].name,name);assert.equal(next.exercises[0].substitutedFrom,name);assert.equal(next.exercises[0].sets[0].weight,'');assert.equal(next.exercises[0].sets[0].done,false);assert.equal(next.exercises[0].setup.restSeconds,90);assert.throws(()=>replacePendingExercise(s,s.exercises[0].id,'杠铃深蹲'),/同部位/);
});
test('新状态、器械快照、观察主题可备份恢复，旧备份不伪造状态',()=>{
  const s=entry(0,10,{setup:setup({equipment:'A',seat:'3',restSeconds:90})});s.checkin={sleepHours:7.5,fatigue:2};const raw={version:1,sessions:[s],weights:[],fitnessProfiles:[{name,setup:setup({equipment:'B'})}],fitnessExperiment:{name,factor:'sleepHours',threshold:7,question:'观察关联'}};const d=validateBackup(raw);assert.equal(d.sessions[0].checkin.sleepHours,7.5);assert.equal(d.sessions[0].exercises[0].setup.equipment,'A');assert.equal(d.fitnessExperiment.threshold,7);const old=validateBackup({version:1,sessions:[entry(0)],weights:[]});assert.equal(old.sessions[0].checkin,undefined);assert.deepEqual(old.fitnessProfiles,[]);raw.sessions[0].checkin.sleepHours=25;assert.throws(()=>validateBackup(raw));
});
test('专注进度以当前草稿的真实完成组计数，空训练不除零',()=>{
  assert.equal(focusProgress({exercises:[]}).ratio,0);const s=entry(0);s.exercises[0].sets.push({...s.exercises[0].sets[0],id:uid(),done:false});const p=focusProgress(s);assert.equal(p.total,2);assert.equal(p.done,1);assert.equal(p.ratio,.5);assert.equal(p.next.index,1);const markup=focusMarkup(s);assert.match(markup,/完成这一组/);assert.match(markup,/不读取心率或热量/);assert.match(markup,/data-field="reps"/);
});

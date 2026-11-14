import fs from 'node:fs/promises';
import {messagesFor,compact,expand,compileAtlas,requestFor,digest,SYSTEM} from './protocol.mjs';
import {validateIntakeOutput} from '../../dist/intake.js';
const base=new URL('./',import.meta.url),dir=new URL('./data-role-context/',base);
const read=async name=>(await fs.readFile(new URL(name,base),'utf8')).trim().split('\n').map(JSON.parse);
const canonical=(out,c)=>{const v=validateIntakeOutput(out,requestFor(c));return JSON.stringify({status:v.status,date:v.date,exercises:v.exercises.map(e=>({name:e.name,sets:e.sets}))});};
const legacy=await read('data-hypertrophy/train.cases.jsonl'),excluded=[],duplicateReplay=[],replay=[],replayTexts=new Set();
for(const c of legacy){try{if(canonical(compileAtlas(compact(c.expected),c).result,c)!==canonical(c.expected,c))throw Error('production_rule_mismatch');if(replayTexts.has(c.text)){duplicateReplay.push(c.id);continue;}replayTexts.add(c.text);replay.push(c);}catch(e){excluded.push({id:c.id,reason:e.message});}}
const weighted=['杠铃卧推','坐姿划船','器械推胸','腿举','哑铃弯举','高位下拉','绳索下压','器械推肩'];
const body=['俯卧撑','卷腹','徒手深蹲','反向卷腹'];
const subjects=['教练','朋友','同学','视频里的博主'];
const train=[],validation=[];
const set=(weightKg,reps,rir=null)=>({weightKg,reps,rir,type:'working'});
function add(rows,id,text,name,sets,status,category){
 const c={id,text,today:'2026-11-14',category,provenance:'original_AI_authored_role_contrast_not_real_user_data',expected:{status,date:'2026-11-14',questions:status==='ready'?[]:['请提供自己实际完成的动作、公斤总重和次数。'],exercises:status==='ready'?[{name,source:text,sets}]:[]}};
 expand(compact(c.expected),c);
 if(canonical(compileAtlas(compact(c.expected),c).result,c)!==canonical(c.expected,c))throw Error('New label conflicts with rules: '+id);
 rows.push(c);
}
for(let i=0;i<40;i++){
 const n=weighted[i%8],b=body[i%4],s=subjects[i%4],w=17.5+i*1.5,r=7+i%8,demo=w+25;
 add(train,`role-train-${i}-observer`,`${s}在演示${n}，总重${demo}公斤做${r+4}次。我只是看了示范，没有做这项训练，别把示范记进我的日志。`,null,null,'not_log','observer-only');
 add(train,`role-train-${i}-other`,`${s}今天已经完成${n}，${demo}公斤、${r+3}次两组。那是他的训练，我今天完全没有练。`,null,null,'not_log','other-person-completed');
 add(train,`role-train-${i}-quote`,`我抄了增肌视频的例子：${n}${demo}公斤${r+2}次3组。这只是视频例子，自己没有实际完成。`,null,null,'not_log','quoted-example-only');
 let text=`${s}示范${n}用${demo}公斤做${r+4}次；我实际已经完成的是${n}总重${w}公斤，${r}次和${r-2}次各一组，RIR没记，只记我自己的。`;
 add(train,`role-train-${i}-mine`,text,n,[set(w,r),set(w,r-2)],'ready','own-vs-example');
 text=`我已经练完${n}，总重${w}公斤，${r+1}次、${r-1}次两组，RIR均未知。旁边${s}用${demo}公斤做了${r+5}次，那不属于我的记录。`;
 add(train,`role-train-${i}-mine-first`,text,n,[set(w,r+1),set(w,r-1)],'ready','own-before-other');
 text=`${s}说体重${60+i%9}公斤是背景；我实际做完${b}，纯自重${r+5}次和${r+2}次两组。第一组RIR2，第二组RIR1。`;
 add(train,`role-train-${i}-body`,text,b,[set(null,r+5,2),set(null,r+2,1)],'ready','own-bodyweight');
 add(train,`role-train-${i}-missing`,`我实际做了${n}两组，每组${r}次。${s}用的是${demo}公斤，我自己的总重量忘了，不能用他的重量代替。`,null,null,'clarify','own-missing-field');
 text=`增肌视频的建议留到明天再讨论。我实际已经完成${n}，总重${w}公斤，两组都做${r}次；第一组RIR0，最后一组RIR没有记录。`;
 add(train,`role-train-${i}-scope`,text,n,[set(w,r,0),set(w,r)],'ready','explicit-zero-and-unknown');
}
for(let i=0;i<8;i++){
 const n=weighted[(i+3)%8],w=26.5+i*2,r=8+i;
 add(validation,`role-dev-${i}-watch`,`今天去了健身房，但${n}${w+30}公斤${r+3}次是教练做给我看的，我本人未参与。`,null,null,'not_log','observer-only');
 add(validation,`role-dev-${i}-quote`,`笔记里的${n}${w+20}公斤${r}次两组，是课程里的案例，今天只做笔记，没有训练。`,null,null,'not_log','quoted-example-only');
 let text=`同学介绍了${n}的技术，我已经实际练完：公斤总重${w}，先${r}次再${r-3}次，共两组，没有填写余力。`;
 add(validation,`role-dev-${i}-own`,text,n,[set(w,r),set(w,r-3)],'ready','own-vs-example');
 text=`先保存本人${n}：总重${w}公斤，完成${r+1}次与${r-2}次两组，RIR分别为2、0。视频中的${w+25}公斤不用记。`;
 add(validation,`role-dev-${i}-rir`,text,n,[set(w,r+1,2),set(w,r-2,0)],'ready','explicit-zero-and-unknown');
 add(validation,`role-dev-${i}-missing`,`我实际完成两组${n}。只知道朋友用${w+20}公斤，自己的重量和每组次数没留下，不要代填。`,null,null,'clarify','own-missing-field');
 const b=body[(i+1)%4];text=`今天我已经做完${b}，自重${r+6}次和${r+2}次两组。教练说余力可以记录，但我这次没有记录RIR。`;
 add(validation,`role-dev-${i}-body`,text,b,[set(null,r+6),set(null,r+2)],'ready','own-bodyweight');
}
const finalTrain=[...replay,...train],finalValidation=[...await read('data-v4/validation.cases.jsonl'),...validation];
const texts=new Set(finalTrain.map(c=>c.text));if(finalValidation.some(c=>texts.has(c.text)))throw Error('Train/validation overlap');
if(texts.size!==finalTrain.length||new Set(finalValidation.map(c=>c.text)).size!==finalValidation.length)throw Error('Duplicate text in training or validation');
await fs.mkdir(dir,{recursive:true});const files={};
for(const [split,rows]of [['train',finalTrain],['validation',finalValidation]]){
 const serialized=rows.map(JSON.stringify).join('\n')+'\n';
 for(const [suffix,raw]of [['cases',serialized],['sft',rows.map(c=>JSON.stringify({prompt:messagesFor(c),completion:[{role:'assistant',content:JSON.stringify(compact(c.expected))}]})).join('\n')+'\n']]){const name=split+'.'+suffix+'.jsonl';await fs.writeFile(new URL(name,dir),raw);files[name]={rows:rows.length,sha256:digest(raw)};}
}
await fs.writeFile(new URL('manifest.json',dir),JSON.stringify({version:'atlas-role-context-v2-deduplicated',createdAt:new Date().toISOString(),promptSha256:digest(SYSTEM),trainingContractSha256:digest(await fs.readFile(new URL('../../lib/atlas-contract.mjs',base),'utf8')),files,newTrainingContexts:train.length,newDevelopmentContexts:validation.length,replayRows:replay.length,excludedReplay:excluded,duplicateReplayRemoved:duplicateReplay,provenance:'Original synthetic contrast pairs, not copied from previous acceptance sets or real users. All new labels checked against unchanged production rules v3.5. Independent human review pending.',selection:'Development validation only. Old36/Old48 are regressions. New frozen role test is not used for epochs or training.',paidModelCalls:0},null,2)+'\n');
console.log(JSON.stringify({newTraining:train.length,replay:replay.length,excluded:excluded.length,training:finalTrain.length,validation:finalValidation.length}));

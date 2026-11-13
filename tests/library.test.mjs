import test from 'node:test';
import assert from 'node:assert/strict';
import {builtInExercises,movementPatterns,equipmentTypes,exerciseGuide,filterExercises,exerciseRecordingHint} from '../dist/exercise-library.js';
import {groups,exerciseCatalog,trackingForName,validateCustomExercise,validateSet,localDate} from '../dist/data.js';
import {validateBackup} from '../dist/backup.js';
import {routineFromSession,sessionFromRoutine} from '../dist/workouts.js';
import {intakeCatalog,validateIntakeRequest} from '../dist/intake.js';
import {exercisePose,muscleFigure} from '../dist/exercise-art.js';
import {exerciseGuideMarkup} from '../dist/library-ui.js';

test('60个动作均有唯一名称、有效分组、记录口径和完整的两阶段说明',()=>{
  assert.equal(builtInExercises.length,60);assert.equal(new Set(builtInExercises.map(e=>e.name)).size,60);
  for(const g of groups)assert.equal(g.exercises.length,10);
  for(const e of builtInExercises){const guide=exerciseGuide(e.name);assert.equal(guide.name,e.name);assert.ok(groups.some(g=>g.id===e.group));assert.ok(equipmentTypes.includes(e.equipment));assert.ok(movementPatterns[e.pattern]);assert.equal(guide.steps.length,2);assert.equal(guide.cues.length,2);assert.ok(guide.primary);assert.ok(['weighted','reps'].includes(e.tracking));}
  for(const name of ['杠铃卧推','上斜哑铃卧推','器械夹胸','哑铃肩推','哑铃侧平举','反向飞鸟','高位下拉','坐姿划船','杠铃划船','哑铃弯举','绳索下压','锤式弯举','杠铃深蹲','腿举','罗马尼亚硬拉','仰卧起坐','悬挂举腿','绳索卷腹','器械卷腹'])assert.ok(builtInExercises.some(e=>e.name===name));
});

test('新增自重动作无需重量，旧自定义同名动作优先，已删除动作不被内置库复活',()=>{
  for(const name of ['俯卧撑','跪姿俯卧撑','引体向上','反手引体向上','徒手深蹲','卷腹','反向卷腹','死虫式','鸟狗式']){assert.equal(trackingForName(name),'reps');assert.equal(validateSet({weight:null,reps:10,rir:''},trackingForName(name)),'');}
  const custom=[{id:'old',name:'反向卷腹',group:'core',tracking:'weighted'}];
  assert.equal(trackingForName('反向卷腹',custom),'weighted');assert.equal(exerciseGuide('反向卷腹',custom),null);
  assert.equal(exerciseCatalog(custom).flatMap(g=>g.exercises).filter(n=>n==='反向卷腹').length,1);
  assert.equal(exerciseCatalog([{...custom[0],deleted:true}]).flatMap(g=>g.exercises).includes('反向卷腹'),false);
  assert.ok(validateCustomExercise(custom[0]));
});

test('旧备份中的同名自定义动作可恢复，组记录与模板的重量口径不变',()=>{
  const custom={id:'legacy-custom',name:'反向卷腹',group:'core',tracking:'weighted'};
  const s={id:'s',title:'旧动作',date:localDate(),duration:30,exercises:[{...custom,sets:[{id:'set',weight:5,reps:10,rir:0,type:'working',done:true}]}]};
  const r=routineFromSession(s,'旧模板');
  const restored=validateBackup({version:1,sessions:[s],weights:[],customExercises:[custom],routines:[r]});
  assert.equal(restored.sessions[0].exercises[0].sets[0].weight,5);assert.equal(restored.sessions[0].exercises[0].sets[0].rir,0);
  assert.equal(sessionFromRoutine(restored.routines[0],restored.customExercises).exercises[0].tracking,'weighted');
  assert.throws(()=>validateBackup({version:1,sessions:[],weights:[],customExercises:[custom,{...custom,id:'duplicate'}]}));
});

test('动作名、肌肉与器械搜索组合生效，搜索不修改数据，自定义项不冒用教学资料',()=>{
  const custom=[{id:'c',name:'悍马单侧推胸',group:'chest',note:'一号机'}],catalog=exerciseCatalog(custom),before=structuredClone(catalog);
  assert.equal(filterExercises(catalog,{group:'legs'}).length,10);
  assert.ok(filterExercises(catalog,{query:'哑铃',group:'chest',equipment:'哑铃'}).every(e=>e.guide.equipment==='哑铃'&&e.group==='chest'));
  assert.ok(filterExercises(catalog,{query:'股四头肌'}).some(e=>e.name==='杠铃深蹲'));
  const found=filterExercises(catalog,{query:'一号机'},custom);assert.equal(found.length,1);assert.equal(found[0].guide,null);
  assert.equal(filterExercises(catalog,{query:'找不到的动作'}).length,0);assert.deepEqual(catalog,before);
});

test('扩充后的动作库可进入原有自然语言接口，新自重记录方式一致',()=>{
  const catalog=intakeCatalog({customExercises:[]});assert.equal(catalog.length,60);
  const request=validateIntakeRequest({text:'俯卧撑做了10次',today:localDate(),catalog});assert.equal(request.catalog.find(e=>e.name==='俯卧撑').tracking,'reps');
});

test('每个动作都有不同的两阶段矢量图，坐标有效，细节模式不会回退到未知图',()=>{
  for(const e of builtInExercises){const g=exerciseGuide(e.name),start=exercisePose(g,'start'),end=exercisePose(g,'end');assert.ok(start.startsWith('<svg'));assert.ok(end.includes(e.name));assert.doesNotMatch(start+end,/NaN|undefined|Infinity/);assert.notEqual(start.replace(/起始/g,'阶段'),end.replace(/结束/g,'阶段'));}
  const map=muscleFigure({view:'back',selected:'back',interactive:true});assert.match(map,/data-group="back"/);assert.match(map,/tabindex="0"/);
});

test('自定义名称与备注被转义，不伪造姿势图，历史详情不提供直接加入操作',()=>{
  const custom={name:'<img onerror=alert(1)>',note:'<script>bad</script>',group:'chest',tracking:'weighted'};
  const html=exerciseGuideMarkup(custom.name,'chest',[custom],{canAdd:false});assert.ok(html.includes('&lt;img'));assert.ok(html.includes('&lt;script'));assert.doesNotMatch(html,/<img onerror|<script>|data-action="guide-add"/);assert.ok(html.includes('这是你的自定义动作'));
});

test('单臂新动作注明单侧重量，旧双侧和自定义备注保持自己的口径',()=>{
  assert.match(exerciseRecordingHint('单臂哑铃划船'),/单侧/);
  assert.match(exerciseRecordingHint('哑铃过顶臂屈伸'),/单只哑铃/);
  assert.match(exerciseRecordingHint('哑铃卧推'),/双侧总重量/);
  assert.match(exerciseRecordingHint('俯卧撑'),/只记录实际完成次数/);
  assert.equal(exerciseRecordingHint('单臂哑铃划船',[{name:'单臂哑铃划船',note:'旧口径：两侧合计'}]),'旧口径：两侧合计');
});

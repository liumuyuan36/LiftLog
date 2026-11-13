export const equipmentTypes=['杠铃','哑铃','器械','绳索','自重'];
export const guideSources=[
  {name:'ACE · 动作与肌群资料库',url:'https://www.acefitness.org/resources/everyone/exercise-library/'},
  {name:'Mayo Clinic · 力量训练教学',url:'https://www.mayoclinic.org/healthy-lifestyle/fitness/in-depth/strength-training/art-20046031'},
];

// Original, simplified movement diagrams are keyed to these movement patterns.
// They describe a movement, not a personalized range of motion or a form assessment.
export const movementPatterns={
  bench:{name:'仰卧推举',steps:['仰卧在凳上，双脚着地，手持器械停在胸部两侧。','向上推起，手腕保持稳定，再受控回到起始位置。'],cues:['肩背稳定贴凳，保持自然腰背姿态。','肘部与躯干留出适合自己的角度，避免过度外展。'],secondary:['shoulders','arms']},
  incline:{name:'上斜推举',steps:['坐靠在上斜凳上，双脚支撑，器械位于上胸两侧。','向上推起，再沿原路径缓慢回落。'],cues:['按器械或教练指导调整靠背角度。','避免为了推起重量而耸肩或大幅挺腰。'],secondary:['shoulders','arms']},
  chestpress:{name:'坐姿推胸',steps:['调节座椅，使把手大致对齐胸部，背部靠稳。','向前推出把手，再受控收回。'],cues:['双脚稳定支撑，手腕与前臂自然对齐。','回程不让配重片突然撞击。'],secondary:['shoulders','arms']},
  fly:{name:'水平内收',steps:['在稳定支撑下打开双臂，肘部保留轻微弯曲。','双臂向身体中线合拢，再受控展开。'],cues:['主要改变肩部开合，肘部弯曲程度保持相对稳定。','选择能控制的幅度，不强行向后拉伸。'],secondary:['shoulders']},
  pushup:{name:'俯卧撑',steps:['双手支撑，身体从头到支撑点保持连贯，弯肘下降。','推离地面，回到手臂伸展的位置。'],cues:['躯干一起移动，避免塌腰或先抬头。','跪姿版本以膝部为后方支撑点。'],secondary:['shoulders','arms','core']},
  overhead:{name:'头上推举',steps:['器械停在肩部附近，躯干稳定，前臂支撑重量。','向头上方推起，再受控下降至准备位置。'],cues:['避免通过大幅后仰完成推举。','在可控制且舒适的活动范围内移动。'],secondary:['arms']},
  lateral:{name:'侧向抬臂',steps:['站稳或按器械要求坐稳，手臂在身体两侧自然下垂。','向侧方抬臂，再缓慢放下。'],cues:['肘部略弯，避免甩动身体借力。','在舒适范围内抬起，不强行追求高度。'],secondary:[]},
  frontRaise:{name:'前方抬臂',steps:['双脚稳定，器械置于身体前方，肘部略弯。','向前抬起手臂，再受控放回。'],cues:['保持躯干稳定，避免后仰甩起。','使用能缓慢回落的重量。'],secondary:[]},
  reverseFly:{name:'反向展开',steps:['俯身或靠稳器械胸垫，双手位于身体前方。','向两侧展开双臂，再受控回到前方。'],cues:['保持颈部自然，不以耸肩代替展开。','俯身版本先稳定髋部和躯干。'],secondary:['back']},
  facepull:{name:'面拉',steps:['滑轮设在面部附近高度，双手握绳，身体站稳。','将绳索拉向面部两侧，再受控送回。'],cues:['双手向面部两侧分开，不拉向喉部。','不要后仰甩动或突然松开绳索。'],secondary:['back','arms']},
  pulldown:{name:'垂直下拉',steps:['坐稳并调节腿垫，双手握把，手臂向上伸展。','将把手拉向上胸前方，再受控上送。'],cues:['把手在身体前方移动，不做颈后下拉。','避免猛然后仰，以可控制的重量练习。'],secondary:['arms','shoulders']},
  pullup:{name:'悬垂上拉',steps:['握稳单杠，身体悬垂，肩部保持可控制的支撑。','向上拉起身体，再缓慢下降。'],cues:['避免借助大幅摆动完成次数。','正握与反握的手掌方向不同，按动作名称选择。'],secondary:['arms','shoulders']},
  row:{name:'水平划船',steps:['坐稳或靠稳胸垫，双臂向前伸展，握住把手。','把手拉向躯干附近，再受控前送。'],cues:['躯干保持稳定，不以反复前后摆动借力。','依器械结构选择自然的肘部路径。'],secondary:['arms','shoulders']},
  bentRow:{name:'俯身划船',steps:['髋部后移并俯身，背部保持自然，手持器械下垂。','将器械拉向躯干附近，再缓慢下放。'],cues:['先建立稳定的髋部与躯干支撑。','单臂版本可用另一侧手和膝稳定支撑。'],secondary:['arms','core']},
  straightPull:{name:'直臂下压',steps:['面向高位滑轮站稳，手臂向前上方伸展，肘略弯。','手臂向大腿方向下压，再受控回到前上方。'],cues:['肘部弯曲角度相对稳定，不变成肱三头肌下压。','保持躯干稳定，不用身体下沉压动配重。'],secondary:['arms','core']},
  curl:{name:'屈肘弯举',steps:['上臂稳定，手持器械，肘部自然伸展。','弯曲肘部抬起器械，再慢慢放下。'],cues:['减少肩部前后摆动。','锤式弯举保持掌心相对；其他版本按握法选择。'],secondary:[]},
  pushdown:{name:'伸肘下压',steps:['面向滑轮站稳，上臂靠近躯干，屈肘握住把手。','伸展肘部向下压，再受控回到屈肘位置。'],cues:['上臂尽量稳定，避免整条手臂大幅前后摆。','不要通过俯身猛压完成动作。'],secondary:[]},
  extension:{name:'头上臂屈伸',steps:['站稳或坐稳，器械位于头后，上臂保持稳定。','伸展肘部抬起器械，再受控回落。'],cues:['避免大幅挺腰，选择舒适的上臂位置。','不要让器械碰撞头颈。'],secondary:[]},
  lyingExtension:{name:'仰卧臂屈伸',steps:['仰卧在凳上，上臂向上，弯肘使器械靠近头部上方。','伸展肘部抬起器械，再受控弯肘。'],cues:['上臂尽量稳定，器械与面部留出距离。','先用容易控制的重量熟悉路径。'],secondary:[]},
  squat:{name:'下蹲与起身',steps:['双脚站稳，保持躯干稳定，准备屈髋屈膝。','下蹲至稳定可控的位置，再沿原路径站起。'],cues:['膝部朝向与脚尖大致一致。','下蹲深度以稳定、可控制的范围为准。'],secondary:['core']},
  hinge:{name:'髋部折叠',steps:['双脚稳定，膝部略弯，器械位于腿前。','髋部后移使器械沿腿前下降，再伸髋站起。'],cues:['躯干保持自然，不以弓背追求下降深度。','这是髋部主导的动作，不必刻意把器械放到地面。'],secondary:['back','core']},
  legpress:{name:'器械蹬伸',steps:['背部和骨盆靠稳，双脚踩住踏板，屈髋屈膝。','向前蹬出踏板，再受控回收。'],cues:['根据器械说明调节座椅与踏板位置。','不要在回程中让骨盆明显卷起离开靠垫。'],secondary:[]},
  lunge:{name:'分腿下蹲',steps:['前后分腿站稳，屈髋屈膝使身体下降。','通过前后脚的稳定支撑回到起始高度。'],cues:['保加利亚版本后脚抬高支撑；箭步蹲后脚在地。','先稳定平衡，避免膝部突然内扣。'],secondary:['core']},
  legextension:{name:'坐姿伸膝',steps:['坐稳，膝部对齐器械转轴，小腿垫放在踝部上方。','伸展膝部抬起小腿，再缓慢放下。'],cues:['背部靠稳，按器械说明调节挡垫。','避免甩腿或突然撞击配重。'],secondary:[]},
  legcurl:{name:'俯卧屈膝',steps:['俯卧靠稳器械，调节转轴和小腿垫位置。','弯曲膝部将脚跟拉近臀部，再受控伸回。'],cues:['骨盆保持稳定，不通过抬髋完成弯腿。','按器械说明调节挡垫，避免压在关节上。'],secondary:[]},
  calf:{name:'踝部提踵',steps:['双脚站稳，需要时扶住固定支撑。','抬起脚跟，再缓慢落回。'],cues:['通过踝部移动，不用膝部反复弹跳。','先使用稳定地面，再考虑增加外部负重。'],secondary:[]},
  crunch:{name:'躯干卷起',steps:['按动作选择仰卧或器械坐姿，稳定骨盆和支撑点。','通过躯干卷曲靠近骨盆，再缓慢回到起始位置。'],cues:['避免用手猛拉头颈。','卷腹动作幅度较小，仰卧起坐的躯干抬起幅度更大。'],secondary:[]},
  cableCrunch:{name:'跪姿绳索卷腹',steps:['面向高位滑轮跪稳，握绳置于头部两侧。','通过躯干卷曲使胸部靠近骨盆，再受控展开。'],cues:['避免只用髋部前后坐动拉动绳索。','手臂用于握持，不主动大幅下拉。'],secondary:[]},
  legraise:{name:'举腿与回落',steps:['仰卧或悬垂，稳定躯干，双腿处于下方位置。','抬起双腿或膝部，再缓慢回落。'],cues:['避免用摆动甩起双腿。','根据自身控制能力选择膝部弯曲程度和幅度。'],secondary:['legs']},
  reverseCrunch:{name:'骨盆卷起',steps:['仰卧，屈髋屈膝抬起双腿。','轻轻卷起骨盆，再受控放回。'],cues:['动作幅度以能够控制为准。','不要借助双腿猛甩身体。'],secondary:['legs']},
  deadbug:{name:'仰卧对侧伸展',steps:['仰卧，手臂向上，髋膝弯曲抬起双腿。','对侧手臂与腿缓慢伸远，再收回并换侧。'],cues:['保持躯干稳定，避免腰部明显拱起。','每完成一侧伸展并收回计 1 次，两侧合计。'],secondary:['legs','shoulders']},
  birddog:{name:'四点支撑伸展',steps:['双手与双膝支撑，保持躯干稳定。','伸出对侧手臂与腿，收回后换侧。'],cues:['减少骨盆旋转，不靠抬高腿来挺腰。','每完成一侧伸展并收回计 1 次，两侧合计。'],secondary:['back','legs','shoulders']},
  twist:{name:'坐姿转体',steps:['坐稳，膝部弯曲，双脚着地，双手持器械于身前。','躯干向一侧转动，再经过中间转向另一侧。'],cues:['在可控制的范围内转动，不猛甩重量。','每转向一侧并回到中间计 1 次，两侧合计。'],secondary:[]},
};

const row=(name,group,equipment,pattern,primary,options={})=>({name,group,equipment,pattern,primary,tracking:'weighted',...options});
export const builtInExercises=[
  row('杠铃卧推','chest','杠铃','bench','胸大肌'),
  row('上斜哑铃卧推','chest','哑铃','incline','胸大肌（上部参与）'),
  row('器械夹胸','chest','器械','fly','胸大肌'),
  row('哑铃卧推','chest','哑铃','bench','胸大肌'),
  row('器械推胸','chest','器械','chestpress','胸大肌'),
  row('绳索夹胸','chest','绳索','fly','胸大肌'),
  row('哑铃飞鸟','chest','哑铃','fly','胸大肌'),
  row('俯卧撑','chest','自重','pushup','胸大肌',{tracking:'reps'}),
  row('跪姿俯卧撑','chest','自重','pushup','胸大肌',{tracking:'reps',variant:'kneeling'}),
  row('上斜杠铃卧推','chest','杠铃','incline','胸大肌（上部参与）'),
  row('哑铃肩推','shoulders','哑铃','overhead','三角肌'),
  row('哑铃侧平举','shoulders','哑铃','lateral','三角肌中束'),
  row('反向飞鸟','shoulders','器械','reverseFly','三角肌后束'),
  row('杠铃推举','shoulders','杠铃','overhead','三角肌'),
  row('器械推肩','shoulders','器械','overhead','三角肌'),
  row('绳索侧平举','shoulders','绳索','lateral','三角肌中束',{variant:'single'}),
  row('哑铃前平举','shoulders','哑铃','frontRaise','三角肌前束'),
  row('面拉','shoulders','绳索','facepull','三角肌后束、肩胛周围肌群'),
  row('俯身哑铃反向飞鸟','shoulders','哑铃','reverseFly','三角肌后束',{variant:'bent'}),
  row('固定器械推肩','shoulders','器械','overhead','三角肌'),
  row('高位下拉','back','器械','pulldown','背阔肌'),
  row('坐姿划船','back','绳索','row','背阔肌、菱形肌'),
  row('杠铃划船','back','杠铃','bentRow','背阔肌、肩胛周围肌群'),
  row('引体向上','back','自重','pullup','背阔肌',{tracking:'reps'}),
  row('反手引体向上','back','自重','pullup','背阔肌',{tracking:'reps',variant:'underhand'}),
  row('单臂哑铃划船','back','哑铃','bentRow','背阔肌',{variant:'single'}),
  row('胸托哑铃划船','back','哑铃','row','背阔肌、菱形肌',{variant:'supported'}),
  row('直臂下压','back','绳索','straightPull','背阔肌'),
  row('器械划船','back','器械','row','背阔肌、菱形肌'),
  row('窄握高位下拉','back','器械','pulldown','背阔肌',{variant:'narrow'}),
  row('哑铃弯举','arms','哑铃','curl','肱二头肌'),
  row('绳索下压','arms','绳索','pushdown','肱三头肌'),
  row('锤式弯举','arms','哑铃','curl','肱肌、肱桡肌、肱二头肌',{variant:'hammer'}),
  row('杠铃弯举','arms','杠铃','curl','肱二头肌'),
  row('牧师凳弯举','arms','杠铃','curl','肱二头肌',{variant:'preacher'}),
  row('上斜哑铃弯举','arms','哑铃','curl','肱二头肌',{variant:'incline'}),
  row('绳索弯举','arms','绳索','curl','肱二头肌'),
  row('仰卧臂屈伸','arms','杠铃','lyingExtension','肱三头肌'),
  row('绳索过顶臂屈伸','arms','绳索','extension','肱三头肌'),
  row('哑铃过顶臂屈伸','arms','哑铃','extension','肱三头肌'),
  row('杠铃深蹲','legs','杠铃','squat','股四头肌、臀大肌'),
  row('腿举','legs','器械','legpress','股四头肌、臀大肌'),
  row('罗马尼亚硬拉','legs','杠铃','hinge','腘绳肌、臀大肌'),
  row('高脚杯深蹲','legs','哑铃','squat','股四头肌、臀大肌',{variant:'goblet'}),
  row('徒手深蹲','legs','自重','squat','股四头肌、臀大肌',{tracking:'reps',variant:'bodyweight'}),
  row('哑铃箭步蹲','legs','哑铃','lunge','股四头肌、臀大肌'),
  row('保加利亚分腿蹲','legs','哑铃','lunge','股四头肌、臀大肌',{variant:'elevated'}),
  row('坐姿腿屈伸','legs','器械','legextension','股四头肌'),
  row('俯卧腿弯举','legs','器械','legcurl','腘绳肌'),
  row('站姿提踵','legs','哑铃','calf','腓肠肌、比目鱼肌'),
  row('仰卧起坐','core','自重','crunch','腹直肌、髋屈肌',{tracking:'reps',variant:'situp'}),
  row('悬挂举腿','core','自重','legraise','腹部肌群、髋屈肌',{tracking:'reps',variant:'hanging'}),
  row('绳索卷腹','core','绳索','cableCrunch','腹直肌'),
  row('器械卷腹','core','器械','crunch','腹直肌',{variant:'machine'}),
  row('卷腹','core','自重','crunch','腹直肌',{tracking:'reps'}),
  row('反向卷腹','core','自重','reverseCrunch','腹直肌',{tracking:'reps'}),
  row('仰卧举腿','core','自重','legraise','腹部肌群、髋屈肌',{tracking:'reps'}),
  row('死虫式','core','自重','deadbug','腹部稳定肌群',{tracking:'reps'}),
  row('鸟狗式','core','自重','birddog','躯干稳定肌群',{tracking:'reps'}),
  row('俄罗斯转体','core','哑铃','twist','腹斜肌'),
];

export function exerciseGuide(name,customExercises=[]){
  if(customExercises.some(e=>e.name===name))return null;
  const e=builtInExercises.find(e=>e.name===name);
  return e?{...movementPatterns[e.pattern],...e,patternName:movementPatterns[e.pattern].name}:null;
}
export function exerciseRecordingHint(name,customExercises=[]){
  const custom=customExercises.find(e=>e.name===name),builtIn=builtInExercises.find(e=>e.name===name);
  if(custom?.note)return custom.note;
  const tracking=custom?(custom.tracking??'weighted'):builtIn?.tracking;
  if(tracking==='reps')return '自重动作 · 只记录实际完成次数';
  if(!custom&&name==='单臂哑铃划船')return '记录单侧哑铃重量 · kg；两侧分别记录一组';
  if(!custom&&name==='哑铃过顶臂屈伸')return '双手共同持握单只哑铃，记录这只哑铃的实际重量 · kg';
  return name.includes('哑铃')||name.includes('锤式')?'双侧总重量 · kg；与历史保持一致':'记录器械标示或使用的总重量 · kg；与历史保持一致';
}
export function filterExercises(catalog,{query='',equipment='all',group='all'}={},customExercises=[]){
  const q=String(query).normalize('NFKC').trim().toLowerCase();
  return catalog.filter(g=>group==='all'||g.id===group).flatMap(g=>g.exercises.map(name=>({name,group:g.id,groupName:g.name,guide:exerciseGuide(name,customExercises),custom:customExercises.find(e=>e.name===name)}))).filter(e=>{
    if(equipment!=='all'&&e.guide?.equipment!==equipment)return false;
    return !q||[e.name,e.groupName,e.guide?.primary,e.guide?.equipment,e.custom?.note].some(t=>String(t??'').normalize('NFKC').toLowerCase().includes(q));
  });
}

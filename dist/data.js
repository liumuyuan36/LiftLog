export const groups = [
  { id: 'chest', name: '胸', en: 'CHEST', color: '#99c96c', short: '推', exercises: ['杠铃卧推', '上斜哑铃卧推', '器械夹胸'] },
  { id: 'shoulders', name: '肩膀', en: 'SHOULDERS', color: '#93bacc', short: '肩', exercises: ['哑铃肩推', '哑铃侧平举', '反向飞鸟'] },
  { id: 'back', name: '背', en: 'BACK', color: '#b9a6d3', short: '拉', exercises: ['高位下拉', '坐姿划船', '杠铃划船'] },
  { id: 'arms', name: '手臂', en: 'ARMS', color: '#e0b88a', short: '臂', exercises: ['哑铃弯举', '绳索下压', '锤式弯举'] },
  { id: 'legs', name: '腿', en: 'LEGS', color: '#d69c9c', short: '腿', exercises: ['杠铃深蹲', '腿举', '罗马尼亚硬拉'] },
  { id: 'core', name: '核心', en: 'CORE', color: '#b9c4a2', short: '核', exercises: ['仰卧起坐', '悬挂举腿', '绳索卷腹', '器械卷腹'] },
];
export const uid = () => crypto.randomUUID();
export function trackingForName(name, customExercises = []) {
  const custom = customExercises.find(e => e.name === name);
  return custom ? custom.tracking ?? 'weighted' : ['仰卧起坐', '悬挂举腿'].includes(name) ? 'reps' : 'weighted';
}
export function exerciseCatalog(customExercises = []) {
  return groups.map(g => ({ ...g, exercises: [...g.exercises.filter(name => !customExercises.some(e => e.name === name)), ...customExercises.filter(e => e.group === g.id && !e.deleted).map(e => e.name)] }));
}
export function setCustomExerciseDeleted(data, id, deleted) {
  if (!data.customExercises?.some(e => e.id === id)) throw Error('找不到自定义动作');
  return {...data, customExercises:data.customExercises.map(e => e.id === id ? {...e,deleted} : e)};
}
export function validateCustomExercise(exercise, customExercises = []) {
  const normalize = value => String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
  const name = String(exercise.name ?? '').trim();
  if (!name || name.length > 60) return '动作名称请输入 1–60 个字符。';
  if (!groups.some(g => g.id === exercise.group)) return '请选择有效的身体部位。';
  if (exercise.tracking !== undefined && !['weighted','reps'].includes(exercise.tracking)) return '请选择有效的记录方式。';
  if (String(exercise.note ?? '').length > 160) return '器械备注最多 160 个字符。';
  if (customExercises.some(e => e.deleted && normalize(e.name) === normalize(name))) return '同名动作已删除，请在动作库底部的“已删除动作”中恢复，或使用不同名称。';
  if (exerciseCatalog(customExercises).flatMap(g => g.exercises).some(n => normalize(n) === normalize(name))) return '这个动作名称已存在。不同器械请加上品牌或型号区分。';
  return '';
}
export const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export function daysAgo(n) { const d = new Date(); d.setDate(d.getDate()-n); return localDate(d); }
export const workSets = session => session.exercises.flatMap(e => e.sets.filter(s => s.done && s.type !== 'warmup'));
export const volume = session => session.exercises.filter(e => e.tracking !== 'reps').flatMap(e => e.sets).filter(s => s.done && s.type !== 'warmup' && s.tracking !== 'reps').reduce((n,s) => n + Number(s.weight) * Number(s.reps), 0);
export const e1rm = s => s.tracking === 'reps' || !s.done || s.type === 'warmup' || s.reps < 1 || s.reps > 10 ? null : Number(s.reps) === 1 ? Number(s.weight) : Number(s.weight) * (1 + Number(s.reps) / 30);
export const bestEstimate = (session, name) => Math.max(0, ...session.exercises.filter(e => e.name === name && e.tracking !== 'reps').flatMap(e => e.sets.map(s => e1rm(s) || 0)));
export const bodyweightReps = session => session.exercises.filter(e => e.tracking === 'reps').flatMap(e => e.sets).filter(s => s.done && s.type !== 'warmup').reduce((sum,s) => sum + Number(s.reps), 0);
export const bestReps = (session, name) => Math.max(0, ...session.exercises.filter(e => e.name === name && e.tracking === 'reps').flatMap(e => e.sets.filter(s => s.done && s.type !== 'warmup').map(s => Number(s.reps))));
export function inPeriod(session, range) {
  const start = new Date(); start.setHours(0,0,0,0);
  if (range === 'week') start.setDate(start.getDate() - (start.getDay()+6)%7);
  else start.setDate(start.getDate() - Number(range) + 1);
  return session.date >= localDate(start) && session.date <= localDate();
}
export function validateSet(set, tracking = set.tracking ?? 'weighted') {
  if (tracking !== 'reps' && (set.weight === '' || !Number.isFinite(Number(set.weight)) || Number(set.weight) < 0 || Number(set.weight) > 1500)) return '重量请输入 0–1500 kg';
  if (set.reps === '' || !Number.isInteger(Number(set.reps)) || Number(set.reps) < 1 || Number(set.reps) > 100) return '次数请输入 1–100 的整数';
  if (set.rir !== '' && (!Number.isFinite(Number(set.rir)) || Number(set.rir) < 0 || Number(set.rir) > 10)) return 'RIR 请输入 0–10，或留空';
  return '';
}
export function records(sessions) {
  const map = new Map();
  for (const session of [...sessions].sort((a,b) => a.date.localeCompare(b.date) || (a.createdAt||'').localeCompare(b.createdAt||''))) {
    for (const e of session.exercises) {
      const prev = map.get(e.name) || { name: e.name, group: e.group, tracking: e.tracking ?? 'weighted', bestReps: 0, weight: 0, estimate: 0, repsByWeight: {} };
      for (const s of e.sets.filter(s => s.done && s.type !== 'warmup')) {
        if (e.tracking === 'reps') {prev.bestReps = Math.max(prev.bestReps, Number(s.reps));continue;}
        prev.weight = Math.max(prev.weight, Number(s.weight));
        prev.estimate = Math.max(prev.estimate, e1rm(s)||0);
        const weightKey = Number(s.weight);
        prev.repsByWeight[weightKey] = Math.max(prev.repsByWeight[weightKey]||0, Number(s.reps));
      }
      if (e.sets.some(s => s.done && s.type !== 'warmup')) map.set(e.name, prev);
    }
  }
  return [...map.values()];
}
export function makeDemo() {
  const plan = [
    [27,'推日 · 胸与肩',[['chest','杠铃卧推',50],['shoulders','哑铃肩推',24]]],
    [23,'拉日 · 背与手臂',[['back','高位下拉',40],['arms','哑铃弯举',16]]],
    [20,'推日 · 胸与肩',[['chest','杠铃卧推',52.5],['shoulders','哑铃侧平举',12]]],
    [16,'下肢训练',[['legs','杠铃深蹲',60],['core','绳索卷腹',20]]],
    [13,'推日 · 胸与肩',[['chest','杠铃卧推',55],['shoulders','哑铃肩推',28]]],
    [9,'拉日 · 背与手臂',[['back','高位下拉',45],['arms','哑铃弯举',18]]],
    [6,'推日 · 胸与肩',[['chest','杠铃卧推',55],['shoulders','哑铃侧平举',14],['arms','绳索下压',25]]],
    [3,'下肢训练',[['legs','杠铃深蹲',65],['core','绳索卷腹',25]]],
    [1,'推日 · 胸与手臂',[['chest','杠铃卧推',57.5],['chest','器械夹胸',35],['arms','绳索下压',27.5]]],
    [0,'拉日 · 背与肩',[['back','高位下拉',47.5],['back','坐姿划船',40],['shoulders','反向飞鸟',16]]],
  ];
  return {
    sessions: plan.map(([ago,title,ex],i) => ({ id: uid(), title, date: daysAgo(ago), duration: 42+i*2, createdAt: daysAgo(ago)+'T09:00:00Z', exercises: ex.map(([group,name,weight]) => ({id:uid(),group,name,sets:[10,10,8].map((reps,j)=>({id:uid(),weight,reps,rir:j===2?1:2,type:'working',done:true}))})) })),
    weights: [27,20,13,6,0].map((ago,i)=>({date:daysAgo(ago),weight:58.1+i*.2})), draft: null,
  };
}

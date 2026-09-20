import { groups, uid, localDate, daysAgo, workSets, volume, bestEstimate, records, makeDemo, inPeriod, validateSet, exerciseCatalog, validateCustomExercise, trackingForName, bodyweightReps, bestReps, setCustomExerciseDeleted } from './data.js';

const icons = {
  grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  dumbbell:'M3 8v8 M7 5v14 M17 5v14 M21 8v8 M7 12h10',
  history:'M3 11a9 9 0 1 1 2 7 M3 4v7h7 M12 7v5l3 2',
  chart:'M4 3v17h17 M8 15l4-5 4 2 5-7',
  settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z',
  plus:'M12 5v14 M5 12h14', arrow:'M5 12h14 M14 7l5 5-5 5',
  calendar:'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z M7 3v4 M17 3v4 M3 11h18',
  weight:'M6 5h12l3 15H3z M9 5V3h6v2 M9 10h6',
  layers:'M12 3l10 5-10 5L2 8z M2 12l10 5 10-5 M2 16l10 5 10-5',
  trophy:'M8 3h8v8a4 4 0 0 1-8 0z M8 5H4v3a4 4 0 0 0 4 4 M16 5h4v3a4 4 0 0 1-4 4 M12 15v5 M8 21h8',
  close:'M6 6l12 12 M6 18L18 6', check:'M5 12l4 4L19 6', trash:'M3 6h18 M8 6V3h8v3 M6 6l1 15h10l1-15 M10 10v7 M14 10v7',
  download:'M12 3v12 M7 10l5 5 5-5 M4 16v5h16v-5', clock:'M12 8v5l3 2 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
};
const icon = n => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[n]||icons.dumbbell}"/></svg>`;
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = n => Number(n).toLocaleString('zh-CN',{maximumFractionDigits:1});
const groupById = id => groups.find(g=>g.id===id);
let storageError = '';
let mode = 'demo';
try { mode = localStorage.getItem('liftlog-mode') === 'personal' ? 'personal' : 'demo'; } catch { storageError = '浏览器存储不可用，本次更改无法持久保存。'; }
function load() {
  const fallback = () => mode === 'demo' ? makeDemo() : { sessions:[], weights:[], draft:null };
  try {
    const raw = localStorage.getItem(`liftlog-v1-${mode}`);
    if (!raw) return fallback();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.sessions) || !Array.isArray(parsed.weights) || !parsed.sessions.every(s=>Array.isArray(s.exercises)&&s.exercises.every(e=>Array.isArray(e.sets)))) throw Error('格式错误');
    if (parsed.customExercises !== undefined && !Array.isArray(parsed.customExercises)) throw Error('动作库格式错误');
    return { ...parsed, customExercises: parsed.customExercises ?? [] };
  } catch { storageError = '无法读取已保存的记录，当前显示临时数据。请先导出备份；原存储不会被覆盖。'; return fallback(); }
}
let data = load();
const catalog = () => exerciseCatalog(data.customExercises ?? []);
const trendNames = () => [...new Set([...catalog().flatMap(g=>g.exercises), ...data.sessions.flatMap(s=>s.exercises.map(e=>e.name))])];
const exerciseNames = group => catalog().find(g => g.id === group)?.exercises ?? [];
const customExercise = name => data.customExercises?.find(e => e.name === name);
const trackingFor = name => trackingForName(name, data.customExercises ?? []);
function exerciseHint(exercise) {
  if(exercise.tracking === 'reps') return '自重动作 · 只记录次数' + (exercise.note ? ' · '+exercise.note : '');
  return exercise.note || customExercise(exercise.name)?.note || (exercise.name.includes('哑铃') || exercise.name.includes('锤式') ? '双侧总重量 · kg' : '记录总重量 · kg');
}
function persist() {
  if(storageError) { toast(storageError); return false; }
  try { localStorage.setItem(`liftlog-v1-${mode}`,JSON.stringify(data)); return true; }
  catch { toast('保存失败：浏览器存储空间不足或不可用，请导出备份。'); return false; }
}
let page = 'overview', selectedGroup = 'all', chartExercise = '杠铃卧推', chartRange = '28';
let editorSession = null, editingId = null, pickerGroup = 'chest', restUntil = 0;
const app = document.querySelector('#app');
const editor = document.querySelector('#editor');
const weightDialog = document.querySelector('#weight-dialog');
const customDialog = document.querySelector('#custom-dialog');
let toastTimer;
function toast(message) { const el=document.querySelector('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),4200); }
function navButton(id,name,glyph) { return `<button data-action="nav" data-page="${id}" class="${page===id?'active':''}" ${page===id?'aria-current="page"':''}>${icon(glyph)}<span>${name}</span></button>`; }
function render() {
  const headings = {overview:'训练概览',train:'开始训练',history:'训练历史',progress:'进步趋势',settings:'数据与设置'};
  app.innerHTML = `<aside class="sidebar"><div class="brand"><img src="./favicon.svg" alt=""><div class="brand-word">Lift<span>Log</span></div></div><div class="brand-sub">每一组，都算数</div><div class="nav-label">我的训练空间</div><nav class="nav" aria-label="主要导航">${navButton('overview','训练概览','grid')}${navButton('train','开始训练','dumbbell')}${navButton('history','训练历史','history')}${navButton('progress','进步趋势','chart')}${navButton('settings','数据与设置','settings')}</nav><div class="side-note"><strong>专注当下这一组。</strong>进步，藏在每一次记录里。</div><div class="side-profile"><div class="avatar">L</div><div>我的训练日志<br><small class="muted">${mode==='demo'?'示例体验空间':'本机个人空间'}</small></div></div></aside><main class="main"><header class="topbar"><span class="crumb">我的空间 <span class="muted">/ ${headings[page]}</span></span><div class="top-actions"><time>${new Date().toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'long'})}</time><span class="mode-badge">${mode==='demo'?'示例数据':'本地保存'}</span>${mode==='demo'?'<button class="text-btn" data-action="personal">开始我的记录</button>':''}</div></header>${storageError?`<div class="notice">${esc(storageError)}</div>`:''}${page==='overview'?overview():page==='train'?training():page==='history'?historyPage():page==='progress'?progressPage():settingsPage()}<footer class="footer"><span>LIFTLOG / 每一组，都算数</span><span>${mode==='demo'?'当前为示例数据':'记录仅保存在当前浏览器'} · V1.0</span></footer></main>`;
}
function heading(eyebrow,title,sub,button=true) { return `<div class="page-heading"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="sub">${sub}</p></div>${button?`<button class="primary" data-action="start">${icon('plus')}${data.draft?'继续训练':'记录训练'}</button>`:''}</div>`; }
function stat(label,value,unit,foot,glyph) { return `<article class="stat"><div class="stat-label">${label}${icon(glyph)}</div><div class="stat-value">${value}<span class="unit">${unit}</span></div><div class="stat-foot">${foot}</div></article>`; }
function overview() {
  const week=data.sessions.filter(s=>inPeriod(s,'week')), recent=data.sessions.filter(s=>inPeriod(s,'7'));
  const weights=[...data.weights].sort((a,b)=>a.date.localeCompare(b.date));
  return heading('YOUR TRAINING, AT A GLANCE','让每一次训练，都有迹可循。','记录今天的努力，看见一点一滴的进步。') +
    `<section class="stats" aria-label="训练统计">${stat('本周训练',week.length,'次','周一至今 · 已完成训练','calendar')}${stat('本周训练容量',fmt(week.reduce((n,s)=>n+volume(s),0)),'kg','仅负重工作组 · 自重不计入','weight')}${stat('本周工作组',week.reduce((n,s)=>n+workSets(s).length,0),'组','热身组不计入统计','layers')}${stat('最新体重',weights.length?fmt(weights.at(-1).weight):'—','kg',`<button class="view-link" data-action="weight">${weights.length?weights.at(-1).date+' · 更新':'记录你的第一次体重'} ${icon('plus')}</button>`,'chart')}</section>
    <section class="body-section"><div class="section-head"><h2>今天，练哪里？</h2><span class="muted">按身体部位开始</span></div>${bodyCards(recent)}</section>
    <div class="dashboard-grid">${trendPanel()}${musclePanel(recent)}</div>
    <section class="panel"><div class="section-head"><h2>最近训练</h2><button class="view-link" data-action="nav" data-page="history">全部记录 ${icon('arrow')}</button></div>${historyRows(sortedSessions().slice(0,3))}</section>`;
}
function bodyCards(sessions=[],filter=false) {
  return `<div class="body-grid">${groups.map(g=>{const count=sessions.flatMap(s=>s.exercises).filter(e=>e.group===g.id).flatMap(e=>e.sets).filter(s=>s.done&&s.type!=='warmup').length;return `<button class="body-card ${filter&&selectedGroup===g.id?'active':''}" style="--tone:${g.color}" data-action="category" data-group="${g.id}"><span class="body-icon">${icon('dumbbell')}</span><span class="arrow">↗</span><strong>${g.name}</strong><small>${g.en}</small><span class="count">${filter?exerciseNames(g.id).length+' 个动作':`近 7 天 · ${count} 组`}</span></button>`;}).join('')}</div>`;
}
function lineChart(points,unit='kg') {
  if(!points.length) return `<div class="empty">还没有可展示的数据<br><small>完成训练后，你的进步会出现在这里。</small></div>`;
  const width=540,height=150,left=42,right=15,top=18,bottom=25;
  const values=points.map(p=>p.value),min=Math.min(...values),max=Math.max(...values),pad=Math.max((max-min)*.4,1);
  const low=Math.max(0,min-pad),high=max+pad;
  const x=i=>points.length===1?(width+left)/2:left+i*(width-left-right)/(points.length-1),y=v=>top+(high-v)/(high-low)*(height-top-bottom);
  const coords=points.map((p,i)=>`${x(i)},${y(p.value)}`);
  return `<svg class="chart" role="img" aria-label="${esc(points.map(p=>`${p.date}：${fmt(p.value)} ${unit}`).join('；'))}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none"><defs><linearGradient id="area-${unit}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#b6d490" stop-opacity=".26"/><stop offset="100%" stop-color="#b6d490" stop-opacity=".01"/></linearGradient></defs>${[0,.5,1].map(t=>{const v=low+(high-low)*t;return `<line x1="${left}" y1="${y(v)}" x2="${width-right}" y2="${y(v)}"/><text x="0" y="${y(v)+4}">${fmt(v)}</text>`;}).join('')}${points.length>1?`<path d="M${coords.join(' L')} L${x(points.length-1)},${height-bottom} L${left},${height-bottom} Z" fill="url(#area-${unit})"/>`:''}<polyline class="series" points="${coords.join(' ')}"/>${points.map((p,i)=>`<circle cx="${x(i)}" cy="${y(p.value)}" r="3.5"><title>${p.date} · ${fmt(p.value)} ${unit}</title></circle>${i===0||i===points.length-1||(points.length>3&&i===Math.floor(points.length/2))?`<text text-anchor="middle" x="${x(i)}" y="${height-2}">${p.date.slice(5).replace('-','/')}</text>`:''}`).join('')}</svg>`;
}
function trendPanel() {
  const repsOnly=trackingFor(chartExercise)==='reps';
  const pts=sortedSessions().reverse().filter(s=>inPeriod(s,chartRange)).map(s=>({date:s.date,value:repsOnly?bestReps(s,chartExercise):bestEstimate(s,chartExercise)})).filter(p=>p.value>0);
  const latest=pts.at(-1)?.value,change=pts.length>1&&pts[0].value>0?(latest-pts[0].value)/pts[0].value*100:null;
  return `<section class="panel"><div class="section-head"><h2>${repsOnly?'次数变化':'力量变化'} <span class="muted" style="font-size:12px;font-weight:400">/ ${repsOnly?'单组最佳':'e1RM'}</span></h2><div class="segmented" aria-label="趋势时间范围">${['28','90'].map(r=>`<button class="${r===chartRange?'active':''}" data-action="range" data-range="${r}">${r==='28'?'4 周':'90 天'}</button>`).join('')}</div></div><select id="chart-exercise" aria-label="选择趋势动作">${trendNames().map(name=>`<option ${name===chartExercise?'selected':''}>${esc(name)}</option>`).join('')}</select><div class="chart-head"><span class="chart-value">${latest?fmt(latest):'—'}<span class="unit">${repsOnly?'次':'kg'}</span></span>${change!==null?`<span class="positive">${change>=0?'↗':'↘'} ${Math.abs(change).toFixed(1)}% · 较区间首次</span>`:'<span class="muted" style="font-size:12px">记录积累，进步可见</span>'}</div>${lineChart(pts,repsOnly?'次':'kg')}<p class="chart-foot">${repsOnly?'每次训练单组最多次数 · 已完成工作组':'每次训练最佳估算值 · 仅统计 1–10 次工作组'}</p></section>`;
}
function musclePanel(sessions) {
  const counts=groups.map(g=>({...g,count:sessions.flatMap(s=>s.exercises).filter(e=>e.group===g.id).flatMap(e=>e.sets).filter(s=>s.done&&s.type!=='warmup').length}));
  const max=Math.max(1,...counts.map(g=>g.count));
  return `<section class="panel"><div class="section-head"><h2>身体部位训练分布</h2><span class="muted">近 7 天</span></div><p class="sub">按动作所属部位统计工作组</p><div class="muscle-bars">${counts.map(g=>`<div class="bar-row"><span>${g.name}</span><div class="bar-track"><div class="bar-fill" style="width:${g.count/max*100}%;background:${g.color}"></div></div><span class="bar-num">${g.count} 组</span></div>`).join('')}</div></section>`;
}
const sortedSessions = () => [...data.sessions].sort((a,b)=>b.date.localeCompare(a.date)||(b.createdAt||'').localeCompare(a.createdAt||''));
function historyRows(sessions) {
  if(!sessions.length) return '<div class="empty">还没有训练记录。<br>点击「记录训练」，从第一组开始。</div>';
  return sessions.map(s=>`<button class="history-row" data-action="edit" data-id="${s.id}" aria-label="查看 ${esc(s.title)} ${s.date}"><span class="date-block"><strong>${s.date.slice(8)}</strong><small>${Number(s.date.slice(5,7))} 月</small></span><span><span class="history-title">${esc(s.title)}</span><span class="history-meta" style="display:block">${s.exercises.length} 个动作 · ${workSets(s).length} 工作组 · ${s.duration} 分钟${bodyweightReps(s)?` · 自重 ${bodyweightReps(s)} 次`:''}</span></span><span class="chips">${[...new Set(s.exercises.map(e=>e.group))].map(g=>`<span class="chip">${groupById(g)?.name||''}</span>`).join('')}</span><span class="row-volume">${s.exercises.every(e=>e.tracking==='reps')?`${fmt(bodyweightReps(s))}<small> 次</small>`:`${fmt(volume(s))}<small> kg</small>`}</span>${icon('arrow')}</button>`).join('');
}
function training() {
  const chosen=catalog().filter(g=>selectedGroup==='all'||g.id===selectedGroup);
  return heading('BUILD YOUR SESSION','从一个部位，开始今天的训练。','选择动作加入训练，按组记录重量、次数和 RIR。') + `${data.draft?'<div class="notice">你有一场未完成的训练，点击右上角「继续训练」接着记录。</div>':''}<section class="body-section">${bodyCards([],true)}</section><div class="section-head"><h2>${selectedGroup==='all'?'全部动作':groupById(selectedGroup).name+'部训练动作'}</h2><div class="library-actions">${selectedGroup!=='all'?'<button class="text-btn" data-action="all-groups">查看全部部位</button>':''}<button class="secondary" data-action="new-custom">${icon('plus')}自定义动作</button></div></div><section class="library-grid">${chosen.flatMap(g=>g.exercises.map(name=>{const last=sortedSessions().find(s=>s.exercises.some(e=>e.name===name));return `<article class="exercise-card"><span class="chip">${g.name} · ${g.en}</span><h3>${esc(name)}</h3>${trackingFor(name)==='reps'?'<span class="chip">自重 · 仅次数</span>':''}${customExercise(name)?`<span class="chip custom-badge">自定义动作</span>${customExercise(name).note?`<p class="exercise-note">${esc(customExercise(name).note)}</p>`:''}`:''}<p>${last?'最近训练：'+last.date:'还没有记录，试着完成第一组'}</p><button class="secondary" data-action="start-exercise" data-group="${g.id}" data-name="${esc(name)}">${icon('plus')}加入训练</button>${customExercise(name)?`<button class="danger delete-custom-button" data-action="delete-custom" data-id="${esc(customExercise(name).id)}" aria-label="删除自定义动作 ${esc(name)}">${icon('trash')}删除动作</button>`:''}</article>`;})).join('')}</section>${deletedExercisesPanel()}`;
}
function deletedExercisesPanel() {
  const deleted=(data.customExercises??[]).filter(e=>e.deleted&&(selectedGroup==='all'||e.group===selectedGroup));
  if(!deleted.length)return '';
  return `<details class="panel deleted-exercises"><summary>已删除动作 · ${deleted.length}</summary><p class="sub">已有训练历史和 PR 会保留。恢复后可以重新加入训练。</p>${deleted.map(e=>`<div class="deleted-row"><span>${esc(e.name)} <span class="chip">${groupById(e.group)?.name}</span></span><button class="secondary" data-action="restore-custom" data-id="${esc(e.id)}" aria-label="恢复 ${esc(e.name)}">恢复</button></div>`).join('')}</details>`;
}
function updateCustomDeletion(id,deleted) {
  const exercise=data.customExercises?.find(e=>e.id===id);
  if(!exercise)return;
  if(deleted&&!confirm(`删除“${exercise.name}”？\n将从可选动作中移除，已有训练记录、PR 和草稿会保留。可在“已删除动作”中恢复。`))return;
  const previous=data;
  data=setCustomExerciseDeleted(data,id,deleted);
  if(!persist()){data=previous;return;}
  if(!trendNames().includes(chartExercise))chartExercise='杠铃卧推';
  render();toast(deleted?'动作已删除，历史保留；可在页面底部恢复':'动作已恢复，可以重新加入训练');
}
function historyPage() {
  const list=sortedSessions().filter(s=>selectedGroup==='all'||s.exercises.some(e=>e.group===selectedGroup));
  return heading('YOUR TRAINING JOURNAL','每一次努力，都在这里。','点击记录查看详情，也可以修改或删除。')+groupFilters()+`<section class="panel"><div class="section-head"><h2>训练记录</h2><span class="muted">${list.length} 次训练</span></div>${historyRows(list)}</section>`;
}
function groupFilters() {return `<div class="filter-row" aria-label="筛选身体部位"><button class="${selectedGroup==='all'?'active':''}" data-action="filter" data-group="all">全部部位</button>${groups.map(g=>`<button class="${selectedGroup===g.id?'active':''}" data-action="filter" data-group="${g.id}">${g.name}</button>`).join('')}</div>`;}
function progressPage() {
  const prs=records(data.sessions).filter(r=>selectedGroup==='all'||r.group===selectedGroup),weights=[...data.weights].sort((a,b)=>a.date.localeCompare(b.date));
  return heading('SMALL STEPS. REAL PROGRESS.','和过去的自己，比一比。','用训练记录观察变化，让进步有据可查。',false)+`<div class="dashboard-grid">${trendPanel()}<section class="panel"><div class="section-head"><h2>体重趋势</h2><button class="view-link" data-action="weight">记录 ${icon('plus')}</button></div><div class="chart-head"><span class="chart-value">${weights.length?fmt(weights.at(-1).weight):'—'}<span class="unit">kg</span></span></div>${lineChart(weights.map(w=>({date:w.date,value:w.weight})),'体重')}<p class="chart-foot">实际测量记录 · 未记录的日期不补值</p></section></div><div class="section-head"><h2>个人最佳 · PR</h2><span class="muted">工作组历史最高表现</span></div>${groupFilters()}<section class="record-grid">${prs.length?prs.map(r=>{if(r.tracking==='reps')return `<article class="panel record-card"><span class="chip">${groupById(r.group)?.name} · 自重</span><h3 style="margin-top:14px">${esc(r.name)}</h3><strong>${fmt(r.bestReps)} <span class="unit">次</span></strong><p>单组最多次数 · PR</p><p>已完成工作组的历史最佳</p></article>`;const weights=Object.keys(r.repsByWeight).map(Number),w=Math.max(...weights);return `<article class="panel record-card"><span class="chip">${groupById(r.group)?.name}</span><h3 style="margin-top:14px">${esc(r.name)}</h3><strong>${fmt(r.weight)} <span class="unit">kg</span></strong><p>最高重量</p><p>e1RM 最佳：${r.estimate?fmt(r.estimate)+' kg':'暂无有效组'}</p><p>${fmt(w)} kg 下最多完成 ${r.repsByWeight[w]} 次</p></article>`;}).join(''):'<div class="empty">完成第一场训练，建立你的个人基准。</div>'}</section>`;
}
function settingsPage() {
  return heading('YOUR DATA, YOUR SPACE','数据与设置','当前版本无需账户，在本机浏览器保存训练。',false)+`<section class="panel settings-block"><h2>当前空间：${mode==='demo'?'示例体验':'我的记录'}</h2><p>示例数据与个人记录分开保存，切换不会删除已有记录。训练草稿也会在当前浏览器中自动保存。</p><button class="primary" data-action="${mode==='demo'?'personal':'demo'}">切换到${mode==='demo'?'我的记录':'示例体验'}</button></section><section class="panel settings-block"><h2>备份你的训练</h2><p>当前空间有 ${data.sessions.length} 次训练、${data.weights.length} 条体重记录。清除浏览器数据或更换浏览器后，记录不会自动恢复；建议定期导出 JSON 备份。</p><button class="secondary" data-action="export">${icon('download')}导出当前空间数据</button></section><section class="panel settings-block"><h2>记录与统计口径</h2><p>重量单位：kg。杠铃包含杆重；双哑铃动作输入双侧总重量。器械动作记录器械标示重量。<br>RIR：完成一组后，估计还能再做的次数，可以留空。<br>训练容量：已完成负重工作组的重量 × 次数之和。自重动作只计组数与次数，不计 kg 容量或 e1RM。<br>e1RM：1 次取实际重量；2–10 次采用重量 ×（1 + 次数 ÷ 30）。它是估算值，不是真实极限测试。<br>身体部位按动作主要分类计数，不重复计算辅助肌群。</p></section>`;
}

function changeMode(next) {
  if(editor.open) closeEditor();
  mode=next; storageError='';
  try{localStorage.setItem('liftlog-mode',mode);}catch{storageError='浏览器存储不可用，本次更改无法持久保存。';}
  data=load(); persist(); page='overview';selectedGroup='all';chartExercise='杠铃卧推'; render(); toast(next==='personal'?'已进入你的个人训练空间':'已切换到示例体验');
}
function freshSession() { return {id:uid(),title:'今日训练',date:localDate(),duration:0,createdAt:new Date().toISOString(),exercises:[]}; }
function startSession(name,group) {
  editingId=null;editorSession=structuredClone(data.draft||freshSession());pickerGroup=group||'chest';
  if(name)addExercise(name,group,false);
  saveDraft();renderEditor();if(!editor.open)editor.showModal();
}
function saveDraft() { if(editorSession&&!editingId){data.draft=structuredClone(editorSession);persist();} }
function openSession(id) { const s=data.sessions.find(s=>s.id===id);if(!s)return;editingId=id;editorSession=structuredClone(s);pickerGroup=s.exercises[0]?.group||'chest';renderEditor();editor.showModal(); }
function blankSet(previous,tracking='weighted') {return {id:uid(),tracking,weight:tracking==='reps'?null:previous?.weight??'',reps:previous?.reps??'',rir:previous?.rir??'',type:'working',done:false};}
function addExercise(name,group,refresh=true) {
  if(!exerciseNames(group).includes(name))return;
  const existing=editorSession.exercises.find(e=>e.name===name);
  if(existing) {if(refresh)toast('这个动作已经在本次训练中');return;}
  const last=sortedSessions().flatMap(s=>s.exercises).find(e=>e.name===name);
  editorSession.exercises.push({id:uid(),name,group,tracking:trackingFor(name),note:customExercise(name)?.note||'',sets:[blankSet(last?.sets.find(s=>s.done&&s.type!=='warmup'),trackingFor(name))]});
  if(editorSession.title==='今日训练')editorSession.title=groupById(group).name+'部训练';
  if(refresh){saveDraft();renderEditor();}
}
function renderEditor() {
  editor.innerHTML=`<header class="dialog-header"><div><p class="eyebrow" style="margin-bottom:5px">${editingId?'TRAINING DETAILS':'ONE SET AT A TIME'}</p><h2>${editingId?'训练详情':'记录今天的训练'}</h2></div><button class="icon-button" data-action="close-editor" aria-label="关闭训练">${icon('close')}</button></header><div class="dialog-body"><div class="session-fields"><label>训练名称<input id="session-title" maxlength="60" value="${esc(editorSession.title)}"></label><label>训练日期<input id="session-date" type="date" max="${localDate()}" value="${editorSession.date}"></label><label>时长 / 分钟<input id="session-duration" type="number" min="0" max="1440" step="1" value="${editorSession.duration||''}" placeholder="可选"></label></div><div>${editorSession.exercises.map(e=>`<section class="editor-exercise" data-exercise="${e.id}"><div class="section-head"><div><h3>${esc(e.name)} <span class="chip">${groupById(e.group)?.name}</span></h3><p class="history-meta">${esc(exerciseHint(e))} · RIR 可留空</p></div><button class="icon-button" data-action="remove-exercise" data-id="${e.id}" aria-label="移除 ${esc(e.name)}">${icon('close')}</button></div><div class="set-row head ${e.tracking==='reps'?'reps-only':''}"><span>组</span><span>类型</span>${e.tracking==='reps'?'':'<span>重量 kg</span>'}<span>次数</span><span>RIR</span><span>完成</span><span></span></div>${e.sets.map((s,i)=>`<div class="set-row ${e.tracking==='reps'?'reps-only':''} ${s.done?'finished':''}" data-set="${s.id}"><span class="set-index">${i+1}</span><select data-field="type" aria-label="${esc(e.name)} 第${i+1}组类型"><option value="working" ${s.type==='working'?'selected':''}>工作组</option><option value="warmup" ${s.type==='warmup'?'selected':''}>热身组</option></select>${e.tracking==='reps'?'':`<input data-field="weight" aria-label="${esc(e.name)} 第${i+1}组重量" type="number" min="0" max="1500" step="0.5" inputmode="decimal" placeholder="kg" value="${s.weight}">`}<input data-field="reps" aria-label="${esc(e.name)} 第${i+1}组次数" type="number" min="1" max="100" step="1" inputmode="numeric" placeholder="次" value="${s.reps}"><input data-field="rir" aria-label="${esc(e.name)} 第${i+1}组 RIR" type="number" min="0" max="10" step="0.5" inputmode="decimal" placeholder="—" value="${s.rir}"><button class="done-button ${s.done?'checked':''}" data-action="toggle-set" data-id="${s.id}" aria-label="${s.done?'取消完成':'完成'} ${esc(e.name)} 第${i+1}组" aria-pressed="${s.done}">${icon('check')}</button><button class="icon-button" data-action="remove-set" data-id="${s.id}" aria-label="删除 ${esc(e.name)} 第${i+1}组">${icon('trash')}</button></div>`).join('')}<button class="add-set" data-action="add-set" data-id="${e.id}">＋ 添加一组</button></section>`).join('')}</div><div class="exercise-picker"><div class="section-head"><h3>添加训练动作</h3><button class="view-link" data-action="new-custom">＋ 自定义动作</button></div><div class="filter-row">${groups.map(g=>`<button class="${pickerGroup===g.id?'active':''}" data-action="picker-group" data-group="${g.id}">${g.name}</button>`).join('')}</div><div class="exercise-options">${exerciseNames(pickerGroup).map(name=>`<button data-action="add-exercise" data-group="${pickerGroup}" data-name="${esc(name)}">${editorSession.exercises.some(e=>e.name===name)?'✓':'＋'} ${esc(name)}</button>`).join('')}</div></div><div class="rest" id="rest-timer"></div><div class="validation" role="alert" id="editor-error"></div></div><footer class="dialog-footer"><div>${editingId?'<button class="danger" data-action="delete-session">删除这次训练</button>':'<span class="muted">草稿自动保存 · 完成后计入统计</span>'}</div><div style="display:flex;gap:8px">${!editingId?'<button class="secondary" data-action="close-editor">稍后继续</button>':''}<button class="primary" data-action="finish">${icon('check')}${editingId?'保存修改':'完成训练'}</button></div></footer>`;
  updateRest();
}
function findSet(id) {return editorSession.exercises.flatMap(e=>e.sets).find(s=>s.id===id);}
function editorError(message) {document.querySelector('#editor-error').textContent=message;document.querySelector('#editor-error').scrollIntoView({block:'nearest'});}
function closeEditor(){saveDraft();editor.close();editorSession=null;editingId=null;render();}
function finishSession() {
  if(!editorSession.title.trim())return editorError('请填写训练名称。');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(editorSession.date)||editorSession.date>localDate())return editorError('请选择今天或更早的有效训练日期。');
  const duration=Number(editorSession.duration||0);
  if(!Number.isInteger(duration)||duration<0||duration>1440)return editorError('训练时长请输入 0–1440 的整数。');
  const done=editorSession.exercises.flatMap(e=>e.sets).filter(s=>s.done);
  if(!done.length)return editorError('请先填写至少一组，并点击右侧勾选按钮完成。');
  for(const s of done){const error=validateSet(s);if(error)return editorError(error);}
  const saved=structuredClone(editorSession);
  saved.title=saved.title.trim();saved.duration=duration;
  saved.exercises=saved.exercises.map(e=>({...e,sets:e.sets.filter(s=>s.done).map(s=>({...s,tracking:e.tracking??'weighted',weight:e.tracking==='reps'?null:Number(s.weight),reps:Number(s.reps),rir:s.rir===''?'':Number(s.rir)}))})).filter(e=>e.sets.length);
  const before=records(data.sessions).filter(r=>saved.exercises.some(e=>e.name===r.name));
  const oldData=structuredClone(data);
  if(editingId)data.sessions=data.sessions.map(s=>s.id===editingId?saved:s);else data.sessions.push(saved);
  if(!editingId)data.draft=null;
  if(!persist()){data=oldData;return editorError('保存失败，请保留页面并导出数据备份。');}
  const after=records(data.sessions),pr=before.some(b=>{const a=after.find(r=>r.name===b.name);return a&&(a.bestReps>b.bestReps||a.weight>b.weight||a.estimate>b.estimate||Object.keys(b.repsByWeight).some(w=>a.repsByWeight[w]>b.repsByWeight[w]));});
  const wasEditing=Boolean(editingId);
  editor.close();editorSession=null;editingId=null;restUntil=0;render();toast(wasEditing?'修改已保存，统计已更新':pr?'训练已保存，恭喜刷新个人最佳！':'训练已保存，每一组都算数。');
}
function openCustomExercise() {
  const group = editor.open ? pickerGroup : selectedGroup === 'all' ? 'chest' : selectedGroup;
  customDialog.innerHTML = `<header class="dialog-header"><div><p class="eyebrow" style="margin-bottom:5px">YOUR EXERCISE LIBRARY</p><h2 id="custom-title">新建自定义动作</h2></div><button class="icon-button" data-action="close-custom" aria-label="关闭自定义动作">${icon('close')}</button></header><form id="custom-form" class="dialog-body custom-form"><label>动作名称<input name="name" maxlength="60" required placeholder="例如：悍马单侧推胸" autocomplete="off" autofocus></label><label>身体部位<select name="group">${groups.map(g=>`<option value="${g.id}" ${g.id===group?'selected':''}>${g.name}</option>`).join('')}</select></label><label>记录方式<select name="tracking"><option value="weighted">负重动作 · 重量 + 次数</option><option value="reps">自重动作 · 仅次数</option></select></label><label>器械 / 动作备注（可选）<textarea name="note" maxlength="160" rows="3" placeholder="例如：二楼挂片式器械，记录单侧挂片重量（kg）"></textarea></label><p class="custom-help">建议在名称中注明品牌或型号，方便区分不同器械。下次训练沿用相同的重量记录方式。</p><p class="custom-space">${mode==='demo'?'当前是示例空间，自定义动作会保存在示例空间。':'保存到你的个人动作库，之后可重复使用。'}</p><div id="custom-error" class="validation" role="alert"></div><div class="custom-form-actions"><button type="button" class="secondary" data-action="close-custom">取消</button><button type="submit" class="primary">${editor.open?'保存并加入训练':'保存动作'}</button></div></form>`;
  customDialog.showModal();
}
customDialog.addEventListener('submit', event => {
  event.preventDefault();
  const form = event.target;
  if (!form.reportValidity()) return;
  const fields = new FormData(form);
  const exercise = {id:uid(),name:String(fields.get('name')??'').trim().replace(/\s+/g,' '),group:String(fields.get('group')??''),tracking:String(fields.get('tracking')??'weighted'),note:String(fields.get('note')??'').trim()};
  const error = validateCustomExercise(exercise,data.customExercises??[]);
  if (error) {document.querySelector('#custom-error').textContent=error;return;}
  const previous = data.customExercises;
  data.customExercises = [...(previous??[]),exercise];
  if (!persist()) {data.customExercises=previous;document.querySelector('#custom-error').textContent='保存失败，请保留输入并检查浏览器存储。';return;}
  customDialog.close();
  if (editor.open) {pickerGroup=exercise.group;addExercise(exercise.name,exercise.group);}
  else {page='train';selectedGroup=exercise.group;render();}
  toast(editor.open?'自定义动作已保存并加入训练':'自定义动作已保存，下次可以直接选择');
});
function openWeight() {
  weightDialog.innerHTML=`<header class="dialog-header"><h2>记录体重</h2><button class="icon-button" data-action="close-weight" aria-label="关闭体重记录">${icon('close')}</button></header><form id="weight-form" class="dialog-body weight-form"><label>日期<input name="date" type="date" value="${localDate()}" max="${localDate()}" required></label><label>体重 / kg<input name="weight" type="number" min="20" max="500" step="0.1" placeholder="例如 59.0" required></label><p class="muted" style="font-size:12px">同一天再次记录，将更新当天的体重。</p><button class="primary" type="submit">保存体重</button></form>`;weightDialog.showModal();
}
function updateRest() {const el=document.querySelector('#rest-timer');if(!el)return;const seconds=Math.max(0,Math.ceil((restUntil-Date.now())/1000));el.textContent=restUntil?seconds?`休息计时 · ${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')} / 2 分钟`:'休息结束，可以开始下一组了。':'';}
setInterval(updateRest,1000);
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-action]');if(!button)return;
  const a=button.dataset.action,id=button.dataset.id,g=button.dataset.group;
  if(a==='nav'){page=button.dataset.page;selectedGroup='all';render();window.scrollTo({top:0,behavior:'smooth'});}
  if(a==='category'){page='train';selectedGroup=g;render();}
  if(a==='filter'){selectedGroup=g;render();}
  if(a==='all-groups'){selectedGroup='all';render();}
  if(a==='new-custom')openCustomExercise();
  if(a==='delete-custom')updateCustomDeletion(id,true);
  if(a==='restore-custom')updateCustomDeletion(id,false);
  if(a==='close-custom')customDialog.close();
  if(a==='start')startSession();
  if(a==='start-exercise')startSession(button.dataset.name,g);
  if(a==='edit')openSession(id);
  if(a==='range'){chartRange=button.dataset.range;render();}
  if(a==='personal'||a==='demo')changeMode(a==='personal'?'personal':'demo');
  if(a==='close-editor')closeEditor();
  if(a==='picker-group'){pickerGroup=g;renderEditor();}
  if(a==='add-exercise')addExercise(button.dataset.name,g);
  if(a==='add-set'){const e=editorSession.exercises.find(e=>e.id===id);e.sets.push(blankSet(e.sets.at(-1),e.tracking??'weighted'));saveDraft();renderEditor();}
  if(a==='remove-set'){editorSession.exercises.forEach(e=>e.sets=e.sets.filter(s=>s.id!==id));saveDraft();renderEditor();}
  if(a==='remove-exercise'){editorSession.exercises=editorSession.exercises.filter(e=>e.id!==id);saveDraft();renderEditor();}
  if(a==='toggle-set'){const s=findSet(id);if(!s.done){const error=validateSet(s);if(error)return editorError(error);}s.done=!s.done;if(s.done)restUntil=Date.now()+120000;saveDraft();renderEditor();}
  if(a==='finish')finishSession();
  if(a==='delete-session'){
    if(!confirm('删除这次训练？相关统计会重新计算，此操作无法撤销。'))return;
    const old=data.sessions;data.sessions=data.sessions.filter(s=>s.id!==editingId);
    if(!persist()){data.sessions=old;return;}
    editor.close();editorSession=null;editingId=null;render();toast('训练已删除，统计已更新');
  }
  if(a==='weight')openWeight();
  if(a==='close-weight')weightDialog.close();
  if(a==='export'){
    const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,space:mode,exportedAt:new Date().toISOString(),...data},null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download=`liftlog-${mode}-${localDate()}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('训练备份已导出');
  }
});
document.addEventListener('change',event=>{if(event.target.id==='chart-exercise'){chartExercise=event.target.value;render();}});
editor.addEventListener('input',event=>{
  const target=event.target;
  if(target.id==='session-title')editorSession.title=target.value;
  if(target.id==='session-date')editorSession.date=target.value;
  if(target.id==='session-duration')editorSession.duration=target.value;
  if(target.dataset.field){const s=findSet(target.closest('[data-set]').dataset.set);s[target.dataset.field]=target.value;s.done=false;const row=target.closest('[data-set]');row.classList.remove('finished');const done=row.querySelector('.done-button');done.classList.remove('checked');done.setAttribute('aria-pressed','false');done.setAttribute('aria-label',done.getAttribute('aria-label').replace(/^取消完成/,'完成'));}
  saveDraft();
});
editor.addEventListener('cancel',e=>{e.preventDefault();closeEditor();});
weightDialog.addEventListener('submit',event=>{
  event.preventDefault();const form=event.target;if(!form.reportValidity())return;
  const fields=new FormData(form),date=String(fields.get('date')),weight=Number(fields.get('weight'));
  if(!date||date>localDate()||!Number.isFinite(weight)||weight<20||weight>500)return;
  const old=data.weights;data.weights=[...data.weights.filter(w=>w.date!==date),{date,weight}];
  if(!persist()){data.weights=old;return;}weightDialog.close();render();toast('体重已保存');
});
// Optional browser-standard read-only tool; no LLM or external AI service is used.
if(document.modelContext?.registerTool){
  const lifecycle=new AbortController();
  try{Promise.resolve(document.modelContext.registerTool({name:'get_training_summary',description:'Read the currently selected local training space summary.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute(input){if(!input||typeof input!=='object'||Object.keys(input).length)throw Error('Expected an empty object');return {space:mode,sessions:data.sessions.length,volumeKg:data.sessions.reduce((n,s)=>n+volume(s),0),workingSets:data.sessions.reduce((n,s)=>n+workSets(s).length,0)};}},{signal:lifecycle.signal})).catch(()=>{});}catch{}
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
persist();render();

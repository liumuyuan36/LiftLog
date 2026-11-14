import {lastExercise,sessionSummary} from './workouts.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=n=>Number(n).toLocaleString('zh-CN',{maximumFractionDigits:1});

export function routineSection(data,mode){
  const routines=data.routines??[];
  return `<section class="routine-section" aria-labelledby="routines-heading"><div class="section-head"><div><h2 id="routines-heading">我的训练模板</h2></div><span class="chip">${routines.length} / 20</span></div>${routines.length?`<div class="routine-grid">${routines.map(r=>`<article class="panel routine-card"><div class="routine-card-heading"><h3>${esc(r.name)}</h3><button class="icon-button" data-action="delete-routine" data-id="${esc(r.id)}" aria-label="删除模板 ${esc(r.name)}">×</button></div><p>${r.exercises.length} 个动作 · ${r.exercises.reduce((n,e)=>n+e.sets.length,0)} 组</p><small>${r.exercises.map(e=>esc(e.name)).join(' · ')}</small><button class="primary" data-action="start-routine" data-id="${esc(r.id)}">用此模板开始 ↗</button></article>`).join('')}</div>`:`<div class="panel routine-empty"><span class="routine-empty-symbol" aria-hidden="true">＋</span><div><h3>把常练的组合，留给下次</h3><p>训练或历史记录中可保存模板。</p></div></div>`}${mode==='demo'?'<p class="routine-space-note">当前为示例空间。切换「开始我的记录」后，可保存自己的模板。</p>':''}</section>`;
}

export function referenceMarkup(data,exercise,date,excludeId,compact=false){
  const ref=lastExercise(data.sessions,exercise,date,excludeId);
  if(!ref)return '';
  const rows=ref.exercise.sets.filter(s=>s.type==='working');
  return `<div class="last-reference ${compact?'compact-reference':''}"><div><span>上次记录 · ${esc(ref.date)}</span><strong>${rows.slice(0,3).map(s=>exercise.tracking==='reps'?`${s.reps} 次`:`${number(s.weight)} kg × ${s.reps}`).join(' / ')}${rows.length>3?` / … 共 ${rows.length} 组`:''}</strong></div>${!compact?`<button class="view-link" data-action="fill-reference" data-id="${esc(exercise.id)}">填入未完成组</button>`:''}<small>按动作匹配；器械与状态可能不同，仅供记录参考。</small></div>`;
}

export function summaryMarkup(session,mode){
  const s=sessionSummary(session);
  return `<header class="dialog-header"><div><h2 id="summary-title">这次训练，记好了。</h2></div><button class="icon-button" data-action="close-summary" aria-label="关闭训练总结">×</button></header><div class="dialog-body workout-summary"><span class="summary-check" aria-hidden="true">✓</span><h3>${esc(session.title)}</h3><p class="sub">${esc(session.date)} · ${mode==='demo'?'示例空间':'本机个人空间'}</p><div class="summary-stats"><article><strong>${s.exercises}</strong><span>已记录动作</span></article><article><strong>${s.workingSets}</strong><span>完成工作组</span></article><article><strong>${number(s.volume)}</strong><span>负重容量 / kg</span></article>${s.bodyweightReps?`<article><strong>${s.bodyweightReps}</strong><span>自重工作组次数</span></article>`:''}${s.duration?`<article><strong>${s.duration}</strong><span>手动填写时长 / 分钟</span></article>`:''}</div><p class="sub">已保存 ${s.sets} 组（含热身组）。未勾选的组不会计入历史。</p><div class="summary-next"><h3>下次，少选一次动作</h3><p>保留动作与参考数值，下次开始时仍需确认完成。</p><button class="primary" data-action="summary-template">存为训练模板</button></div><p class="routine-space-note">记录保存在当前浏览器，可在「更多 → 数据与设置」导出备份。</p></div><footer class="dialog-footer"><button class="secondary" data-action="summary-detail">查看这次记录</button><button class="primary" data-action="close-summary">完成</button></footer>`;
}

import {uid,localDate} from './data.js';
import {strategies,decisionSource,makeDecisionPlans,decisionSummary,decisionMemory,decisionOutcome,validateDecisionAdvice} from './decision.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let mountId=0;
export function mountDecision(root,{getData,save,space,apply,openSession,notify,startTraining=()=>{}}){
  const id=++mountId,active=()=>root.isConnected&&mountId===id;
  const sessions=()=>[...getData().sessions].filter(s=>s.date<=localDate()).sort((a,b)=>b.date.localeCompare(a.date)||(b.createdAt??'').localeCompare(a.createdAt??''));
  let sourceId=sessions()[0]?.id,minutes=20,setMinutes=3,transitionMinutes=1,prepMinutes=3,priorityName='',requiredNames=[],blockedNames=[],goal='',remember=false,consent=false,busy=false,configured=null,decision=null,advice=null,error='';
  function resetSource(){const s=sessions().find(s=>s.id===sourceId);priorityName=s?.exercises[0]?.name??'';requiredNames=priorityName?[priorityName]:[];blockedNames=[];}
  function compute(){
    decision=null;error='';advice=null;
    try{decision=makeDecisionPlans(sessions().find(s=>s.id===sourceId),{minutes,setMinutes,transitionMinutes,prepMinutes,priorityName,requiredNames,blockedNames});}
    catch(e){error=e.message;}
  }
  function history(){
    const receipts=(getData().decisionReceipts??[]).slice(-8).reverse();
    if(!receipts.length)return '<div class="empty">选好一个方案并带入训练后，会生成第一张选择记录。</div>';
    return receipts.map(r=>{
      const o=decisionOutcome(r,getData().sessions),chosen=r.candidates.find(p=>p.id===r.selectedId);
      const timing=o.status==='pending'?'尚未形成已保存训练，不计入完成情况':o.status==='missing'?'关联训练不可用，无法核对':o.actualMinutes===null?'未填写实际时长，暂不判断是否按时完成':`记录用时 ${o.actualMinutes} 分钟 · ${o.timeMet?'未超出预算':'超出预算 '+Math.round((o.actualMinutes-r.constraints.minutes)*10)/10+' 分钟'}`;
      return `<article class="panel decision-receipt"><div class="section-head"><h3>${esc(strategies[r.selectedId].name)}</h3><span class="chip">${r.advice?.candidateId===r.selectedId?'选择与 AI 一致':r.advice?'用户选择了其他方案':'用户自主选择'}</span></div><p class="sub">${esc(r.createdAt.slice(0,10))} · 预算 ${r.constraints.minutes} 分钟 · 选择时估算 ${chosen.estimatedMinutes} 分钟</p><p class="decision-timing">${esc(timing)}</p>${o.status==='saved'?`<div class="decision-outcome"><span>计划工作组：${o.matchedSets} / ${o.plannedSets}</span><span>${r.constraints.requiredNames.length?(o.requiredMet?'必留动作已记录':'有必留动作未记录完成组'):'未设置必留动作'}</span></div><p class="sub">只核对已记录的时长、动作和组数，不代表训练效果，也不能说明方案与结果的因果关系。</p>`:''}<details><summary>查看选择时的条件与删减</summary><p class="sub">${esc(r.goal||'未填写额外偏好')}<br>来源：${esc(r.source.date)} · ${esc(r.source.title)}<br>必留动作：${esc(r.constraints.requiredNames.join('、')||'未指定')}（至少 1 个工作组）<br>暂不做：${esc(r.constraints.blockedNames.join('、')||'无')}</p><div class="decision-rows">${r.source.exercises.map(e=>`<div><span>${esc(e.name)}</span><span>${e.sets.filter(s=>s.type==='working').length} → ${chosen.counts[e.name]} 组</span></div>`).join('')}</div><p class="sub">选择时的快照保留。修改或删除历史记录后，完成情况会重新核对。</p></details><div class="decision-receipt-actions">${o.status==='saved'?`<button class="secondary" data-lab="result" data-id="${esc(r.resultSessionId)}">查看 / 补充实际记录</button>`:''}<button class="text-btn" data-lab="memory" data-id="${esc(r.id)}">${r.remember?'不再参考这次取舍':'记住这次取舍'}</button></div><div class="decision-feedback"><span>这次取舍有帮助吗？</span>${[['helpful','有帮助'],['not_helpful','不合适']].map(([value,label])=>`<button class="secondary ${r.feedback===value?'selected':''}" data-lab="feedback" data-id="${esc(r.id)}" data-value="${value}" aria-pressed="${r.feedback===value}">${label}</button>`).join('')}</div></article>`;
    }).join('');
  }
  function candidate(p){
    return `<article class="panel decision-option ${advice?.status==='recommend'&&advice.candidateId===p.id?'recommended':''}"><div class="section-head"><h3>${esc(strategies[p.id].name)}</h3>${advice?.status==='recommend'&&advice.candidateId===p.id?'<span class="chip lab-ai-badge">AI 协助选择</span>':''}</div><div class="decision-time">${p.estimatedMinutes}<small> 分钟 · 估算</small></div><p>${esc(strategies[p.id].reason)}</p><div class="decision-facts"><span>${p.workingSets} 个工作组</span><span>${p.exerciseCount} 个动作</span><span>${p.switches} 次动作切换</span></div><p class="decision-loss">较来源少 ${p.removedWorkSets} 个工作组${p.removedExercises.length?'；本次不做 '+esc(p.removedExercises.join('、')):'；动作种类均保留'}。</p><details><summary>逐动作看取舍</summary><div class="decision-rows">${decision.source.exercises.map(e=>`<div><span>${esc(e.name)}${requiredNames.includes(e.name)?' · 必留':''}</span><span>${e.sets.filter(s=>s.type==='working').length} → ${p.counts[e.name]} 组</span></div>`).join('')}</div><p class="sub">保留动作原有的已记录热身组；工作组沿用来源中的数值，带入后请自行核对。</p></details><button class="primary" data-lab="choose" data-id="${p.id}" ${busy?'disabled':''}>选择这个方案</button></article>`;
  }
  function draw(){
    if(!active())return;
    const movementOpen=root.querySelector('.decision-movement-details')?.open===true,estimatesOpen=root.querySelector('.decision-estimates')?.open===true;
    const current=sessions().find(s=>s.id===sourceId),memory=decisionMemory(getData()),receipts=getData().decisionReceipts??[];
    root.innerHTML=`<div class="page-heading"><div><p class="eyebrow">TRAIN WITH INTENTION</p><h1>把时间，留给更在意的。</h1><p class="sub">告诉我今天有多少时间，把常练的组合安排得更从容。</p></div><span class="review-pill">${space==='demo'?'示例体验 · 模拟训练':'个人空间 · 本机记录'}</span></div><div class="decision-intro"><span>① 明确限制</span><span>② 比较取舍</span><span>③ 记录选择</span><span>④ 回看完成情况</span></div>
      ${!current?'<section class="panel"><div class="empty">先保存一次训练，下次时间紧张时，就能用它安排今天的动作和组数。<p><button class="primary" data-lab="start">记录一次训练</button></p></div></section>':`<section class="panel decision-controls"><div class="section-head"><h2>今天的限制</h2><span class="chip">可离线规划</span></div><div class="decision-fields"><label>以哪次训练为参考<select id="lab-source" ${busy?'disabled':''}>${sessions().map(s=>`<option value="${esc(s.id)}" ${s.id===sourceId?'selected':''}>${esc(s.date)} · ${esc(s.title)}</option>`).join('')}</select></label><label>今天可用时间 / 分钟<input id="lab-minutes" type="number" min="5" max="180" value="${minutes}" ${busy?'disabled':''}></label><label>优先保留组数的动作<select id="lab-priority" ${busy?'disabled':''}>${current.exercises.map(e=>`<option ${e.name===priorityName?'selected':''}>${esc(e.name)}</option>`).join('')}</select></label></div><details class="decision-movement-details" ${movementOpen?'open':''}><summary>动作限制 · 必留 ${requiredNames.length} · 暂不做 ${blockedNames.length}</summary><div class="decision-locks">${current.exercises.map(e=>`<div><strong>${esc(e.name)}</strong><label><input type="checkbox" data-required="${esc(e.name)}" aria-label="必留 ${esc(e.name)}，至少 1 个工作组" ${requiredNames.includes(e.name)?'checked':''} ${busy?'disabled':''}>必留，至少 1 个工作组</label><label><input type="checkbox" data-blocked="${esc(e.name)}" aria-label="今天暂不做 ${esc(e.name)}" ${blockedNames.includes(e.name)?'checked':''} ${busy?'disabled':''}>今天暂不做</label></div>`).join('')}</div></details><details class="decision-estimates" ${estimatesOpen?'open':''}><summary>修改时间估算假设</summary><p class="sub">下面是可编辑的排程假设，不是推荐休息时长，也不是完成时间保证。每个已保留的热身组与工作组均计入。</p><div class="decision-fields"><label>每组含间隔预计 / 分钟<input id="lab-pace" type="number" min="0.5" max="10" step="0.5" value="${setMinutes}" ${busy?'disabled':''}></label><label>切换动作预计 / 分钟<input id="lab-transition" type="number" min="0" max="10" step="0.5" value="${transitionMinutes}" ${busy?'disabled':''}></label><label>准备时间 / 分钟<input id="lab-prep" type="number" min="0" max="30" step="0.5" value="${prepMinutes}" ${busy?'disabled':''}></label></div></details></section>
      <div class="decision-comparison-heading"><h2>可选安排</h2><p class="sub">${decision?.originalMinutes!==undefined?`完整来源按当前假设估算 ${decision.originalMinutes} 分钟。`:''}方案只做删减；选择后仍需确认实际完成。</p></div>${error?`<div class="notice" role="status">${esc(error)}</div>`:''}${decision&&!decision.candidates.length?`<div class="notice">当前限制下没有可行方案。按你的估算，保留最低要求至少需要 ${decision.minimumMinutes} 分钟；请自行调整预算、必留动作或时间假设。</div>`:''}<div class="decision-options">${decision?.candidates.map(candidate).join('')??''}</div>${decision?.candidates.length===1?'<p class="sub">当前限制下只有一个不同的可行结果，未编造其他方案。</p>':''}
      ${decision?.candidates.length?`<section class="panel decision-ai"><h2>让 AI 帮你理清偏好</h2><p class="sub">AI 只在上方可行方案中选择；你可以选择其他方案。</p><label>这次最在意什么？<textarea id="lab-goal" rows="2" maxlength="300" placeholder="例如：今天宁可少做几个动作，也想把主项的组数保留下来。" ${busy?'disabled':''}>${esc(goal)}</textarea></label><p class="sub">只参考你主动记住的最近 ${memory.length} 次取舍；${memory.length?'包含选择、主观反馈和已记录的时间结果。':'当前没有偏好记忆。'}可以在下方回执中随时取消参考。</p><label class="review-consent"><input id="lab-consent" type="checkbox" ${consent?'checked':''} ${busy?'disabled':''}>同意将本次偏好、方案统计和上述偏好记忆发送至 DeepSeek。不发送重量、逐组训练或完整历史。</label><button class="secondary" data-lab="advise" ${busy||!configured||!consent||!goal.trim()?'disabled':''}>${busy?'AI 正在协助比较…':configured===false?'DeepSeek 尚未配置':'请 AI 协助选择'}</button>${advice?.status==='clarify'?`<div class="notice lab-ai-advice">AI 需要确认：${esc(advice.question)}<br>请修改偏好或限制后再比较。</div>`:advice?.status==='recommend'?`<p class="sub lab-ai-advice">AI 选择：${esc(strategies[advice.candidateId].name)}。${esc(strategies[advice.candidateId].reason)}所有数字仍以方案比较为准。</p>`:''}<label class="review-consent"><input id="lab-remember" type="checkbox" ${remember?'checked':''} ${busy?'disabled':''}>我愿意让后续比较参考这次最终选择（仅本机保存，可取消）</label></section>`:''}`}
      <section class="decision-history"><div class="section-head"><h2>我的选择与实际完成</h2><button class="secondary" data-lab="export">导出取舍记录</button></div><p class="sub">当前空间 ${receipts.length} 张回执；${receipts.filter(r=>decisionOutcome(r,getData().sessions).status==='saved').length} 张有关联训练。${space==='demo'?'示例空间不计作真实用户效果。':''}</p><div class="decision-receipts">${history()}</div></section>`;
  }
  root.oninput=e=>{if(e.target.id==='lab-goal'){goal=e.target.value;advice=null;root.querySelectorAll('.lab-ai-advice,.lab-ai-badge').forEach(el=>el.remove());root.querySelectorAll('.decision-option.recommended').forEach(el=>el.classList.remove('recommended'));const button=root.querySelector('[data-lab="advise"]');if(button)button.disabled=busy||!configured||!consent||!goal.trim();}};
  root.onchange=e=>{
    const t=e.target;
    if(t.id==='lab-goal')return;
    if(t.id==='lab-consent'){consent=t.checked;draw();return;}
    if(t.id==='lab-remember'){remember=t.checked;return;}
    if(t.id==='lab-source'){sourceId=t.value;resetSource();}
    if(t.id==='lab-minutes')minutes=Number(t.value);
    if(t.id==='lab-priority')priorityName=t.value;
    if(t.id==='lab-pace')setMinutes=Number(t.value);
    if(t.id==='lab-transition')transitionMinutes=Number(t.value);
    if(t.id==='lab-prep')prepMinutes=Number(t.value);
    if(t.dataset.required)requiredNames=t.checked?[...requiredNames,t.dataset.required]:requiredNames.filter(n=>n!==t.dataset.required);
    if(t.dataset.blocked)blockedNames=t.checked?[...blockedNames,t.dataset.blocked]:blockedNames.filter(n=>n!==t.dataset.blocked);
    compute();draw();
  };
  root.onclick=async e=>{
    const button=e.target.closest('[data-lab]');if(!button||button.disabled)return;
    const action=button.dataset.lab;
    if(action==='start')return startTraining();
    if(action==='choose'){
      try{if(apply(decision,button.dataset.id,{goal,remember,advice})!==false)notify('选择记录已生成；核对训练组后再保存实际记录。');}catch(err){error=err.message;draw();}
    }
    if(action==='result')openSession(button.dataset.id);
    if(action==='memory'||action==='feedback'){
      const r=getData().decisionReceipts.find(r=>r.id===button.dataset.id);if(!r)return;
      const before={remember:r.remember,feedback:r.feedback};
      if(action==='memory')r.remember=!r.remember;else r.feedback=button.dataset.value;
      if(!save()){Object.assign(r,before);return;}draw();
    }
    if(action==='export'){
      const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,space,receipts:getData().decisionReceipts??[],modelRuns:getData().labRuns??[]},null,2)],{type:'application/json'}));
      const link=document.createElement('a');link.href=url;link.download=`liftlog-decisions-${space}-${localDate()}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }
    if(action==='advise'&&decision?.candidates.length){
      busy=true;error='';advice=null;draw();const started=performance.now();
      try{
        const response=await fetch('/api/ai/decision',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({goal,candidates:decision.candidates.map(decisionSummary),memory:decisionMemory(getData())}),signal:AbortSignal.timeout(30000)});
        const payload=await response.json();if(!active())return;
        if(!response.ok)throw Error(payload.error||'AI 比较暂时不可用。');
        advice=validateDecisionAdvice(payload.advice,decision.candidates.map(p=>p.id));
        const data=getData(),previous=data.labRuns;data.labRuns=[...(previous??[]),{id:uid(),space,createdAt:new Date().toISOString(),status:advice.status,...payload.meta,clientElapsedMs:Math.round(performance.now()-started)}].slice(-100);
        if(!save())data.labRuns=previous;
      }catch(err){if(active())error=err.name==='TimeoutError'?'AI 比较超时，仍可手动选择上方方案。':err instanceof TypeError?'无法连接 AI，仍可手动比较和选择方案。':err.message;}
      finally{busy=false;if(active())draw();}
    }
  };
  resetSource();if(sourceId)compute();draw();
  fetch('/api/ai/status').then(r=>r.json()).then(s=>{configured=s.configured===true;if(active())draw();}).catch(()=>{configured=false;if(active())draw();});
}

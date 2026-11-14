import {buildReview,goals,validateSelection} from './review.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let days=7,goal='consistency',current=null,configured=null,mountId=0;

export function mountReview(root,{getData,space,save,openSession,notify,startTraining=()=>{},startIntake=()=>{}}){
  const mounted=++mountId;
  const signature=()=>JSON.stringify([space,days,goal,getData().sessions]);
  const review=()=>buildReview(getData().sessions,{days,goal});
  let busy=false,consent=false,error='';
  const active=()=>root.isConnected&&mountId===mounted;
  function track(engine,selection,elapsedMs,status='success'){
    const data=getData(),before=data.reviewRuns;
    const run={id:crypto.randomUUID(),createdAt:new Date().toISOString(),engine,status,days,goal,elapsedMs,selection,space};
    data.reviewRuns=[...(before??[]),run].slice(-200);
    if(!save()){data.reviewRuns=before;return null;}
    return run.id;
  }
  function draw(){
    if(!active())return;
    if(current?.signature!==signature())current=null;
    const r=review(),selection=current?.selection??r.baseline;
    const runs=getData().reviewRuns??[],successful=runs.filter(x=>x.status==='success'),rated=successful.filter(x=>x.feedback),useful=rated.filter(x=>x.feedback==='useful');
    const currentRun=runs.find(x=>x.id===current?.runId);
    if(!r.sessionCount){root.innerHTML=emptyReview(r,space,days===7?buildReview(getData().sessions,{days:28,goal}).sessionCount:0);return;}
    root.innerHTML=`<div class="page-heading"><div><p class="eyebrow">FROM RECORDS TO REFLECTION</p><h1>回看训练，找到下一步。</h1><p class="sub">把每次完成的训练，连成更清楚的变化。</p></div><span class="review-pill">${space==='demo'?'示例记录':'我的训练'}</span></div>
      <section class="review-hero panel"><div><span class="chip">${current?.engine==='ai'?'AI 复盘已生成':'训练概览'}</span><h2>每一组，都有迹可循。</h2><p class="sub">从已保存的记录回看训练，也可以让 AI 帮你整理重点。</p></div><div class="review-controls"><label>复盘周期<select id="review-days"><option value="7" ${days===7?'selected':''}>近 7 天</option><option value="28" ${days===28?'selected':''}>近 28 天</option></select></label><label>这次关注什么<select id="review-goal">${Object.entries(goals).map(([id,name])=>`<option value="${id}" ${goal===id?'selected':''}>${name}</option>`).join('')}</select></label></div></section>
      <p class="review-period">${r.start} — ${r.today} · 对比 ${r.previousStart} — ${r.previousEnd} · ${r.sessionCount} 次有效记录</p>
      <section class="stats review-stats" aria-label="复盘数据"><article class="stat"><div class="stat-label">训练次数</div><div class="stat-value">${r.sessionCount}<span class="unit">次</span></div><div class="stat-foot">已保存且包含完成组</div></article><article class="stat"><div class="stat-label">完成工作组</div><div class="stat-value">${r.sets}<span class="unit">组</span></div><div class="stat-foot">不含热身组</div></article><article class="stat"><div class="stat-label">余力记录</div><div class="stat-value">${r.rirCoverage===null?'—':r.rirCoverage+'% '}</div><div class="stat-foot">RIR 填写比例 · 不确定可留空</div></article></section>
      ${!r.sessionCount?'<div class="notice">本期还没有有效训练记录。先记录一次训练，再回来复盘；不会为你生成虚构进展。</div>':''}
      <div class="review-layout"><section><div class="section-head"><h2>${current?.engine==='ai'?'你的复盘重点':'本期记录重点'}</h2><span class="muted">${current?'已更新':'随记录更新'}</span></div><div class="review-facts">${selection.factIds.map(id=>{const f=r.facts.find(f=>f.id===id);return `<article class="panel review-fact"><span class="review-evidence">来自训练记录</span><h3>${esc(f.title)}</h3><p>${esc(f.text)}</p>${f.refs.length?`<details><summary>查看 ${f.refs.length} 次相关训练</summary><div class="review-sources">${f.refs.map(s=>`<button class="view-link" data-review="source" data-id="${esc(s.id)}">${esc(s.date)} · ${esc(s.title)}</button>`).join('')}</div></details>`:''}</article>`;}).join('')}</div><section class="panel review-next"><h2>下次记录，可以留意</h2>${selection.actionIds.map(id=>{const a=r.actionOptions.find(a=>a.id===id);return `<div><h3>${esc(a.title)}</h3><p>${esc(a.text)}</p></div>`;}).join('')}</section></section>
      <aside><section class="panel review-generate"><h2>让复盘更贴近你的关注。</h2><p class="sub">选择你在意的方向，让 AI 从这期记录中整理重点。统计数值始终来自你的训练。</p><button class="secondary" data-review="local" ${busy?'disabled':''}>查看训练概览</button><div class="review-divider"></div><span class="chip">${configured===null?'正在连接服务…':configured?'AI 复盘可用':'AI 复盘暂不可用'}</span><p class="sub">${configured?'勾选后，点击按钮才发送当前周期的汇总依据；不发送体重、训练名称和逐组记录。':'服务恢复前，你仍可查看完整的训练概览。'}</p><details class="product-method"><summary>查看本次使用的训练汇总</summary><p>关注：${esc(goals[goal])} · 近 ${days} 天</p><ul>${r.facts.map(f=>`<li>${esc(f.title)}：${esc(f.text)}</li>`).join('')}</ul></details><label class="review-consent"><input id="review-consent" type="checkbox" ${consent?'checked':''} ${busy?'disabled':''}>同意将上方汇总依据发送到 LiftLog 服务器，由 Atlas 整理本次复盘</label><button class="primary" data-review="ai" ${!configured||!consent||busy||!r.sessionCount?'disabled':''}>${busy?'正在选择复盘重点…':'整理 AI 复盘'}</button><div role="status" aria-live="polite" class="review-error">${esc(error)}</div></section>
      ${current?`<section class="panel review-feedback"><h2>这些重点对你有帮助吗？</h2><p class="sub">${currentRun?.feedback?'已记录，可修改评价。':'反馈仅保存在当前空间，用于后续改进。'}</p><div class="review-votes">${[['useful','有帮助'],['irrelevant','不够相关'],['wrong','依据有误']].map(([id,label])=>`<button class="secondary ${currentRun?.feedback===id?'selected':''}" data-review="feedback" data-value="${id}" aria-pressed="${currentRun?.feedback===id}" ${busy?'disabled':''}>${label}</button>`).join('')}</div></section>`:''}</aside></div>
      <details class="panel product-method"><summary>数据与 AI 说明</summary><p>概览根据当前空间已保存的完成组计算。Atlas 只从给定依据中整理复盘重点，不会修改记录或自动安排训练。只有勾选并生成时，才发送本期汇总；不发送体重、训练名称与逐组明细。</p><button class="text-btn" data-review="export">导出本机复盘反馈记录</button></details>`;
  }
  root.onchange=event=>{
    if(event.target.id==='review-days'){days=Number(event.target.value);current=null;error='';consent=false;draw();}
    if(event.target.id==='review-goal'){goal=event.target.value;current=null;error='';consent=false;draw();}
    if(event.target.id==='review-consent'){consent=event.target.checked;draw();}
  };
  root.onclick=async event=>{
    const button=event.target.closest('[data-review]');if(!button||button.disabled)return;
    const action=button.dataset.review,r=review();
    if(action==='start')return startTraining();if(action==='intake')return startIntake();if(action==='widen'){days=28;consent=false;current=null;draw();return;}
    if(action==='source')return openSession(button.dataset.id);
    if(action==='export'){
      const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,space,runs:getData().reviewRuns??[]},null,2)],{type:'application/json'}));
      const link=document.createElement('a');link.href=url;link.download=`liftlog-review-${space}-${r.today}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;
    }
    if(action==='local'){
      const started=performance.now(),fresh=review(),elapsedMs=Math.max(1,Math.round(performance.now()-started));
      current={signature:signature(),selection:fresh.baseline,engine:'local',elapsedMs,runId:track('local',fresh.baseline,elapsedMs)};error='';draw();
    }
    if(action==='feedback'){
      if(!current)current={signature:signature(),selection:r.baseline,engine:'local',elapsedMs:0};
      if(!current.runId)current.runId=track(current.engine,current.selection,current.elapsedMs);
      const run=getData().reviewRuns?.find(x=>x.id===current.runId);if(!run)return;
      const previous=run.feedback;run.feedback=button.dataset.value;
      if(!save()){run.feedback=previous;return;}
      notify('评价已保存在当前空间');draw();
    }
    if(action==='ai'){
      if(!configured||!consent||busy||!r.sessionCount)return;
      const snapshot=signature(),started=performance.now();busy=true;error='';draw();
      try{
        const response=await fetch('/api/ai/review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({goal,days,facts:r.facts.map(({id,text})=>({id,text})),engine:'atlas',consent:true}),signal:AbortSignal.timeout(100000)});
        const result=await response.json();
        if(!active()||snapshot!==signature())return;
        if(!response.ok)throw Object.assign(Error(result.error||'AI 暂时不可用，请稍后再试。'),{code:result.code});
        const selection=validateSelection(result,r),elapsedMs=Math.round(performance.now()-started);
        current={signature:snapshot,selection,engine:'ai',elapsedMs,runId:track('ai',selection,elapsedMs)};
      }catch(e){if(active()&&snapshot===signature()){error=e.name==='TimeoutError'?'这次整理超时了。你的训练概览仍可查看，稍后可以重试。':e.code==='review_priority_failed'?e.message:'暂时没能整理复盘，已保存的记录不受影响。请稍后重试。';track('ai',null,Math.round(performance.now()-started),'failed');}}
      finally{busy=false;if(active())draw();}
    }
  };
  draw();
  fetch('/api/ai/status').then(r=>{if(!r.ok)throw Error();return r.json();}).then(s=>{configured=s.configured===true;if(active())draw();}).catch(()=>{configured=false;if(active())draw();});
}

function emptyReview(r,space,older){
 return `<div class="page-heading"><div><p class="eyebrow">YOUR TRAINING, IN PERSPECTIVE</p><h1>回看训练，找到下一步。</h1><p class="sub">把每次完成的训练，连成更清楚的变化。</p></div><span class="review-pill">${space==='demo'?'示例记录':'我的训练'}</span></div><div class="product-review-filters"><label>回看多久<select id="review-days"><option value="7" ${days===7?'selected':''}>近 7 天</option><option value="28" ${days===28?'selected':''}>近 28 天</option></select></label><p>${r.start} — ${r.today}</p></div><section class="panel product-empty-review"><span class="product-empty-symbol" aria-hidden="true">↗</span><span class="chip">从一次训练开始</span><h2>这 ${days} 天，还没有完成的训练记录。</h2><p>记下动作、重量和次数。完成并保存后，<br>这里会帮你回看训练频率、组数和余力记录。</p><div class="product-empty-actions"><button class="primary" data-review="start">记录一次训练</button><button class="secondary" data-review="${older?'widen':'intake'}">${older?'查看近 28 天的 '+older+' 次记录':'用一句话记训练'}</button></div><ol class="product-empty-steps"><li><b>01</b>记录实际完成的组</li><li><b>02</b>保存到我的训练</li><li><b>03</b>回来看看这周的变化</li></ol><small>${space==='demo'?'你正在浏览示例空间，可从顶部切换到自己的记录。':'只读取当前设备保存的训练；更换设备时请通过备份恢复。'}</small></section>`;
}

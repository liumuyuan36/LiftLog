import {buildReview,goals,validateSelection} from './review.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let days=7,goal='consistency',current=null,configured=null,mountId=0;

export function mountReview(root,{getData,space,save,openSession,notify}){
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
    root.innerHTML=`<div class="page-heading"><div><p class="eyebrow">FROM RECORDS TO REFLECTION</p><h1>回看训练，找到下一步。</h1><p class="sub">从真实记录出发，看看最近的变化。</p></div><span class="review-pill">${space==='demo'?'示例体验 · 模拟训练':'个人空间 · 本机记录'}</span></div>
      <section class="review-hero panel"><div><span class="chip">${current?.engine==='ai'?'AI 已选择复盘重点':'本地规则 · 无模型调用'}</span><h2>你的记录，是复盘的起点。</h2><p class="sub">数字由日志计算。AI 只选择重点，不自动修改你的训练。</p></div><div class="review-controls"><label>复盘周期<select id="review-days"><option value="7" ${days===7?'selected':''}>近 7 天</option><option value="28" ${days===28?'selected':''}>近 28 天</option></select></label><label>这次关注什么<select id="review-goal">${Object.entries(goals).map(([id,name])=>`<option value="${id}" ${goal===id?'selected':''}>${name}</option>`).join('')}</select></label></div></section>
      <p class="review-period">${r.start} — ${r.today} · 对比 ${r.previousStart} — ${r.previousEnd} · ${r.sessionCount} 次有效记录</p>
      <section class="stats review-stats" aria-label="复盘数据"><article class="stat"><div class="stat-label">有效训练</div><div class="stat-value">${r.sessionCount}<span class="unit">次</span></div><div class="stat-foot">有已完成工作组的记录</div></article><article class="stat"><div class="stat-label">已完成工作组</div><div class="stat-value">${r.sets}<span class="unit">组</span></div><div class="stat-foot">排除热身与无效输入</div></article><article class="stat"><div class="stat-label">RIR 记录覆盖</div><div class="stat-value">${r.rirCoverage===null?'—':r.rirCoverage+'% '}</div><div class="stat-foot">留空表示未知</div></article></section>
      ${!r.sessionCount?'<div class="notice">本期还没有有效训练记录。先记录一次训练，再回来复盘；不会为你生成虚构进展。</div>':''}
      <div class="review-layout"><section><div class="section-head"><h2>${current?.engine==='ai'?'AI 选择的重点':'本地复盘重点'}</h2><span class="muted">${current?`${current.elapsedMs} ms`:'实时预览'}</span></div><div class="review-facts">${selection.factIds.map(id=>{const f=r.facts.find(f=>f.id===id);return `<article class="panel review-fact"><span class="review-evidence">日志依据 · ${esc(f.id)}</span><h3>${esc(f.title)}</h3><p>${esc(f.text)}</p>${f.refs.length?`<details><summary>查看 ${f.refs.length} 次来源训练</summary><div class="review-sources">${f.refs.map(s=>`<button class="view-link" data-review="source" data-id="${esc(s.id)}">${esc(s.date)} · ${esc(s.title)}</button>`).join('')}</div></details>`:''}</article>`;}).join('')}</div><section class="panel review-next"><h2>可以做的下一步</h2>${selection.actionIds.map(id=>{const a=r.actionOptions.find(a=>a.id===id);return `<div><h3>${esc(a.title)}</h3><p>${esc(a.text)}</p></div>`;}).join('')}</section></section>
      <aside><section class="panel review-generate"><h2>让重点贴合你的关注</h2><p class="sub">本地复盘随时可用。AI 会从同一组依据中选择重点，方便比较两种结果。</p><button class="secondary" data-review="local" ${busy?'disabled':''}>生成本地复盘</button><div class="review-divider"></div><span class="chip">${configured===null?'正在检查模型配置':configured?'DeepSeek · 已配置':'DeepSeek · 尚未配置'}</span><p class="sub">${configured?'勾选后，点击按钮才发送当前周期的汇总依据；不发送体重、训练名称和逐组记录。':'配置服务端密钥后可启用 AI，当前可以完整体验本地复盘。'}</p><details class="review-payload"><summary>查看将发送的内容</summary><pre>${esc(JSON.stringify({goal:r.goal,days:r.days,facts:r.facts.map(({id,text})=>({id,text}))},null,2))}</pre></details><label class="review-consent"><input id="review-consent" type="checkbox" ${consent?'checked':''} ${busy?'disabled':''}>同意将上方汇总依据发送至 DeepSeek 生成本次复盘</label><button class="primary" data-review="ai" ${!configured||!consent||busy||!r.sessionCount?'disabled':''}>${busy?'正在选择复盘重点…':'生成 AI 复盘'}</button><div role="status" aria-live="polite" class="review-error">${esc(error)}</div></section>
      <section class="panel review-feedback"><h2>这次复盘有帮助吗？</h2><p class="sub">${currentRun?.feedback?'已记录，可修改评价。':'反馈仅保存在当前空间，用于后续改进。'}</p><div class="review-votes">${[['useful','有帮助'],['irrelevant','不够相关'],['wrong','依据有误']].map(([id,label])=>`<button class="secondary ${currentRun?.feedback===id?'selected':''}" data-review="feedback" data-value="${id}" aria-pressed="${currentRun?.feedback===id}" ${busy?'disabled':''}>${label}</button>`).join('')}</div></section></aside></div>
      <section class="panel review-metrics"><div><h2>当前空间的体验反馈</h2><p class="sub">已保存成功复盘 ${successful.length} 次 · 已评价 ${rated.length} 次 · 有帮助 ${useful.length} 次。${rated.length?`有帮助占已评价的 ${Math.round(useful.length/rated.length*100)}%。`:'尚无评价。'}<br>仅统计最近 200 次尝试；这是使用反馈，不代表模型准确率。${space==='demo'?'示例空间反馈不计作真实用户数据。':''}</p></div><button class="secondary" data-review="export">导出复盘评测记录</button></section>`;
  }
  root.onchange=event=>{
    if(event.target.id==='review-days'){days=Number(event.target.value);current=null;error='';consent=false;draw();}
    if(event.target.id==='review-goal'){goal=event.target.value;current=null;error='';consent=false;draw();}
    if(event.target.id==='review-consent'){consent=event.target.checked;draw();}
  };
  root.onclick=async event=>{
    const button=event.target.closest('[data-review]');if(!button||button.disabled)return;
    const action=button.dataset.review,r=review();
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
        const response=await fetch('/api/ai/review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({goal,days,facts:r.facts.map(({id,text})=>({id,text}))}),signal:AbortSignal.timeout(30000)});
        const result=await response.json();
        if(!active()||snapshot!==signature())return;
        if(!response.ok)throw Error(result.error||'AI 暂时不可用，请稍后再试。');
        const selection=validateSelection(result,r),elapsedMs=Math.round(performance.now()-started);
        current={signature:snapshot,selection,engine:'ai',elapsedMs,runId:track('ai',selection,elapsedMs)};
      }catch(e){if(active()&&snapshot===signature()){error=e.name==='TimeoutError'?'请求超时，可以继续使用本地复盘。':e.message;track('ai',null,Math.round(performance.now()-started),'failed');}}
      finally{busy=false;if(active())draw();}
    }
  };
  draw();
  fetch('/api/ai/status').then(r=>{if(!r.ok)throw Error();return r.json();}).then(s=>{configured=s.configured===true;if(active())draw();}).catch(()=>{configured=false;if(active())draw();});
}

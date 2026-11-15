import {trainingTrail,trailWindow,trailEvidence} from './trail.js';
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#39;");
const fmt=n=>Number(n).toLocaleString('zh-CN',{maximumFractionDigits:2});
const verdict={up:'匹配组有提高',down:'匹配组有下降',flat:'匹配组保持相同',mixed:'匹配组有升有降'};
export function mountTrail(root,{getData,space,openSession,start}){
  const records=trainingTrail(getData().sessions);
  let index=records.length-1,focus='',replayTimer=0,frame=0,position=0,mapKey='',mapElement=null,alive=true,replayWindow=null;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function stopReplay(){replayWindow=null;clearTimeout(replayTimer);replayTimer=0;const button=root.querySelector('[data-trail="replay"]');if(button){button.textContent='▷ 回放本段';button.setAttribute('aria-pressed','false');}}
  function moveCursor(path,ink,cursor,target,initial){
    cancelAnimationFrame(frame);const from=initial?0:position,start=performance.now(),duration=reduced.matches?0:initial?950:460,total=path.getTotalLength();
    function tick(now){if(!alive||!root.isConnected)return;const t=duration?Math.min(1,(now-start)/duration):1,eased=1-Math.pow(1-t,3);position=from+(target-from)*eased;const p=path.getPointAtLength(total*position);cursor.style.left=p.x/340*100+'%';cursor.style.top=p.y/250*100+'%';ink.style.strokeDashoffset=String(1000*(1-position));if(t<1)frame=requestAnimationFrame(tick);}
    tick(start);
  }
  function draw(){
    if(!records.length){
      root.innerHTML='<section class="trail-panel trail-empty" aria-label="我的训练轨迹"><h2>你的起点，留在这里。</h2><div class="trail-start-dot" aria-hidden="true"></div><p>保存首次训练，留下第一个节点。</p><button type="button" class="primary" data-trail="start">记录第一场训练</button></section>';return;
    }
    const selected=records[index],window=replayWindow??trailWindow(records,index);
    if(!selected.exercises.some(e=>e.name===focus))focus=selected.exercises[0].name;
    const p=trailEvidence(records,selected.id,focus),pair=p.pairs?.[0],set=p.exercise.sets[0];
    const hasComparison=pair&&p.baseline;
    const unit=pair?.metric==='weight'?'kg':'次';
    let fact=fmt(set.reps),factUnit='次完成',context=(p.exercise.tracking==='reps'?'自重次数':fmt(set.weight)+' kg')+' · 第 1 工作组';
    if(pair){fact=fmt(pair.after[pair.metric]);factUnit=unit;context='第 '+pair.ordinal+' 工作组 · '+(pair.metric==='weight'?pair.after.reps+' 次 · RIR '+pair.after.rir:(p.exercise.tracking==='reps'?'自重':fmt(pair.after.weight)+' kg')+' · RIR '+pair.after.rir);}
    if(hasComparison&&(!p.latest.setupKnown||!p.baseline.setupKnown))context+=' · 器械待核实';
    let result='<strong>这次完成 '+selected.workingSets+' 个工作组。</strong><span> '+esc(p.reason||'还需同动作、同设置的更早记录，才能核对变化。')+'</span>';
    if(hasComparison){
      const sign=pair.delta>0?'+':'';
      result='<strong>'+esc(verdict[p.status]??'匹配组记录对照')+'</strong><span> 第 '+pair.ordinal+' 组：'+fmt(pair.before[pair.metric])+' → '+fmt(pair.after[pair.metric])+' '+unit+'（'+sign+fmt(pair.delta)+' '+unit+'）。</span>';
    }
    const sameDay=records.filter(r=>r.date===selected.date).length>1;
    const paths=window.records.length>1?'<svg class="trail-curve" viewBox="0 0 340 250" preserveAspectRatio="none" aria-hidden="true"><path class="trail-curve-base" d="M32 181 C76 181 84 78 140 92 S231 201 308 65" fill="none"/><path class="trail-curve-ink" pathLength="1000" d="M32 181 C76 181 84 78 140 92 S231 201 308 65" fill="none"/></svg>':'';
    root.innerHTML='<section class="trail-panel" aria-label="我的训练轨迹"><header class="trail-header"><div><h2>训练轨迹</h2></div><span class="trail-badge">'+(space==='demo'?'示例记录':'个人记录')+' · 近 90 天</span></header><div class="trail-layout"><div class="trail-map-wrap"><div class="trail-map" role="group" aria-label="选择已完成的训练节点">'+paths+'<div class="trail-cursor" aria-hidden="true"></div><div class="trail-nodes"></div></div><p class="trail-map-note">按训练顺序展示<span>共 '+records.length+' 次'+(records.length>5?' · 展示第 '+(window.start+1)+'–'+(window.start+window.records.length)+' 次':'')+'</span></p></div><div class="trail-detail"><div class="trail-detail-top"><span>'+esc(selected.date)+'</span><span>第 '+selected.ordinal+' 次训练</span></div><h3>'+esc(selected.title)+'</h3><label class="trail-focus-label">查看动作<select aria-label="轨迹查看动作">'+selected.exercises.map(e=>'<option'+(e.name===focus?' selected':'')+'>'+esc(e.name)+'</option>').join('')+'</select></label><div class="trail-fact"><strong>'+fact+'</strong><span>'+factUnit+'</span></div><p class="trail-context">'+esc(context)+'</p><div class="trail-result" data-status="'+esc(p.status)+'" aria-live="polite">'+result+'</div><p class="trail-session-facts">'+selected.exercises.length+' 个动作 · '+selected.workingSets+' 工作组 · '+fmt(selected.volume)+' kg 负重容量</p><button class="view-link" type="button" data-trail="source" data-id="'+esc(selected.id)+'">查看训练 ↗</button></div></div><nav class="trail-nav" aria-label="回看训练轨迹"><button type="button" data-trail="previous"'+(index===0?' disabled':'')+'>← 上一次</button><div class="trail-position"><span>'+ (index+1)+' / '+records.length+' 次训练</span>'+(window.records.length>1?'<button type="button" data-trail="replay" aria-pressed="false">▷ 回放本段</button>':'')+'</div><button type="button" data-trail="next"'+(index===records.length-1?' disabled':'')+'>下一次 →</button></nav><details class="trail-method"><summary>比较依据与来源</summary><p>节点按近 90 天的记录顺序排列，只包含有效、已完成的工作组。曲线的高低和长短不表示力量或增肌效果，日期间隔不按比例绘制。'+(sameDay?'同一天多场训练仅作展示排列，不判断实际先后。':'')+'</p><p>对比固定选择当前动作中第一个可匹配工作组，核对动作顺序、器械设置和相同的自报 RIR；同重量比次数，同次数比重量，不挑历史最弱记录。其他匹配组：'+(p.pairs?.length?p.pairs.map(row=>'第 '+row.ordinal+' 组 '+fmt(row.before[row.metric])+' → '+fmt(row.after[row.metric])+' '+(row.metric==='weight'?'kg':'次')).join('；'):'暂无')+'。'+(p.unmatched?'另有 '+p.unmatched+' 组条件不同或信息不足。':'')+'</p>'+(hasComparison?'<p class="trail-condition">'+(p.latest.setupKnown&&p.baseline.setupKnown?'器械名称及设置已记录，仍依赖填写一致。':'器械名称未记录，无法确认同一器械；这里只对照其余已记录条件。')+'尚未控制实际休息、动作幅度与节奏，不等同于身体变化。</p><button class="view-link" type="button" data-trail="source" data-id="'+esc(p.baseline.id)+'">查看对比记录 · '+esc(p.baseline.date)+' ↗</button>':'')+'</details></section>';
    const key=window.records.map(r=>r.id).join('|'),sameMap=key===mapKey&&mapElement;
    if(sameMap)root.querySelector('.trail-map').replaceWith(mapElement);
    else {mapKey=key;mapElement=root.querySelector('.trail-map');position=0;}
    const path=root.querySelector('.trail-curve-base'),ink=root.querySelector('.trail-curve-ink'),nodes=root.querySelector('.trail-nodes');
    if(!sameMap)nodes.replaceChildren();
    const total=path?.getTotalLength()??0;
    window.records.forEach((record,i)=>{
      const t=window.records.length===1?0:i/(window.records.length-1),point=path?path.getPointAtLength(total*t):{x:170,y:125};
      if(sameMap){nodes.children[i].setAttribute('aria-pressed',String(record.id===selected.id));return;}
      const b=document.createElement('button');b.type='button';b.className='trail-node';b.dataset.trail='node';b.dataset.id=record.id;
      b.style.left=point.x/340*100+'%';b.style.top=point.y/250*100+'%';b.setAttribute('aria-label','查看 '+record.date+' '+record.title+' 的训练节点');b.setAttribute('aria-pressed',String(record.id===selected.id));
      b.innerHTML='<b aria-hidden="true"></b><span>'+esc(record.date.slice(5).replace('-','.'))+'</span>';nodes.appendChild(b);
    });
    if(ink)moveCursor(path,ink,root.querySelector('.trail-cursor'),(index-window.start)/(window.records.length-1),!sameMap);
    else root.querySelector('.trail-cursor').hidden=true;
  }
  root.onclick=event=>{
    const b=event.target.closest('[data-trail]');if(!b||!root.contains(b))return;
    const action=b.dataset.trail;
    if(b.disabled)return;
    if(action==='replay'){
      if(replayTimer){stopReplay();return;}
      const segment=trailWindow(records,index),end=segment.start+segment.records.length-1;
      function step(){if(!alive||!root.isConnected)return stopReplay();focus='';draw();const control=root.querySelector('[data-trail="replay"]');control.textContent='Ⅱ 暂停';control.setAttribute('aria-pressed','true');if(index<end){replayTimer=setTimeout(()=>{index++;step();},1100);}else replayTimer=setTimeout(stopReplay,1100);}
      replayWindow=segment;index=segment.start;step();return;
    }
    stopReplay();
    if(action==='source'){openSession(b.dataset.id);return;}
    if(action==='start'){start();return;}
    if(action==='previous'&&index>0)index--;
    if(action==='next'&&index<records.length-1)index++;
    if(action==='node')index=records.findIndex(r=>r.id===b.dataset.id);
    if(index>=0){
      focus='';draw();
      const selectedNode=[...root.querySelectorAll('.trail-node')].find(n=>n.dataset.id===records[index].id);
      if(action==='node')selectedNode?.focus();
      else if(action==='previous'||action==='next'){
        const target=root.querySelector('[data-trail="'+action+'"]');
        (target&&!target.disabled?target:selectedNode)?.focus();
      }
    }
  };
  root.onchange=event=>{if(event.target.matches('select')){stopReplay();focus=event.target.value;draw();root.querySelector('select')?.focus();}};
  const onVisibility=()=>{if(document.hidden)stopReplay();};document.addEventListener('visibilitychange',onVisibility);
  const onMotion=()=>{cancelAnimationFrame(frame);stopReplay();draw();};reduced.addEventListener('change',onMotion);
  draw();
  return ()=>{alive=false;stopReplay();cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',onVisibility);reduced.removeEventListener('change',onMotion);};
}

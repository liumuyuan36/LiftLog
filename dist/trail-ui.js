import {trainingTrail,trailWindow,trailEvidence} from './trail.js';
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#39;");
const fmt=n=>Number(n).toLocaleString('zh-CN',{maximumFractionDigits:2});
const verdict={up:'匹配组有提高',down:'匹配组有下降',flat:'匹配组保持相同',mixed:'匹配组有升有降'};
export function mountTrail(root,{getData,space,openSession,start}){
  const records=trainingTrail(getData().sessions);
  let index=records.length-1,focus='',frame=0,mapKey='',mapElement=null,alive=true,motionFrame=0,motions=[];
  let view=trailWindow(records,index);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function paintSpread(progress){
    root.querySelectorAll('.trail-curve-ink,.trail-curve-bloom').forEach(p=>p.style.strokeDashoffset=String(1000*(1-progress)));
    const nodes=[...root.querySelectorAll('.trail-node')];nodes.forEach((n,i)=>n.classList.toggle('trail-grown',progress>=i/Math.max(1,nodes.length-1)));
  }
  function finishSpread(){cancelAnimationFrame(frame);paintSpread(1);const b=root.querySelector('[data-trail="spread"]');if(b){b.disabled=false;b.textContent='重新展开';}}
  function spread(){
    cancelAnimationFrame(frame);if(reduced.matches)return finishSpread();
    mapElement.classList.add('trail-reset');paintSpread(0);void mapElement.offsetWidth;mapElement.classList.remove('trail-reset');const b=root.querySelector('[data-trail="spread"]');if(b){b.disabled=true;b.textContent='展开中…';}
    const started=performance.now();
    function tick(now){if(!alive||!root.isConnected)return;const t=Math.min(1,(now-started)/2600),progress=t*t*(3-2*t);paintSpread(progress);if(t<1)frame=requestAnimationFrame(tick);else finishSpread();}
    frame=requestAnimationFrame(tick);
  }
  function pointAt(path,t){
    const length=path.getTotalLength(),bounded=Math.max(0,Math.min(1,t)),p=path.getPointAtLength(length*bounded);
    if(t<0||t>1){const q=path.getPointAtLength(length*(t<0 ? .02 : .98)),dx=p.x-q.x,dy=p.y-q.y,d=Math.hypot(dx,dy)||1,extra=length*Math.abs(t-bounded);return {x:p.x+dx/d*extra,y:p.y+dy/d*extra};}return p;
  }
  function place(node,path,t){const p=pointAt(path,t);node.style.left=p.x/340*100+'%';node.style.top=p.y/250*100+'%';node.dataset.trailT=String(t);}
  function finishMotion(){
    cancelAnimationFrame(motionFrame);for(const m of motions){if(m.exit)m.node.remove();else{place(m.node,m.path,m.to);m.node.style.opacity='';m.node.querySelector('b').style.transform='';}}motions=[];
  }
  function moveWindow(path,before,direction){
    const nodes=[...root.querySelectorAll('.trail-node')];motions=nodes.map((node,i)=>({node,path,from:before.get(node.dataset.id)?.t??(direction>0?1.17:-.17),to:i/Math.max(1,nodes.length-1),enter:!before.has(node.dataset.id)}));
    const ids=new Set(nodes.map(n=>n.dataset.id));for(const [id,old]of before){if(ids.has(id))continue;const node=old.node.cloneNode(true);node.classList.add('trail-ghost');node.disabled=true;node.tabIndex=-1;node.setAttribute('aria-hidden','true');node.removeAttribute('data-trail');root.querySelector('.trail-nodes').append(node);motions.push({node,path,from:old.t,to:direction>0?-.17:1.17,exit:true});}
    const started=performance.now();function tick(now){if(!alive||!root.isConnected)return;const t=Math.min(1,(now-started)/560),u=t*t*(3-2*t);for(const m of motions){place(m.node,path,m.from+(m.to-m.from)*u);m.node.style.opacity=String(m.enter?u:m.exit?1-u:1);if(m.enter)m.node.querySelector('b').style.transform='scale('+(.65+.35*u)+')';}if(t<1)motionFrame=requestAnimationFrame(tick);else finishMotion();}tick(started);
  }
  function draw(animate=false){
    if(!records.length){
      root.innerHTML='<section class="trail-panel trail-empty" aria-label="我的训练轨迹"><h2>你的起点，留在这里。</h2><div class="trail-start-dot" aria-hidden="true"></div><p>保存首次训练，留下第一个节点。</p><button type="button" class="primary" data-trail="start">记录第一场训练</button></section>';return;
    }
    const before=new Map([...(mapElement?.querySelectorAll('.trail-node:not(.trail-ghost)')??[])].map(n=>[n.dataset.id,{node:n,t:Number(n.dataset.trailT)}]));
    const oldStart=mapElement?Number(mapElement.dataset.start):view.start;finishMotion();
    const selected=records[index],window=view;
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
    const paths=window.records.length>1?'<svg class="trail-curve" viewBox="0 0 340 250" preserveAspectRatio="none" aria-hidden="true"><path class="trail-curve-base" d="M32 181 C76 181 84 78 140 92 S231 201 308 65" fill="none"/><path class="trail-curve-bloom" pathLength="1000" d="M32 181 C76 181 84 78 140 92 S231 201 308 65" fill="none"/><path class="trail-curve-ink" pathLength="1000" d="M32 181 C76 181 84 78 140 92 S231 201 308 65" fill="none"/></svg>':'';
    root.innerHTML='<section class="trail-panel" aria-label="我的训练轨迹"><header class="trail-header"><div><h2>训练轨迹</h2></div><span class="trail-badge">'+(space==='demo'?'示例记录':'个人记录')+' · 近 90 天</span></header><div class="trail-layout"><div class="trail-map-wrap"><div class="trail-map" role="group" aria-label="选择已完成的训练节点">'+paths+'<div class="trail-nodes"></div></div><p class="trail-map-note">按训练顺序展示<span>共 '+records.length+' 次'+(records.length>5?' · 展示第 '+(window.start+1)+'–'+(window.start+window.records.length)+' 次':'')+'</span></p></div><div class="trail-detail"><div class="trail-detail-top"><span>'+esc(selected.date)+'</span><span>第 '+selected.ordinal+' 次训练</span></div><h3>'+esc(selected.title)+'</h3><label class="trail-focus-label">查看动作<select aria-label="轨迹查看动作">'+selected.exercises.map(e=>'<option'+(e.name===focus?' selected':'')+'>'+esc(e.name)+'</option>').join('')+'</select></label><div class="trail-fact"><strong>'+fact+'</strong><span>'+factUnit+'</span></div><p class="trail-context">'+esc(context)+'</p><div class="trail-result" data-status="'+esc(p.status)+'" aria-live="polite">'+result+'</div><p class="trail-session-facts">'+selected.exercises.length+' 个动作 · '+selected.workingSets+' 工作组 · '+fmt(selected.volume)+' kg 负重容量</p><button class="view-link" type="button" data-trail="source" data-id="'+esc(selected.id)+'">查看训练 ↗</button></div></div><nav class="trail-nav" aria-label="回看训练轨迹"><button type="button" data-trail="previous"'+((records.length>5?view.start===0:index===0)?' disabled':'')+'>'+(records.length>5?'← 较早':'← 上一次')+'</button><div class="trail-position"><span>'+(records.length>5?(window.start+1)+'–'+(window.start+window.records.length):index+1)+' / '+records.length+' 次训练</span></div><button type="button" data-trail="next"'+((records.length>5?view.start+view.records.length===records.length:index===records.length-1)?' disabled':'')+'>'+(records.length>5?'较近 →':'下一次 →')+'</button></nav><details class="trail-method"><summary>比较依据与来源</summary><p>节点按近 90 天的记录顺序排列，只包含有效、已完成的工作组。曲线的高低和长短不表示力量或增肌效果，日期间隔不按比例绘制。'+(sameDay?'同一天多场训练仅作展示排列，不判断实际先后。':'')+'</p><p>对比固定选择当前动作中第一个可匹配工作组，核对动作顺序、器械设置和相同的自报 RIR；同重量比次数，同次数比重量，不挑历史最弱记录。其他匹配组：'+(p.pairs?.length?p.pairs.map(row=>'第 '+row.ordinal+' 组 '+fmt(row.before[row.metric])+' → '+fmt(row.after[row.metric])+' '+(row.metric==='weight'?'kg':'次')).join('；'):'暂无')+'。'+(p.unmatched?'另有 '+p.unmatched+' 组条件不同或信息不足。':'')+'</p>'+(hasComparison?'<p class="trail-condition">'+(p.latest.setupKnown&&p.baseline.setupKnown?'器械名称及设置已记录，仍依赖填写一致。':'器械名称未记录，无法确认同一器械；这里只对照其余已记录条件。')+'尚未控制实际休息、动作幅度与节奏，不等同于身体变化。</p><button class="view-link" type="button" data-trail="source" data-id="'+esc(p.baseline.id)+'">查看对比记录 · '+esc(p.baseline.date)+' ↗</button>':'')+'</details></section>';
    const key=window.records.map(r=>r.id).join('|'),sameMap=key===mapKey&&mapElement;
    if(sameMap)root.querySelector('.trail-map').replaceWith(mapElement);
    else {mapKey=key;mapElement=root.querySelector('.trail-map');}mapElement.dataset.start=String(view.start);
    const path=root.querySelector('.trail-curve-base'),ink=root.querySelector('.trail-curve-ink'),nodes=root.querySelector('.trail-nodes');
    if(!sameMap)nodes.replaceChildren();
    const total=path?.getTotalLength()??0;
    window.records.forEach((record,i)=>{
      const t=window.records.length===1?0:i/(window.records.length-1),point=path?path.getPointAtLength(total*t):{x:170,y:125};
      if(sameMap){const n=nodes.children[i];n.setAttribute('aria-pressed',String(record.id===selected.id));if(path)place(n,path,t);return;}
      const b=document.createElement('button');b.type='button';b.className='trail-node';b.dataset.trail='node';b.dataset.id=record.id;
      b.dataset.trailT=String(t);b.style.left=point.x/340*100+'%';b.style.top=point.y/250*100+'%';b.setAttribute('aria-label','查看 '+record.date+' '+record.title+' 的训练节点');b.setAttribute('aria-pressed',String(record.id===selected.id));
      b.innerHTML='<b aria-hidden="true"></b><span>'+esc(record.date.slice(5).replace('-','.'))+'</span>';nodes.appendChild(b);
    });
    if(animate&&ink)spread();else finishSpread();
    if(!sameMap&&before.size&&path&&!reduced.matches)moveWindow(path,before,Math.sign(view.start-oldStart));
  }
  root.onclick=event=>{
    const b=event.target.closest('[data-trail]');if(!b||!root.contains(b))return;
    const action=b.dataset.trail;
    if(b.disabled)return;
    finishSpread();
    if(action==='source'){finishMotion();openSession(b.dataset.id);return;}
    if(action==='start'){start();return;}
    if(action==='previous'||action==='next'){
      const direction=action==='next'?1:-1;
      if(records.length>5){const start=Math.max(0,Math.min(records.length-5,view.start+direction));view={start,records:records.slice(start,start+5)};index=start+view.records.length-1;}
      else index=Math.max(0,Math.min(records.length-1,index+direction));
    }
    if(action==='node')index=records.findIndex(r=>r.id===b.dataset.id);
    if(index>=0){
      focus='';draw();
      const selectedNode=[...root.querySelectorAll('.trail-node')].find(n=>n.dataset.id===records[index].id);
      if(action==='node')selectedNode?.focus({preventScroll:true});
      else if(action==='previous'||action==='next'){
        const target=root.querySelector('[data-trail="'+action+'"]');
        (target&&!target.disabled?target:selectedNode)?.focus({preventScroll:true});
      }
    }
  };
  root.onchange=event=>{if(event.target.matches('select')){finishSpread();focus=event.target.value;draw();root.querySelector('select')?.focus({preventScroll:true});}};
  const onVisibility=()=>{if(document.hidden){finishSpread();finishMotion();}};document.addEventListener('visibilitychange',onVisibility);
  const onMotion=()=>{cancelAnimationFrame(frame);finishSpread();finishMotion();draw();};reduced.addEventListener('change',onMotion);
  draw(true);
  return ()=>{alive=false;cancelAnimationFrame(frame);finishMotion();document.removeEventListener('visibilitychange',onVisibility);reduced.removeEventListener('change',onMotion);};
}

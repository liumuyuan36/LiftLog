import {openVoice,closeVoice} from './voice-ui.js';
import {intakeCatalog,validateIntakeOutput} from './intake.js';
import {uid,localDate} from './data.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let sequence=0;
export function openIntake({getData,save,space,apply,notify,manual=()=>{}}){
  const dialog=document.querySelector('#intake-dialog'),session=++sequence;
  const available=()=>Boolean(status?.configured);
  const providerName=()=> 'DeepSeek';
  let text='',consent=false,busy=false,status=null,result=null,runId=null,error='',controller=null;
  const active=()=>dialog.open&&session===sequence;
  const remember=(state,meta={})=>{
    const data=getData(),previous=data.intakeRuns;
    const run={id:uid(),createdAt:new Date().toISOString(),space,status:state,inputCharacters:text.length,...meta};
    data.intakeRuns=[...(previous??[]),run].slice(-200);
    if(!save()){data.intakeRuns=previous;return null;}return run.id;
  };
  function render(){
    dialog.innerHTML=`<header class="dialog-header"><div><p class="eyebrow">DESCRIBE. REVIEW. LOG.</p><h2>用一句话，记下这次训练</h2></div><button class="icon-button" data-intake="close" aria-label="关闭快捷录入">×</button></header><div class="dialog-body intake-body"><p class="sub">输入已经完成的动作、总重量、每组次数和组数。也可以语音录入，核对后再整理；RIR 可省略。</p><p class="sub">由 DeepSeek 整理草稿，保存前由你核对。</p><label>本次训练描述<textarea id="intake-text" maxlength="1200" rows="4" placeholder="例如：杠铃卧推50kg，做了10、9、8次，RIR2" ${busy?'disabled':''}>${esc(text)}</textarea></label><p class="intake-counter">${text.length} / 1200 字 · ${space==='demo'?'当前为示例空间':'当前为个人空间'}</p><div class="intake-examples"><button data-intake="voice" ${busy?'disabled':''}>语音录入</button><button data-intake="example" ${busy?'disabled':''}>填入示例</button><button data-intake="context-example" ${busy?'disabled':''}>目标＋训练示例</button><span>${status===null?'正在连接服务…':available()?providerName()+' 可用':'服务暂不可用'}</span></div><label class="review-consent"><input id="intake-consent" type="checkbox" ${consent?'checked':''} ${busy?'disabled':''}>同意将本次描述和动作名称发送至 DeepSeek。 不会发送其他训练历史，也不会将本次描述加入训练集。</label><button class="primary" data-intake="generate" ${busy||!consent||!text.trim()||!available()?'disabled':''}>${busy?'正在整理训练草稿…':'整理训练草稿'}</button>${status&&!available()?'<p class="sub">服务暂不可用，你仍可手动记录。</p>':''}<div class="validation" role="status" aria-live="polite">${esc(error)}</div>${result?preview():''}<button class="text-btn intake-manual" data-intake="manual" ${busy?'disabled':''}>改为手动记录</button></div>`;
    dialog.querySelector('#intake-text').oninput=e=>{text=e.target.value;consent=false;const consentBox=dialog.querySelector('#intake-consent');if(consentBox)consentBox.checked=false;result=null;runId=null;error='';dialog.querySelector('.intake-counter').textContent=`${text.length} / 1200 字 · ${space==='demo'?'当前为示例空间':'当前为个人空间'}`;dialog.querySelector('[data-intake="generate"]').disabled=busy||!consent||!text.trim()||!available();const old=dialog.querySelector('.intake-preview');if(old)old.remove();};
    dialog.querySelector('#intake-consent').onchange=e=>{consent=e.target.checked;render();};
  }
  function preview(){
    if(result.status!=='ready')return `<section class="intake-preview panel"><h3>${result.status==='clarify'?'先补充一点信息':'这段内容暂不能记为训练'}</h3><ul>${result.questions.map(q=>`<li>${esc(q)}</li>`).join('')}</ul><p class="sub">在上方补充后重新生成，不会保存不完整的记录。</p></section>`;
    return `<section class="intake-preview panel"><span class="chip">${esc(providerName())} · 待校对 · 尚未写入训练历史</span><h3>${esc(result.date)} · ${result.exercises.length} 个动作</h3>${result.exercises.map(e=>`<article><h4>${esc(e.name)}</h4><p class="intake-source">原文：${esc(e.source)}</p><table><thead><tr><th>组</th><th>${e.tracking==='reps'?'记录方式':'总重量'}</th><th>次数</th><th>RIR</th></tr></thead><tbody>${e.sets.map((s,i)=>`<tr><td>${i+1}${s.type==='warmup'?' · 热身':''}</td><td>${e.tracking==='reps'?'自重':esc(s.weight)+' kg'}</td><td>${s.reps}</td><td>${s.rir===''?'未记录':s.rir}</td></tr>`).join('')}</tbody></table></article>`).join('')}<p class="sub">下一步核对重量和次数，再逐组确认完成。${getData().draft?'识别的组会加入现有草稿，不会覆盖已有组。':''}</p><button class="primary" data-intake="apply">核对并带入训练</button><button class="text-btn" data-intake="retry">需要修改描述</button></section>`;
  }
  function close(){closeVoice();controller?.abort();sequence++;dialog.close();}
  dialog.oncancel=e=>{e.preventDefault();close();};
  dialog.onclick=async event=>{
    const button=event.target.closest('[data-intake]');if(!button||button.disabled)return;
    const action=button.dataset.intake;
    if(action==='close')return close();
    if(action==='voice')return openVoice({onAccept:value=>{if(!active())return;text=value;consent=false;result=null;runId=null;error='';render();}});
    if(action==='manual'){close();return manual();}
    if(action==='example'){consent=false;text='杠铃卧推50kg，做了10、9、8次，RIR2';result=null;runId=null;error='';render();}
    if(action==='context-example'){consent=false;text='想练宽肩窄腰。今天已经完成高位下拉，总重40公斤，第一组10次、第二组8次，RIR没记。';result=null;runId=null;error='';render();}
    if(action==='retry'){dialog.querySelector('#intake-text').focus();}
    if(action==='apply'&&result?.status==='ready'){
      if(!runId)return notify('本次体验记录未保存，请先检查本机存储。');
      try{if(apply(result,runId)!==false){sequence++;dialog.close();}}catch(e){error=e.message;render();}
    }
    if(action==='generate'){
      busy=true;error='';result=null;runId=null;controller=new AbortController();const timer=setTimeout(()=>controller.abort(),30000);render();
      const request={text:text.trim(),today:localDate(),catalog:intakeCatalog(getData())},started=performance.now();
      try{
        const response=await fetch('/api/ai/intake',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request),signal:controller.signal});
        const payload=await response.json();if(!active())return;
        if(!response.ok)throw Object.assign(Error(payload.error||'暂时无法整理草稿，请稍后重试。'),{code:payload.code??'http_'+response.status});
        result=validateIntakeOutput(payload.result,request);
        runId=remember(result.status,{...payload.meta,clientElapsedMs:Math.round(performance.now()-started),generatedSets:result.exercises.reduce((n,e)=>n+e.sets.length,0)});
      }catch(e){if(active()){error=e.name==='AbortError'?'这次整理超时了，输入内容已保留。可以稍后重试，或改为手动记录。':e instanceof TypeError?'暂时连不上识别服务，输入内容已保留。请检查网络，或改为手动记录。':e.code==='rate_limited'?'服务正在忙，请稍后重试。你也可以改为手动记录。':'这次没有整理出完整草稿。可以补充描述再试，或改为手动记录。';remember('failed',{clientElapsedMs:Math.round(performance.now()-started),failureCode:e.code??(e.name==='AbortError'?'timeout':e instanceof TypeError?'network':'invalid_output')});}}
      finally{clearTimeout(timer);busy=false;if(active())render();}
    }
  };
  render();dialog.showModal();
  fetch('/api/ai/status').then(r=>{if(!r.ok)throw Error();return r.json();}).then(value=>{status=value;if(active())render();}).catch(()=>{status={configured:false};if(active())render();});
}

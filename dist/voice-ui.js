import {encodeWav,joinSamples} from './audio.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let dismiss=null;
export function closeVoice(){dismiss?.();}
export function openVoice({onAccept,maxLength=1200}){
 closeVoice();const dialog=document.querySelector('#voice-dialog');
 let alive=true,recording=false,starting=false,busy=false,blob=null,url='',text='',error='',consent=false,context=null,stream=null,node=null,chunks=[],timer=null,started=0,controller=null,flush=null;
 const release=()=>{clearInterval(timer);stream?.getTracks().forEach(t=>t.stop());stream=null;node?.disconnect();node=null;const old=context;context=null;old?.close().catch(()=>{});};
 const close=()=>{alive=false;release();controller?.abort();if(url)URL.revokeObjectURL(url);url='';blob=null;chunks=[];text='';document.removeEventListener('visibilitychange',background);dialog.close();dismiss=null;};
 dismiss=close;
 const setBlob=value=>{if(url)URL.revokeObjectURL(url);blob=value;url=URL.createObjectURL(value);text='';consent=false;};
 const render=()=>{
  if(!alive)return;
  dialog.innerHTML=`<header class="dialog-header"><div><p class="eyebrow">SPEAK. CHECK. CONTINUE.</p><h2>说下来，再核对。</h2></div><button class="icon-button" data-v="close" aria-label="关闭语音输入">×</button></header><div class="dialog-body voice-body"><p class="sub">最多 60 秒。先在本机录音，确认后才上传转写；不会自动保存为训练。</p><div class="voice-actions"><button class="${recording?'secondary':'primary'}" data-v="record" ${starting||busy?'disabled':''}>${starting?'正在准备麦克风…':recording?'结束录音':'开始录音'}</button><span class="voice-recording" role="status">${recording?'录音中 · 0 秒':''}</span></div><label class="voice-upload">或选择一段音频<input id="voice-file" type="file" accept="audio/*" ${recording||starting||busy?'disabled':''}></label><p class="sub">支持浏览器可解码的音频，文件不超过 8 MB。麦克风无法使用时，可选文件或使用手机输入法。</p>${blob?`<audio controls src="${esc(url)}"></audio><label class="review-consent"><input id="voice-consent" type="checkbox" ${consent?'checked':''} ${busy?'disabled':''}>同意将本段录音发送至 DeepSeek 语音服务进行转写。LiftLog 不保存音频，不将其加入训练集。</label><button class="primary" data-v="transcribe" ${!consent||busy||recording?'disabled':''}>${busy?'正在转写…':'转写这段录音'}</button>`:''}<p class="validation" role="status">${esc(error)}</p>${text?`<label>核对文字<textarea id="voice-text" rows="4" maxlength="${maxLength}">${esc(text)}</textarea></label><p class="sub">特别检查动作名称、公斤数和次数。确认后只填入输入框，仍需另行整理、核对。</p><button class="primary" data-v="accept">核对并填入</button>`:''}</div>`;
  const c=dialog.querySelector('#voice-consent');if(c)c.onchange=e=>{consent=e.target.checked;dialog.querySelector('[data-v="transcribe"]').disabled=!consent||busy;};
  const t=dialog.querySelector('#voice-text');if(t)t.oninput=e=>{text=e.target.value;dialog.querySelector('[data-v="accept"]').disabled=!text.trim();};
  dialog.querySelector('#voice-file').onchange=async e=>{
   const file=e.target.files[0];if(!file)return;busy=true;error='';render();let decoder;
   try{if(file.size>8*1024*1024)throw Error('文件超过 8 MB，请选短一些的音频。');decoder=new (window.AudioContext||window.webkitAudioContext)();const audio=await decoder.decodeAudioData(await file.arrayBuffer());if(!alive)return;if(audio.duration<.3||audio.duration>60)throw Error('请选择 0.3–60 秒的音频。');const mono=new Float32Array(audio.length);for(let c=0;c<audio.numberOfChannels;c++){const values=audio.getChannelData(c);for(let i=0;i<mono.length;i++)mono[i]+=values[i]/audio.numberOfChannels;}setBlob(new Blob([encodeWav(mono,audio.sampleRate)],{type:'audio/wav'}));}
   catch(e){if(alive)error=['EncodingError','NotSupportedError'].includes(e.name)?'浏览器无法解码这段音频，请换一个音频文件。':e.message;}
   finally{decoder?.close().catch(()=>{});busy=false;render();}
  };
 };
 const stop=async()=>{
  if(!recording)return;recording=false;clearInterval(timer);
  await new Promise(resolve=>{const end=setTimeout(resolve,200);flush=()=>{clearTimeout(end);resolve();};node?.port.postMessage('flush');});
  const rate=context?.sampleRate??48000;release();if(!alive)return;
  try{const input=joinSamples(chunks).slice(0,Math.floor(rate*60));setBlob(new Blob([encodeWav(input,rate)],{type:'audio/wav'}));}catch(e){error=e.message;}
  chunks=[];render();
 };
 const background=()=>{if(document.hidden&&recording)stop();};document.addEventListener('visibilitychange',background);
 dialog.oncancel=e=>{e.preventDefault();close();};
 dialog.onclick=async e=>{
  const b=e.target.closest('[data-v]');if(!b||b.disabled)return;
  if(b.dataset.v==='close')return close();
  if(b.dataset.v==='accept'){const value=text.trim().slice(0,maxLength);if(!value)return;close();return onAccept(value);}
  if(b.dataset.v==='record'){
   if(recording)return stop();starting=true;error='';render();
   try{if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia)throw Error('此浏览器不能启用麦克风。请用 Safari 打开，或选择音频文件。');const acquired=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true},video:false});if(!alive){acquired.getTracks().forEach(t=>t.stop());return;}stream=acquired;if(document.hidden)throw Error('页面已切到后台，请回到页面后重新录音。');context=new (window.AudioContext||window.webkitAudioContext)();await context.resume();if(!context.audioWorklet)throw Error('此浏览器暂不支持录音处理，请选择音频文件。');await context.audioWorklet.addModule(new URL('./pcm-worklet.js',import.meta.url));if(!alive){release();return;}node=new AudioWorkletNode(context,'liftlog-pcm');chunks=[];node.port.onmessage=e=>{if(e.data.samples&&chunks.reduce((n,a)=>n+a.length,0)<context?.sampleRate*60)chunks.push(e.data.samples);if(e.data.flushed)flush?.();};context.createMediaStreamSource(stream).connect(node);node.connect(context.destination);recording=true;started=Date.now();render();timer=setInterval(()=>{const seconds=Math.floor((Date.now()-started)/1000),label=dialog.querySelector('.voice-recording');if(label)label.textContent=`录音中 · ${Math.min(60,seconds)} 秒`;if(seconds>=60)stop();},250);}
   catch(e){release();if(alive)error=e.name==='NotAllowedError'?'没有获得麦克风权限。可在浏览器设置中允许，或选择音频文件。':e.message;}
   finally{starting=false;if(!recording)render();else{const b=dialog.querySelector('[data-v="record"]');if(b)b.disabled=false;}}
  }
  if(b.dataset.v==='transcribe'){
   busy=true;error='';controller=new AbortController();const deadline=setTimeout(()=>controller.abort(),35000);render();
   try{const r=await fetch('/api/ai/transcribe',{method:'POST',headers:{'Content-Type':'audio/wav','x-audio-consent':'yes'},body:blob,signal:controller.signal});const v=await r.json();if(!r.ok)throw Error(v.error||'暂时无法转写，请稍后再试。');if(alive){text=v.text.slice(0,maxLength);if(v.text.length>maxLength)error=`文字超过 ${maxLength} 字，已截取前段，请核对。`;}}
   catch(e){if(alive)error=e.name==='AbortError'?'转写超时，录音仍保留在页面。可重试或手动输入。':e instanceof TypeError?'网络暂不可用，录音仍保留在页面。':e.message;}
   finally{clearTimeout(deadline);busy=false;render();}
  }
 };
 render();dialog.showModal();
}

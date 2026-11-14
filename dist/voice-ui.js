let dismiss=null;
export function closeVoice(){dismiss?.();}
export function openVoice({onAccept,maxLength=1200}){
 closeVoice();const dialog=document.querySelector('#voice-dialog');
 dialog.innerHTML=`<header class="dialog-header"><div><p class="eyebrow">DICTATE. CHECK. CONTINUE.</p><h2>听写之后，再核对。</h2></div><button class="icon-button" data-close aria-label="关闭听写输入">×</button></header><div class="dialog-body voice-body"><p>点击下方输入框，使用手机输入法的麦克风听写，也可以输入或粘贴文字。</p><label>核对训练描述<textarea id="voice-text" rows="5" maxlength="${maxLength}" placeholder="杠铃卧推 50 公斤，10 次，2 组"></textarea></label><p class="sub">语音由设备或输入法处理，Atlas 只处理文字。LiftLog 不在此录音或上传音频。</p><p class="sub">检查动作名称、重量和次数。这里只填入描述；整理、核对和保存仍由你确认。</p><button class="primary" data-accept disabled>核对并填入</button></div>`;
 const input=dialog.querySelector('textarea'),accept=dialog.querySelector('[data-accept]');
 const close=()=>{dialog.close();dialog.removeEventListener('cancel',cancel);dialog.removeEventListener('close',closed);dismiss=null;};
 const cancel=e=>{e.preventDefault();close();};const closed=()=>{dismiss=null;dialog.removeEventListener('cancel',cancel);dialog.removeEventListener('close',closed);};
 dismiss=close;dialog.querySelector('[data-close]').onclick=close;input.oninput=()=>{accept.disabled=!input.value.trim();};
 accept.onclick=()=>{const text=input.value.trim();if(!text)return;close();onAccept(text);};
 dialog.addEventListener('cancel',cancel);dialog.addEventListener('close',closed);dialog.showModal();input.focus();
}

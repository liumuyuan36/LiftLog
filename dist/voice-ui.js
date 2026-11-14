let dismiss=null;
export function closeVoice(){dismiss?.();}
export function openVoice({onAccept,maxLength=1200}){
 closeVoice();const dialog=document.querySelector('#voice-dialog');
 dialog.innerHTML=`<header class="dialog-header"><div><h2>听写输入</h2></div><button class="icon-button" data-close aria-label="关闭听写输入">×</button></header><div class="dialog-body voice-body"><p>点击输入框，使用输入法麦克风听写。</p><label>核对训练描述<textarea id="voice-text" rows="5" maxlength="${maxLength}" placeholder="杠铃卧推 50 公斤，10 次，2 组"></textarea></label><p class="sub">语音由输入法处理，LiftLog 仅接收核对后的文字。</p><p class="sub">请核对动作、重量与次数。填入后不会自动保存。</p><button class="primary" data-accept disabled>核对并填入</button></div>`;
 const input=dialog.querySelector('textarea'),accept=dialog.querySelector('[data-accept]');
 const close=()=>{dialog.close();dialog.removeEventListener('cancel',cancel);dialog.removeEventListener('close',closed);dismiss=null;};
 const cancel=e=>{e.preventDefault();close();};const closed=()=>{dismiss=null;dialog.removeEventListener('cancel',cancel);dialog.removeEventListener('close',closed);};
 dismiss=close;dialog.querySelector('[data-close]').onclick=close;input.oninput=()=>{accept.disabled=!input.value.trim();};
 accept.onclick=()=>{const text=input.value.trim();if(!text)return;close();onAccept(text);};
 dialog.addEventListener('cancel',cancel);dialog.addEventListener('close',closed);dialog.showModal();input.focus();
}

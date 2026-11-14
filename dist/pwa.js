let state={ready:false,error:false};
const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
export function pwaStatus(){return !window.isSecureContext?'需要 HTTPS 才能启用离线':state.error?'离线缓存未就绪，请联网重试':state.ready?'离线记录已就绪':'首次使用，请保持联网完成准备';}
export function refreshPwa(){
  const el=document.querySelector('#pwa-state');
  if(el)el.textContent=`${navigator.onLine?'在线':'当前离线'} · ${pwaStatus()}`;
  const install=document.querySelector('#pwa-install-button');
  if(install)install.textContent=standalone()?'已从主屏幕打开':'添加到 iPhone 主屏幕';
}
export function initPwa(){
  refreshPwa();
  window.addEventListener('online',refreshPwa);window.addEventListener('offline',refreshPwa);
  document.addEventListener('click',event=>{
    if(!event.target.closest('[data-action="install-guide"]'))return;
    const dialog=document.querySelector('#install-dialog');
    dialog.innerHTML=`<header class="dialog-header"><h2>把 LiftLog 放到主屏幕</h2><button class="icon-button" aria-label="关闭安装说明" id="close-install">×</button></header><div class="dialog-body install-body"><img src="./icons/apple-touch-icon.png" width="72" height="72" alt="LiftLog 图标"><p>在 iPhone 上，用 Safari 打开正式的 HTTPS 访问地址。</p><ol><li>点 Safari 的分享按钮。</li><li>选择「添加到主屏幕」。</li><li>如果出现「作为网页 App 打开」，保持开启，点「添加」。</li></ol><p>之后点主屏幕图标进入独立窗口。首次联网准备完成后，记录、历史和训练概览可以离线使用；AI 复盘需要联网。</p><p class="sub">它是主屏幕网页 App，无需苹果开发者账号，不通过 App Store 安装。请在主屏幕 App 内检查数据；Safari 与主屏幕 App 的存储可能分开，必要时用 JSON 备份迁移。</p><p class="sub">当前状态：${pwaStatus()}</p></div>`;
    dialog.querySelector('#close-install').onclick=()=>dialog.close();dialog.showModal();
  });
  if(!('serviceWorker' in navigator)||!window.isSecureContext){state.error=true;refreshPwa();return;}
  navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(async reg=>{
    await navigator.serviceWorker.ready;
    state.ready=true;refreshPwa();
    if(reg.waiting)showUpdate();
    reg.addEventListener('updatefound',()=>reg.installing?.addEventListener('statechange',()=>{if(reg.waiting&&navigator.serviceWorker.controller)showUpdate();}));
  }).catch(()=>{state.error=true;refreshPwa();});
  navigator.serviceWorker.addEventListener('controllerchange',()=>{state.ready=true;refreshPwa();});
}
function showUpdate(){const el=document.querySelector('#pwa-update');if(el){el.hidden=false;el.textContent='新版本已准备好。结束训练后，关闭所有 LiftLog 窗口再打开即可更新。';}}

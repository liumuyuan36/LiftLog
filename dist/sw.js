const PREFIX='liftlog-shell-';
const CACHE=PREFIX+'v1.7.0-r3';
const FILES=['./','./index.html','./styles.css','./interface.css','./library.css','./exercise-library.js','./exercise-art.js','./library-ui.js','./fitness.js','./fitness-ui.js','./focus-ui.js','./workouts.js','./routine-ui.js','./app.js','./data.js','./review.js','./review-ui.js','./intake.js','./intake-ui.js','./decision.js','./decision-ui.js','./backup.js','./pwa.js','./favicon.svg','./manifest.webmanifest','./icons/apple-touch-icon.png','./icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
// 不强制替换正在记录训练的页面；新版本在旧页面全部关闭后生效。
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)));
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url),base=new URL(self.registration.scope);
  if(event.request.method!=='GET'||url.origin!==base.origin||!url.pathname.startsWith(base.pathname)||url.pathname.startsWith(base.pathname+'api/'))return;
  if(event.request.mode==='navigate'){
    event.respondWith(caches.open(CACHE).then(cache=>cache.match('./index.html')).then(cached=>cached||fetch(event.request)));
    return;
  }
  // 只缓存应用壳，绝不缓存 API、模型返回或训练数据。
  const relative='./'+url.pathname.slice(base.pathname.length);
  if(!FILES.includes(relative))return;
  event.respondWith(caches.open(CACHE).then(cache=>cache.match(event.request,{ignoreSearch:true})).then(cached=>cached||fetch(event.request)));
});


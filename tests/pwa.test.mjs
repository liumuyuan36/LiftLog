import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const root=new URL('../dist/',import.meta.url);
const source=await fs.readFile(new URL('sw.js',root),'utf8');
const currentCache='liftlog-shell-'+source.match(/const CACHE=PREFIX\+'([^']+)'/)[1];
function environment(){
  const handlers={},removed=[];let files=[];
  const cached={html:'offline-shell'};
  const context={URL,self:{registration:{scope:'https://liftlog.example/'},clients:{claim:async()=>true},addEventListener:(type,fn)=>handlers[type]=fn},caches:{open:async()=>({addAll:async list=>{files=list;},match:async()=>cached}),keys:async()=>['unrelated-cache','liftlog-shell-old',currentCache],delete:async key=>removed.push(key)},fetch:async()=>{throw Error('Network offline');}};
  vm.runInNewContext(source,context);return {handlers,removed,cached,getFiles:()=>files};
}
test('预缓存列表中的所有资源真实存在，manifest图标尺寸正确',async()=>{
  const env=environment();let pending;env.handlers.install({waitUntil:p=>pending=p});await pending;
  for(const file of env.getFiles())await fs.access(new URL(file==='./'?'index.html':file,root));
  const manifest=JSON.parse(await fs.readFile(new URL('manifest.webmanifest',root),'utf8'));
  assert.equal(manifest.display,'standalone');assert.equal(manifest.start_url,'./');
  for(const icon of manifest.icons){const png=await fs.readFile(new URL(icon.src,root));const size=Number(icon.sizes.split('x')[0]);assert.equal(png.readUInt32BE(16),size);assert.equal(png.readUInt32BE(20),size);}
});
test('断网导航从缓存返回应用壳；API、跨域和POST不被拦截或缓存',async()=>{
  const env=environment();let response;
  env.handlers.fetch({request:{url:'https://liftlog.example/',method:'GET',mode:'navigate'},respondWith:p=>response=p});assert.equal(await response,env.cached);
  for(const request of [{url:'https://liftlog.example/api/ai/status',method:'GET'},{url:'https://liftlog.example/api/ai/review',method:'POST'},{url:'https://elsewhere.example/app.js',method:'GET'}])env.handlers.fetch({request,respondWith:()=>assert.fail('API请求不得被离线缓存拦截')});
});
test('更新只清理自己的过期应用壳，不清理其他缓存',async()=>{
  const env=environment();let pending;env.handlers.activate({waitUntil:p=>pending=p});await pending;assert.deepEqual(env.removed,['liftlog-shell-old']);
});


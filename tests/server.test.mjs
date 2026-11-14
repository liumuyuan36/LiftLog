import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createAppServer,normalizePublicOrigin} from '../server.mjs';
import fs from 'node:fs';
const appVersion=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8')).version;

async function withServer(options,run){
  const server=createAppServer(options);server.listen(0,'0.0.0.0');await once(server,'listening');
  const base=`http://127.0.0.1:${server.address().port}`;
  try{await run(base,server);}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
}

test('容器监听所有接口，返回首页、WebP与健康状态，拒绝访问包外文件',async()=>{
  await withServer({},async(base,server)=>{
    assert.equal(server.address().address,'0.0.0.0');
    const page=await fetch(base+'/');assert.equal(page.status,200);assert.match(await page.text(),/LiftLog/);
    const image=await fetch(base+'/media/body3d/exercise-01-end.webp');assert.equal(image.headers.get('content-type'),'image/webp');assert.equal(Buffer.from(await image.arrayBuffer()).toString('ascii',8,12),'WEBP');
    const health=await fetch(base+'/healthz');assert.deepEqual(await health.json(),{status:'ok',version:appVersion});
    const secret=await fetch(base+'/%2e%2e%2fpackage.json');assert.equal(secret.status,403);
    const write=await fetch(base+'/',{method:'POST'});assert.equal(write.status,405);
  });
});

test('HTTPS代理入口下三个AI接口接受正确来源；伪造转发头和跨站来源被拒绝；不调用模型',async()=>{
  const before=process.env.ATLAS_ENABLED;delete process.env.ATLAS_ENABLED;
  try{
    await withServer({publicOrigin:'https://liftlog-demo.example/'},async base=>{
      for(const route of['intake','decision','review']){
        const url=base+'/api/ai/'+route;
        const valid=await fetch(url,{method:'POST',headers:{origin:'https://liftlog-demo.example','content-type':'application/json'},body:'{}'});
        assert.equal(valid.status,503);assert.equal((await valid.json()).code,'not_configured');assert.equal(valid.headers.get('cache-control'),'no-store');
        const bad=await fetch(url,{method:'POST',headers:{origin:'https://attacker.example','x-forwarded-host':'attacker.example','content-type':'application/json'},body:'{}'});assert.equal(bad.status,403);
        assert.equal((await fetch(url)).status,405);
      }
      const status=await fetch(base+'/api/ai/status'),availability=await status.json();assert.equal(availability.configured,false);assert.equal(availability.atlas.ready,false);
      const atlas=await fetch(base+'/api/atlas/intake',{method:'POST',headers:{origin:'https://liftlog-demo.example','content-type':'application/json'},body:'{}'});assert.equal(atlas.status,503);assert.equal((await atlas.json()).code,'not_configured');
    });
  }finally{if(before===undefined)delete process.env.ATLAS_ENABLED;else process.env.ATLAS_ENABLED=before;}
});

test('未配置公开域名时只认可实际Host，不信任伪造的代理Host；域名配置拒绝路径、凭据和非HTTPS公网地址',async()=>{
  await withServer({},async base=>{
    const response=await fetch(base+'/api/ai/intake',{method:'POST',headers:{origin:'https://attacker.example','x-forwarded-host':'attacker.example','content-type':'application/json'},body:'{}'});assert.equal(response.status,403);
  });
  assert.equal(normalizePublicOrigin('https://demo.example/'),'https://demo.example');
  for(const value of['https://demo.example/path','https://name:pass@demo.example','http://demo.example','https://demo.example/?x=1','https://demo.example/#a'])assert.throws(()=>normalizePublicOrigin(value));
});

test('资料拒答不依赖密钥；语音接口拒绝跨站与未经同意的上传',async()=>{
 const before=process.env.ATLAS_ENABLED;delete process.env.ATLAS_ENABLED;
 try{await withServer({},async base=>{
  const r=await fetch(base+'/api/ai/knowledge',{method:'POST',headers:{origin:base,'content-type':'application/json'},body:JSON.stringify({question:'量子计算机怎么工作',engine:'atlas',consent:true})});assert.equal(r.status,200);assert.equal((await r.json()).meta.modelCalled,false);
  const voice=await fetch(base+'/api/ai/transcribe',{method:'POST',headers:{origin:base,'content-type':'audio/wav'},body:'bad'});assert.equal(voice.status,403);
  const external=await fetch(base+'/api/ai/transcribe',{method:'POST',headers:{origin:'https://attacker.example','x-forwarded-host':'attacker.example','content-type':'audio/wav','x-audio-consent':'yes'},body:'bad'});assert.equal(external.status,403);
 });}finally{if(before===undefined)delete process.env.ATLAS_ENABLED;else process.env.ATLAS_ENABLED=before;}
});

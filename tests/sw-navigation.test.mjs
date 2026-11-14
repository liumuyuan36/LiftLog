import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

test('离线壳仅接管App入口，不把作品集与PDF导航替换成首页',async()=>{
  const handlers={},calls=[];
  const context={URL,self:{registration:{scope:'https://example.com/'},addEventListener:(name,fn)=>handlers[name]=fn},caches:{open:async()=>({match:async()=>({appShell:true})})}};
  vm.runInNewContext(await readFile(new URL('../dist/sw.js',import.meta.url),'utf8'),context);
  for(const pathname of ['/','/index.html','/portfolio/index.html','/portfolio/LiftLog-AI-PM-CaseStudy.pdf']){
    let response;
    handlers.fetch({request:{url:'https://example.com'+pathname,method:'GET',mode:'navigate'},respondWith:p=>{response=p;}});
    calls.push(Boolean(response));
    if(response)assert.equal((await response).appShell,true);
  }
  assert.deepEqual(calls,[true,true,false,false]);
});

import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {aiRoute,send} from './lib/ai-http.mjs';
import {generateIntake} from './lib/intake-model.mjs';
import {aiAvailability} from './lib/model-config.mjs';
import {startAtlasText,stopAtlasText} from './lib/atlas-text-runtime.mjs';
import {requireAtlasConsent} from './lib/atlas-text-config.mjs';
import {generateDecision} from './lib/decision-model.mjs';
import {generateKnowledge} from './lib/knowledge-model.mjs';
import {audioRoute} from './lib/transcribe.mjs';
import {generateSelection,validatePayload} from './ai.mjs';

const entry=fileURLToPath(import.meta.url);
const appVersion=JSON.parse(await readFile(new URL('./package.json',import.meta.url),'utf8')).version;
const root=fileURLToPath(new URL('./dist/',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.pdf':'application/pdf','.webmanifest':'application/manifest+json'};
const routes=new Map([
  ['/api/ai/intake',generateIntake],
  ['/api/ai/decision',generateDecision],
  ['/api/ai/knowledge',generateKnowledge],
  ['/api/ai/review',(body,options)=>{requireAtlasConsent(body);return generateSelection(validatePayload(body),options);}]
]);

export function normalizePublicOrigin(value=''){
  if(!value.trim())return '';
  const url=new URL(value.trim());
  if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('PUBLIC_ORIGIN must be an http(s) origin without a path or credentials.');
  if(url.protocol==='http:'&&!['localhost','127.0.0.1','[::1]'].includes(url.hostname))throw Error('PUBLIC_ORIGIN must use HTTPS outside localhost.');
  return url.origin;
}

export function allowedOrigin(req,publicOrigin=''){
  try{
    const origin=req.headers.origin,url=new URL(origin);
    if(!['http:','https:'].includes(url.protocol)||origin!==url.origin)return false;
    // Ignore client-supplied proxy headers. A configured public origin is the
    // authority when the platform forwards requests to an internal hostname.
    return publicOrigin?origin===publicOrigin:url.host===req.headers.host;
  }catch{return false;}
}

export function createAppServer({publicOrigin=process.env.PUBLIC_ORIGIN??''}={}){
  const expected=normalizePublicOrigin(publicOrigin);
  return http.createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');
    let url;try{url=new URL(req.url,'http://localhost');}catch{return send(res,400,{error:'请求地址无效。'});}
    const pathname=url.pathname;
    if(pathname==='/healthz')return send(res,req.method==='GET'||req.method==='HEAD'?200:405,{status:'ok',version:appVersion});
    if(pathname==='/api/ai/status'){
      if(req.method!=='GET')return send(res,405,{error:'仅支持 GET。'});
      return send(res,200,await aiAvailability());
    }
    if(pathname==='/api/atlas/intake'){
      if(req.method!=='POST')return send(res,405,{error:'仅支持 POST。'});
      if(!allowedOrigin(req,expected))return send(res,403,{error:'请求来源无效。'});
      req.headers['x-forwarded-host']=new URL(req.headers.origin).host;
      return aiRoute(req,res,generateIntake);
    }
    if(pathname==='/api/ai/transcribe'){
      if(!allowedOrigin(req,expected))return send(res,403,{error:'请求来源无效。'});
      req.headers['x-forwarded-host']=new URL(req.headers.origin).host;
      return audioRoute(req,res);
    }
    const generate=routes.get(pathname);
    if(generate){
      if(req.method!=='POST')return send(res,405,{error:'仅支持 POST。'});
      if(!allowedOrigin(req,expected))return send(res,403,{error:'请求来源无效。'});
      // The shared Vercel handler checks forwarded-host. Supply only the host
      // from the origin validated above, never a browser-provided proxy value.
      req.headers['x-forwarded-host']=new URL(req.headers.origin).host;
      return aiRoute(req,res,generate,pathname==='/api/ai/knowledge'?{configured:()=>true}:undefined);
    }
    if(pathname.startsWith('/api/'))return send(res,404,{error:'接口不存在。'});
    if(!['GET','HEAD'].includes(req.method))return send(res,405,{error:'仅支持 GET 或 HEAD。'});
    try{
      const name=decodeURIComponent(pathname),file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
      if(!file.startsWith(path.resolve(root)+path.sep))return send(res,403,{error:'访问路径无效。'});
      const body=await readFile(file);
      res.writeHead(200,{'Content-Type':types[path.extname(file)]??'application/octet-stream','Cache-Control':'no-cache'});
      res.end(req.method==='HEAD'?undefined:body);
    }catch{return send(res,404,{error:'文件不存在。'});}
  });
}

if(process.argv[1]&&path.resolve(process.argv[1])===entry){
  let server;try{server=createAppServer();void startAtlasText();}catch(e){console.error(e.message);process.exit(1);}
  const port=Number(process.env.PORT??5173),host=process.env.HOST??'127.0.0.1';
  if(!Number.isInteger(port)||port<0||port>65535){console.error('Invalid PORT');process.exit(1);}
  server.listen(port,host,()=>console.log(`LiftLog ready on ${host}:${server.address().port}`));
  server.on('error',e=>{console.error(e.message);process.exit(1);});
  for(const signal of['SIGINT','SIGTERM'])process.once(signal,()=>{stopAtlasText();server.close(()=>process.exit(0));server.closeIdleConnections();});
}

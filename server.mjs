import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {generateSelection,validatePayload} from './ai.mjs';
import {aiRoute} from './lib/ai-http.mjs';
import {generateIntake} from './lib/intake-model.mjs';
import {generateDecision} from './lib/decision-model.mjs';
const root = path.resolve(fileURLToPath(new URL('./dist/', import.meta.url)));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.webmanifest':'application/manifest+json', '.png':'image/png' };
const server = http.createServer(async (req, res) => {
  const json=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
  if(req.url==='/api/ai/intake')return aiRoute(req,res,generateIntake);
  if(req.url==='/api/ai/decision')return aiRoute(req,res,generateDecision);
  if(req.url==='/api/ai/status'&&req.method==='GET')return json(200,{configured:Boolean(process.env.DEEPSEEK_API_KEY)});
  if(req.url==='/api/ai/review'){
    if(req.method!=='POST')return json(405,{error:'仅支持 POST'});
    if(req.headers.origin!==`http://${req.headers.host}`||!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))return json(403,{error:'请求来源无效'});
    const chunks=[];let size=0;
    try{
      for await(const chunk of req){size+=chunk.length;if(size>16384){json(413,{error:'请求过大'});return;}chunks.push(chunk);}
      let review;
      try{review=validatePayload(JSON.parse(Buffer.concat(chunks).toString('utf8')));}catch{return json(400,{error:'复盘数据格式无效'});}
      if(!process.env.DEEPSEEK_API_KEY)return json(503,{error:'尚未配置模型密钥，可以继续使用本地复盘。'});
      if(server.aiBusy)return json(429,{error:'已有复盘正在生成，请稍后重试。'});
      server.aiBusy=true;
      try{const result=await generateSelection(review);return json(200,result);}
      catch(error){return json(502,{error:error.name==='TimeoutError'?'模型请求超时，本地复盘仍可使用。':error.message});}
      finally{server.aiBusy=false;}
    }catch{return json(400,{error:'无法读取请求'});}
  }
  try {
    const name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (name === '/' ? '/index.html' : name));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(body);
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(Number(process.env.PORT || 5173), '127.0.0.1', () => console.log(`LiftLog ready: http://127.0.0.1:${server.address().port}`));
server.on('error', e => { console.error(e.message); process.exit(1); });

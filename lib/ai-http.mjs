const windows=new Map();let inFlight=0;
export function send(res,status,body){res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json; charset=utf-8');res.statusCode=status;res.end(JSON.stringify(body));}
export async function aiRoute(req,res,generate){
  if(req.method!=='POST')return send(res,405,{error:'仅支持 POST。'});
  const origin=req.headers.origin;
  let expected;try{expected=new URL(origin);}catch{return send(res,403,{error:'请求来源无效。'});}
  const host=req.headers['x-forwarded-host']??req.headers.host;
  if(expected.host!==host||!['http:','https:'].includes(expected.protocol)||!/^application\/json(?:;|$)/i.test(req.headers['content-type']??''))return send(res,403,{error:'请求来源或类型无效。'});
  if(!process.env.DEEPSEEK_API_KEY)return send(res,503,{error:'模型尚未配置，请使用手动记录。',code:'not_configured'});
  const now=Date.now(),ip=String(req.headers['x-forwarded-for']??req.socket?.remoteAddress??'unknown').split(',')[0].trim();
  for(const [key,value] of windows)if(now-value.at>3600000)windows.delete(key);
  const window=windows.get(ip)??{at:now,count:0};
  if(window.count>=20||inFlight>=3)return send(res,429,{error:'本次体验请求较多，请稍后重试。',code:'rate_limited'});
  windows.set(ip,{at:window.at,count:window.count+1});
  let body=req.body;
  try{
    if(body===undefined){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>16384)return send(res,413,{error:'请求内容过长。'});chunks.push(chunk);}body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}
    else if(typeof body==='string')body=JSON.parse(body);
    if(Buffer.byteLength(JSON.stringify(body))>16384)return send(res,413,{error:'请求内容过长。'});
  }catch{return send(res,400,{error:'请求格式无效。'});}
  inFlight++;
  try{return send(res,200,await generate(body));}
  catch(e){return send(res,e.status??(e.name==='TimeoutError'?504:502),{error:e.name==='TimeoutError'?'模型响应超时，可以继续手动记录。':e.message,code:e.code??'generation_failed'});}
  finally{inFlight--;}
}

export const MAX_AUDIO_BYTES=1920044;
const limits=new Map();let active=0;
export function inspectWav(bytes){
 if(bytes.length<44||bytes.length>MAX_AUDIO_BYTES||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WAVE'||bytes.readUInt32LE(4)+8!==bytes.length)throw Error('请提供不超过60秒的有效 WAV 录音。');
 let at=12,format=null,dataBytes=null;
 while(at+8<=bytes.length){const name=bytes.toString('ascii',at,at+4),size=bytes.readUInt32LE(at+4),start=at+8;if(start+size>bytes.length)throw Error('音频数据不完整。');if(name==='fmt '){if(size<16)throw Error('音频格式无效。');format={encoding:bytes.readUInt16LE(start),channels:bytes.readUInt16LE(start+2),rate:bytes.readUInt32LE(start+4),byteRate:bytes.readUInt32LE(start+8),align:bytes.readUInt16LE(start+12),bits:bytes.readUInt16LE(start+14)};}if(name==='data'){if(dataBytes!==null)throw Error('音频数据段无效。');dataBytes=size;}at=start+size+(size%2);}
 if(!format||format.encoding!==1||format.channels!==1||format.rate!==16000||format.byteRate!==32000||format.align!==2||format.bits!==16||dataBytes===null||dataBytes%2||dataBytes/32000<.3||dataBytes/32000>60)throw Error('请使用16kHz单声道PCM录音，时长0.3–60秒。');
 return {durationMs:Math.round(dataBytes/32),bytes:bytes.length};
}
export async function transcribeAudio(bytes,{apiKey=process.env.DEEPSEEK_API_KEY,fetchImpl=fetch}={}){
 const audio=inspectWav(bytes);if(!apiKey)throw Object.assign(Error('语音服务暂不可用，仍可输入文字。'),{status:503,code:'not_configured'});
 const form=new FormData();form.append('file',new Blob([bytes],{type:'audio/wav'}),'recording.wav');
 const r=await fetchImpl('https://api.deepseek.com/v1/tools/asr',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`},body:form,signal:AbortSignal.timeout(30000),redirect:'error'});
 if(!r.ok)throw Object.assign(Error('这次没有完成转写，录音仍保留在页面，可稍后重试或手动输入。'),{status:502,code:'asr_http_'+r.status});
 const value=await r.json();if(typeof value.text!=='string'||!value.text.trim()||value.text.length>1200)throw Object.assign(Error('没有取得可用的转写文字，请重录或分段输入。'),{status:502,code:'asr_invalid_output'});
 return {text:value.text.trim(),durationMs:audio.durationMs,provider:'DeepSeek ASR'};
}
export async function audioRoute(req,res){
 const send=(s,b)=>{res.statusCode=s;res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(b));};
 if(req.method!=='POST')return send(405,{error:'仅支持POST。'});
 let origin;try{origin=new URL(req.headers.origin);}catch{return send(403,{error:'请求来源无效。'});}
 if(origin.host!==(req.headers['x-forwarded-host']??req.headers.host)||!['http:','https:'].includes(origin.protocol)||!/^audio\/wav(?:;|$)/i.test(req.headers['content-type']??'')||req.headers['x-audio-consent']!=='yes')return send(403,{error:'请确认录音处理方式后再转写。'});
 if(!process.env.DEEPSEEK_API_KEY)return send(503,{error:'语音服务暂不可用，仍可输入文字。',code:'not_configured'});
 const now=Date.now(),ip=String(req.headers['x-forwarded-for']??req.socket?.remoteAddress??'unknown').split(',')[0].trim();for(const [k,v]of limits)if(now-v.at>3600000)limits.delete(k);const entry=limits.get(ip)??{at:now,count:0};
 if(entry.count>=20||active>=2)return send(429,{error:'语音请求较多，请稍后再试。',code:'rate_limited'});
 entry.count++;limits.set(ip,entry);active++;
 try{const chunks=[];let length=0;for await(const chunk of req){length+=chunk.length;if(length>MAX_AUDIO_BYTES)return send(413,{error:'录音超过60秒，请分段录入。'});chunks.push(chunk);}let bytes=Buffer.concat(chunks);try{inspectWav(bytes);}catch(e){return send(400,{error:e.message});}const result=await transcribeAudio(bytes);bytes=null;return send(200,result);}
 catch(e){return send(e.status??502,{error:e.name==='TimeoutError'?'转写超时，录音仍保留在页面，可稍后重试。':e.message,code:e.code??'asr_failed'});}finally{active--;}
}

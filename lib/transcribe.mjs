export const MAX_AUDIO_BYTES=1920044;
const limits=new Map();let active=0;
export function inspectWav(bytes){
 if(bytes.length<44||bytes.length>MAX_AUDIO_BYTES||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WAVE'||bytes.readUInt32LE(4)+8!==bytes.length)throw Error('请提供不超过60秒的有效 WAV 录音。');
 let at=12,format=null,dataBytes=null;
 while(at+8<=bytes.length){const name=bytes.toString('ascii',at,at+4),size=bytes.readUInt32LE(at+4),start=at+8;if(start+size>bytes.length)throw Error('音频数据不完整。');if(name==='fmt '){if(size<16)throw Error('音频格式无效。');format={encoding:bytes.readUInt16LE(start),channels:bytes.readUInt16LE(start+2),rate:bytes.readUInt32LE(start+4),byteRate:bytes.readUInt32LE(start+8),align:bytes.readUInt16LE(start+12),bits:bytes.readUInt16LE(start+14)};}if(name==='data'){if(dataBytes!==null)throw Error('音频数据段无效。');dataBytes=size;}at=start+size+(size%2);}
 if(!format||format.encoding!==1||format.channels!==1||format.rate!==16000||format.byteRate!==32000||format.align!==2||format.bits!==16||dataBytes===null||dataBytes%2||dataBytes/32000<.3||dataBytes/32000>60)throw Error('请使用16kHz单声道PCM录音，时长0.3–60秒。');
 return {durationMs:Math.round(dataBytes/32),bytes:bytes.length};
}
const retired=()=>Object.assign(Error('录音转写已调整为手机输入法听写。请核对文字后交给 Atlas 处理。'),{status:410,code:'feature_changed'});
export async function transcribeAudio(){throw retired();}
export async function audioRoute(req,res){
 const send=(s,b)=>{res.statusCode=s;res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(b));};
 if(req.method!=='POST')return send(405,{error:'仅支持 POST。'});
 let origin;try{origin=new URL(req.headers.origin);}catch{return send(403,{error:'请求来源无效。'});}
 if(origin.host!==(req.headers['x-forwarded-host']??req.headers.host)||!['http:','https:'].includes(origin.protocol)||req.headers['x-audio-consent']!=='yes')return send(403,{error:'请确认输入方式。'});
 const e=retired();return send(e.status,{error:e.message,code:e.code});
}

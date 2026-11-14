export function encodeWav(input,sampleRate=48000){
 if(!(input instanceof Float32Array)||!Number.isFinite(sampleRate)||sampleRate<8000||sampleRate>192000)throw Error('音频格式无效。');
 const seconds=input.length/sampleRate;if(seconds<.3||seconds>60)throw Error('请提供 0.3–60 秒的音频。');
 const count=Math.floor(input.length*16000/sampleRate),buffer=new ArrayBuffer(44+count*2),v=new DataView(buffer);
 const str=(at,s)=>[...s].forEach((c,i)=>v.setUint8(at+i,c.charCodeAt(0)));
 str(0,'RIFF');v.setUint32(4,buffer.byteLength-8,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,16000,true);v.setUint32(28,32000,true);v.setUint16(32,2,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,count*2,true);
 for(let i=0;i<count;i++){const start=Math.floor(i*sampleRate/16000),end=Math.max(start+1,Math.floor((i+1)*sampleRate/16000));let value=0,n=0;for(let j=start;j<Math.min(end,input.length);j++){value+=Number.isFinite(input[j])?input[j]:0;n++;}const s=Math.max(-1,Math.min(1,value/Math.max(1,n)));v.setInt16(44+i*2,Math.round(s*(s<0?32768:32767)),true);}
 return buffer;
}
export function joinSamples(chunks){const out=new Float32Array(chunks.reduce((n,a)=>n+a.length,0));let at=0;for(const a of chunks){out.set(a,at);at+=a.length;}return out;}

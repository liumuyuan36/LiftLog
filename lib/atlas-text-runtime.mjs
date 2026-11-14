import {spawn} from 'node:child_process';
import {createReadStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {ATLAS_MODEL,ATLAS_VERSION,ATLAS_SHA256,atlasTextEnabled,atlasTextEndpoint} from './atlas-text-config.mjs';
let child=null,verified=false,starting=false;
export async function startAtlasText(){
 if(!atlasTextEnabled()||starting||child)return;
 starting=true;
 try{
  const hash=createHash('sha256');for await(const bytes of createReadStream(process.env.ATLAS_GGUF_PATH||'/opt/atlas/model.gguf'))hash.update(bytes);
  if(hash.digest('hex')!==ATLAS_SHA256)throw Error('model_checksum');
  const endpoint=new URL(atlasTextEndpoint()),env={};
  for(const key of ['PATH','LD_LIBRARY_PATH','SYSTEMROOT','WINDIR','LANG','LC_ALL'])if(process.env[key])env[key]=process.env[key];
  const args=['--model',process.env.ATLAS_GGUF_PATH||'/opt/atlas/model.gguf','--alias',ATLAS_MODEL,'--host','127.0.0.1','--port',endpoint.port||'7861','--ctx-size','8192','--parallel','1','--threads','2','--threads-batch','2','--batch-size','256','--ubatch-size','128','--no-webui','--no-slots','--log-disable'];
  child=spawn(process.env.ATLAS_LLAMA_BIN||'/opt/llama/llama-b12377/llama-server',args,{env,stdio:'ignore',windowsHide:true});
  // No user prompts, generated text, provider credentials or audio reach logs.
  verified=true;child.once('error',()=>{verified=false;console.warn('atlas_worker_error');});
  child.once('exit',code=>{verified=false;console.warn('atlas_worker_exit',JSON.stringify({code}));});
 }catch{verified=false;console.warn('atlas_start_failed');}finally{starting=false;}
}
export async function atlasTextAvailability(){
 let ready=false;
 if(atlasTextEnabled()&&verified&&child&&child.exitCode===null){try{const response=await fetch(atlasTextEndpoint()+'/v1/models',{signal:AbortSignal.timeout(1200),redirect:'error'});const body=response.ok?await response.json():{};ready=body.data?.length===1&&body.data[0].id===ATLAS_MODEL;}catch{}}
 return {configured:ready,provider:'LiftLog Atlas',model:ATLAS_MODEL,modelVersion:ATLAS_VERSION,mode:'single-model',atlas:{configured:atlasTextEnabled(),ready,archived:false,artifactSha:ATLAS_SHA256},voice:{configured:false,mode:'system-dictation',message:'Atlas 处理文字。语音可使用手机输入法听写，核对后提交。'}};
}
export function stopAtlasText(){if(child&&!child.killed)child.kill('SIGTERM');verified=false;}

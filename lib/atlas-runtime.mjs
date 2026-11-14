import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {atlasEndpoint,atlasStatus} from './atlas-model.mjs';
export const atlasEnabled=()=>process.env.ATLAS_ENABLED==='1'&&/^[a-f0-9]{64}$/.test(process.env.ATLAS_ADAPTER_SHA256??'');
export async function atlasAvailability(){return atlasEnabled()?atlasStatus():{configured:false,ready:false,provider:'LiftLog Atlas',version:'atlas-intake-v3'};}
export function startAtlasWorker(){
 if(!atlasEnabled())return null;
 const model=process.env.ATLAS_MODEL_DIR,adapter=process.env.ATLAS_ADAPTER_DIR;
 if(!model||!adapter||!existsSync(model)||!existsSync(adapter)){console.warn('atlas_start_failed',JSON.stringify({code:'missing_model_files'}));return null;}
 const script=process.env.ATLAS_WORKER_SCRIPT||fileURLToPath(new URL('../training/atlas/worker.py',import.meta.url));
 const mode=process.env.ATLAS_QUANTIZATION||'none';if(!['none','float16','dynamic-mlp','dynamic-channel'].includes(mode))throw Error('Unsupported Atlas deployment mode');
 const env={};for(const key of ['PATH','SYSTEMROOT','WINDIR','LANG','LC_ALL','LD_LIBRARY_PATH'])if(process.env[key])env[key]=process.env[key];
 Object.assign(env,{PYTHONUTF8:'1',HF_HUB_OFFLINE:'1',HF_HUB_DISABLE_TELEMETRY:'1',HF_HOME:'/tmp/atlas-cache',OMP_NUM_THREADS:'2',MKL_NUM_THREADS:'2'});
 const args=['-u',script,'--model',model,'--adapter',adapter,'--threads','2','--port',new URL(atlasEndpoint()).port||'7861','--quantization',mode];
 const worker=spawn(process.env.ATLAS_PYTHON||'python3',args,{env,stdio:['ignore','inherit','inherit'],windowsHide:true});
 worker.on('error',()=>console.warn('atlas_start_failed',JSON.stringify({code:'worker_process_error'})));
 worker.on('exit',code=>console.warn('atlas_worker_exit',JSON.stringify({code})));
 const cleanup=()=>{if(!worker.killed)worker.kill('SIGTERM');};process.once('exit',cleanup);
 for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>{cleanup();process.exit(0);});
 return worker;
}

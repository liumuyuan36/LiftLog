import {validateIntakeRequest} from '../dist/intake.js';
import {messagesFor,expand,evidenceGuard,MODEL_NAME,VERSION} from './atlas-contract.mjs';
export function atlasEndpoint(){
 const url=new URL(process.env.ATLAS_WORKER_URL||'http://127.0.0.1:7861');
 if(url.protocol!=='http:'||url.hostname!=='127.0.0.1'||url.username||url.password||url.pathname!=='/')throw Error('Atlas worker must use loopback HTTP');
 return url.origin;
}
export async function atlasStatus({fetchImpl=fetch}={}){
 try{const response=await fetchImpl(atlasEndpoint()+'/healthz',{signal:AbortSignal.timeout(1500),redirect:'error'});if(!response.ok)return {configured:true,ready:false,provider:MODEL_NAME,version:VERSION};const body=await response.json();return {configured:true,ready:body.ready===true&&body.model===MODEL_NAME&&body.version===VERSION,provider:MODEL_NAME,version:VERSION};}
 catch{return {configured:true,ready:false,provider:MODEL_NAME,version:VERSION};}
}
export async function generateAtlasIntake(body,{fetchImpl=fetch}={}){
 const request=validateIntakeRequest(body),started=Date.now();
 const response=await fetchImpl(atlasEndpoint()+'/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:messagesFor(request)}),signal:AbortSignal.timeout(24000),redirect:'error'});
 if(!response.ok)throw Object.assign(Error(response.status===429?'Atlas 正在处理另一条记录，请稍后再试。':'Atlas 正在启动或暂不可用，可以继续手动记录。'),{status:response.status===429?429:503,code:'atlas_unavailable'});
 const result=await response.json();
 if(result.limited||typeof result.output!=='string')throw Object.assign(Error('本次描述未能完整解析，请简化或分次输入，也可以手动记录。'),{status:502,code:'atlas_incomplete'});
 let value;try{value=JSON.parse(result.output);}catch{throw Object.assign(Error('Atlas 本次未生成有效草稿，请核对描述后重试。'),{status:502,code:'atlas_invalid_json'});}
 let output,rejected=false;
 try{output=evidenceGuard(expand(value,request),request);}
 catch(e){
  if(/^compact_/.test(e.message)||e.message==='nonready_has_exercises')throw Object.assign(Error('Atlas 本次输出不完整，可以继续手动记录。'),{status:502,code:'atlas_invalid_shape'});
  rejected=true;output={status:'clarify',date:request.today,questions:['请核对完整动作名、公斤总重量、实际完成的组数与次数；RIR 不确定时可留空。'],exercises:[]};
 }
 return {result:output,meta:{model:MODEL_NAME,modelVersion:VERSION,promptVersion:VERSION,engine:'atlas',elapsedMs:Date.now()-started,guardRejected:rejected,usage:{inputTokens:result.inputTokens??null,outputTokens:result.outputTokens??null}}};
}

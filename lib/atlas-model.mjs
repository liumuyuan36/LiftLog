import {validateIntakeRequest} from '../dist/intake.js';
import {messagesFor,compileAtlas,literalDisposition,MODEL_NAME,VERSION} from './atlas-contract.mjs';
export function atlasEndpoint(){
 const url=new URL(process.env.ATLAS_WORKER_URL||'http://127.0.0.1:7861');
 if(url.protocol!=='http:'||url.hostname!=='127.0.0.1'||url.username||url.password||url.pathname!=='/')throw Error('Atlas worker must use loopback HTTP');
 return url.origin;
}
export async function atlasStatus({fetchImpl=fetch}={}){
 try{const response=await fetchImpl(atlasEndpoint()+'/healthz',{signal:AbortSignal.timeout(1500),redirect:'error'});if(!response.ok)return {configured:true,ready:false,provider:MODEL_NAME,version:VERSION};const body=await response.json(),expected=process.env.ATLAS_ADAPTER_SHA256;return {configured:true,ready:body.ready===true&&body.model===MODEL_NAME&&body.version===VERSION&&(!expected||body.artifactSha===expected),provider:MODEL_NAME,version:VERSION,artifactSha:body.artifactSha??null};}
 catch{return {configured:true,ready:false,provider:MODEL_NAME,version:VERSION};}
}
export async function generateAtlasIntake(body,{fetchImpl=fetch}={}){
 const request=validateIntakeRequest(body),started=Date.now();
 const policy=literalDisposition(request);
 if(policy)return {result:policy,meta:{model:MODEL_NAME,modelVersion:VERSION,pipelineVersion:'atlas-pipeline-v3.4',engine:'atlas-policy',policyRouted:true,elapsedMs:Date.now()-started,usage:{inputTokens:0,outputTokens:0}}};
 const response=await fetchImpl(atlasEndpoint()+'/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:messagesFor(request)}),signal:AbortSignal.timeout(24000),redirect:'error'});
 if(!response.ok)throw Object.assign(Error(response.status===429?'Atlas 正在处理另一条记录，请稍后再试。':'Atlas 正在启动或暂不可用，可以继续手动记录。'),{status:response.status===429?429:503,code:'atlas_unavailable'});
 const result=await response.json();
 if(process.env.ATLAS_ADAPTER_SHA256&&result.artifactSha!==process.env.ATLAS_ADAPTER_SHA256)throw Object.assign(Error('Atlas 版本校验未通过，可以继续手动记录。'),{status:503,code:'atlas_version_mismatch'});
 if(result.limited||typeof result.output!=='string')throw Object.assign(Error('本次描述未能完整解析，请简化或分次输入，也可以手动记录。'),{status:502,code:'atlas_incomplete'});
 let value;try{value=JSON.parse(result.output);}catch{throw Object.assign(Error('Atlas 本次未生成有效草稿，请核对描述后重试。'),{status:502,code:'atlas_invalid_json'});}
 let compiled;try{compiled=compileAtlas(value,request);}catch{throw Object.assign(Error('Atlas 本次输出不完整，可以继续手动记录。'),{status:502,code:'atlas_invalid_shape'});}
 return {result:compiled.result,meta:{model:MODEL_NAME,modelVersion:VERSION,pipelineVersion:'atlas-pipeline-v3.4',promptVersion:VERSION,engine:'atlas',elapsedMs:Date.now()-started,guardRejected:compiled.guardRejected,schemaProjected:compiled.schemaProjected,policyRouted:false,usage:{inputTokens:result.inputTokens??null,outputTokens:result.outputTokens??null}}};
}

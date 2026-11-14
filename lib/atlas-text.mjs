import fs from 'node:fs/promises';
import {atlasPrompt} from './atlas-prompt.mjs';
import {ATLAS_MODEL,ATLAS_VERSION,ATLAS_SHA256,atlasTextEnabled,atlasTextEndpoint} from './atlas-text-config.mjs';
const grammar=await fs.readFile(new URL('./atlas-json.gbnf',import.meta.url),'utf8');
export const atlasCompletionBody=(messages,maxTokens)=>({prompt:atlasPrompt(messages),temperature:0,seed:42,n_predict:Math.min(2200,Math.max(1,maxTokens)),grammar,cache_prompt:false,stop:['<|im_end|>'],stream:false});
export async function atlasJSON({messages,maxTokens=700,fetchImpl=fetch,enabled=atlasTextEnabled(),signal}={}){
 if(!enabled)throw Object.assign(Error('Atlas 尚未配置或正在启动，可以继续手动记录。'),{status:503,code:'not_configured'});
 const start=Date.now(),body=atlasCompletionBody(messages,maxTokens);
 const response=await fetchImpl(atlasTextEndpoint()+'/completion',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.any([AbortSignal.timeout(90000),...(signal?[signal]:[])]),redirect:'error'});
 if(!response.ok)throw Object.assign(Error(response.status===429||response.status===503?'Atlas 正在启动或处理另一条请求，请稍后再试。':'Atlas 本次未完成处理，可以继续使用手动功能。'),{status:response.status===429?429:503,code:'atlas_http_'+response.status});
 let raw;try{raw=await response.json();}catch{throw Object.assign(Error('Atlas 返回格式无效，本次结果未采用。'),{status:502,code:'atlas_invalid_response'});}
 if(raw.model!==ATLAS_MODEL)throw Object.assign(Error('Atlas 模型身份校验失败，本次结果未采用。'),{status:503,code:'atlas_version_mismatch'});
 if(raw.truncated||raw.stop_type==='limit'||raw.tokens_predicted>=body.n_predict||!['eos','word'].includes(raw.stop_type))throw Object.assign(Error('Atlas 回答未完整结束，请缩短内容或分次输入。'),{status:502,code:'atlas_incomplete'});
 let value;try{value=JSON.parse(raw.content);if(!value||typeof value!=='object'||Array.isArray(value))throw Error();}catch{throw Object.assign(Error('Atlas 本次未生成有效结果，请核对内容后重试。'),{status:502,code:'atlas_invalid_json'});}
 return {value,meta:{provider:'LiftLog Atlas',engine:'atlas',model:ATLAS_MODEL,modelVersion:ATLAS_VERSION,artifactSha:ATLAS_SHA256,elapsedMs:Date.now()-start,usage:{inputTokens:raw.tokens_evaluated??null,outputTokens:raw.tokens_predicted??null}}};
}

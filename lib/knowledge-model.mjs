import {retrieveKnowledge,knowledgeMessages,validateKnowledgeAnswer,KNOWLEDGE_VERSION} from '../dist/knowledge.js';
import {deepseekJSON} from './deepseek.mjs';
import {atlasEndpoint} from './atlas-model.mjs';
export async function generateKnowledge(body,{fetchImpl=fetch,apiKey=process.env.DEEPSEEK_API_KEY}={}){
 if(!body||!['atlas','deepseek'].includes(body.engine)||body.consent!==true)throw Object.assign(Error('请选择回答服务并确认本次问题的处理方式。'),{status:400,code:'consent_required'});
 let retrieved;try{retrieved=retrieveKnowledge(body.question);}catch(e){throw Object.assign(e,{status:400});}
 if(!retrieved.chunks.length)return {result:{status:'insufficient',points:[],limitation:retrieved.message},retrieval:retrieved,meta:{engine:'retrieval-policy',knowledgeVersion:KNOWLEDGE_VERSION,modelCalled:false}};
 const messages=knowledgeMessages(retrieved);let value,meta;
 if(body.engine==='deepseek')({value,meta}=await deepseekJSON({messages,maxTokens:512,apiKey,fetchImpl}));
 else{
  if(process.env.ATLAS_KNOWLEDGE_EXPERIMENT!=='1')throw Object.assign(Error('Atlas 本轮未通过问答验收，暂不开放问答。仍可用它整理训练记录，或选择 DeepSeek 阅读资料。'),{status:503,code:'atlas_knowledge_not_released'});
  if(process.env.ATLAS_ENABLED!=='1')throw Object.assign(Error('Atlas 实验服务暂不可用，可选择 DeepSeek 或直接阅读资料。'),{status:503,code:'atlas_unavailable'});
  const r=await fetchImpl(atlasEndpoint()+'/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages}),signal:AbortSignal.timeout(24000),redirect:'error'});
  if(!r.ok)throw Object.assign(Error('Atlas 正在忙或暂不可用，请稍后再试。'),{status:503,code:'atlas_unavailable'});
  const raw=await r.json();if(raw.limited||raw.artifactSha!==process.env.ATLAS_ADAPTER_SHA256||typeof raw.output!=='string')throw Object.assign(Error('Atlas 未生成完整且可核对的回答。'),{status:502,code:'atlas_incomplete'});
  try{value=JSON.parse(raw.output);}catch{throw Object.assign(Error('Atlas 本次回答格式无效，资料仍可直接阅读。'),{status:502,code:'invalid_output'});}
  meta={model:'LiftLog Atlas · Qwen3-0.6B LoRA',artifactSha:raw.artifactSha,elapsedMs:raw.elapsedMs,usage:{inputTokens:raw.inputTokens,outputTokens:raw.outputTokens}};
 }
 let result;try{result=validateKnowledgeAnswer(value,retrieved);}catch(e){throw Object.assign(e,{status:502,code:'citation_validation_failed'});}
 return {result,retrieval:retrieved,meta:{...meta,engine:body.engine,knowledgeVersion:KNOWLEDGE_VERSION,modelCalled:true}};
}

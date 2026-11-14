import {retrieveKnowledge,knowledgeMessages,validateKnowledgeAnswer,KNOWLEDGE_VERSION,KNOWLEDGE_PROMPT_VERSION} from '../dist/knowledge.js';
import {deepseekJSON} from './deepseek.mjs';
import {retiredProvider} from './model-config.mjs';
export async function generateKnowledge(body,{fetchImpl=fetch,apiKey=process.env.DEEPSEEK_API_KEY}={}){
 if(body?.engine==='atlas')throw Object.assign(Error(retiredProvider.error),{status:410,code:retiredProvider.code});
 if(!body||body.consent!==true||(body.engine!==undefined&&body.engine!=='deepseek'))throw Object.assign(Error('请确认由 DeepSeek 处理本次问题与资料。'),{status:400,code:'consent_required'});
 let retrieved;try{retrieved=retrieveKnowledge(body.question);}catch(e){throw Object.assign(e,{status:400});}
 if(!retrieved.chunks.length)return {result:{status:'insufficient',points:[],limitation:retrieved.message},retrieval:retrieved,meta:{engine:'retrieval-policy',knowledgeVersion:KNOWLEDGE_VERSION,promptVersion:KNOWLEDGE_PROMPT_VERSION,modelCalled:false}};
 const {value,meta}=await deepseekJSON({messages:knowledgeMessages(retrieved),maxTokens:512,apiKey,fetchImpl});
 let result;try{result=validateKnowledgeAnswer(value,retrieved);}catch(e){throw Object.assign(e,{status:502,code:'citation_validation_failed'});}
 return {result,retrieval:retrieved,meta:{...meta,engine:'deepseek',knowledgeVersion:KNOWLEDGE_VERSION,promptVersion:KNOWLEDGE_PROMPT_VERSION,modelCalled:true}};
}

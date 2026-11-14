import {retrieveKnowledge,knowledgeMessages,validateKnowledgeAnswer,KNOWLEDGE_VERSION,KNOWLEDGE_PROMPT_VERSION} from '../dist/knowledge.js';
import {atlasJSON} from './atlas-text.mjs';
import {requireAtlasConsent} from './atlas-text-config.mjs';
export async function generateKnowledge(body,options={}){
 requireAtlasConsent(body);
 let retrieved;try{retrieved=retrieveKnowledge(body.question);}catch(e){throw Object.assign(e,{status:400});}
 if(!retrieved.chunks.length)return {result:{status:'insufficient',points:[],limitation:retrieved.message},retrieval:retrieved,meta:{engine:'retrieval-policy',knowledgeVersion:KNOWLEDGE_VERSION,promptVersion:KNOWLEDGE_PROMPT_VERSION,modelCalled:false}};
 const {value,meta}=await atlasJSON({...options,messages:knowledgeMessages(retrieved),maxTokens:512});
 let result;try{result=validateKnowledgeAnswer(value,retrieved);}catch(e){throw Object.assign(e,{status:502,code:'citation_validation_failed'});}
 return {result,retrieval:retrieved,meta:{...meta,engine:'atlas',knowledgeVersion:KNOWLEDGE_VERSION,promptVersion:KNOWLEDGE_PROMPT_VERSION,modelCalled:true}};
}

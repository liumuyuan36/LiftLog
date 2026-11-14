import {aiRoute} from '../../lib/ai-http.mjs';
import {generateKnowledge} from '../../lib/knowledge-model.mjs';
export default function handler(req,res){return aiRoute(req,res,generateKnowledge,{configured:()=>true});}

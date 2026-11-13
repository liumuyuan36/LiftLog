import {aiRoute} from '../../lib/ai-http.mjs';
import {validatePayload,generateSelection} from '../../ai.mjs';
export default function handler(req,res){return aiRoute(req,res,body=>generateSelection(validatePayload(body)));}

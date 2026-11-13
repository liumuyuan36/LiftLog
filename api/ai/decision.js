import {aiRoute} from '../../lib/ai-http.mjs';
import {generateDecision} from '../../lib/decision-model.mjs';
export default function handler(req,res){return aiRoute(req,res,generateDecision);}

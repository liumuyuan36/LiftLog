import {aiRoute} from '../../lib/ai-http.mjs';
import {generateIntake} from '../../lib/intake-model.mjs';
export default function handler(req,res){return aiRoute(req,res,generateIntake);}

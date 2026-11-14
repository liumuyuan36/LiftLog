import {aiAvailability} from '../../lib/model-config.mjs';
import {send} from '../../lib/ai-http.mjs';
export default async function handler(req,res){if(req.method!=='GET')return send(res,405,{error:'仅支持 GET。'});return send(res,200,await aiAvailability());}

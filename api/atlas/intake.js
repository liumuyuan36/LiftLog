import {retiredProvider} from '../../lib/model-config.mjs';
import {send} from '../../lib/ai-http.mjs';
export default function handler(req,res){return send(res,req.method==='POST'?410:405,req.method==='POST'?retiredProvider:{error:'仅支持 POST。'});}

import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {score,digest} from './protocol.mjs';
export function removeWholeFence(raw){
 if(typeof raw!=='string')return raw;
 const match=raw.trim().match(/^```(?:json)?\s*\n([\s\S]*?)\n```$/i);
 return match?match[1]:raw;
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
 const args=process.argv.slice(2),arg=k=>args[args.indexOf(k)+1];
 if(!args.includes('--predictions')||!args.includes('--out'))throw Error('Require --predictions FILE --out FILE');
 const raw=await fs.readFile(new URL('./data/test.cases.jsonl',import.meta.url),'utf8'),cases=raw.trim().split('\n').map(JSON.parse);
 const predictions=(await fs.readFile(arg('--predictions'),'utf8')).trim().split('\n').map(JSON.parse);
 for(const p of predictions)if(p.datasetSha256!==digest(raw))throw Error('Dataset hash mismatch');
 const report={kind:'post_hoc_format_only_diagnostic_not_primary_metric',note:'Observed Markdown fences in baseline; apply identical whole-fence removal to both models. No JSON repair, no text extraction, no production change.',datasetSha256:digest(raw),...score(cases,predictions.map(p=>({...p,output:removeWholeFence(p.output)})))};
 await fs.writeFile(arg('--out'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report.metrics));
}

import fs from 'node:fs/promises';
import path from 'node:path';
import {score,digest,messagesFor} from './protocol.mjs';
const args=process.argv.slice(2),arg=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
const split=arg('--split','test');if(!['test','validation'].includes(split))throw Error('Evaluate validation or test only');
const data=await fs.readFile(new URL(`./data/${split}.cases.jsonl`,import.meta.url),'utf8');
const cases=data.trim().split('\n').map(JSON.parse),predictionsPath=arg('--predictions');
if(!predictionsPath)throw Error('Use --predictions FILE.jsonl --out REPORT.json');
const predictions=(await fs.readFile(predictionsPath,'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse);
for(const prediction of predictions)if(prediction.datasetSha256&&prediction.datasetSha256!==digest(data))throw Error('Prediction dataset hash mismatch');
for(const prediction of predictions){const c=cases.find(c=>c.id===prediction.id);if(c&&prediction.promptSha256&&prediction.promptSha256!==digest(messagesFor(c)))throw Error('Prediction prompt/catalog hash mismatch');}
const report={checkedAt:new Date().toISOString(),split,datasetSha256:digest(data),labelQuality:'synthetic_pending_human_review',predictionFile:path.basename(predictionsPath),...score(cases,predictions)};
const output=arg('--out');if(output)await fs.writeFile(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));

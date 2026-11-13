import fs from 'node:fs/promises';
import {messagesFor,digest} from './protocol.mjs';
const args=process.argv.slice(2),split=args.includes('--validation')?'validation':'test';
const raw=await fs.readFile(new URL(`./data/${split}.cases.jsonl`,import.meta.url),'utf8');
const rows=raw.trim().split('\n').map(JSON.parse).map(c=>({id:c.id,messages:messagesFor(c),promptSha256:digest(messagesFor(c)),datasetSha256:digest(raw)}));
await fs.writeFile(new URL(`./data/${split}.prompts.jsonl`,import.meta.url),rows.map(r=>JSON.stringify(r)).join('\n')+'\n');
console.log(JSON.stringify({split,rows:rows.length,containsGoldAnswers:false,modelCalls:0}));

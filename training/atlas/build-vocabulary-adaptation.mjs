import fs from 'node:fs/promises';
import {messagesFor,compact,digest,SYSTEM} from './protocol.mjs';
const base=new URL('./',import.meta.url),read=async f=>(await fs.readFile(new URL(f,base),'utf8')).trim().split('\n').map(JSON.parse);
const original=await read('data-v4/train.cases.jsonl'),vocab=await read('vocabulary/context.cases.jsonl');
const replay=original.filter((_,i)=>i%7===0),train=[...vocab,...replay],validation=await read('data-v4/validation.cases.jsonl'),root=new URL('./data-vocabulary/',base),files={};await fs.mkdir(root,{recursive:true});
for(const [split,rows]of [['train',train],['validation',validation]]){
 for(const [suffix,raw]of [['cases',rows.map(JSON.stringify).join('\n')+'\n'],['sft',rows.map(c=>JSON.stringify({prompt:messagesFor(c),completion:[{role:'assistant',content:JSON.stringify(compact(c.expected))}]})).join('\n')+'\n']]){const name=split+'.'+suffix+'.jsonl';await fs.writeFile(new URL(name,root),raw);files[name]={rows:rows.length,sha256:digest(raw)};}
}
await fs.writeFile(new URL('manifest.json',root),JSON.stringify({version:'atlas-vocabulary-adaptation-1',promptSha256:digest(SYSTEM),files,provenance:'264 AI-authored vocabulary contexts + every seventh original v4 training row for replay. No acceptance/test examples. All synthetic, pending human review.',vocabularyTerms:132,evaluationPolicy:'All previously inspected sets are regressions, not unseen validation',paidModelCalls:0},null,2));console.log(JSON.stringify({train:train.length,vocabulary:vocab.length,replay:replay.length,validation:validation.length}));

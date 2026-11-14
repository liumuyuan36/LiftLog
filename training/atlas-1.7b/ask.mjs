// Run from the exported model package. Uses local RAG and local weights only.
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {retrieveKnowledge,knowledgeMessages,validateKnowledgeAnswer,sources} from './knowledge.js';
const args=process.argv.slice(2);let python='python';
const at=args.indexOf('--python');if(at>=0){python=args[at+1];args.splice(at,2);}
const question=args.join(' ').trim();
if(!question)throw Error('Usage: node ask.mjs [--python PYTHON_PATH] "你的健身问题"');
const retrieval=retrieveKnowledge(question);
if(!retrieval.chunks.length){console.log(retrieval.message);process.exit(0);}
const processHandle=spawn(python,[fileURLToPath(new URL('./infer.py',import.meta.url)),'--model',fileURLToPath(new URL('./model/',import.meta.url)),'--input','-'],{windowsHide:true,stdio:['pipe','pipe','pipe']});
let stdout='',stderr='';
processHandle.stdout.setEncoding('utf8');processHandle.stdout.on('data',s=>{stdout+=s;});
processHandle.stderr.setEncoding('utf8');processHandle.stderr.on('data',s=>{stderr+=s;});
processHandle.stdin.end(JSON.stringify({messages:knowledgeMessages(retrieval)}));
const code=await new Promise((resolve,reject)=>{processHandle.once('error',reject);processHandle.once('close',resolve);});
if(code!==0)throw Error('Atlas local inference failed; verify Python dependencies and model path. '+stderr.slice(-600));
const result=validateKnowledgeAnswer(JSON.parse(stdout.trim()),retrieval);
console.log('LiftLog Atlas · 1.7B · 本机推理\n');
for(const p of result.points)console.log(p.text+' ['+p.sourceIds.join(', ')+']');
console.log('\n'+result.limitation);
for(const c of retrieval.chunks){console.log('\n'+c.id+' · '+c.title);for(const id of c.sources)console.log(sources[id].url);}

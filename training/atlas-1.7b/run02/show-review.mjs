import fs from 'node:fs/promises';
const dir=new URL('../../../evaluation/atlas17-run02/',import.meta.url),read=async name=>JSON.parse(await fs.readFile(new URL(name,dir),'utf8'));
const cases=await read('fresh40.cases.json'),a=await read('run01.fresh40.report.json'),b=await read('run02.fresh40.report.json');
const start=Number(process.argv[2]??1)-1,count=Number(process.argv[3]??5);
for(const c of cases.slice(start,start+count)){
 const x=a.rows.find(x=>x.id===c.id),y=b.rows.find(y=>y.id===c.id);
 console.log(JSON.stringify({id:c.id,q:c.question,gold:c.expected,passages:x.retrieval?.chunks.map(c=>({id:c.id,title:c.title,scope:c.scope,...(process.argv.includes('--sources')?{text:c.text}:{})})),run01:x.rawOutput,run02:y.rawOutput,auto:{run01:x.checks,run02:y.checks}}));
}

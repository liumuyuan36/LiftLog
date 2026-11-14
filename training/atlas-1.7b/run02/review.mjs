// Annotation values are manually authored by the Codex reviewer after reading
// both raw answers; this script checks consistency and aggregates, not semantics.
import fs from 'node:fs/promises';
const dir=new URL('../../../evaluation/atlas17-run02/',import.meta.url);
const read=async name=>JSON.parse(await fs.readFile(new URL(name,dir),'utf8'));
const cases=await read('fresh40.cases.json'),r1=await read('run01.fresh40.report.json'),r2=await read('run02.fresh40.report.json');
const {default:annotations}=await import('./semantic-annotations.mjs');
if(annotations.length!==40||new Set(annotations.map(r=>r[0])).size!==40)throw Error('Expected40 complete paired annotations');
const rows=cases.map((c,i)=>{
 const a=annotations.find(a=>a[0]===i+1);if(!a)throw Error('Missing annotation '+c.id);
 const item={id:c.id,question:c.question,answerability:c.expected.answerability};
 for(const [version,grades,reason,auto]of [['run01',a[1],a[3],r1],['run02',a[2],a[4],r2]]){
  if(grades.length!==c.expected.mustConvey.length||grades.some(n=>![0,.5,1].includes(n)))throw Error('Invalid grades '+c.id+' '+version);
  const flags=a[5]?.[version]??[],forbidden=flags.includes('forbidden'),unsupported=flags.includes('unsupported'),citationFaithful=!flags.includes('wrongCitation');
  const raw=auto.rows.find(r=>r.id===c.id),strict=grades.every(n=>n===1)&&!forbidden&&!unsupported&&citationFaithful;
  item[version]={mustConveyGrades:grades,forbidden,unsupported,citationFaithful,reason,strictContentPass:strict,endToEndPass:strict&&raw.checks.valid&&raw.checks.expectedStatus&&!raw.limited};
 }
 return item;
});
const summary=items=>Object.fromEntries(['run01','run02'].map(v=>{const grades=items.flatMap(r=>r[v].mustConveyGrades);return [v,{n:items.length,strictContentPass:items.filter(r=>r[v].strictContentPass).length,endToEndPass:items.filter(r=>r[v].endToEndPass).length,itemMean:grades.reduce((a,n)=>a+n,0)/grades.length,unsupported:items.filter(r=>r[v].unsupported).length,forbidden:items.filter(r=>r[v].forbidden).length}];}));
const report={createdAt:new Date().toISOString(),method:'Codex assistant manually read paired raw answers under prewritten mustConvey and forbidden meanings. Non-blind, exact underlying model ID not exposed, reviewer also authored data and questions. Not independent professional or real-user validation. New wording shares source concepts and some close themes with SFT; no claim of unseen knowledge or family-disjoint generalization.',summary:summary(rows),byKind:Object.fromEntries(['supported','partial','uncovered','outside_scope'].map(k=>[k,summary(rows.filter(r=>r.answerability===k))])),comparison:{improved:rows.filter(r=>!r.run01.strictContentPass&&r.run02.strictContentPass).map(r=>r.id),regressed:rows.filter(r=>r.run01.strictContentPass&&!r.run02.strictContentPass).map(r=>r.id)},rows};
await fs.writeFile(new URL('semantic.fresh40.json',dir),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({summary:report.summary,improved:report.comparison.improved.length,regressed:report.comparison.regressed.length}));

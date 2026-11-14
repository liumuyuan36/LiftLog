import fs from 'node:fs/promises';
const dir=new URL('../../evaluation/fitness-100/',import.meta.url);
const read=async name=>JSON.parse(await fs.readFile(new URL(name,dir),'utf8'));
const cases=await read('cases.json'),baseReport=await read('base.report.json'),atlasReport=await read('atlas.report.json');
const chunks=await Promise.all(['semantic-review-001-050.json','semantic-review-051-100.json'].map(read));
const reviews=chunks.flatMap(x=>Array.isArray(x)?x:x.rows);
if(reviews.length!==100||new Set(reviews.map(r=>r.id)).size!==100)throw Error('Semantic review must cover exactly100 unique cases');
const rows=cases.map(c=>{
 const r=reviews.find(r=>r.id===c.id);if(!r)throw Error('Missing semantic review '+c.id);
 for(const model of ['base','atlas']){
  const a=r[model];if(!a||!Array.isArray(a.mustConveyGrades)||a.mustConveyGrades.length!==c.expected.mustConvey.length||a.mustConveyGrades.some(n=>![0,.5,1].includes(n)))throw Error('Invalid item grades '+c.id+' '+model);
  for(const key of ['forbiddenTriggered','unsupportedClaim','citationFaithful','strictContentPass'])if(typeof a[key]!=='boolean')throw Error('Missing semantic flag '+c.id+' '+model+' '+key);
  if(a.strictContentPass&&(!a.mustConveyGrades.every(n=>n===1)||a.forbiddenTriggered||a.unsupportedClaim||!a.citationFaithful))throw Error('Inconsistent strict pass '+c.id+' '+model);
  if(typeof a.reason!=='string'||!a.reason.trim())throw Error('Missing review reason '+c.id);
 }
 const merge=(model,report)=>{
  const auto=report.rows.find(r=>r.id===c.id),review=r[model];
  return {...review,automaticChecks:auto.checks,endToEndPass:review.strictContentPass&&auto.checks.structure&&auto.checks.providedCitationsAndNumbers&&auto.checks.expectedStatus&&!auto.limited};
 };
 return {id:c.id,split:c.split,answerability:c.expected.answerability,question:c.question,base:merge('base',baseReport),atlas:merge('atlas',atlasReport)};
});
const summarize=items=>Object.fromEntries(['base','atlas'].map(model=>{
 const grades=items.flatMap(r=>r[model].mustConveyGrades);
 return [model,{n:items.length,strictContentPass:items.filter(r=>r[model].strictContentPass).length,endToEndPass:items.filter(r=>r[model].endToEndPass).length,itemGradeMean:grades.reduce((a,n)=>a+n,0)/grades.length,forbidden:items.filter(r=>r[model].forbiddenTriggered).length,unsupported:items.filter(r=>r[model].unsupportedClaim).length,citationFaithful:items.filter(r=>r[model].citationFaithful).length}];
}));
const comparison={improvedContent:rows.filter(r=>!r.base.strictContentPass&&r.atlas.strictContentPass).map(r=>r.id),regressedContent:rows.filter(r=>r.base.strictContentPass&&!r.atlas.strictContentPass).map(r=>r.id),improvedEndToEnd:rows.filter(r=>!r.base.endToEndPass&&r.atlas.endToEndPass).map(r=>r.id),regressedEndToEnd:rows.filter(r=>r.base.endToEndPass&&!r.atlas.endToEndPass).map(r=>r.id)};
const result={createdAt:new Date().toISOString(),method:'Two Codex AI reviewers each read50 paired cases under frozen criteria; exact underlying model IDs not exposed, not blinded, not professional or real-user validation. Raw outputs and labels unchanged. Readable content may be semantically reviewed despite invalid JSON; end-to-end additionally requires automatic validation.',summary:summarize(rows),bySplit:Object.fromEntries(['development','heldout'].map(split=>[split,summarize(rows.filter(r=>r.split===split))])),byAnswerability:Object.fromEntries(['supported','partial','uncovered','outside_scope'].map(kind=>[kind,summarize(rows.filter(r=>r.answerability===kind))])),comparison,rows};
await fs.writeFile(new URL('semantic-review.json',dir),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({summary:result.summary,improved:comparison.improvedContent.length,regressed:comparison.regressedContent.length}));

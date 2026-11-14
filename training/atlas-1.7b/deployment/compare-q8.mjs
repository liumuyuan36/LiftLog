import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../../../',import.meta.url),dir=new URL('evaluation/atlas17-deployment/',root);
const read=async name=>JSON.parse(await fs.readFile(new URL(name,root),'utf8'));
const parse=s=>s.trim().split(/\r?\n/).map(JSON.parse),hash=s=>createHash('sha256').update(s).digest('hex');
const prior=await read('evaluation/atlas17-run02/semantic.fresh40.json'),auto=await read('evaluation/atlas17-deployment/fresh40.report.json');
const oldRaw=await fs.readFile(new URL('evaluation/atlas17-run02/raw/atlas17-run02.fresh40.predictions.jsonl',root),'utf8'),newRaw=await fs.readFile(new URL('fresh40.predictions.jsonl',dir),'utf8');
const old=parse(oldRaw),current=parse(newRaw);
// Non-blind manual review of all 11 changed JSON answers; remaining 29 exactly equal.
const annotations={
 1:[[1,.5],'定义已完成次数与RIR0，仍缺空白未知的明确处理。'],
 6:[[.5,1],'保留两负荷尺寸与力量结局区别，但省略努力程度或非任意轻松活动等效的条件。'],
 7:[[1,0,.5],'只保留全程下肢平均优势与范围，漏答长肌长局部行程及双向绝对化。'],
 9:[[0,0,0],'检索仍缺F20/F21，本次只答肌电与长期增长区别，仍未回应随机变化。'],
 10:[[1,1],'文字变动仍保留损伤与增长边界、不同情境曲线及不能倒计时。'],
 13:[[1,1],'本次选F35，明确背景未知及不能用日志补全，较GPU答非所问改善。'],
 17:[[0,1,0],'只答预疲劳非必然增肌，漏掉前置动作力量收益和不能一刀切先复合。'],
 19:[[1,1],'恢复了小型实验皮褶、肌厚与力量实际结果，保留不能全算肌肉及非通用速度。'],
 23:[[1,.5],'本次补特定行程限制并说明相近增长，但没明确感觉不保证普适优势。'],
 26:[[1,1,.5],'保留肌群差异和未增长不等未参与，仍缺男性样本限定。'],
 39:[[1,.5],'拒绝个人用量及安全保证，仍缺个人情况专业评估建议；语义与原答相同。'],
};
const rows=current.map(p=>{
 const before=old.find(x=>x.id===p.id),priorReview=prior.rows.find(x=>x.id===p.id).run02,changed=JSON.stringify(JSON.parse(before.output))!==JSON.stringify(JSON.parse(p.output));
 const manual=annotations[Number(p.id.slice(-3))];if(changed&&!manual)throw Error('Unreviewed changed answer');
 const grades=changed?manual[0]:priorReview.mustConveyGrades;
 const review={...priorReview,mustConveyGrades:grades,reason:changed?manual[1]:'JSON内容与原Run02逐字相同，继承已记录语义复核。'};
 review.strictContentPass=grades.every(n=>n===1)&&!review.forbidden&&!review.unsupported&&review.citationFaithful;
 const a=auto.rows.find(r=>r.id===p.id);review.endToEndPass=review.strictContentPass&&Object.values(a.checks).every(Boolean)&&!a.limited;
 return {id:p.id,changed,prior:priorReview,current:review,automaticChecks:a.checks};
});
const times=current.map(x=>x.elapsedMs).sort((a,b)=>a-b),wf=parse(await fs.readFile(new URL('workflow16.predictions.jsonl',dir),'utf8'));
const report={createdAt:new Date().toISOString(),method:'Existing 40 questions, not fresh independent evaluation. Same assistant non-blind manual review of 11 changed outputs using frozen meanings; 29 byte-identical parsed JSON answers inherit prior annotations. No professional or user evidence. Q8 and JSON grammar/runtime changed together; do not attribute differences solely to quantization or training.',hashes:{priorPredictions:hash(oldRaw),currentPredictions:hash(newRaw)},summary:{total:40,changed:rows.filter(x=>x.changed).length,priorStrict:21,currentStrict:rows.filter(x=>x.current.strictContentPass).length,currentEndToEnd:rows.filter(x=>x.current.endToEndPass).length,improved:rows.filter(x=>!x.prior.strictContentPass&&x.current.strictContentPass).map(x=>x.id),regressed:rows.filter(x=>x.prior.strictContentPass&&!x.current.strictContentPass).map(x=>x.id),medianMs:times[19],minMs:times[0],maxMs:times.at(-1),all56Complete:[...current,...wf].every(x=>x.httpStatus===200&&!x.limited)},rows};
await fs.writeFile(new URL('comparison.json',dir),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report.summary));

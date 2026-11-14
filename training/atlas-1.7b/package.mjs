import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const workspace=path.resolve(root,'../..'),run=path.join(workspace,'work/atlas-1.7b-run-01-resume');
const dest=path.join(workspace,'outputs/LiftLog-Atlas-1.7B-Run01');
const info=JSON.parse(await fs.readFile(path.join(run,'run.json'),'utf8'));
if(info.status!=='trained_experimental_not_production')throw Error('Training not complete');
const baseline=JSON.parse(await fs.readFile(path.join(root,'evaluation/fitness-100/base.report.json'),'utf8'));
const candidate=JSON.parse(await fs.readFile(path.join(root,'evaluation/fitness-100/atlas.report.json'),'utf8'));
const workflow=JSON.parse(await fs.readFile(path.join(root,'evaluation/fitness-100/workflow.report.json'),'utf8'));
let semantic=null;try{semantic=JSON.parse(await fs.readFile(path.join(root,'evaluation/fitness-100/semantic-review.json'),'utf8'));}catch{}
if(baseline.executed!==100||candidate.executed!==100)throw Error('Both100 question runs must finish');
await fs.access(path.join(dest,'model/MODEL-MANIFEST.json'));
await fs.mkdir(dest,{recursive:true});
await fs.cp(path.join(run,'adapter'),path.join(dest,'adapter'),{recursive:true});
await fs.copyFile(path.join(run,'run.json'),path.join(dest,'run.json'));
await fs.copyFile(path.join(workspace,'work/models/Qwen3-1.7B/DOWNLOAD-MANIFEST.json'),path.join(dest,'BASE-MODEL-MANIFEST.json'));
await fs.copyFile(path.join(workspace,'work/models/Qwen3-1.7B/LICENSE'),path.join(dest,'QWEN-LICENSE.txt'));
await fs.copyFile(path.join(root,'training/atlas-1.7b/ask.mjs'),path.join(dest,'ask.mjs'));
await fs.copyFile(path.join(root,'evaluation/fitness-100/workflow.report.json'),path.join(dest,'workflow-16.report.json'));
if(semantic)await fs.copyFile(path.join(root,'evaluation/fitness-100/semantic-review.json'),path.join(dest,'AI-SEMANTIC-REVIEW.json'));
try{const html=await fs.readFile(path.join(root,'dist/portfolio/fitness-rag.html'),'utf8');await fs.writeFile(path.join(dest,'REPORT.html'),html.replace('href="index.html"','href="MODEL_CARD.md"').replace('← 返回产品案例','← 返回模型说明'));}catch{}
for(const [from,to]of [['training/atlas-1.7b/infer.py','infer.py'],['training/atlas-1.7b/data/manifest.json','data-manifest.json'],['evaluation/fitness-100/cases.json','100-questions.json'],['evaluation/fitness-100/FREEZE.json','FREEZE.json'],['evaluation/fitness-100/RESOURCE-AMENDMENT.json','RESOURCE-AMENDMENT.json'],['evaluation/fitness-100/PROTOCOL.md','EVALUATION-PROTOCOL.md'],['evaluation/fitness-100/prompts.jsonl','100-prompts.jsonl'],['evaluation/fitness-100/base.report.json','baseline-100.report.json'],['evaluation/fitness-100/atlas.report.json','atlas-100.report.json'],['dist/knowledge-data.js','knowledge-data.js'],['dist/knowledge.js','knowledge.js']])await fs.copyFile(path.join(root,from),path.join(dest,to));
const rows=(await fs.readFile(path.join(root,'evaluation/fitness-100/prompts.jsonl'),'utf8')).trim().split('\n').map(s=>JSON.parse(s));
await fs.writeFile(path.join(dest,'example.messages.json'),JSON.stringify({messages:rows[0].messages},null,2)+'\n');
const sha=createHash('sha256').update(await fs.readFile(path.join(dest,'adapter/adapter_model.safetensors'))).digest('hex');
const card=`# LiftLog Atlas · 1.7B / Run01

Atlas 是在官方 Qwen3-1.7B 上做本地 LoRA 监督微调得到的专用小模型。model目录是完整合并模型，可直接离线加载，不依赖DeepSeek API；adapter目录保留原始微调权重便于复现。不是从零预训练，也不是将外部API改名。

本轮累计实际训练 ${info.epochsCompleted} 轮，${info.trainingRows} 条训练／${info.validationRows} 条验证，${info.trainableParameters.toLocaleString()} 个可训练参数；固定 seed42，bf16、r16、alpha32、所有线性层。仅 completion 计算损失。第一轮后因显存缓存压力中断，从checkpoint123恢复优化器、调度器和随机数状态，增加缓存清理；不是重新训练3轮。选择验证损失最低检查点 ${path.basename(info.bestCheckpoint)}；恢复阶段训练器计时 ${info.metrics.train_runtime} 秒，不将其冒称整个实验总耗时。资源修订见RESOURCE-AMENDMENT.json。

知识库61张卡与模型权重分开：资料通过RAG提供，微调训练输出格式、证据使用与任务边界。100道题没有用于权重更新或检查点选择；题目可能与训练共用知识来源和概念。测试输入已冻结，两边均实际生成100条原始预测，不修复JSON。候选测试使用model目录的完整BF16合并模型，不能直接把未合并adapter的指标挪给另一种导出格式。

自动诊断（不是语义准确率）：原始底模 JSON ${baseline.totals.json}/100、结构 ${baseline.totals.structure}/100、引用及数字校验 ${baseline.totals.providedCitationsAndNumbers}/100；Atlas JSON ${candidate.totals.json}/100、结构 ${candidate.totals.structure}/100、引用及数字校验 ${candidate.totals.providedCitationsAndNumbers}/100。完整输出与每题失败在两份report中；语义复核另记。

${semantic?`逐题严格内容AI复核：原始底模${semantic.summary.base.strictContentPass}/100，Atlas${semantic.summary.atlas.strictContentPass}/100；加入结构与应用校验后的端到端通过分别为${semantic.summary.base.endToEndPass}/100与${semantic.summary.atlas.endToEndPass}/100。由两个Codex AI按冻结必要项、禁止含义和引用支持判读，非盲评，精确底层模型ID未暴露；曾参与资料/题目整理，不是独立专家或真实用户评审。该标准严格要求答全与保留范围，不是通用健身知识准确率。Atlas仍有漏答、偏题和过度拒绝，不能用100/100结构率冒充内容正确率。详见AI-SEMANTIC-REVIEW.json。`:'严格内容复核尚未完成，不提供语义准确率。'}

另外16条跨任务合成回归通过${workflow.passed}/${workflow.total}，不并入100题成绩。未来计划误当已完成、缺少次数、无效记录优先与冲突澄清仍有失败；这是未直接替换线上版本的功能原因，不是专业审核门槛。训练分布核对发现复盘训练没有excluded优先样本，方案训练没有clarify样本，后续沿用同一Atlas1.7B补齐这些数据，而非更换模型或仅增加轮数。

底模 revision：70d244cc86ccca08cf5af4e1e306ecf908b1ad5e。
adapter SHA256：${sha}。
底模版权与来源保留于 QWEN-LICENSE.txt 和 BASE-MODEL-MANIFEST.json。完整模型各文件哈希见model/MODEL-MANIFEST.json；保留的原始底模位于 ${path.join(workspace,'work/models/Qwen3-1.7B')}。

离线试用（使用已安装的训练Python环境，在本目录运行）：

    python infer.py --model model --input example.messages.json

带本地资料检索的问答：

    node ask.mjs --python "${path.join(workspace,'work/liftlog-train-venv/Scripts/python.exe')}" "增肌一定要每组力竭吗？"

所有评测为AI原创合成题，无真实用户训练数据；结果不等于真实用户准确率、增肌效果或商业成果。无云/API训练费用。本包为本地实验模型，不代表魔搭线上已经切换。
`;
await fs.writeFile(path.join(dest,'MODEL_CARD.md'),card);
await fs.writeFile(path.join(dest,'RELEASE.json'),JSON.stringify({name:'LiftLog Atlas',base:'Qwen3-1.7B',run:'Run01',adapterSha256:sha,trained:true,evaluationQuestions:100,paidTrainingApiCalls:0,online:false,readyForFullReplacement:false,workflowPassed:workflow.passed,semanticStrict:semantic?.summary.atlas.strictContentPass??null},null,2)+'\n');
console.log(JSON.stringify({dest,adapterSha256:sha,trained:true,evaluated:100,online:false}));

import fs from 'node:fs/promises';
import {messagesFor,compact,digest,expand} from './protocol.mjs';
const root=new URL('./vocabulary/',import.meta.url);await fs.mkdir(root,{recursive:true});
const sources=[
 {id:'user',title:'用户提供的口语词；不是权威术语定义',url:null},
 {id:'guide',title:'国家体育总局《全民健身指南》',url:'https://www.sport.gov.cn/n315/n20067006/c20324479/content.html'},
 {id:'ace',title:'ACE Exercise Library：肌群、器材及动作目录',url:'https://www.acefitness.org/resources/everyone/exercise-library/'},
 {id:'body',title:'国家体育总局：科学减重“质”大于“量”',url:'https://www.sport.gov.cn/n20001280/n20001265/n20066978/c28489202/content.html'},
 {id:'rir',title:'Estimating Repetitions in Reserve in Four Commonly Used Resistance Exercises',url:'https://pubmed.ncbi.nlm.nih.gov/33337690/'},
 {id:'ods',title:'NIH ODS：Dietary Supplements for Exercise and Athletic Performance',url:'https://ods.od.nih.gov/factsheets/ExerciseAndAthleticPerformance-HealthProfessional/'},
 {id:'product',title:'LiftLog 自有记录字段与输入分类规范；不是医学资料',url:null}
];
const groups=[
 ['外形目标与口语','user','context_only','薄肌|脂包肌|宽肩窄腰|倒三角|穿衣显瘦|脱衣有肉|肌肉线条|壮一点|显肩宽|背变宽'],
 ['身体信息','body','measurement_context','体脂率|体脂百分比|体重|脂肪量|瘦体重|肌肉量|身体成分'],
 ['身体围度与主观描述','product','measurement_context','身高|腰围|肩围|胸围|臀围|臂围|腿围|腰臀比|骨骼肌量|水分|BMI'],
 ['肌肉部位','ace','body_region_not_exercise','三角肌|三角肌前束|三角肌中束|三角肌后束|胸肌|胸大肌|背阔肌|斜方肌|菱形肌|肱二头肌|肱三头肌|股四头肌|腘绳肌|臀大肌|臀中肌|腓肠肌|比目鱼肌|腹直肌|腹斜肌|竖脊肌'],
 ['训练类型','guide','context_only','抗阻训练|力量训练|有氧运动|柔韧性|肌肉力量|肌耐力|心肺功能|平衡能力|热身|恢复'],
 ['逐组记录字段','product','explicit_log_fields_only','组数|次数|工作组|热身组|总重量|每只重量|单侧重量|双侧总重|自重|负重|公斤|千克|kg|磅|lb|半程|完整行程|动作幅度|向心|离心|等长|组间休息'],
 ['余力与感受','rir','do_not_infer_rir','RIR|余力次数|剩余次数|RPE|力竭|发力感|技术性力竭|泵感|借力|耸肩'],
 ['器材与动作语境','ace','require_catalog_full_name','杠铃|哑铃|壶铃|弹力带|绳索|史密斯机|龙门架|训练凳|固定器械|卧推|深蹲|硬拉|划船|下拉|推举'],
 ['营养语境','ods','nutrition_not_training_load','肌酸|蛋白粉|蛋白质|碳水化合物|脂肪|咖啡因|乳清蛋白|氨基酸|能量摄入'],
 ['营养及感受口语','user','context_only','碳水|优质脂肪|皮质醇'],
 ['行为与时态','product','completion_scope','已完成|做完了|练完了|补记|昨天|前天|计划|准备|打算|没开始|没做|跳过|只做了|还剩|忘了记']
];
const terms=[];for(const [category,source,handling,list]of groups)for(const term of list.split('|'))terms.push({term,category,source,handling,reviewStatus:'draft_pending_independent_review'});
for(const entry of terms){if(['薄肌','脂包肌','宽肩窄腰'].includes(entry.term))entry.note='用户外形描述；不据此推断体脂率、肌肉量、健康状况或训练处方。';if(entry.term==='胸肌')entry.note='宽泛部位称呼；不能自动等同于某个完整动作。';if(['RPE','技术性力竭','泵感','借力','耸肩'].includes(entry.term)){entry.source='product';entry.note='口语候选词，暂不作专业定义；不自动转换RIR。';}if(['每只重量','单侧重量','双侧总重'].includes(entry.term))entry.note='当前不自动乘二；无法确认总重时请求补充。';}
const seen=new Set();for(const t of terms){if(seen.has(t.term))throw Error('Duplicate '+t.term);seen.add(t.term);}
const lexicon={version:'atlas-vocabulary-draft-1',researchedAt:'2026-11-14',purpose:'训练记录语境识别词表；不是知识问答库，不代表模型权重已学习。来源用于概念参考；中文候选译名及产品处理规则由本项目编写。',sources,terms};
await fs.writeFile(new URL('fitness-lexicon.zh-CN.json',root),JSON.stringify(lexicon,null,2)+'\n');
const cases=[];for(const [i,t]of terms.entries()){
 const ready=`我想了解${t.term}，不过先记今天已经完成的杠铃卧推，总重${30+i%9*2.5}公斤，第一组${8+i%5}次，第二组${7+i%5}次，RIR没记。`;
 const weight=30+i%9*2.5,a=8+i%5,b=7+i%5;
 cases.push({id:'vocab-context-'+i,text:ready,today:'2026-11-14',category:t.category,expected:{status:'ready',date:'2026-11-14',questions:[],exercises:[{name:'杠铃卧推',source:ready,sets:[a,b].map(reps=>({weightKg:weight,reps,rir:null,type:'working'}))}]}});
 const body=`今天体脂率${15+i%10}%，体重${55+i%15}公斤，想练出宽肩窄腰。还提到了${t.term}，不把它记为动作。已经做完俯卧撑，第一组12次、第二组9次，没加负重，RIR没填。`;
 cases.push({id:'vocab-body-'+i,text:body,today:'2026-11-14',category:'body-metric-decoys',expected:{status:'ready',date:'2026-11-14',questions:[],exercises:[{name:'俯卧撑',source:body,sets:[12,9].map(reps=>({weightKg:null,reps,rir:null,type:'working'}))}]}});
}
for(const c of cases)expand(compact(c.expected),c);
const raw=cases.map(JSON.stringify).join('\n')+'\n';await fs.writeFile(new URL('context.cases.jsonl',root),raw);
const sft=cases.map(c=>JSON.stringify({prompt:messagesFor(c),completion:[{role:'assistant',content:JSON.stringify(compact(c.expected))}]})).join('\n')+'\n';await fs.writeFile(new URL('context.sft.jsonl',root),sft);
await fs.writeFile(new URL('manifest.json',root),JSON.stringify({terms:terms.length,contextExamples:cases.length,status:'prepared_not_trained',caseSha:digest(raw),sftSha:digest(sft),trainedRun06UsesThisData:false,provenance:'AI-authored synthetic contexts; pending human review; not evaluation holdout',sources},null,2));
console.log(JSON.stringify({terms:terms.length,categories:groups.length,contextExamples:cases.length,status:'prepared_not_trained'}));

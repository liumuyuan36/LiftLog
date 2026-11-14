export const KNOWLEDGE_VERSION='fitness-notes-2026-11-14-v1';
export const sources={
 A:{title:'ACSM 2026 抗阻训练立场声明·官方摘要',url:'https://acsm.org/resistance-training-guidelines-update-2026/',year:2026,type:'专业组织'},
 B:{title:'Refalo 等：接近力竭与肌肥大·系统综述',url:'https://pubmed.ncbi.nlm.nih.gov/36334240/',year:2023,type:'研究综述'},
 C:{title:'Helms 等：基于剩余次数的主观用力量表',url:'https://pubmed.ncbi.nlm.nih.gov/27531969/',year:2016,type:'研究文章'},
 D:{title:'Hughes 等：四种动作的 RIR 估计',url:'https://pubmed.ncbi.nlm.nih.gov/33337690/',year:2020,type:'研究文章'},
 E:{title:'Singer 等：组间休息与肌肥大·系统综述',url:'https://pubmed.ncbi.nlm.nih.gov/39205815/',year:2024,type:'研究综述'},
 F:{title:'NIH ODS：运动与竞技表现膳食补充剂资料',url:'https://ods.od.nih.gov/factsheets/ExerciseAndAthleticPerformance-HealthProfessional/',year:null,type:'官方资料'},
 G:{title:'ACSM：延迟性肌肉酸痛说明',url:'https://www.acsm.org/docs/default-source/files-for-resource-library/delayed-onset-muscle-soreness-%28doms%29.pdf',year:null,type:'专业组织'},
 P:{title:'LiftLog 记录与统计口径',url:'https://github.com/liumuyuan36/LiftLog/blob/main/dist/data.js',year:2026,type:'产品规范'},
 V:{title:'LiftLog 外形口语词表与处理范围',url:'https://github.com/liumuyuan36/LiftLog/blob/main/training/atlas/vocabulary/fitness-lexicon.zh-CN.json',year:2026,type:'产品规范'}
};
export const knowledgeChunks=[
 {id:'F01',title:'RIR 在记录什么',topics:['rir'],sources:['C'],text:'RIR 是完成一组后，对还能规范完成多少次的主观估计。例如 RIR2 表示估计还能做2次，RIR0 表示估计不能再完成一次规范重复。它不是已经完成的次数，也不是下一组必须完成的次数。',scope:'训练感受量尺；不是精确测量。'},
 {id:'F02',title:'RIR 的估计存在误差',topics:['rir','accuracy'],sources:['D','P'],text:'RIR 估计会受训练负荷等条件影响；研究中的重负荷估计更准确，不能假定所有情境同样可靠。LiftLog 不确定的 RIR 可以留空，空值不会作为零处理。',scope:'研究样本为受过训练的男性；记录规则为本产品约定。'},
 {id:'F03',title:'增肌并不等于每组绝对力竭',topics:['failure'],sources:['B'],text:'该综述没有发现瞬时肌肉力竭训练对肌肥大始终优于非力竭训练。不同研究的力竭定义和训练条件存在差异；这也不意味着训练努力程度无关紧要。',scope:'研究汇总结论，不能据此给个人规定所有组的强度。'},
 {id:'F04',title:'周工作组是观察增肌训练量的一种口径',topics:['volume'],sources:['A'],text:'ACSM 的健康成人证据摘要指出，较高的周训练量有助于肌肥大，并以每肌群每周约10组作为参考。它不是所有新手都必须立即达到的固定处方。',scope:'健康成人的一般证据；应结合目标和可持续性理解。'},
 {id:'F05',title:'规律训练与频率',topics:['frequency','consistency'],sources:['A'],text:'ACSM 强调规律参与抗阻训练，并建议主要肌群每周至少训练两天。安排应适合个人目标与日程；训练频率和每周总工作组数是不同变量。',scope:'一般健康成人建议；不用于个体诊疗或康复计划。'},
 {id:'F06',title:'器械不是唯一决定因素',topics:['equipment'],sources:['A'],text:'自由重量、器械、弹力带和自重训练都可以带来益处。证据没有显示器材类型本身在所有情况下都持续决定训练结果。',scope:'一般抗阻训练证据，不能将不同动作的重量直接视作等价。'},
 {id:'F07',title:'日志的公斤容量与周组数不是同一指标',topics:['log-volume','volume'],sources:['P','A'],text:'LiftLog 的负重容量是已完成负重工作组的重量乘次数之和，不含热身组，自重组不计公斤容量。增肌资料中的周肌群工作组数采用另一种口径，不能把两者直接互换。',scope:'前半为产品计算约定；不代表肌肉增长量。'},
 {id:'F08',title:'组间休息并非越短越好',topics:['rest'],sources:['E'],text:'该综述提示，超过60秒的组间休息可能有小幅肌肥大收益；超过90秒后未发现明显的额外差异，研究结果仍有异质性。不能据此给所有人规定唯一最佳休息时间。',scope:'健康成人研究汇总，不等于个人训练处方。'},
 {id:'F09',title:'蛋白粉是一种补充形式',topics:['protein'],sources:['F'],text:'蛋白质与训练适应有关，补充剂可用于补足饮食需要，但不能代替抗阻训练和整体饮食。是否需要蛋白粉应结合已有饮食，资料不能直接确定个人摄入克数。',scope:'一般运动营养资料；不提供个人营养或疾病方案。'},
 {id:'F10',title:'肌酸的证据范围',topics:['creatine'],sources:['F'],text:'肌酸的较充分证据集中在短时、重复高强度运动表现，个体反应可能不同。不能把使用补充剂直接等同于一定增加多少肌肉，也不据此给个人指定用量。',scope:'本库不覆盖肾病、孕期或用药相关问题。'},
 {id:'F11',title:'延迟性酸痛与乳酸不是同一回事',topics:['soreness'],sources:['G'],text:'不熟悉的负荷可能引起延迟性肌肉酸痛，通常在运动后逐渐出现。ACSM 的说明指出，这种延迟性酸痛不是由乳酸积累造成的。',scope:'一般知识；持续、急性或异常疼痛不在本问答范围。'},
 {id:'F12',title:'外形目标不作为身体测量',topics:['appearance'],sources:['V'],text:'在 LiftLog 中，薄肌、脂包肌、宽肩窄腰作为用户的外形目标语境，不自动换算为体脂率、肌肉量或训练处方。实际测量和完成的训练应分别记录。',scope:'产品词表约定；不是医学分类。'}
];

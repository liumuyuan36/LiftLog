# LiftLog Atlas · 1.7B 本地微调实验

2026-11-14 用户明确选择独立训练的小模型。固定底模为官方 Qwen3-1.7B；使用 LoRA 监督微调，保存独立 adapter，与底模一起构成 Atlas 推理模型。不是从零预训练，不训练 DeepSeek API，不将底模原有能力宣称为自研。

训练目标：读取给定增肌知识卡，输出带可核对引用的简短回答；资料不足时说明不足。混合已有合成训练记录样本，保留日志提取任务。当前不声称模型能诊断动作、提供个体医疗或营养方案、保证肌肉增长。

知识卡用于 RAG 的外部资料；SFT 学习证据使用、格式与回答边界。Run01 按目标卡分组，但部分验证卡曾作为干扰资料出现在训练上下文，详见 [分组更正](DATA-SPLIT-ERRATUM.md)。100 道验收题单独生成，不用于梯度更新、检查点选择或训练轮次决定。题目可能与训练共用知识概念和来源，不能据此声称学会全新领域知识。

固定 seed42、bf16、所有线性层 LoRA r16/alpha32/dropout0.05，completion-only loss，提示词和 padding 不计损失。最大3轮，按验证损失选择检查点，早停1轮；不以凑满十轮为目标。基线和候选使用同一底模快照、相同问题/资料/提示词与非思考贪心解码。全部为合成材料；专业审核不是交付条件，结果不代表真实用户准确率。

原始结果、结构校验、引用检查和语义复核分别记录。无效JSON不修复，缺失、截断和失败均保留。未通过的候选不宣布上线。线上现有 DeepSeek 为切换前状态，本实验不增加第二个生产模型或静默回退。

本地运行（仓库根目录，路径按实际位置填写）：

```powershell
node training/atlas-1.7b/build.mjs
python training/intake/train_lora.py --model MODEL_DIR --output NEW_RUN_DIR --data training/atlas-1.7b/data --epochs 3 --batch-size 2 --accumulation 4 --rank 16 --all-linear --learning-rate 0.00005 --early-stopping-patience 1 --cache-cleanup-steps 20 --baseline-eval --allow-synthetic
```

权重与运行结果保存在仓库外，不上传凭据，不使用云/API训练费用。官方底模下载脚本校验固定 revision 和权重 SHA256，不启用 trust_remote_code。

实际Run01第一轮验证后出现显存缓存压力，保留checkpoint123后中断，恢复至新目录`work/atlas-1.7b-run-01-resume`，从保存的优化器／调度器／随机数状态继续，累计轮数上限仍为3。增加每20步及验证前释放未用CUDA缓存，未改数据、提示、梯度批次或学习率。代码哈希修订保存在`evaluation/fitness-100/RESOURCE-AMENDMENT.json`；100题预测在此之前尚未运行。

2026-11-14 完成 Run02：在 Run01 adapter 上以 2e-5 学习率继续 LoRA SFT，810 条训练、88 条验证，实际 2 轮，按验证损失选 checkpoint-204。完整 BF16 模型与 adapter 保存在本地 `outputs/LiftLog-Atlas-1.7B-Run02`，未替换魔搭线上服务。

同题对照的 40 道新增场景题，严格内容 AI 复核通过数为 Run01 19/40 → Run02 21/40（47.5% → 52.5%）；5 题改善、3 题退步，属于小幅提升。不是统计显著性或市场准确率证明。跨任务回归 12/16 → 14/16，修复了未来计划被记为完成、缺次数仍可生成草稿的问题。原 100 题 JSON 保持 100/100，应用引用与数值校验从 99/100 降为 98/100，仍需改进。

新题未用于训练或检查点选择，但与训练共享来源、概念和部分相近主题；Codex AI 由同一作者非盲复核，非独立人工或真实用户评测。程序检查与语义指标分开列出，原始预测、失败和预设晋级标准保存在 [Run02 评测](../../evaluation/atlas17-run02/)。训练脚本和数据在 `run02/`，继续训练要使用新输出目录，不能覆盖本次冻结材料。

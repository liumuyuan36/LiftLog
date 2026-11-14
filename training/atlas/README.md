# LiftLog Atlas · 训练记录理解模型

Atlas 的目标是把中文训练口语整理成可校对草稿，降低健身房逐组输入的成本。模型名称不代表从零预训练：它基于官方 [Qwen3-0.6B](https://huggingface.co/Qwen/Qwen3-0.6B)，使用 LoRA 微调。Qwen 为 Apache-2.0；底模许可证随部署包保留。

## 任务边界

输入仅包含本次描述、参考日期和动作名称/记录方式。先按完整动作名的最长匹配缩小候选，再抽取动作、逐组公斤总重、次数、RIR 和热身类型。未知 RIR 保留为空；“力竭”不自动换算 RIR。日期归一化、重复动作合并、数值证据检查、自重字段约束与未来计划分流由程序处理，这些成绩不能称为模型单独的能力。

它不提供知识问答、营养建议、动作诊断、下一阶段训练计划，也不把未来计划当作已经完成的训练。库外动作、含糊简称、未明确的单位或不确定数值应请求补充。输出只进入草稿，用户校对并逐组确认后保存。语音来自手机输入法；当前没有自建语音识别模型。

## 数据与实验

- 首轮微调只更新 q/v 投影，验证了完整训练链路，但留出测试仅 8/20，未上线。
- Atlas V2 改为所有线性层 LoRA r16、alpha32、dropout0.05，训练 1,348 条。检查点训练被正常保存后恢复，有完整优化器与训练状态。
- V3 从 V2 检查点继续训练，2,104 条训练数据、120 条新开发验证，2 epochs、学习率3e-5、有效 batch8、bf16、seed42。选用最小验证损失的 checkpoint263。可训练参数10,092,544。完成部分计算损失，提示词与 padding 不计算损失，不截断超长样本。
- V2 已检查的156条验证被明确重新归入 V3 开发/训练，不能再称独立测试。V3 的208条程序生成留出、40条手写验收、10条用户术语边界保持原字节和哈希，未用于训练。术语可能已在训练语境中出现，因此不是“未见词汇”测试。
- 全部训练标注由 AI 编写，尚未经独立教练/标注员审核，不含真实用户私有训练记录。即使合成测试通过，也不能推断真实市场准确率或产品留存。

`data-v3/manifest.json` 保存数据哈希与预先声明的门槛；`run.json` 保存实际训练参数和版本。模型权重、环境、预测文件不提交 Git；发布报告单独包含实测结果。禁止用留出集调参后仍声称其为独立测试。

## 复现

先按 `training/intake/README.md` 准备官方底模与独立 Python 环境。Atlas 的 SFT 与评测协议不同于首轮完整 JSON 实验，不能混用。

```powershell
node training/atlas/build-v3.mjs
node training/atlas/export-controls.mjs
# WARM_ADAPTER 是已训练的 V2 adapter；RUN_DIR 必须是新目录
python training/intake/train_lora.py --model MODEL_DIR --output RUN_DIR --data training/atlas/data-v3 --adapter WARM_ADAPTER --epochs 2 --batch-size 4 --accumulation 2 --rank 16 --all-linear --learning-rate 0.00003 --allow-synthetic
python training/intake/predict_local.py --model MODEL_DIR --adapter RUN_DIR/adapter --input training/atlas/data-v3/validation.prompts.jsonl --output validation.predictions.jsonl --max-new-tokens 512
node training/atlas/evaluate.mjs --split validation --predictions validation.predictions.jsonl --out validation.report.json
```

基础模型零样本、6示例提示词、LoRA 使用同一快照、贪心非思考解码、512输出令牌上限。对照的24条来自开发验证，仅用于探索性比较；报告同时列出严格 JSON、原始结构正确率和完整服务正确率。没有为了提高分数去掉 JSON 围栏或修复输出结构。模型小、任务专用，不将对照结果外推为通用能力比较。

发布门槛：完整覆盖、有效 JSON ≥99%、完整服务字段精确匹配 ≥95%、错误放行0、已放行记录关键字段错误0；部署 CPU 的P95≤20秒。超时与缺失仍计失败。规则拒绝与字段投影独立统计。测试通过也只是 Beta 候选，仍需要真实用户校对和错误分析。

## 服务

`worker.py` 在容器回环地址推理，Node `/api/atlas/intake` 验证来源、请求大小与限流。服务端校验 adapter SHA256；工作进程不会收到 DeepSeek 密钥，不会远程补调或静默切换付费模型。部署开关默认为关闭，只有显式启用且权重校验一致才显示可用状态。

CPU 实验曾发现 INT8 的结构化输出质量明显下降；不能根据一条成功样例宣布量化可上线。候选 FP16 动态打包必须在实际2核/8GB限制下跑完整测试。启动失败不影响原有网页和手动记录。配置项见 `.env.example`，不需要把密钥写进数据集或上传包。

用户同意一次推理不等于同意模型训练。当前不会采集描述作为训练数据；本机体验统计只保存字符数、耗时、结果状态与用户校对情况。后续若采集数据，须独立设计知情授权、去标识、审核和删除流程。

## 2026-11-14 继续训练

V3 在新增32条合成验收中只有28条完整服务正确，4条自重记录重复了第一组次数，因此没有发布。`build-v4.mjs` 在原训练集上补充800条不同次数与逐组RIR描述，形成2,904条训练数据；从V3 adapter继续训练1 epoch，学习率5e-5、有效batch8，其余LoRA设置相同，实际耗时310秒。

这32条已检查样本明确降为开发回归。V4回归模型原始结果29/32，完整服务32/32；不能再宣称是独立测试。新的40条合成发布验收在本轮训练过程中固定且未用于训练；实际CPU结果与发布状态另附报告。全部合成标签仍待独立人工审核。旧208条、旧40条及10个用户术语均已被检查，不继续称为未见测试集。

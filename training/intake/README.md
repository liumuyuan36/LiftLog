# LiftLog 健身口语理解微调实验

任务：让小模型把已完成训练整理为可核对的结构化草稿。实验对比原始小模型与LoRA模型，沿用线上同一个提示词、动作库和业务校验，不替换线上DeepSeek。

首批100条AI编写合成数据：训练60、验证20、留出测试20。未经过独立人工审核，不含真实用户记录。数据集声明见 `data/manifest.json`，字段口径见 [标注规范](ANNOTATION.md)。这是小规模可行性实验，不是市场验证。

## 零模型费用检查

在仓库根目录运行（Node 20+）：

```powershell
node training/intake/build-dataset.mjs
node training/intake/export-prompts.mjs
node --test tests/model-lab.test.mjs
node training/intake/predict-deepseek.mjs
```

最后一条默认只预览，不联网、不调用模型。留出测试只导出prompt，不生成SFT格式文件。

## 本地LoRA实验

候选底模为官方 `Qwen/Qwen3-0.6B`，用于低成本验证流程，许可证Apache-2.0。使用官方下载的本地快照并记录revision；不启用 `trust_remote_code`。它不是声称最优的业务模型。训练脚本使用Transformers Trainer与PEFT，不需要更换现有应用的SDK。

Python3.12建议创建独立venv。RTX5090使用支持该架构的CUDA版PyTorch，按官方安装页选择；本次环境使用官方cu128索引。不要更改系统Python或现有应用依赖。

```powershell
python -m venv .venv-train
.\.venv-train\Scripts\python.exe -m pip install torch==2.7.1+cu128 --index-url https://download.pytorch.org/whl/cu128
.\.venv-train\Scripts\python.exe -m pip install transformers==5.22.2 peft==0.21.3 accelerate==1.15.0 huggingface_hub==2.4.0
.\.venv-train\Scripts\python.exe training/intake/download_model.py --output MODEL_DIR

# MODEL_DIR指官方模型本地快照；RUN_DIR选择不存在的新目录
.\.venv-train\Scripts\python.exe training/intake/train_lora.py --model MODEL_DIR --output RUN_DIR --allow-synthetic --preflight
.\.venv-train\Scripts\python.exe training/intake/predict_local.py --model MODEL_DIR --input training/intake/data/test.prompts.jsonl --output base.predictions.jsonl
.\.venv-train\Scripts\python.exe training/intake/train_lora.py --model MODEL_DIR --output RUN_DIR --allow-synthetic
.\.venv-train\Scripts\python.exe training/intake/predict_local.py --model MODEL_DIR --adapter RUN_DIR/adapter --input training/intake/data/test.prompts.jsonl --output lora.predictions.jsonl
node training/intake/evaluate.mjs --predictions base.predictions.jsonl --out base.report.json
node training/intake/evaluate.mjs --predictions lora.predictions.jsonl --out lora.report.json
```

两次推理必须使用同一个底模快照、prompt、测试文件和解码参数。训练仅学习completion，prompt和padding的loss为-100；不截断超长标注。固定seed42，q/v投影LoRA r8/alpha16/dropout0.05，学习率1e-4，3epochs，按验证损失选择检查点。训练代码不读取test；测试只用于最终报告。评测缺失行按失败计入总分母，重复/未知ID直接报错。

如果Windows应用程序控制阻止DLL加载，保留安全保护；可以在已配置好的WSL2/Linux GPU容器中使用本目录Dockerfile（官方PyTorch镜像）。不要修改应用程序控制策略或给文件解除安全阻止来强行运行。Docker引擎是否可用、GPU透传是否成功，需要单独验证；安装依赖不等于训练已经完成。

Docker引擎运行后，可在仓库根目录执行：

```powershell
docker build --tag liftlog-intake-train:pilot --file training/intake/Dockerfile training/intake
# 四个Mode依次运行：preflight、base、train、lora
./training/intake/run-docker.ps1 -ModelDirectory MODEL_DIR -ResultsDirectory RESULTS_DIR -RunsDirectory RUNS_DIR -Mode preflight
```

容器从固定digest的官方镜像构建；运行时关闭网络，只读挂载代码和底模，仅结果与训练输出目录可写。不要挂载Docker socket或添加privileged权限。脚本选择的`run-01`及预测文件必须尚不存在，防止覆盖历史实验。

`--allow-synthetic` 明确表示接受未人工复核的试验性质，不代表数据已审核。模型权重、venv、缓存和预测不提交Git。实际依赖版本保存在每次run.json；首次运行需要下载数GB，GPU会升温耗电。没有CUDA则停止，不会自动租用云GPU。

本次Windows环境中2.11.0的DLL被系统策略阻止；官方2.7.1通过了正常的系统加载检查与CUDA矩阵运算，未修改安全保护。完整Python依赖版本见requirements-lock.txt。该文件用于复现实验，跨系统安装仍需选择匹配的官方PyTorch轮子。

## DeepSeek对照（可选，产生API费用）

仅在另行明确授权调用数量后，把密钥配置到本机环境。不要把密钥写进命令或数据集：

```powershell
node training/intake/predict-deepseek.mjs --live --limit 1 --max-calls 1 --out deepseek.predictions.jsonl
```

每条最多一次请求，无自动重试，遇错误即停止；未运行的样本仍计入完整集合的评测分母。DeepSeek使用同一任务提示词和2200输出令牌上限；本地模型使用固定非思考贪心解码。不同服务的输出限制不同，跨服务结果需标明，不能当严格控制变量实验。本轮不调用付费API。

## 格式问题的补充诊断

首次观察到原始底模输出Markdown代码围栏后，增加了事后诊断：`format-diagnostic.mjs --predictions FILE --out REPORT`。它对两边采用相同的完整围栏移除，不补造字段、不修复截断、不从解释文本抽取JSON。该项与主指标分开报告，不修改线上解析。尚未运行少样本提示词或约束解码对照，不能把本轮结果当成微调方案最优的证据。

## 产品决策与求职材料

先验证可证伪假设：“微调能否在相同底模下提高完整记录抽取质量，尤其保留未知RIR并避免少组、错重量。”报告应列出失败案例、延迟、硬件、训练时长和限制。没有改善就保留原方案；改进仅在小合成集成立时，继续收集经授权的真实表达，重新冻结测试集。

在独立测试、用户校对率和部署成本评估完成前，线上继续使用既有服务。本地训练成功不意味着能在魔搭免费CPU上达到可接受的推理延迟。面试材料可展示问题定义→标注规范→数据治理→基线→微调→失败分析→上线决策，禁止编造用户量或准确率。

官方参考：

- https://huggingface.co/Qwen/Qwen3-0.6B
- https://huggingface.co/docs/peft/en/quicktour
- https://huggingface.co/docs/transformers/main/en/main_classes/trainer
- https://pytorch.org/get-started/locally/

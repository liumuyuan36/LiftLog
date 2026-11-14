# Atlas Run02 CPU 部署

固定官方 Qwen3-1.7B revision `70d244cc86ccca08cf5af4e1e306ecf908b1ad5e`，本地 LoRA SFT Run02。原始模型与 adapter 保留，不在 Git 源码库内分发大权重。

用官方 llama.cpp `b12377` / commit `32bdc3a89e6528d3e419024c833c5dabf32c7541` 的 `convert_hf_to_gguf.py` 转换已合并 BF16 模型：

```text
python convert_hf_to_gguf.py <Run02-merged-model-directory> --outfile atlas-run02-q8_0.gguf --outtype q8_0 --model-name "LiftLog Atlas 1.7B Run02"
```

现有训练环境补装 sentencepiece 0.2.1；未追加权重训练。来源与 SHA256 在 `lib/atlas-model-manifest.json`。发布包构建和启动都验证 GGUF SHA256。

推理使用官方 Linux CPU 二进制和 MIT 许可证。Node24 bookworm-slim 安装 Debian libssl3 / libgomp1，解压官方 tar 保留符号链接。仅公开 Node 7860；llama-server 监听 127.0.0.1:7861，单并发，2线程，8192上下文。提示与原始 tokenizer 非思考模板逐条相同。原生 `/completion` + 官方 JSON GBNF，贪心、seed42、禁用提示缓存。chat/completions 的模板与 JSON grammar 在该固定运行时产生 sampler 错误，因此不使用该路由，也不静默更改模板。

`evaluate-q8.mjs` 请求本机7862独立测试容器，按已冻结40问与16跨任务题做部署回归。输入哈希不变，预测逐条写入且不覆盖已有文件。`compare-q8.mjs` 对照GPU原始结果；11条不同输出经同一助手非盲复核，29条相同JSON继承原复核。属于已见合成题回归，不是新的独立准确率测试。

结果：56条均完整结束；40问程序有效40/40，预期回答状态39/40，严格内容复核21/40→20/40，2改善、3退步；跨任务14/16。JSON约束、量化与引擎同时改变，不能把差异仅归因于量化。原模型两条复盘首要重点错误保留为失败，线上额外程序校验拒绝，不改写为正确AI结果。

发布包：`node scripts/prepare-atlas17-modelscope.mjs`。四个文字任务统一走同一 Atlas alias，90秒超时，非法身份/截断/JSON/引用不采用，单并发与每IP限流，断开请求时中止推理。保留手动功能，不自动转发外部API。音频转写端点410，设备听写后由用户提交文字。

本机验收使用与生产相同Node24基础系统及包版本的缓存镜像，2核8GB、`--network none`。真实四任务及失败路径22项通过，见 `docs/atlas17-container.json`。最后行尾清理后的最终包另做字节核验；公网部署以 `docs/atlas17-live.json` 为准，不能只凭本机结果声称已上线。

## 许可与数据范围

Qwen模型为Apache2.0，llama.cpp为MIT；许可证随模型包分发。知识卡摘要保留原始研究/官方来源。仅包含合成训练和评测，不包含用户训练记录或密钥。运行日志不含提示、回答或音频；Node不会自动收集个人记录进训练集。

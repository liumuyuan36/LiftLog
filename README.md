# LiftLog / 训练日志

A local-first workout tracker built with vanilla JavaScript, HTML and CSS. Personal AI-assisted / Vibe Coding project by Muyuan Liu.

面向个人力量训练的健身记录应用：从身体部位选择动作，记录每组重量、次数与 RIR，查看历史、训练趋势与个人纪录。开发过程使用 AI 辅助，应用本身不调用 AI 模型。

## Highlights

- Workout logging with completed sets, rest timer and resumable drafts.
- Custom exercises, bodyweight-only movements and recoverable exercise deletion.
- Training volume, estimated 1RM, personal records and bodyweight trends.
- Separate demo and personal spaces; browser-local storage and JSON export.
- No account, backend database or third-party package installation required.

## Quick start

Requires Node.js 20 or newer.

```sh
npm run dev
```

Open http://127.0.0.1:5173. The source lives directly in `dist/`; it is included intentionally and does not require a build step.

```sh
npm test
npm run check
```

## Development approach

This personal Vibe Coding project explores turning a real training workflow into an interactive application. AI assistance was part of development; the repository is not presented as entirely hand-written code. The implementation and included tests provide concrete examples of data rules, edge cases and interaction choices.

No open-source license is granted with this repository.

---

# LiftLog · 训练日志

一个在 VS Code 中直接运行的本地网页项目。按胸、肩膀、背、手臂、腿、核心分类，记录每一组训练，查看历史与基础统计。无 AI、无账户、无云端依赖。

## 启动

1. 安装 Node.js 20 或更高版本。
2. 在 VS Code 中打开本文件所在的 `liftlog` 文件夹。
3. 打开终端，运行：

```bash
npm run dev
```

也可直接运行 `node server.mjs`。不需要 `npm install`。

项目附带 VS Code 调试配置，也可按 F5 选择「启动 LiftLog」。同一个端口只需启动一次；若提示端口已占用，请直接访问已运行的页面。

浏览器访问 http://127.0.0.1:5173 。保持终端运行；Ctrl+C 停止。

## 使用

- 首次打开为明确标注的示例空间，包含模拟训练及体重数据。
- 点击「开始我的记录」进入独立的个人空白空间。示例和个人数据互不混合。
- 点击身体部位，选择动作加入训练；输入重量、次数、可选 RIR，勾选完成。
- 在「开始训练」页点击「自定义动作」，填写名称、所属部位和可选器械备注。训练弹窗里也有入口，可直接保存并加入当前训练。
- 自定义动作会在所属部位、趋势动作选择和 PR 中使用，与预置动作采用相同统计口径。建议用品牌、型号区分不同器械，并保持重量记录方式一致。名称不能与已有动作重复。
- 自定义动作随当前空间本地保存并包含在 JSON 备份中；示例与个人动作库互相独立。动作卡片可点击「删除动作」，确认后从可选动作库移除，已有历史、PR 和草稿保留。可在动作库底部「已删除动作」中恢复；有历史记录的已删除动作仍可查看趋势。预置动作不提供删除。本版暂不提供重命名。
- 核心分类内置「仰卧起坐」「悬挂举腿」，只输入次数、可选 RIR，无需填写重量。新建自定义动作时也可选择「自重动作 · 仅次数」。
- 自重动作计入工作组数，历史展示完成次数，趋势展示每场训练的单组最多次数，PR 按单组次数统计；不计入 kg 容量或 e1RM，也不把体重当作负重。现有负重记录与旧自定义动作保留原有口径。
- 每完成一组启动 2 分钟休息倒计时，下一组复制上一组输入。
- 「稍后继续」或关闭弹窗保留新训练草稿。刷新页面后点击「继续训练」恢复。
- 完成训练只保留已勾选的组，计入历史与统计；尚未完成的行不保存进历史。
- 历史页点击训练可以编辑或删除。编辑已保存训练时，必须点击「保存修改」才生效；修改一组后需要重新勾选完成。
- 在概览或趋势页记录体重；同一天重复记录会更新该日体重。
- 设置页可切换空间、导出 JSON 备份。

## 技术结构

```text
dist/
  index.html     页面入口
  styles.css     响应式样式
  app.js         页面、交互、本地保存
  data.js        数据模型、计算函数与示例数据
  favicon.svg   图标
tests/
  data.test.mjs  核心指标和边界测试
server.mjs      Node.js 本地静态服务器
package.json   启动和测试命令
```

采用原生 HTML/CSS/JavaScript ES Modules，便于阅读和直接运行；本版没有使用 React Native 或 Supabase。无需安装第三方依赖。修改源码后刷新页面查看更新。

## 验证

```bash
npm test
npm run check
```

## 统计口径

- 容量 = 已完成工作组的重量 × 次数之和，热身不计入。
- e1RM：单次取实际重量，2–10 次使用重量 ×（1 + 次数 / 30），其他组不计入；每场训练取动作最佳值。
- PR：同一动作的最高重量、最高 e1RM、相同重量下最高次数。第一条记录为基准，超过历史基准时提示突破，持平不提示。
- 部位组数按动作所属主分类统计，不推测辅助肌群贡献。
- 本周从用户设备时区的周一开始；过去 7 天包含今天。
- 双哑铃输入双侧总重量，杠铃包含杆重；不同动作或器械不混合比较 PR。

## 当前边界

数据保存在当前浏览器的 localStorage，按网站地址和浏览器隔离。没有跨设备同步；清除网站数据会丢失记录。导出功能提供 JSON 备份，本版尚未提供导入界面。请保持使用相同访问地址（127.0.0.1 与 localhost 是不同空间）。

本版是本地网页应用，不是独立 iPhone 安装包。没有登录、饮食或 AI 功能。休息时间仅在当前打开页面中计时，不发送系统通知。对已有训练的未提交编辑不自动保存。

import fs from 'node:fs/promises';
const root=new URL('../',import.meta.url);
async function replace(name,from,to){const url=new URL(name,root),s=await fs.readFile(url,'utf8');if(s.includes(to))return;if(!s.includes(from))throw Error('Missing release target: '+name);await fs.writeFile(url,s.replace(from,to));}
await replace('package.json','"version": "1.13.0"','"version": "1.14.0"');
await replace('dist/app.js','V1.13.0 · 主屏幕网页 App','V1.14.0 · 主屏幕网页 App');
await replace('dist/sw.js',"v1.13.0-r1","v1.14.0-r1");
await replace('dist/knowledge-ui.js',"import {openVoice}","import {knowledgeChunks} from './knowledge-data.js';\nimport {openVoice}");
await replace('dist/knowledge-ui.js',"const examples=['增肌一定要每组力竭吗？','RIR 2 是什么意思？','公斤容量和每周组数是一回事吗？','隔天酸痛是因为乳酸吗？'];", "const examples=['增肌一定要每组力竭吗？','重量没变，次数多了算进步吗？','完整行程和半程怎么理解？','增肌饮食为什么还要看碳水？'];");
await replace('dist/knowledge-ui.js','<div class="knowledge-sources">${c.sources.map', '<details class="knowledge-provenance"><summary>来源与资料说明</summary><p class="sub">${c.sources.some(id=>sources[id].type===\'产品规范\')?\'包含产品统计约定，请与研究证据区分。\':\'AI 整理的简短资料摘要，可回看原始出处。\'}</p>${c.unsupportedInferences?.length?`<p class="sub">不能据此推断：${c.unsupportedInferences.map(esc).join(\'；\')}。</p>`:\'\'}<div class="knowledge-sources">${c.sources.map');
await replace('dist/knowledge-ui.js',"${esc(s.title)} ↗</a>`;}).join('')}</div></article>", "${esc(s.title)} ↗</a><small class=\"muted\">${s.year?esc(s.year)+\' · \':\'\'}${s.readStatus===\'unavailable_on_this_review_attempt\'?\'本次未能重新访问，保留历史来源\':s.readStatus===\'product_specification\'?\'产品记录口径\':\'公开摘要／资料整理\'}${s.accessedAt?\' · 核对尝试 \'+esc(s.accessedAt):\'\'}</small>`;}).join('')}</div></details></article>");
await replace('dist/knowledge-ui.js','力竭、余力、休息与训练量，从一个小问题开始。','从负荷、行程到饮食和进步观察，从一个小问题开始。');
await replace('dist/knowledge-ui.js','当前是精简资料库，尚不能覆盖所有健身问题。','现有 ${knowledgeChunks.length} 条简短资料，覆盖常见增肌问题；未覆盖时会说明资料不足。');
await replace('dist/portfolio/index.html','当前 V1.13：统一 DeepSeek 主模型','当前 V1.14：DeepSeek＋增肌资料检索');
await replace('dist/portfolio/index.html','记录整理、资料问答与复盘使用同一主模型。下方 Atlas 成绩与截图保留为历史实验；PDF 为 V1.11 快照。','记录整理、资料问答与复盘使用同一主模型；资料库扩展至 37 条。检索诊断与 API 对照见新版报告。下方 Atlas 成绩与截图保留为历史实验；PDF 为 V1.11 快照。');
await replace('dist/portfolio/index.html','<section class="cover">','<p><a href="fitness-rag.html">查看 V1.14 健身 RAG 迭代与评测 ↗</a></p><section class="cover">');
await replace('dist/portfolio/index.html','下一步，用真实用户的行为检验这些判断。','当前以可体验流程、可追溯资料和可复核评测展示产品判断。');
console.log('Prepared V1.14 UI and cache release');

import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {ATLAS_SHA256,ATLAS_MODEL} from '../lib/atlas-text-config.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),workspace=path.resolve(root,'../..');
const dest=path.join(workspace,'outputs/LiftLog-Atlas17-ModelScopeUpload');await fs.mkdir(dest,{recursive:true});
const files=[];
async function add(name,bytes){files.push({name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),base64:bytes.toString('base64')});}
async function tree(dir){for(const e of await fs.readdir(path.join(root,dir),{withFileTypes:true})){const name=dir+'/'+e.name;if(e.isDirectory())await tree(name);else if(!['deepseek.mjs','atlas-model.mjs','atlas-contract.mjs','atlas-runtime.mjs'].includes(e.name))await add(name,await fs.readFile(path.join(root,name)));}}
await tree('dist');await tree('lib');for(const name of ['package.json','server.mjs','ai.mjs'])await add(name,await fs.readFile(path.join(root,name)));
await add('THIRD-PARTY-NOTICE.txt',await fs.readFile(path.join(root,'artwork/MODEL-NOTICE.txt')));
await fs.writeFile(path.join(dest,'liftlog-files.json'),JSON.stringify({version:1,files}));
for(const [src,name]of [
 ['outputs/LiftLog-DeepSeek-ModelScopeUpload/restore.mjs','restore.mjs'],
 ['outputs/LiftLog-Atlas-1.7B-Run02-GGUF/atlas-run02-q8_0.gguf','atlas-run02-q8_0.gguf'],
 ['work/atlas17-runtime-tools/llama-linux.tar.gz','llama-linux.tar.gz'],
 ['outputs/LiftLog-Atlas-1.7B-Run02/model/QWEN-LICENSE.txt','QWEN-LICENSE.txt'],
 ['work/atlas17-llama-source/LICENSE','LLAMA-LICENSE.txt']]){const target=path.join(dest,name);try{if((await fs.stat(target)).size===(await fs.stat(path.join(workspace,src))).size)continue;}catch{}await fs.copyFile(path.join(workspace,src),target);}
const body=`USER root
RUN apt-get update && apt-get install -y --no-install-recommends libssl3 libgomp1 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY llama-linux.tar.gz /tmp/llama-linux.tar.gz
RUN echo '93713f6bf0ff11e8bc55e64fd14b2415fd8accd3e6f8aecf6e218973b625becd  /tmp/llama-linux.tar.gz' | sha256sum -c - && mkdir -p /opt/llama && tar -xzf /tmp/llama-linux.tar.gz -C /opt/llama && rm /tmp/llama-linux.tar.gz
COPY atlas-run02-q8_0.gguf /opt/atlas/model.gguf
RUN echo '${ATLAS_SHA256}  /opt/atlas/model.gguf' | sha256sum -c -
COPY QWEN-LICENSE.txt LLAMA-LICENSE.txt /opt/atlas/
COPY liftlog-files.json restore.mjs ./
RUN node restore.mjs
ENV NODE_ENV=production HOST=0.0.0.0 PORT=7860 ATLAS_ENABLED=1 ATLAS_MODEL_SHA256=${ATLAS_SHA256} ATLAS_GGUF_PATH=/opt/atlas/model.gguf ATLAS_LLAMA_BIN=/opt/llama/llama-b12377/llama-server
USER node
EXPOSE 7860
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 CMD node -e "fetch('http://127.0.0.1:7860/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node","server.mjs"]
`;
await fs.writeFile(path.join(dest,'Dockerfile'),'FROM node:24-bookworm-slim\n'+body);
await fs.writeFile(path.join(dest,'Dockerfile.local'),'FROM liftlog-atlas17-node-base:dev\n'+body.replace(/RUN apt-get update[^\n]*\n/,''));
let attrs=await fs.readFile(path.join(workspace,'work/liftlog-modelscope-release/.gitattributes'),'utf8');
for(const pattern of ['*.gguf','*.tar.gz'])if(!attrs.includes(pattern+' '))attrs+='\n'+pattern+' filter=lfs diff=lfs merge=lfs -text\n';
await fs.writeFile(path.join(dest,'.gitattributes'),attrs);
await fs.writeFile(path.join(dest,'README.md'),`---\nlicense: apache-2.0\n---\n# LiftLog V1.15.0 · Atlas\n\n面向增肌入门者的个人 AI 产品经理作品演示，不是正式商业运营。记录、资料问答、时间规划与复盘统一使用 LiftLog Atlas 1.7B Run02（Qwen3-1.7B + 本地 LoRA SFT，合并后 Q8_0）。免费 2 核 / 8GB CPU；繁忙或失败明确提示，不回退外部 API。\n\n模型 SHA256：${ATLAS_SHA256}。启动校验模型哈希、固定模型别名；四个任务只访问本容器127.0.0.1。保留 PUBLIC_ORIGIN；现有 DeepSeek 密钥不读取、不调用。线上不需要付费模型 API。\n\nAtlas 是文字模型。语音使用设备或输入法听写，核对后提交文字；旧录音转写端点停用。只在主动同意后处理必要文字，不持久化提示或输出、不写入训练集。训练记录保存在用户浏览器，不包含于发布包。\n\n来源与证据：/portfolio/index.html；Run02历史训练报告与部署回归分开呈现。训练和评测是合成数据，AI复核非独立专业评审；不能视作真实用户准确率。原始问答、失败及量化部署差异保留。Qwen模型Apache2.0，llama.cpp MIT，许可证随包分发。\n`);
const manifest={version:'1.15.0',createdAt:new Date().toISOString(),primaryModel:ATLAS_MODEL,ggufSha256:ATLAS_SHA256,appFiles:files.length,appBytes:files.reduce((n,f)=>n+f.bytes,0),secretsIncluded:false,personalRecordsIncluded:false,externalApiFallback:false};
if(manifest.appBytes>16*1024*1024)throw Error('Restore size exceeded');
await fs.writeFile(path.join(dest,'UPLOAD-MANIFEST.json'),JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify({dest,...manifest}));



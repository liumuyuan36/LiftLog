import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url)),workspace=path.resolve(root,'../..');
const dest=path.join(workspace,'outputs/LiftLog-Atlas17-UI-1.15.1');
const base='mshub-registry.cn-zhangjiakou.cr.aliyuncs.com/modelscope-repo/independent-service:374767-8f1abfdb-2026-11-14-18-44-48';
await fs.mkdir(dest,{recursive:true});const files=[];
async function add(name){const bytes=await fs.readFile(path.join(root,name));files.push({name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),base64:bytes.toString('base64')});}
async function tree(dir){for(const e of await fs.readdir(path.join(root,dir),{withFileTypes:true})){const name=dir+'/'+e.name;if(e.isDirectory())await tree(name);else if(!['deepseek.mjs','atlas-model.mjs','atlas-contract.mjs','atlas-runtime.mjs'].includes(e.name))await add(name);}}
await tree('dist');await tree('lib');for(const name of ['package.json','server.mjs','ai.mjs'])await add(name);
const notice=await fs.readFile(path.join(root,'artwork/MODEL-NOTICE.txt'));files.push({name:'THIRD-PARTY-NOTICE.txt',bytes:notice.length,sha256:createHash('sha256').update(notice).digest('hex'),base64:notice.toString('base64')});
await fs.writeFile(path.join(dest,'liftlog-files.json'),JSON.stringify({version:1,files}));
await fs.copyFile(path.join(workspace,'outputs/LiftLog-Atlas17-ModelScopeUpload/restore.mjs'),path.join(dest,'restore.mjs'));
const body=`USER root\nWORKDIR /app\nCOPY liftlog-files.json restore.mjs ./\nRUN node restore.mjs && rm liftlog-files.json\nUSER node\n`;
await fs.writeFile(path.join(dest,'Dockerfile'),`# Reuse the existing LiftLog Atlas image, including its verified model and runtime.\nFROM ${base}\n${body}`);
await fs.writeFile(path.join(dest,'Dockerfile.local'),`FROM liftlog-atlas17:1.15.0\n${body}`);
const oldReadme=await fs.readFile(path.join(workspace,'outputs/LiftLog-Atlas17-ModelScopeUpload/README.md'),'utf8');await fs.writeFile(path.join(dest,'README.md'),oldReadme.replace('V1.15.0','V1.15.1')+'\n界面更新：精简重复说明、按需展开资料、优化手机复盘操作顺序。模型、检索资料与训练数据保持原版本。镜像继承此前已发布的完整 Atlas 镜像，不重新下载或训练模型。\n');
const manifest={version:'1.15.1',baseImage:base,createdAt:new Date().toISOString(),appFiles:files.length,appBytes:files.reduce((n,f)=>n+f.bytes,0),bundleSha256:createHash('sha256').update(await fs.readFile(path.join(dest,'liftlog-files.json'))).digest('hex'),secretsIncluded:false,personalRecordsIncluded:false,modelChanged:false};
await fs.writeFile(path.join(dest,'UPLOAD-MANIFEST.json'),JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify({dest,...manifest}));

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {artAssets} from '../dist/art-assets.js';
import {builtInExercises,exerciseGuide} from '../dist/exercise-library.js';
import {muscleFigure,exercisePose} from '../dist/exercise-art.js';
const root=new URL('../dist/',import.meta.url);
test('60个内置动作都有实际且不同的起止WebP文件，全部肌群组合均可离线找到',async()=>{
 const cache=await fs.readFile(new URL('sw.js',root),'utf8');
 for(const item of builtInExercises){const guide=exerciseGuide(item.name),pose=artAssets.poses[item.name];assert.ok(pose);const buffers=[];for(const phase of['start','end']){const file=pose[phase];assert.match(file,/^media\/body3d\/[\w-]+\.webp$/);const b=await fs.readFile(new URL(file,root));assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');assert.ok(b.length>1000);assert.ok(cache.includes(file));buffers.push(createHash('sha256').update(b).digest('hex'));assert.ok(exercisePose(guide,phase).includes(file));}assert.notEqual(...buffers);const view=guide.group==='back'?'back':'front',key=[view,guide.group,[...guide.secondary].sort().join('+')].join(':');assert.ok(artAssets.atlases[key],key);}
 for(const file of Object.values(artAssets.atlases)){await fs.access(new URL(file,root));assert.ok(cache.includes(file));}
});
test('肌群命中区域保持键盘入口且不覆盖渲染图，自定义动作不冒用图像',()=>{
 for(const view of['front','back']){const svg=muscleFigure({view,selected:'legs',interactive:true});assert.match(svg,/<image href="\.\/media\/body3d\/atlas-/);assert.match(svg,/art-hit/);for(const d of Object.values(artAssets.hits[view])){assert.match(d,/^M/);assert.doesNotMatch(d,/NaN|Infinity/);}assert.match(svg,/tabindex="0"/);}
 assert.equal(exercisePose({name:'未知动作'},'start'),'');assert.doesNotMatch(muscleFigure({view:'<script>',selected:'<bad>'}),/<script>|<bad>/);
});

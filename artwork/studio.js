import {HumanStudio,atlasKey,groups} from './renderer.js';
import {builtInExercises,exerciseGuide} from '../dist/exercise-library.js';
const select=document.querySelector('#exercise'),status=document.querySelector('#status');
select.innerHTML=builtInExercises.map((e,i)=>`<option value="${i}">${e.name}</option>`).join('');
let studio,view='front',phase='start';
const reviewButton=document.createElement('button');reviewButton.textContent='审阅全部动作';reviewButton.id='review';document.querySelector('header').append(reviewButton);
const review=document.createElement('section');review.id='reviews';document.body.append(review);
const style=document.createElement('style');style.textContent='#reviews{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;padding:20px;max-width:1220px;margin:auto}#reviews article{background:#f9fbf6;border-radius:15px;padding:12px}#reviews h3{font-size:14px;margin:0 0 8px}#reviews img{width:50%;display:inline-block;vertical-align:top}#reviews span{display:block;font-size:11px;color:#89967c}';document.head.append(style);
reviewButton.onclick=async()=>{if(!studio)return;document.querySelector('main').style.display='none';review.replaceChildren();for(const e of builtInExercises){const g=exerciseGuide(e.name),card=document.createElement('article'),title=document.createElement('h3');title.textContent=e.name;card.append(title);for(const p of['start','end']){const img=document.createElement('img');img.src=studio.renderPose(g,p);img.alt=e.name+' '+p;card.append(img);}review.append(card);await new Promise(requestAnimationFrame);}reviewButton.textContent='审阅完成 · 60 个动作';};
function draw(){if(!studio)return;const guide=exerciseGuide(builtInExercises[Number(select.value)].name);if(view==='pose')studio.renderPose(guide,phase);else studio.renderAtlas(view,document.querySelector('#region').value);status.textContent=view==='pose'?guide.name+' · '+phase:'人体 · '+view;}
try{studio=await HumanStudio.create(document.querySelector('#canvas'));draw();document.querySelector('#summary').textContent=`${studio.data.positions.length/3} 个顶点 / ${studio.data.body.length/3} 个三角形 / ${studio.data.bones.length} 根骨骼`;}catch(e){status.textContent='渲染失败：'+e.message;console.error(e);}
document.querySelector('#front').onclick=()=>{view='front';draw();};document.querySelector('#back').onclick=()=>{view='back';draw();};document.querySelector('#region').onchange=draw;
select.onchange=()=>{view='pose';draw();};for(const p of['start','end'])document.querySelector('#'+p).onclick=()=>{view='pose';phase=p;draw();};
document.querySelector('#export').onclick=async()=>{
 if(!studio)return;const files={},atlases={},poses={},hits={},dimensions={};let count=0;
 const yieldFrame=()=>new Promise(requestAnimationFrame);
 for(const side of['front','back']){
  hits[side]=studio.hitAreas(side);
  const combos=new Map([['all:[]',{selected:'all',secondary:[]}],...groups.map(g=>[g+':[]',{selected:g,secondary:[]}])]);
  for(const e of builtInExercises){const g=exerciseGuide(e.name);if(side===(g.group==='back'?'back':'front'))combos.set(g.group+':'+JSON.stringify(g.secondary),{selected:g.group,secondary:g.secondary});}
  for(const {selected,secondary}of combos.values()){
   const key=atlasKey(side,selected,secondary),path=`media/body3d/atlas-${count++}.webp`;
   files[path]=studio.renderAtlas(side,selected,secondary);atlases[key]=path;status.textContent=`生成肌群图 ${count}`;await yieldFrame();
  }
 }
 for(let i=0;i<builtInExercises.length;i++){
  const guide=exerciseGuide(builtInExercises[i].name);poses[guide.name]={};
  for(const p of['start','end']){const path=`media/body3d/exercise-${String(i).padStart(2,'0')}-${p}.webp`;files[path]=studio.renderPose(guide,p);poses[guide.name][p]=path;status.textContent=`生成动作 ${i+1} / ${builtInExercises.length}：${guide.name} · ${p}`;await yieldFrame();}
 }
 const artifact={version:1,renderer:'MakeHuman CC0 mesh + Three.js r180',atlases,poses,hits,files};
 const url=URL.createObjectURL(new Blob([JSON.stringify(artifact)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='liftlog-3d-art.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);status.textContent=`导出完成：${Object.keys(files).length} 张 3D 渲染图`;
};

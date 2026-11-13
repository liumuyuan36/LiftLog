import {artAssets} from './art-assets.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const regionNames={chest:'胸',shoulders:'肩膀',back:'背',arms:'手臂',legs:'腿与臀',core:'核心'};
export function muscleFigure({view='front',selected='all',secondary=[],interactive=false}={}){
 view=view==='back'?'back':'front';const key=[view,selected,[...secondary].sort().join('+')].join(':'),src=artAssets.atlases[key]??artAssets.atlases[view+':'+selected+':']??artAssets.atlases[view+':all:'];
 const hits=interactive?Object.entries(artAssets.hits[view]).map(([g,d])=>'<g class="muscle-region art-hit" data-action="muscle-select" data-group="'+g+'" role="button" tabindex="0" aria-label="选择'+regionNames[g]+'训练动作"><path d="'+d+'"/></g>').join(''):'';
 return '<svg class="muscle-figure rendered-human" viewBox="0 0 180 360" role="'+(interactive?'group':'img')+'" aria-label="'+(view==='back'?'背面':'正面')+'人体部位示意" xmlns="http://www.w3.org/2000/svg"><image href="./'+src+'" width="180" height="360"/>'+hits+'</svg>';
}
export function exercisePose(guide,phase='end',{thumbnail=false}={}){
 const images=artAssets.poses[guide?.name];if(!images)return '';const step=phase==='start'?'start':'end',label=esc(guide.name)+' · '+(step==='start'?'起始':'结束')+'姿势';
 return '<svg class="exercise-pose rendered-pose '+(thumbnail?'pose-thumbnail':'')+'" viewBox="0 0 640 640" role="img" aria-label="'+label+'" xmlns="http://www.w3.org/2000/svg"><title>'+label+'</title><image href="./'+images[step]+'" width="640" height="640"/></svg>';
}

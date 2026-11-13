const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const regionNames={chest:'胸',shoulders:'肩膀',back:'背',arms:'手臂',legs:'腿与臀',core:'核心'};
const front={
  chest:'M66 79Q78 71 88 78L87 104Q71 111 62 96ZM92 78Q104 71 116 79L120 96Q109 111 93 104Z',
  shoulders:'M61 69Q48 73 46 93L59 97Q61 84 68 79ZM119 69Q132 73 134 93L121 97Q119 84 112 79Z',
  arms:'M46 99L58 102L50 132Q46 139 39 134ZM39 141L49 144L42 169L34 167ZM134 99L122 102L130 132Q134 139 141 134ZM141 141L131 144L138 169L146 167Z',
  core:'M75 111L87 109L87 125L76 125ZM93 109L105 111L104 125L93 125ZM76 130L87 130L87 145L77 145ZM93 130L104 130L103 145L93 145ZM77 150L87 150L87 166L80 171ZM93 150L103 150L100 171L93 166ZM64 110L71 115L74 168L64 158ZM116 110L109 115L106 168L116 158Z',
  legs:'M65 185L85 190L81 247L69 254L59 241ZM95 190L115 185L121 241L111 254L99 247ZM66 263L80 259L77 304L66 319L61 302ZM100 259L114 263L119 302L114 319L103 304Z',
};
const back={
  shoulders:'M61 69Q48 73 46 93L59 97L68 79ZM119 69Q132 73 134 93L121 97L112 79Z',
  back:'M85 65L88 91L68 89L65 77ZM95 65L115 77L112 89L92 91ZM65 96L86 98L85 145L74 137ZM94 98L115 96L106 137L95 145ZM82 146L88 148L88 173L81 170ZM92 148L98 146L99 170L92 173Z',
  arms:front.arms,
  legs:'M65 178Q77 174 88 182L87 202Q72 210 62 198ZM92 182Q103 174 115 178L118 198Q108 210 93 202ZM64 209L84 210L80 247L67 253L59 241ZM96 210L116 209L121 241L113 253L100 247ZM65 263Q74 254 81 263L77 302L66 319L61 301ZM99 263Q106 254 115 263L119 301L114 319L103 302Z',
};

export function muscleFigure({view='front',selected='all',secondary=[],interactive=false}={}){
  const paths=view==='back'?back:front;
  const body=`<circle cx="90" cy="31" r="18"/><path d="M82 49H98V65H82Z"/><path d="M62 65Q90 54 118 65L127 82L119 118L112 155L118 186L112 205H68L62 186L68 155L61 118L53 82Z"/><path d="M59 68Q44 74 41 97L33 135L28 161Q26 173 34 178Q43 182 47 168L54 141L63 115L68 82Z"/><path d="M121 68Q136 74 139 97L147 135L152 161Q154 173 146 178Q137 182 133 168L126 141L117 115L112 82Z"/><path d="M66 184L89 191L85 244L82 273L79 316L78 330L58 334Q51 330 58 323L60 312L55 274L54 242Z"/><path d="M91 191L114 184L126 242L125 274L120 312L122 323Q129 330 122 334L102 330L101 316L98 273L95 244Z"/>`;
  return `<svg class="muscle-figure" viewBox="0 0 180 350" ${interactive?'aria-label="点击身体区域选择训练部位"':'aria-hidden="true"'}><g class="anatomy-outline">${body}</g>${Object.entries(paths).map(([group,d])=>`<g class="muscle-region ${selected==='all'?'region-idle':selected===group?'region-selected':secondary.includes(group)?'region-secondary':''}" ${interactive?`data-action="muscle-select" data-group="${group}" role="button" tabindex="0" aria-label="选择${regionNames[group]}部位" aria-pressed="${selected===group}"`:''}><title>${regionNames[group]}</title><path d="${d}"/></g>`).join('')}<path class="anatomy-center" d="M90 68V175"/></svg>`;
}

const poly=(points,width=13,color='var(--figure-body)')=>`<polyline points="${points.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
const equipmentLine=(a,b,width=5)=>poly([a,b],width,'var(--figure-equipment)');
const dumbbell=(p)=>`<g transform="translate(${p[0]} ${p[1]})"><path d="M-12 0H12" stroke="var(--figure-equipment)" stroke-width="4"/><rect x="-15" y="-8" width="6" height="16" rx="2" fill="var(--figure-equipment)"/><rect x="9" y="-8" width="6" height="16" rx="2" fill="var(--figure-equipment)"/></g>`;
const barbell=(a,b)=>`${equipmentLine(a,b,4)}<circle cx="${a[0]}" cy="${a[1]}" r="8" fill="var(--figure-equipment)"/><circle cx="${b[0]}" cy="${b[1]}" r="8" fill="var(--figure-equipment)"/>`;

export function exercisePose(guide,phase='start',{thumbnail=false}={}){
  if(!guide)return '';
  const end=phase==='end',p=guide.pattern,eq=guide.equipment,v=guide.variant;
  let head=[110,49],torso=[[110,73],[110,137]],legs=[[[110,137],[94,176],[92,216]],[[110,137],[132,176],[136,216]]],arms=[[[105,79],[82,111],[78,139]],[[115,79],[138,111],[142,139]]],equipment='',floor=222;
  let accent=[[105,83],[115,83]];
  const bench=(a=[61,159],b=[170,159])=>`${equipmentLine(a,b,8)}${equipmentLine([a[0]+12,a[1]],[a[0]+5,218],5)}${equipmentLine([b[0]-12,b[1]],[b[0]-5,218],5)}`;
  const machine=()=>`${equipmentLine([190,29],[190,219],6)}${equipmentLine([190,30],[144,30],5)}<rect x="178" y="148" width="24" height="47" rx="3" fill="var(--figure-equipment)" opacity=".25"/>`;
  if(['bench','incline','lyingExtension'].includes(p)||(p==='fly'&&eq==='哑铃')){
    const incline=p==='incline';head=incline?[67,94]:[54,141];torso=incline?[[81,113],[125,157]]:[[74,151],[137,151]];legs=[[[137,151],[159,177],[164,215]],[[132,153],[148,185],[145,215]]];
    const sh=incline?[84,115]:[80,148];
    if(p==='lyingExtension')arms=[[sh,[95,102],end?[95,62]:[57,98]],[sh,[105,102],end?[105,62]:[67,98]]];
    else if(p==='fly')arms=[[sh,end?[103,99]:[47,120],end?[104,66]:[27,103]],[sh,end?[111,99]:[118,128],end?[112,66]:[142,105]]];
    else arms=[[sh,end?[83,94]:[104,136],end?[84,57]:[101,94]],[sh,end?[106,93]:[123,136],end?[107,57]:[125,94]]];
    equipment=bench(incline?[66,112]:[38,163],[145,163]);accent=torso.slice();
  }else if(p==='pushup'){
    head=end?[53,102]:[51,137];torso=end?[[73,112],[140,128]]:[[73,144],[142,150]];legs=[[[140,128+(end?0:22)],[176,164],[202,207]],[[142,130+(end?0:20)],[174,169],v==='kneeling'?[179,207]:[208,207]]];
    if(v==='kneeling')legs=[[[140,end?128:150],[170,193],[198,174]],[[142,end?130:152],[175,198],[204,179]]];
    arms=[[[75,end?114:146],end?[69,158]:[99,170],[66,211]],[[83,end?116:148],end?[85,160]:[110,173],[82,211]]];accent=torso.slice();
  }else if(['squat','lunge','hinge','calf'].includes(p)){
    if(p==='squat'){
      head=end?[111,45]:[92,80];torso=end?[[111,69],[111,134]]:[[96,105],[126,147]];legs=end?[[[111,134],[96,176],[94,215]],[[111,134],[135,176],[139,215]]]:[[[126,147],[88,174],[82,215]],[[126,147],[151,177],[157,215]]];
      arms=eq==='杠铃'?[[[103,end?75:111],[80,end?86:124],[73,end?65:102]],[[118,end?75:111],[143,end?86:124],[151,end?65:102]]]:[[[103,end?75:111],[90,end?102:134],[106,end?92:124]],[[118,end?75:111],[133,end?102:134],[115,end?92:124]]];accent=[legs[0][0],legs[0][1]];
    }else if(p==='hinge'){
      head=end?[110,47]:[68,109];torso=end?[[110,72],[114,139]]:[[87,122],[137,148]];legs=[[[114+(end?0:23),139+(end?0:9)],[102,179],[97,215]],[[114+(end?0:23),139+(end?0:9)],[145,180],[146,215]]];arms=end?[[[104,79],[100,112],[102,150]],[[116,79],[122,112],[120,150]]]:[[[92,126],[87,158],[85,191]],[[98,127],[104,159],[102,191]]];accent=[legs[0][0],legs[0][1]];
    }else if(p==='lunge'){
      head=[113,end?49:76];torso=[[113,end?73:100],[113,end?132:153]];legs=end?[[[113,132],[85,172],[72,215]],[[113,132],[147,167],v==='elevated'?[178,179]:[166,215]]]:[[[113,153],[73,161],[72,215]],[[113,153],[141,199],v==='elevated'?[180,179]:[174,215]]];arms=[[[105,end?81:106],[91,end?116:140],[89,end?145:169]],[[121,end?81:106],[136,end?116:140],[138,end?145:169]]];if(v==='elevated')equipment=bench([168,187],[210,187]);accent=[legs[0][0],legs[0][1]];
    }else{const rise=end?12:0;head=[110,49-rise];torso=[[110,73-rise],[110,137-rise]];legs=[[[110,137-rise],[94,173-rise],[92,211-rise]],[[110,137-rise],[132,173-rise],[136,211-rise]]];arms=[[[103,80-rise],[83,111-rise],[79,143-rise]],[[117,80-rise],[138,111-rise],[142,143-rise]]];accent=[legs[0][1],legs[0][2]];}
  }else if(['pulldown','pullup','overhead'].includes(p)){
    if(p!=='overhead'){
      equipment=machine()+equipmentLine([62,25],[168,25],5);head=[112,p==='pullup'&&end?35:74];torso=[[112,p==='pullup'&&end?59:98],[112,p==='pullup'&&end?121:155]];
      legs=p==='pullup'?[[[112,end?121:155],[98,end?163:185],[103,214]],[[112,end?121:155],[135,end?163:185],[136,214]]]:[[[112,155],[154,160],[154,216]],[[112,155],[134,177],[132,216]]];
      arms=(!end||p==='pullup')?[[[103,p==='pullup'&&end?65:104],[83,65],[71,29]],[[121,p==='pullup'&&end?65:104],[143,65],[158,29]]]:[[[103,104],[77,113],[78,87]],[[121,104],[148,113],[148,87]]];
      if(p==='pullup'&&end)arms=[[[103,65],[76,89],[71,29]],[[121,65],[148,89],[158,29]]];
      if(p==='pulldown')equipment+=bench([84,168],[135,168])+equipmentLine([70,end?85:29],[157,end?85:29],4)+equipmentLine([190,30],[112,end?85:29],2);
      accent=[[106,p==='pullup'&&end?81:116],[106,p==='pullup'&&end?112:145]];
    }else{arms=[[[103,80],end?[87,56]:[72,96],end?[84,23]:[72,56]],[[117,80],end?[135,56]:[148,96],end?[138,23]:[148,56]]];accent=[[100,78],[91,83]];if(eq==='器械')equipment=bench([90,150],[134,150])+equipmentLine([134,150],[134,66],6);}
  }else if(['row','bentRow','straightPull','facepull','reverseFly'].includes(p)){
    if(p==='bentRow'||(p==='row'&&v==='supported')||(p==='reverseFly'&&(eq==='哑铃'||v==='bent'))){head=[74,99];torso=[[91,115],[137,148]];legs=[[[137,148],[109,179],[101,216]],[[137,148],[151,183],[154,216]]];arms=[[[95,119],end?[120,105]:[82,154],end?[116,139]:[81,184]],[[102,122],end?[140,111]:[105,155],end?[133,146]:[105,184]]];if(p==='reverseFly'&&end)arms=[[[95,119],[66,108],[36,105]],[[102,122],[144,113],[181,114]]];accent=torso.slice();if(v==='single'){equipment=bench([43,161],[95,161]);arms[1]=[[98,121],[88,141],[78,155]];}if(v==='supported')equipment=bench([71,139],[139,176]);}
    else if(p==='row'){head=[97,71];torso=[[101,95],[111,157]];legs=[[[111,157],[151,170],[183,208]],[[111,157],[141,185],[169,214]]];arms=[[[104,104],end?[89,129]:[134,120],end?[119,135]:[164,129]],[[107,108],end?[100,140]:[145,134],end?[127,146]:[170,139]]];equipment=bench([82,170],[125,170])+machine()+equipmentLine([190,131],arms[0][2],2);accent=[[103,110],[110,146]];}
    else if(p==='facepull'){arms=[[[103,80],end?[66,89]:[151,74],end?[86,55]:[180,67]],[[117,80],end?[144,89]:[156,85],end?[130,55]:[184,79]]];equipment=machine()+equipmentLine([190,64],arms[0][2],2)+equipmentLine([190,64],arms[1][2],2);accent=[[101,79],[91,86]];}
    else if(p==='straightPull'){arms=[[[103,80],end?[123,116]:[142,60],end?[132,148]:[171,39]],[[117,80],end?[136,115]:[157,65],end?[144,148]:[180,45]]];equipment=machine()+equipmentLine([190,30],arms[1][2],2);accent=[[104,95],[107,124]];}
    else{head=[112,61];torso=[[112,85],[112,151]];arms=end?[[[104,91],[72,83],[38,74]],[[120,91],[150,83],[183,74]]]:[[[104,91],[129,109],[157,109]],[[120,91],[144,121],[170,121]]];equipment=bench([90,161],[138,161]);accent=[[100,87],[89,90]];}
  }else if(['curl','pushdown','extension','lateral','frontRaise','fly','chestpress'].includes(p)){
    if(p==='curl'){arms=[[[103,80],[86,116],end?[92,76]:[80,153]],[[117,80],[137,116],end?[132,76]:[145,153]]];accent=[[101,88],[88,112]];if(v==='incline'||v==='preacher')equipment=bench([84,151],[136,151])+equipmentLine([128,151],[122,82],6);}
    else if(p==='pushdown'){arms=[[[103,80],[135,105],end?[139,148]:[160,77]],[[117,80],[147,105],end?[149,148]:[172,77]]];equipment=machine()+equipmentLine([190,30],arms[1][2],2);accent=[[120,83],[139,101]];}
    else if(p==='extension'){arms=[[[103,80],[92,40],end?[94,11]:[119,64]],[[117,80],[132,40],end?[132,11]:[125,64]]];accent=[[118,75],[130,46]];}
    else if(p==='lateral'){arms=end?[[[103,80],[70,88],[35,92]],[[117,80],[151,88],[186,92]]]:[[[103,80],[85,115],[79,153]],[[117,80],[139,115],[145,153]]];accent=[[101,80],[91,87]];}
    else if(p==='frontRaise'){arms=[[[103,80],end?[142,84]:[91,115],end?[175,82]:[88,149]],[[117,80],end?[153,96]:[136,115],end?[186,95]:[141,149]]];accent=[[118,81],[131,89]];}
    else if(p==='fly'){arms=end?[[[103,80],[112,103],[111,124]],[[117,80],[119,103],[120,124]]]:[[[103,80],[66,89],[32,111]],[[117,80],[154,89],[188,111]]];if(eq==='器械')equipment=bench([88,151],[138,151])+equipmentLine([130,151],[130,71],6);accent=[[100,87],[119,87]];}
    else{head=[94,63];torso=[[96,88],[100,150]];legs=[[[100,150],[136,156],[141,215]],[[100,150],[123,177],[124,215]]];arms=[[[99,96],end?[137,93]:[81,121],end?[174,90]:[110,94]],[[103,104],end?[140,108]:[91,136],end?[177,108]:[119,108]]];equipment=bench([76,162],[122,162])+equipmentLine([81,162],[77,71],7)+machine();accent=[[95,92],[105,110]];}
  }else if(['legpress','legextension','legcurl'].includes(p)){
    if(p==='legcurl'){head=[48,143];torso=[[68,154],[127,154]];legs=[[[127,154],[165,155],end?[168,111]:[201,154]],[[127,158],[166,165],end?[179,118]:[204,167]]];arms=[[[76,151],[62,170],[55,174]],[[84,153],[77,174],[70,179]]];equipment=bench([48,169],[178,169]);accent=[[132,155],[162,157]];}
    else{head=[76,83];torso=[[79,108],[98,157]];legs=p==='legpress'?[[[98,157],end?[140,130]:[117,119],end?[181,92]:[144,134]],[[101,159],end?[155,143]:[136,133],end?[191,102]:[158,147]]]:[[[98,157],[143,159],end?[182,149]:[148,210]],[[101,161],[137,174],end?[181,166]:[133,215]]];arms=[[[81,112],[65,140],[78,157]],[[87,113],[94,143],[106,155]]];equipment=bench([63,169],[114,169])+equipmentLine([62,169],[45,101],8);if(p==='legpress')equipment+=equipmentLine([177,68],[207,121],9);else equipment+=equipmentLine(legs[0][2],legs[1][2],9);accent=[legs[0][0],legs[0][1]];}
  }else if(['crunch','reverseCrunch','legraise','deadbug','birddog','twist','cableCrunch'].includes(p)){
    if(p==='cableCrunch'||(p==='crunch'&&v==='machine')){head=end?[117,124]:[101,65];torso=end?[[105,142],[124,168]]:[[106,91],[124,160]];legs=[[[124,168],[141,192],[93,209]],[[124,168],[158,190],[110,212]]];arms=[[[106,end?143:97],[86,end?126:79],[111,end?121:61]],[[114,end?149:100],[103,end?131:83],[121,end?128:66]]];equipment=machine()+equipmentLine([190,30],arms[1][2],2);accent=torso.slice();}
    else if(p==='birddog'){head=[61,121];torso=[[81,139],[141,143]];legs=[[[141,143],[147,185],[179,206]],[[141,143],end?[171,135]:[152,185],end?[205,126]:[189,209]]];arms=[[[82,139],[70,173],[69,210]],[[86,139],end?[55,124]:[89,175],end?[24,113]:[92,210]]];accent=torso.slice();}
    else if(p==='twist'){head=[end?121:95,87];torso=[[end?121:95,112],[125,171]];legs=[[[125,171],[159,180],[177,216]],[[125,171],[145,193],[158,216]]];arms=[[[end?118:95,119],[end?144:71,142],[end?157:60,152]],[[end?128:105,119],[end?150:83,145],[end?161:67,159]]];accent=torso.slice();}
    else if(p==='legraise'&&v==='hanging'){equipment=equipmentLine([56,25],[171,25],6);head=[112,70];torso=[[112,93],[112,149]];arms=[[[104,97],[87,61],[73,29]],[[120,97],[140,61],[155,29]]];legs=end?[[[112,149],[151,146],[187,147]],[[112,149],[148,158],[183,162]]]:[[[112,149],[102,182],[101,218]],[[112,149],[125,183],[128,218]]];accent=[[107,117],[110,145]];}
    else{head=p==='crunch'&&end?(v==='situp'?[88,110]:[66,156]):[48,186];torso=p==='crunch'&&end?(v==='situp'?[[105,133],[142,194]]:[[89,174],[142,194]]):[[72,196],[142,196]];
      legs=['legraise','reverseCrunch'].includes(p)?[[[142,end?185:196],end?[156,145]:[172,198],end?[168,101]:[208,209]],[[142,end?185:196],end?[144,147]:[173,207],end?[153,104]:[209,217]]]:[[[142,196],[169,160],[187,212]],[[142,196],[155,168],[166,215]]];
      arms=[[[78,end&&p==='crunch'?166:192],[69,167],[55,161]],[[85,end&&p==='crunch'?170:195],[79,176],[66,170]]];
      if(p==='deadbug'){head=[48,189];torso=[[72,196],[139,196]];arms=[[[78,194],end?[54,174]:[88,158],end?[25,148]:[88,120]],[[84,196],[98,164],[99,125]]];legs=[[[139,196],[146,159],[185,160]],[[139,196],end?[174,199]:[135,161],end?[208,206]:[178,161]]];}
      accent=torso.slice();
    }
  }
  if(p==='lateral'&&v==='single'){
    arms[0]=[[103,80],[85,115],[79,153]];accent=[[119,80],[130,87]];
    equipment=equipmentLine([28,58],[28,219],6)+equipmentLine([28,211],arms[1][2],2);
  }
  let loads='';
  if(eq==='哑铃'&&!['squat','twist'].includes(p))loads=dumbbell(arms[0][2])+((v==='single'||p==='extension')?'':dumbbell(arms[1][2]));
  if(eq==='哑铃'&&['squat','twist'].includes(p))loads=dumbbell(arms[0][2]);
  if(eq==='杠铃')loads=barbell(arms[0][2],arms[1][2]);
  if(eq==='绳索'&&!equipment.includes('190')&&!(p==='lateral'&&v==='single'))equipment+=machine()+equipmentLine([190,p==='curl'||p==='lateral'?215:30],arms[1][2],2);
  const label=`${guide.name} · ${end?'结束':'起始'}姿势 · ${guide.patternName??p}模式示意`;
  return `<svg class="exercise-pose ${thumbnail?'pose-thumbnail':''}" viewBox="0 0 230 240" role="img" aria-label="${esc(label)}"><ellipse cx="119" cy="224" rx="88" ry="5" fill="var(--figure-shadow)"/><path d="M21 ${floor}H210" stroke="var(--figure-floor)" stroke-width="1"/>${equipment}<g opacity=".65">${poly(legs[1],14)}${poly(arms[1],12)}</g>${poly(torso,23)}${poly(legs[0],16)}${poly(arms[0],13)}<circle cx="${head[0]}" cy="${head[1]}" r="14" fill="var(--figure-head)"/>${poly(accent,9,'var(--figure-highlight)')}${loads}<g fill="var(--figure-joint)">${[...legs[0].slice(0,2),arms[0][1]].map(a=>`<circle cx="${a[0]}" cy="${a[1]}" r="3"/>`).join('')}</g></svg>`;
}

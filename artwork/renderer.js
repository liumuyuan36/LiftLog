import * as T from './vendor/three.module.min.js';

const V=(...a)=>new T.Vector3(...a),Y=V(0,1,0),ONE=V(1,1,1);
const silver=new T.Color('#b4bdc6'),green=new T.Color('#79ad52'),gold=new T.Color('#bba774');
export const groups=['chest','shoulders','back','arms','legs','core'];
export const atlasKey=(view,selected,secondary=[])=>[view,selected,[...secondary].sort().join('+')].join(':');

export class HumanStudio{
  static async create(canvas){const data=await fetch('./human.json').then(r=>r.json());return new HumanStudio(canvas,data);}
  constructor(canvas,data){
    this.data=data;this.canvas=canvas;this.scene=new T.Scene();this.actor=new T.Group();this.props=new T.Group();this.scene.add(this.actor,this.props);
    this.renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,preserveDrawingBuffer:true});this.renderer.setPixelRatio(1);this.renderer.setSize(720,720);this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.88;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
    this.camera=new T.OrthographicCamera(-1,1,1,-1,.02,30);
    this.scene.add(new T.HemisphereLight(0xf7fbff,0x89927f,.85));
    const key=new T.DirectionalLight(0xffffff,2.8);key.position.set(-3.2,5,4);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-3;key.shadow.camera.right=3;key.shadow.camera.top=3;key.shadow.camera.bottom=-3;key.shadow.bias=-.0003;key.shadow.normalBias=.015;key.shadow.radius=5;this.scene.add(key);
    const rim=new T.DirectionalLight(0xcbd9e8,1.7);rim.position.set(3,2,-4);this.scene.add(rim);const fill=new T.DirectionalLight(0xffffff,.6);fill.position.set(3,1,3);this.scene.add(fill);
    // Large luminous panels produce broad, restrained studio reflections.
    const room=new T.Scene();room.background=new T.Color('#bfc4c8');for(const [pos,size] of [[[0,5,0],[8,.1,8]],[[-4,2,2],[.1,4,4]],[[4,2,-2],[.1,4,4]]]){const p=new T.Mesh(new T.BoxGeometry(...size),new T.MeshBasicMaterial({color:0xffffff}));p.position.set(...pos);room.add(p);}const pmrem=new T.PMREMGenerator(this.renderer);this.env=pmrem.fromScene(room,.06);this.scene.environment=this.env.texture;pmrem.dispose();room.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
    this.floor=new T.Mesh(new T.PlaneGeometry(20,20),new T.ShadowMaterial({opacity:.16}));this.floor.rotation.x=-Math.PI/2;this.floor.receiveShadow=true;this.scene.add(this.floor);
    this.metal=new T.MeshStandardMaterial({color:'#53616a',metalness:.7,roughness:.3});this.pad=new T.MeshStandardMaterial({color:'#26332f',roughness:.68});this.chrome=new T.MeshStandardMaterial({color:'#c5ccd1',metalness:.85,roughness:.23});
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(data.positions,3));geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(data.skinIndices,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(data.skinWeights,4));geometry.setAttribute('color',new T.Float32BufferAttribute(data.positions.map(()=>1),3));geometry.setIndex([...data.body,...data.shorts]);geometry.addGroup(0,data.body.length,0);geometry.addGroup(data.body.length,data.shorts.length,1);geometry.computeVertexNormals();
    this.model=new T.SkinnedMesh(geometry,[new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,metalness:.2,roughness:.43}),new T.MeshStandardMaterial({color:'#53615f',metalness:.06,roughness:.75})]);this.model.castShadow=true;this.model.receiveShadow=true;this.actor.add(this.model);
    this.bones={};this.rest=new Map();
    for(const b of data.bones){const bone=new T.Bone();bone.name=b.name;this.bones[b.name]=bone;const q=new T.Quaternion().setFromUnitVectors(Y,V(...b.tail).sub(V(...b.head)).normalize());this.rest.set(b.name,new T.Matrix4().compose(V(...b.head),q,ONE));}
    for(const b of data.bones){const local=this.rest.get(b.name).clone();if(b.parent)local.premultiply(this.rest.get(b.parent).clone().invert());local.decompose(this.bones[b.name].position,this.bones[b.name].quaternion,this.bones[b.name].scale);if(b.parent)this.bones[b.parent].add(this.bones[b.name]);else this.model.add(this.bones[b.name]);}
    this.model.updateMatrixWorld(true);this.model.bind(new T.Skeleton(data.bones.map(b=>this.bones[b.name])));this.initial={};for(const [n,b] of Object.entries(this.bones))this.initial[n]=b.quaternion.clone();
    this.restPositions=data.positions;this.regionWeights=data.positions.filter((_,i)=>i%3===0).map((_,i)=>this.regionAt(i));
  }
  regionAt(i){
    const p=V(...this.data.positions.slice(i*3,i*3+3)),bone=this.data.bones[this.data.skinIndices[i*4]]?.name??'',w={};
    const ell=(c,r)=>{const d=p.clone().sub(V(...c));return Math.max(0,1-(d.x/r[0])**2-(d.y/r[1])**2-(d.z/r[2])**2);};
    const shoulder=Math.min(p.distanceTo(V(...this.data.bones.find(b=>b.name==='upperarm01.L').head)),p.distanceTo(V(...this.data.bones.find(b=>b.name==='upperarm01.R').head)));
    if(/arm|wrist|finger|metacarpal|shoulder|clavicle/.test(bone)){w.shoulders=Math.max(0,1-shoulder/.13);if(!/wrist|finger|metacarpal/.test(bone))w.arms=1-w.shoulders;}
    if(/leg/.test(bone))w.legs=1;
    if(Math.abs(p.x)<.23&&p.y>-.02&&p.y<.55){
      w.chest=Math.max(ell([-.105,.445,.135],[.115,.105,.15]),ell([.105,.445,.135],[.115,.105,.15]));
      w.back=Math.max(ell([-.10,.30,-.07],[.14,.24,.12]),ell([.10,.30,-.07],[.14,.24,.12]),ell([0,.48,-.035],[.2,.1,.12]));
      w.core=Math.max(...[.08,.16,.24].flatMap(y=>[-.043,.043].map(x=>ell([x,y,.13],[.042,.042,.12]))));
    }
    return w;
  }
  color(selected,secondary=[]){const a=this.model.geometry.attributes.color;for(let i=0;i<a.count;i++){const r=this.regionWeights[i],y=this.restPositions[i*3+1],bone=this.data.bones[this.data.skinIndices[i*4]]?.name??'',covered=y>=-.27&&y<=.13&&!/arm|wrist|finger|metacarpal|shoulder|clavicle/.test(bone);let c=covered?new T.Color('#53615f'):silver.clone();if(!covered){if(selected!=='all'&&r[selected])c.lerp(green,Math.min(1,r[selected]*2.4));else for(const g of secondary)if(r[g])c.lerp(gold,Math.min(.8,r[g]*1.6));}a.setXYZ(i,c.r,c.g,c.b);}a.needsUpdate=true;}
  reset(){for(const [n,b] of Object.entries(this.bones))b.quaternion.copy(this.initial[n]);this.actor.rotation.set(0,0,0);this.actor.position.set(0,.96,0);while(this.props.children.length){const o=this.props.children[0];this.props.remove(o);o.traverse(x=>x.geometry?.dispose());}this.actor.updateMatrixWorld(true);}
  aim(name,d){const b=this.bones[name];if(!b)return;this.actor.updateMatrixWorld(true);const q=b.getWorldQuaternion(new T.Quaternion()),current=Y.clone().applyQuaternion(q),delta=new T.Quaternion().setFromUnitVectors(current,V(...d).normalize());const target=delta.multiply(q),parent=b.parent.getWorldQuaternion(new T.Quaternion());b.quaternion.copy(parent.invert().multiply(target));b.updateMatrixWorld(true);}
  arm(side,upper,lower){for(const n of['upperarm01.','upperarm02.'])this.aim(n+side,upper);for(const n of['lowerarm01.','lowerarm02.'])this.aim(n+side,lower);}
  legs(upper=[.06,-1,0],lower=[0,-1,0],feet=[0,-.15,1]){for(const [side,s]of [['L',1],['R',-1]]){for(const n of['upperleg01.','upperleg02.'])this.aim(n+side,[upper[0]*s,upper[1],upper[2]]);for(const n of['lowerleg01.','lowerleg02.'])this.aim(n+side,[lower[0]*s,lower[1],lower[2]]);}}
  torso(d){for(const n of ['spine05','spine04','spine03','spine02','spine01'])this.aim(n,d);}
  palmNormal(side){const wrist=this.data.bones.find(b=>b.name==='wrist.'+side),a=V(...this.data.bones.find(b=>b.name==='finger2-1.'+side).head).sub(V(...wrist.head)),b=V(...this.data.bones.find(b=>b.name==='finger5-1.'+side).head).sub(V(...wrist.head)),normal=a.cross(b).normalize();if(normal.dot(V(side==='L'?-1:1,0,0))<0)normal.negate();const restQ=new T.Quaternion().setFromRotationMatrix(this.rest.get(wrist.name)),nowQ=this.bones[wrist.name].getWorldQuaternion(new T.Quaternion());return normal.applyQuaternion(nowQ.multiply(restQ.invert()));}
  hands(closed=true){if(!closed)return;for(const side of['L','R']){const normal=this.palmNormal(side);for(let finger=2;finger<=5;finger++)for(let segment=1;segment<=3;segment++){const b=this.bones[`finger${finger}-${segment}.${side}`],q=b.getWorldQuaternion(new T.Quaternion()),direction=Y.clone().applyQuaternion(q),axis=direction.clone().cross(normal).normalize();const world=new T.Quaternion().setFromAxisAngle(axis,[0,.55,1.05,.8][segment]).multiply(q),parent=b.parent.getWorldQuaternion(new T.Quaternion());b.quaternion.copy(parent.invert().multiply(world));b.updateMatrixWorld(true);}}this.actor.updateMatrixWorld(true);}
  position(name){this.actor.updateMatrixWorld(true);return this.bones[name].getWorldPosition(V());}
  grip(side){const wrist=this.position('wrist.'+side),knuckles=this.position('finger2-1.'+side).add(this.position('finger5-1.'+side)).multiplyScalar(.5);return wrist.lerp(knuckles,.8).addScaledVector(this.palmNormal(side),.012);}
  box(size,pos,material=this.metal,rotation){const o=new T.Mesh(new T.BoxGeometry(...size),material);o.position.set(...pos);if(rotation)o.rotation.set(...rotation);o.castShadow=true;o.receiveShadow=true;this.props.add(o);return o;}
  tube(a,b,r=.018,mat=this.chrome){const av=Array.isArray(a)?V(...a):a,bv=Array.isArray(b)?V(...b):b,d=bv.clone().sub(av);const m=new T.Mesh(new T.CylinderGeometry(r,r,d.length(),16),mat);m.position.copy(av).add(bv).multiplyScalar(.5);m.quaternion.setFromUnitVectors(Y,d.normalize());m.castShadow=true;this.props.add(m);return m;}
  bench(height=.58,incline=false,prone=false){const z=prone?.32:-.32;if(incline){this.box([.35,.085,1.0],[0,height+.45*Math.cos(.65),-.07-.45*Math.sin(.65)],this.pad,[Math.PI/2-.65,0,0]);this.box([.36,.075,.30],[0,height,.12],this.pad);}else this.box([.35,.085,1.12],[0,height,z],this.pad);this.box([.10,.06,1.2],[0,height-.13,z]);for(const offset of [-.37,.48]){this.box([.07,height-.1,.07],[0,(height-.1)/2,z+offset]);this.box([.62,.05,.12],[0,.025,z+offset]);}}
  machineArms(height=1.25){for(const [side,s]of[['L',1],['R',-1]]){const pivot=V(s*.65,height,-.25),hand=this.grip(side);this.tube([s*.65,.03,-.25],pivot,.025,this.metal);this.tube(pivot,hand,.022,this.metal);this.tube(hand.clone().add(V(0,-.08,0)),hand.clone().add(V(0,.08,0)),.019,this.pad);}}
  dualCable(){for(const [side,s]of[['L',1],['R',-1]]){this.tube([s*.75,.03,-.4],[s*.75,1.9,-.4],.026,this.metal);this.box([.4,.05,.6],[s*.75,.025,-.4]);this.tube([s*.75,1.55,-.4],this.grip(side),.003);}}
  seat(height=.54,back=true){this.box([.4,.08,.42],[0,height,0],this.pad);this.box([.08,height,.09],[0,height/2,0]);this.box([.66,.06,.65],[0,.03,0]);if(back){this.box([.35,.65,.085],[0,height+.32,-.13],this.pad,[.08,0,0]);this.tube([0,.1,-.18],[0,height+.65,-.18],.025,this.metal);}}
  dumbbell(side){const p=this.grip(side),q=this.bones['wrist.'+side].getWorldQuaternion(new T.Quaternion()),axis=V(1,0,0).applyQuaternion(q);this.tube(p.clone().addScaledVector(axis,-.11),p.clone().addScaledVector(axis,.11),.012);for(const sign of [-1,1])for(let n=0;n<3;n++){const center=p.clone().addScaledVector(axis,sign*(.07+n*.013));this.tube(center.clone().addScaledVector(axis,-.005),center.clone().addScaledVector(axis,.005),.061,this.metal);}}
  barbell(){const a=this.grip('L'),b=this.grip('R'),axis=b.clone().sub(a).normalize(),mid=a.clone().add(b).multiplyScalar(.5),half=Math.max(.58,a.distanceTo(b)/2+.2);this.tube(mid.clone().addScaledVector(axis,-half-.1),mid.clone().addScaledVector(axis,half+.1),.013);for(const s of[-1,1])for(let i=0;i<2;i++){const c=mid.clone().addScaledVector(axis,s*(half-.06+i*.035));this.tube(c.clone().addScaledVector(axis,-.015),c.clone().addScaledVector(axis,.015),.16,this.metal);}}
  tower(height=2.12,low=false,z=1.1){this.box([.72,.06,.7],[0,.03,z]);for(const x of[-.31,.31])this.tube([x,.04,z],[x,height,z],.025,this.metal);this.box([.7,.05,.06],[0,height,z]);for(let i=0;i<10;i++)this.box([.42,.032,.23],[0,.11+i*.04,z+.08]);const a=this.grip('L'),b=this.grip('R'),mid=a.clone().add(b).multiplyScalar(.5),pulley=V(0,low?.26:height,z-.3);this.tube(pulley,mid,.003,this.chrome);this.tube(a,b,.012);if(!low)this.tube([0,height,z],[0,height,z-.5],.018,this.metal);}
  load(guide){if(guide.equipment==='杠铃')this.barbell();else if(guide.equipment==='哑铃'){this.dumbbell('L');if(guide.variant!=='single'&&!['extension','squat','twist'].includes(guide.pattern))this.dumbbell('R');}else if(guide.equipment==='绳索'&&!['pulldown','row','facepull','straightPull','pushdown','cableCrunch'].includes(guide.pattern))this.tower(2.12,['curl','lateral'].includes(guide.pattern));}
  pose(guide,phase){
    this.reset();const e=phase==='end',p=guide.pattern,v=guide.variant,eq=guide.equipment;this.color(guide.group);this.legs();
    const arms=(u,l)=>{for(const [side,s]of[['L',1],['R',-1]])this.arm(side,[u[0]*s,u[1],u[2]],[l[0]*s,l[1],l[2]]);};
    arms([.12,-1,0],[.04,-1,.07]);
    const sit=()=>{this.actor.position.y=.59;this.legs([.08,0,1],[0,-1,0]);};
    if(['bench','incline','lyingExtension'].includes(p)||(p==='fly'&&eq==='哑铃')){
      this.actor.rotation.x=p==='incline'?-.65:-Math.PI/2;this.actor.position.y=p==='incline'?.66:.62;this.legs([.12,-.5,.85],[0,-1,0]);
      if(p==='lyingExtension')arms([.12,1,0],e?[0,1,0]:[0,.1,-1]);
      else if(p==='fly')arms(e?[.20,1,0]:[1,.05,0],e?[-.1,1,0]:[1,.25,0]);
      else arms(e?[.22,1,0]:[.95,.12,.15],e?[0,1,0]:[0,1,0]);
      this.bench(.58,p==='incline');
    }else if(p==='curl'){
      if(v==='incline'){sit();this.torso([0,1,-.25]);this.seat(.54);}
      if(v==='preacher'){sit();this.seat(.54);this.box([.65,.08,.43],[0,1.0,.36],this.pad,[.45,0,0]);}
      arms([.08,-1,v==='preacher'?.65:0],e?[0,.65,.85]:[0,-.95,.16]);
    }else if(p==='overhead'){
      if(eq!=='杠铃'){sit();this.seat(.54);}
      arms(e?[.20,1,0]:[1,.08,0],[0,1,.08]);
      if(eq==='器械'){for(const s of[-1,1])this.tube([s*.45,.04,-.2],[s*.45,1.9,-.2],.025,this.metal);}
    }else if(p==='lateral'){
      arms(e?[1,.05,0]:[.12,-1,0],e?[1,-.06,.05]:[.02,-1,.08]);if(v==='single')this.arm('L',[.12,-1,0],[.02,-1,.08]);
    }else if(p==='frontRaise')arms(e?[.1,.08,1]:[.1,-1,0],e?[0,.03,1]:[0,-1,.08]);
    else if(p==='squat'){
      this.actor.position.y=e?.63:.96;this.torso(e?[0,1,.35]:[0,1,0]);this.legs(e?[.25,-.2,1]:[.08,-1,0],e?[0,-1,-.25]:[0,-1,0]);
      if(eq==='杠铃')arms([1,.05,-.1],[0,.6,-.75]);else arms([.1,-.8,.45],[-.4,.8,.4]);
    }else if(p==='hinge'){
      this.torso(e?[0,.65,.8]:[0,1,0]);this.legs([.1,-1,.12],[0,-1,-.05]);arms([.05,-1,0],[.02,-1,0]);
    }else if(p==='lunge'){
      this.actor.position.y=e?.62:.96;this.aim('upperleg01.L',e?[.1,-.1,1]:[.1,-.85,.4]);this.aim('lowerleg01.L',[0,-1,0]);this.aim('upperleg01.R',e?[-.05,-.65,-.65]:[-.1,-.85,-.4]);this.aim('lowerleg01.R',[0,-.5,-1]);if(v==='elevated')this.box([.55,.4,.4],[0,.2,-.65],this.pad);
    }else if(p==='calf'){this.actor.position.y=e?1.02:.96;this.legs();if(e)for(const s of['L','R'])this.bones['foot.'+s].quaternion.multiply(new T.Quaternion().setFromAxisAngle(V(1,0,0),-.4));}
    else if(['pulldown','pullup'].includes(p)){
      if(p==='pulldown'){sit();this.seat(.54,false);}else this.actor.position.y=e?1.47:1.10;
      arms(e?[.75,-.4,0]:[.25,1,0],e?[-.2,1,.1]:[0,1,0]);
      if(p==='pullup'){const mid=this.grip('L').add(this.grip('R')).multiplyScalar(.5);this.actor.position.y+=2.12-mid.y;for(const s of[-1,1])this.tube([s*.65,0,-.1],[s*.65,2.15,-.1],.025,this.metal);this.tube([-.66,2.15,.15],[.66,2.15,.15],.025);}
      else this.tower();
    }else if(p==='row'){
      if(v==='supported'){this.actor.rotation.x=.65;this.actor.position.y=.77;this.legs([.12,-.65,-.65],[0,-1,0]);this.box([.38,.08,.65],[0,.97,.32],this.pad,[-Math.PI/2+.65,0,0]);this.box([.12,.92,.12],[0,.46,.32]);arms(e?[.3,-.3,-.85]:[.15,-1,.1],e?[0,-1,.1]:[0,-1,.1]);}
      else{sit();this.seat(.54,false);arms(e?[.25,-.8,-.35]:[.15,-.1,1],e?[-.1,.1,1]:[0,0,1]);this.tower(1.7,true);}
    }else if(p==='bentRow'){
      this.torso([0,.55,.85]);this.legs([.1,-1,.12],[0,-1,-.05]);arms(e?[.35,-.35,-.85]:[.1,-1,0],[0,-1,.1]);if(v==='single'){this.arm('R',[.1,-1,.3],[0,-1,.3]);this.bench(.52);}
    }else if(p==='reverseFly'){
      if(eq==='器械'){sit();this.seat(.54);arms(e?[1,.05,0]:[.22,0,1],e?[1,0,.05]:[-.1,0,1]);}
      else{this.torso([0,.55,.85]);arms(e?[1,.05,0]:[.1,-1,.1],e?[1,-.05,.1]:[0,-1,.1]);}
    }else if(p==='facepull'){arms(e?[1,.1,-.05]:[.15,.1,1],e?[-.2,.3,1]:[0,.1,1]);this.tower(1.6);}
    else if(p==='straightPull'){this.torso([0,1,.2]);arms(e?[.1,-.9,.3]:[.1,.55,1],e?[0,-1,.25]:[0,.55,1]);this.tower();}
    else if(p==='fly'){if(eq==='器械'){sit();this.seat(.54);}arms(e?[.25,0,1]:[1,0,0],e?[-.2,0,1]:[.85,0,.4]);}
    else if(p==='chestpress'){sit();this.seat(.54);arms(e?[.1,0,1]:[.5,-.2,-.5],e?[0,0,1]:[-.2,.1,1]);}
    else if(p==='pushdown'){arms([.08,-1,.1],e?[0,-1,.05]:[0,.1,1]);this.tower();}
    else if(p==='extension')arms([.3,1,0],e?[0,1,0]:[0,-.7,-.6]);
    else if(p==='legextension'){sit();this.seat(.54);for(const s of['L','R'])this.aim('lowerleg01.'+s,e?[0,.05,1]:[0,-1,.1]);arms([.6,-1,0],[0,-1,.2]);this.tube(this.position('foot.L'),this.position('foot.R'),.055,this.pad);}
    else if(p==='legcurl'){this.actor.rotation.x=Math.PI/2;this.actor.position.y=.68;this.legs([.07,0,-1],e?[0,1,-.1]:[0,0,-1]);arms([.35,-.8,.4],[0,-1,.1]);this.bench(.58,false,true);this.tube(this.position('foot.L'),this.position('foot.R'),.055,this.pad);}
    else if(p==='legpress'){sit();this.actor.position.y=.55;this.torso([0,.8,-.4]);this.legs(e?[.1,.3,1]:[.1,.95,.4],e?[0,.3,1]:[0,-.25,1]);arms([.4,-1,0],[0,-1,.1]);this.seat(.46);const feet=this.position('foot.L').add(this.position('foot.R')).multiplyScalar(.5);this.box([.65,.08,.4],[feet.x,feet.y,feet.z+.1],this.metal,[.4,0,0]);}
    else if(p==='pushup'){
      this.actor.rotation.x=Math.PI/2;this.actor.position.y=e?.32:.15;this.torso([0,e?.3:.12,1]);this.legs([.08,-.32,-1],[0,-.32,-1],[0,-1,-.2]);arms(e?[.15,-1,0]:[.7,-.1,-.6],e?[0,-1,0]:[-.3,-1,.25]);if(v==='kneeling')this.legs([.1,-1,-.25],[0,.4,-1],[0,.5,-1]);
    }else if(p==='birddog'){
      this.actor.rotation.x=Math.PI/2;this.actor.position.y=.64;this.legs([.1,-1,0],[0,0,-1],[0,0,-1]);arms([.1,-1,0],[0,-1,0]);if(e){this.arm('L',[0,0,1],[0,0,1]);this.aim('upperleg01.R',[0,0,-1]);this.aim('lowerleg01.R',[0,0,-1]);}
    }else if(p==='legraise'&&v==='hanging'){
      arms([.3,1,0],[0,1,0]);this.actor.position.y=1.1;this.legs(e?[.1,0,1]:[.1,-1,0],e?[0,0,1]:[0,-1,0]);this.tube([-.6,2.15,0],[.6,2.15,0],.025,this.metal);
    }else if(p==='cableCrunch'||(p==='crunch'&&v==='machine')){
      this.actor.position.y=.66;this.torso(e?[0,.5,1]:[0,1,0]);this.legs([.1,-1,0],[0,0,-1]);arms([.3,.4,1],[-.3,.4,-1]);this.tower();
    }else if(['crunch','reverseCrunch','legraise','deadbug','twist'].includes(p)){
      if(p==='twist'){this.actor.position.y=.2;this.torso([e?.45:-.45,.8,-.3]);this.legs([.1,.4,1],[0,-.7,1]);arms([.2,-.2,1],[-.4,.2,1]);}
      else{this.actor.rotation.x=-Math.PI/2;this.actor.position.y=.18;this.legs([.1,.7,.6],[0,-.7,.6]);arms([.4,-.1,-.6],[-.5,.4,.5]);
        if(p==='crunch'&&e)this.torso([0,v==='situp'?.8:.3,-.8]);
        if(p==='legraise')this.legs([.05,e?1:0,e?.1:1],[0,e?1:0,e?.1:1]);
        if(p==='reverseCrunch'){this.legs([.1,e?1:.7,e?-.1:.7],[0,e?.1:.2,1]);if(e)this.actor.position.y=.23;}
        if(p==='deadbug'){arms([.1,1,0],[0,1,0]);this.legs([.1,1,0],[0,0,1]);if(e){this.arm('L',[0,.1,-1],[0,0,-1]);this.aim('upperleg01.R',[0,.1,1]);this.aim('lowerleg01.R',[0,0,1]);}}
      }
    }
    this.actor.updateMatrixWorld(true);this.hands(!['pushup','birddog','deadbug','crunch','reverseCrunch','legraise'].includes(p));if(eq==='器械'&&['fly','chestpress','overhead','reverseFly'].includes(p))this.machineArms(p==='overhead'?1.7:1.25);if(eq==='绳索'&&p==='fly')this.dualCable();else this.load(guide);this.actor.updateMatrixWorld(true);
    return this;
  }
  bounds(){this.model.skeleton.update();this.model.computeBoundingBox();const box=this.model.boundingBox.clone().applyMatrix4(this.model.matrixWorld);for(const o of this.props.children)box.union(new T.Box3().setFromObject(o));return box;}
  frame(view='pose',guide){
    const box=this.bounds(),center=box.getCenter(V()),size=box.getSize(V());
    const atlas=view==='front'||view==='back',dir=atlas?V(0,.015,view==='back'?-1:1):V(3.4,1.7,['bench','incline','lyingExtension','legcurl','pushup','birddog'].includes(guide?.pattern)?3.5:5.0).normalize();
    this.camera.position.copy(center).addScaledVector(dir,7);this.camera.lookAt(center);this.camera.updateMatrixWorld(true);
    let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
    for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z]){const p=V(x,y,z).applyMatrix4(this.camera.matrixWorldInverse);minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);}
    const aspect=this.canvas.width/this.canvas.height,h=Math.max(maxY-minY,(maxX-minX)/aspect)*(atlas?1.09:1.13);this.camera.left=-h*aspect/2;this.camera.right=h*aspect/2;this.camera.top=h/2;this.camera.bottom=-h/2;this.camera.updateProjectionMatrix();this.floor.position.y=Math.min(0,box.min.y-.008);this.renderer.render(this.scene,this.camera);return this;
  }
  renderAtlas(view='front',selected='all',secondary=[]){this.renderer.setSize(512,1024);this.reset();for(const [s,k]of[['L',1],['R',-1]])this.arm(s,[k*.18,-1,0],[k*.02,-1,.02]);this.color(selected,secondary);this.frame(view);return this.canvas.toDataURL('image/webp',.91);}
  renderPose(guide,phase){this.renderer.setSize(640,640);this.pose(guide,phase);this.frame('pose',guide);return this.canvas.toDataURL('image/webp',.91);}
  hitAreas(view){
    this.renderAtlas(view);const position=this.model.geometry.attributes.position,byGroup={};
    const project=i=>{const p=V();this.model.getVertexPosition(i,p);p.applyMatrix4(this.model.matrixWorld).project(this.camera);return [(p.x+1)*90,(1-p.y)*180];};
    for(let i=0;i<position.count;i++){for(const g of groups){if((this.regionWeights[i][g]??0)<.24)continue;if(view==='front'&&g==='back'||view==='back'&&['chest','core'].includes(g))continue;const side=['legs','arms','shoulders','chest','back'].includes(g)?(this.restPositions[i*3]>0?'L':'R'):'C',key=g+'-'+side;(byGroup[key]??=[]).push(project(i));}}
    const hull=points=>{const pts=points.sort((a,b)=>a[0]-b[0]||a[1]-b[1]),cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);const a=[],b=[];for(const p of pts){while(a.length>1&&cross(a.at(-2),a.at(-1),p)<=0)a.pop();a.push(p);}for(const p of pts.toReversed()){while(b.length>1&&cross(b.at(-2),b.at(-1),p)<=0)b.pop();b.push(p);}return [...a.slice(0,-1),...b.slice(0,-1)];};
    const result={};for(const [key,points]of Object.entries(byGroup)){const g=key.split('-')[0];const poly=hull(points);if(poly.length<3)continue;(result[g]??=[]).push('M'+poly.map(p=>p.map(n=>n.toFixed(2)).join(',')).join('L')+'Z');}return Object.fromEntries(Object.entries(result).map(([g,v])=>[g,v.join('')]));
  }
}

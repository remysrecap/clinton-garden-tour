'use strict';
const $=id=>document.getElementById(id),canvas=$('scene'),renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(73,1,.035,150);
scene.background=new THREE.Color(0xe8e5db);
scene.add(new THREE.HemisphereLight(0xfff9e7,0xd5dcd8,1.52));
const sun=new THREE.DirectionalLight(0xffedcc,2.4);sun.position.set(-13,7,-3);sun.castShadow=true;
Object.assign(sun.shadow.camera,{left:-13,right:13,top:12,bottom:-12});sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0002;sun.shadow.normalBias=.015;scene.add(sun);
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.38;
const loader=new THREE.TextureLoader(),cache={};
function texture(file,color=true){
 if(!cache[file]){const t=loader.load(file);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());if(color)t.colorSpace=THREE.SRGBColorSpace;cache[file]=t}return cache[file]
}
const timber=['oak','lightoak','honey','walnut'],cloth=['linen','thread','teal','sage','blush','leather','sofa'];
function finish(key,color,geo){
 if(key.startsWith('frontStreet')){
    const flipped=key.endsWith('Mirrored'),a=flipped?1:0,b=1-a;
    geo.setAttribute('uv',new THREE.Float32BufferAttribute([a,0,b,0,b,1,a,1],2));
    return new THREE.MeshBasicMaterial({map:texture('front-street.jpg'),toneMapped:false});
 }
 const m=new THREE.MeshStandardMaterial({color:'#'+color,roughness:.76,flatShading:false});
 let sx=1,sy=1;
 if(timber.includes(key)){m.map=texture('hardwood2_diffuse.jpg');m.bumpMap=texture('hardwood2_bump.jpg',false);m.roughnessMap=texture('hardwood2_roughness.jpg',false);m.roughness=.68;m.bumpScale=.009;sx=3.2;sy=1.58;m.color.set(key==='walnut'?0x83674f:key==='honey'?0xe8c598:0xfff3dc)}
 else if(cloth.includes(key)){m.map=texture('weave.png');m.bumpMap=m.map;m.bumpScale=.0022;sx=sy=.32}
 else if(key==='brick'||key==='whitebrick'){m.map=texture(key+'.png');m.color.set(0xffffff);m.bumpMap=m.map;m.bumpScale=.014;sx=1.03;sy=1.04}
 else if(['paver','stone','quartz','plaster'].includes(key)){m.map=texture('limestone.png');m.bumpMap=m.map;m.bumpScale=.003;sx=sy=1.7}
 if(['brass','metal','mirror','screen'].includes(key)){m.metalness=.3;m.roughness=.28}
 if(['quartz','ceramic','tile'].includes(key))m.roughness=.3;
 if(['steel','silverMirror','blackGlass','tableGlass','saddle','cabWhite','cabInset','counterStone'].includes(key)){
    const finishes={steel:[.89,.30],silverMirror:[1,.06],blackGlass:[.32,.14],tableGlass:[.02,.09],saddle:[.02,.43],cabWhite:[.02,.32],cabInset:[0,.36],counterStone:[.06,.33]};
    [m.metalness,m.roughness]=finishes[key];m.side=THREE.DoubleSide;
    if(key==='tableGlass'){m.transparent=true;m.depthWrite=false;m.opacity=.24}
 }
 if(['taupe','rugIvory','striped','ochreThrow','cane'].includes(key)){m.map=texture('weave.png');m.bumpMap=m.map;m.bumpScale=.0017;sx=sy=.27}
 const scanned={saddle:'brown_leather',brick:'brown_brick_02',whitebrick:'pale-brick',oak:'wood_floor',lightoak:'wood_floor'}[key];
 if(scanned){const source=scanned==='pale-brick'?'painted_brick':scanned;m.map=texture(scanned+'_Diffuse.jpg');m.normalMap=texture(source+'_nor_gl.jpg',false);m.normalScale.set(.65,.65);m.roughnessMap=texture(source+'_Rough.jpg',false);m.bumpMap=null;m.color.set(0xffffff);sx=sy=key==='brick'?1.16:key==='whitebrick'?1.9:key==='saddle'?.62:1.55}
 if(key==='clearPane'){m.color.set(0xdceae9);m.transparent=true;m.opacity=.11;m.depthWrite=false;m.roughness=.08}
 if(m.map){const verts=geo.attributes.position,norm=geo.attributes.normal,uv=[];for(let i=0;i<verts.count;i++){const x=verts.getX(i),y=verts.getY(i),z=verts.getZ(i),up=Math.abs(norm.getY(i))>.65;if(up&&['oak','lightoak'].includes(key)){uv.push(z/sy,x/sx);continue}uv.push((up||Math.abs(norm.getZ(i))>Math.abs(norm.getX(i))?x:z)/sx,(up?z:y)/sy)}geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2))}
 return m
}

const outside=loader.load('outdoors.jpg');outside.colorSpace=THREE.SRGBColorSpace;outside.mapping=THREE.EquirectangularReflectionMapping;scene.environment=outside;
const lamps=[];
for(const [x,z] of [[-6,-.6],[-1,-1],[1,.6],[4.3,-.7],[4.4,3.2],[1.55,-1.7]]){const l=new THREE.PointLight(0xfff0db,9,5,2);l.position.set(x,2.45,z);scene.add(l);lamps.push(l)}
const parts=apartment.parts.map(([color,variant,wall,positions,indices,key])=>{
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();
 const mesh=new THREE.Mesh(geo,finish(key,color,geo));
 mesh.castShadow=key!=='clearPane'&&!key.startsWith('frontStreet');mesh.receiveShadow=true;scene.add(mesh);return {mesh,variant,wall};
});
const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:0xe7e4d9}));ground.rotation.x=-Math.PI/2;ground.position.y=-.125;ground.receiveShadow=true;scene.add(ground);
const rooms={'Living & dining':[315,458,103,372],Kitchen:[377,382,465,316],Entry:[382,490,570,433],Bathroom:[578,372,580,312],'King bedroom':[727,461,716,312],'Full bedroom':[681,606,715,520],Garden:[834,565,938,455]};
let walking=false,angle=.05,elevation=.93,radius=19,yaw=0,pitch=0,drag=null;const keys=new Set();let layout='murphy';const unit=3.3528/160;
function apply(){if(walking&&layout==='murphy'){const p=camera.position,px=p.x/unit+510,py=p.z/unit+400;if(px>674&&px<768&&py>501&&py<571){p.z=(593-400)*unit}}
 scene.background=walking?outside:new THREE.Color(0xe8e5db);for(const {mesh,variant,wall} of parts){mesh.visible=(variant==="ceiling"||variant==='street')?walking:!variant||variant===layout;mesh.scale.y=wall&&!walking?.28:1}
 $('view').textContent=walking?'Apartment overview':'Walk inside';$('pad').hidden=!walking;$('hint').textContent=walking?'Drag to look · WASD or arrows to walk':'Drag to orbit · Scroll or pinch to zoom';}
function jump(room){let [x,y,tx,ty]=rooms[room];walking=true;camera.position.set((x-510)*unit,1.58,(y-400)*unit);yaw=Math.atan2(tx-x,y-ty);pitch=room==='Full bedroom'?-.54:room==='King bedroom'?-.34:-.16;apply();canvas.focus()}
function overview(){walking=false;angle=.05;elevation=.93;radius=19;$('rooms').value='';keys.clear();apply()}
$('layout').onchange=e=>{layout=e.target.value;apply();if(parent!==window)parent.postMessage({kind:'model-bed-change',folded:layout==='stowed',regularDouble:layout==='full'},'*')};$('rooms').onchange=e=>{if(e.target.value)jump(e.target.value)};
$('view').onclick=()=>{if(walking)overview();else{$('rooms').value='Entry';jump('Entry')}};$('reset').onclick=overview;
const pointers=new Map();let pinch=0;canvas.onpointerdown=e=>{canvas.focus();canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);drag=[e.clientX,e.clientY];pinch=0};
canvas.onpointermove=e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,[e.clientX,e.clientY]);if(pointers.size===2&&!walking){const [a,b]=[...pointers.values()];let d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pinch)radius=THREE.MathUtils.clamp(radius*pinch/d,5,40);pinch=d;return}
 if(drag){let dx=e.clientX-drag[0],dy=e.clientY-drag[1];if(walking){yaw-=dx*.004;pitch=THREE.MathUtils.clamp(pitch+dy*.004,-1.25,1.2)}else{angle-=dx*.006;elevation=THREE.MathUtils.clamp(elevation+dy*.006,.2,1.52)}}drag=[e.clientX,e.clientY]};
canvas.onpointerup=canvas.onpointercancel=e=>{pointers.delete(e.pointerId);drag=null;pinch=0};
canvas.onwheel=e=>{if(!walking){e.preventDefault();radius=THREE.MathUtils.clamp(radius*Math.exp(e.deltaY*.001),5,40)}};
onkeydown=e=>{if(walking&&document.activeElement.tagName!=='SELECT'&&['w','s','a','d','arrowleft','arrowright','arrowup','arrowdown'].includes(e.key.toLowerCase())){e.preventDefault();keys.add(e.key.toLowerCase())}};onkeyup=e=>keys.delete(e.key.toLowerCase());onblur=()=>keys.clear();
for(const el of document.querySelectorAll('[data-k]')){el.onpointerdown=e=>{el.setPointerCapture(e.pointerId);keys.add(el.dataset.k)};el.onpointerup=el.onpointercancel=()=>keys.delete(el.dataset.k)}
function clear(x,z){let px=x/unit+510,py=z/unit+400;if(!(px>50&&px<801&&py>283&&py<513||px>553&&px<802&&py>=510&&py<626||px>=794&&px<975&&py>418&&py<625))return false;return !apartment.walls.some(([cx,cz,w,d,v])=>(!v||v===layout)&&Math.abs(x-cx)<w+.12&&Math.abs(z-cz)<d+.12)}
const clock=new THREE.Clock();function render(){requestAnimationFrame(render);const dt=Math.min(clock.getDelta(),.05);if(walking){const down=(a,b)=>keys.has(a)||keys.has(b)?1:0;let f=down('w','arrowup')-down('s','arrowdown'),r=down('d','arrowright')-down('a','arrowleft');let speed=1.6*dt/Math.max(1,Math.hypot(f,r));let p=camera.position,x=p.x+speed*(Math.sin(yaw)*f+Math.cos(yaw)*r),z=p.z+speed*(-Math.cos(yaw)*f+Math.sin(yaw)*r);if(clear(x,p.z))p.x=x;if(clear(p.x,z))p.z=z;camera.lookAt(p.x+Math.sin(yaw)*Math.cos(pitch),p.y+Math.sin(pitch),p.z-Math.cos(yaw)*Math.cos(pitch))}else{let dist=radius*Math.max(1,1.72/camera.aspect);camera.position.set(Math.sin(angle)*Math.cos(elevation)*dist,Math.sin(elevation)*dist,1.25+Math.cos(angle)*Math.cos(elevation)*dist);camera.lookAt(0,0,1.25)}renderer.render(scene,camera)}
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}onresize=resize;resize();overview();render();

$('showRender').onclick=()=>$('renderDialog').showModal();

window.addEventListener('message',e=>{if(e.source!==parent||e.data?.kind!=='murphy-position')return;layout=e.data.regularDouble?'full':e.data.folded?'stowed':'murphy';$('layout').value=layout;apply()})

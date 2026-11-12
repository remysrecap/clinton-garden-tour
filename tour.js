const points={"living": {"label": "Living room", "pos": [308, 419], "aim": [105, 383], "near": ["lounge", "entry", "kitchen", "windows", "dining", "sofa-end", "coat-closet"]}, "lounge": {"label": "By the sofa", "pos": [218, 465], "aim": [94, 389], "near": ["living", "windows", "sofa-end"]}, "entry": {"label": "Entry hall", "pos": [433, 479], "aim": [288, 384], "near": ["living", "kitchen", "hall", "island", "coat-closet", "passage"]}, "kitchen": {"label": "Kitchen", "pos": [388, 370], "aim": [473, 315], "near": ["entry", "living", "dining", "island", "sink-aisle"]}, "hall": {"label": "Bedroom hall", "pos": [581, 454], "aim": [629, 419], "near": ["entry", "bath", "king", "murphy", "island", "murphy-foot", "vanity", "passage", "king-door", "murphy-entry"]}, "bath": {"label": "Bathroom", "pos": [573, 359], "aim": [551, 306], "near": ["hall", "vanity"]}, "king": {"label": "King bedroom", "pos": [695, 481], "aim": [725, 335], "near": ["king-side", "hall", "terrace", "king-foot", "king-door", "garden-path"]}, "king-side": {"label": "King bedside", "pos": [779, 389], "aim": [695, 330], "near": ["king", "king-foot"]}, "murphy": {"label": "Murphy bedroom", "pos": [649, 605], "aim": [733, 539], "near": ["murphy-side", "hall", "murphy-foot", "murphy-entry"]}, "murphy-side": {"label": "Murphy bed walkway", "pos": [768, 602], "aim": [671, 536], "near": ["murphy", "terrace", "murphy-foot", "garden-seat"]}, "terrace": {"label": "Private garden", "pos": [836, 546], "aim": [934, 465], "near": ["king", "murphy-side", "king-foot", "garden-seat", "garden-path"]}, "windows": {"label": "Front windows", "pos": [76, 371], "aim": [253, 390], "near": ["living", "lounge", "dining"]}, "dining": {"label": "Dining area", "pos": [220, 349], "aim": [157, 333], "near": ["living", "windows", "kitchen", "sofa-end"]}, "island": {"label": "Breakfast bar", "pos": [465, 463], "aim": [454, 377], "near": ["entry", "kitchen", "hall", "coat-closet"]}, "king-foot": {"label": "Foot of king bed", "pos": [730, 430], "aim": [716, 338], "near": ["king", "king-side", "terrace", "king-door"]}, "murphy-foot": {"label": "Beside the Murphy bed", "pos": [710, 596], "aim": [719, 520], "near": ["murphy", "murphy-side", "hall", "murphy-entry"]}, "garden-seat": {"label": "Garden seating", "pos": [900, 516], "aim": [929, 448], "near": ["terrace", "murphy-side", "garden-path"]}, "vanity": {"label": "Bathroom vanity", "pos": [597, 351], "aim": [610, 372], "near": ["bath", "hall"]}, "sofa-end": {"label": "Living room aisle", "pos": [265, 439], "aim": [218, 465], "near": ["lounge", "living", "dining"]}, "sink-aisle": {"label": "By the kitchen sink", "pos": [411, 345], "aim": [388, 370], "near": ["kitchen", "island"]}, "coat-closet": {"label": "By the coat closet", "pos": [401, 477], "aim": [433, 479], "near": ["entry", "living", "island"]}, "passage": {"label": "Hall passage", "pos": [535, 443], "aim": [581, 454], "near": ["hall", "entry"]}, "king-door": {"label": "King bedroom doorway", "pos": [651, 441], "aim": [695, 481], "near": ["king", "king-foot", "hall"]}, "garden-path": {"label": "Garden path", "pos": [867, 481], "aim": [790, 452], "near": ["garden-seat", "terrace", "king"]}, "murphy-entry": {"label": "Small bedroom entrance", "pos": [605, 524], "aim": [620, 576], "near": ["hall", "murphy", "murphy-foot"]}};
const $=id=>document.getElementById(id),canvas=$('pano'),renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(innerWidth<innerHeight?86:76,1,.01,150),loader=new THREE.TextureLoader();
const sphere=new THREE.Mesh(new THREE.SphereGeometry(62,96,50),new THREE.MeshBasicMaterial({side:THREE.BackSide,toneMapped:false}));
// Blender panorama looks to plan north at the center of the panorama.
sphere.material.side=THREE.FrontSide;sphere.geometry.scale(-1,1,1);sphere.rotation.y=-Math.PI/2;
scene.add(sphere);
const files=window.tourFiles||{},asset=n=>files[n]||n;
const rings=[],cache=new Map();let active='',request=0,yaw=0,pitch=-.20,awaiting=false;
const alternateViews=new Set(['murphy','murphy-side','murphy-foot','murphy-entry','hall','terrace','garden-seat','garden-path','passage']);
const furnishedViews=new Set(['living','kitchen','dining','lounge','windows','sofa-end','island','sink-aisle','entry','coat-closet']);
const furnishedStills=new Set(['living','kitchen','range','laundry','bar']);
const styleChoice=$('styleChoice');
const initialStyle=new URLSearchParams(location.search).get('style');
if (['olive','walnut','west-elm'].includes(initialStyle)) styleChoice.value=initialStyle;
function furnitureSuffix(id, available) {
    return available.has(id) && styleChoice.value!=='original' ? '-'+styleChoice.value : '';
}
styleChoice.onchange=()=>{
    const url=new URL(location.href);
    if(styleChoice.value==='original') url.searchParams.delete('style');
    else url.searchParams.set('style',styleChoice.value);
    history.replaceState(null,'',url);
    visit($('rooms').value||active,true);
};
let folded=false, regularDouble=false;
function syncModel(){const f=$('modelFrame');if(f.contentWindow)f.contentWindow.postMessage({kind:'murphy-position',folded,regularDouble},'*')}
function updateBedButton(id){const btn=$('fold');const inBedroom=id.startsWith('murphy');$('bedType').hidden=!inBedroom;$('bedType').value=regularDouble?'full':'murphy';btn.hidden=!inBedroom||regularDouble;btn.textContent=folded?'Open Murphy bed':'Close Murphy bed';btn.setAttribute('aria-pressed',String(folded))}
$('bedType').onchange=async e=>{regularDouble=e.target.value==='full';folded=false;syncModel();await visit(active,true)};
$('fold').onclick=async()=>{if(awaiting)return;folded=!folded;syncModel();await visit(active,true)};
window.addEventListener('message',e=>{if(e.source!==$('modelFrame').contentWindow||e.data?.kind!=='model-bed-change')return;regularDouble=e.data.regularDouble===true;folded=!regularDouble&&e.data.folded===true;if(active)visit(active,true)});
$('modelFrame').addEventListener('load',syncModel);
const step=.020955,eye=1.60;
const turns={"living:lounge": [146.2, 475.8], "living:entry": [327.9, 422.4], "living:kitchen": [346.0, 373.0], "living:windows": [78.8, 357.3], "living:dining": [220.0, 349.0], "living:sofa-end": [265.0, 439.0], "living:coat-closet": [401.0, 477.0], "lounge:living": [308.0, 419.0], "lounge:windows": [142.9, 482.0], "lounge:sofa-end": [265.0, 439.0], "entry:living": [354.0, 448.0], "entry:kitchen": [379.0, 407.0], "entry:hall": [581.0, 454.0], "entry:island": [465.0, 463.0], "entry:coat-closet": [401.0, 477.0], "entry:passage": [535.0, 443.0], "kitchen:entry": [429.3, 480.5], "kitchen:living": [308.0, 419.0], "kitchen:dining": [220.0, 349.0], "kitchen:island": [435.0, 448.7], "kitchen:sink-aisle": [411.0, 345.0], "hall:entry": [433.0, 479.0], "hall:bath": [581.0, 399.0], "hall:king": [632.0, 425.0], "hall:murphy": [595.0, 511.0], "hall:island": [465.0, 463.0], "hall:murphy-foot": [610.6, 507.4], "hall:vanity": [582.8, 383.6], "hall:passage": [535.0, 443.0], "hall:king-door": [649.4, 432.2], "hall:murphy-entry": [605.0, 524.0], "bath:hall": [577.1, 400.8], "bath:vanity": [597.0, 351.0], "king:king-side": [779.0, 389.0], "king:hall": [641.1, 418.4], "king:terrace": [791.0, 456.0], "king:king-foot": [730.0, 430.0], "king:king-door": [657.1, 434.3], "king:garden-path": [817.0, 450.0], "king-side:king": [695.0, 481.0], "king-side:king-foot": [730.0, 430.0], "murphy:murphy-side": [768.0, 602.0], "murphy:hall": [599.0, 519.0], "murphy:murphy-foot": [710.0, 596.0], "murphy:murphy-entry": [605.0, 524.0], "murphy-side:murphy": [649.0, 605.0], "murphy-side:terrace": [791.0, 545.0], "murphy-side:murphy-foot": [710.0, 596.0], "murphy-side:garden-seat": [886.5, 541.5], "terrace:king": [810.5, 478.5], "terrace:murphy-side": [804.0, 545.0], "terrace:king-foot": [778.0, 503.2], "terrace:garden-seat": [900.0, 516.0], "terrace:garden-path": [867.0, 481.0], "windows:living": [308.0, 419.0], "windows:lounge": [218.0, 465.0], "windows:dining": [219.4, 345.0], "dining:living": [308.0, 419.0], "dining:windows": [76.0, 371.0], "dining:kitchen": [388.0, 370.0], "dining:sofa-end": [265.0, 439.0], "island:entry": [433.0, 479.0], "island:kitchen": [377.2, 378.9], "island:hall": [581.0, 454.0], "island:coat-closet": [401.0, 477.0], "king-foot:king": [695.0, 481.0], "king-foot:king-side": [779.0, 389.0], "king-foot:terrace": [784.1, 489.2], "king-foot:king-door": [651.0, 441.0], "murphy-foot:murphy": [649.0, 605.0], "murphy-foot:murphy-side": [768.0, 602.0], "murphy-foot:hall": [638.1, 511.0], "murphy-foot:murphy-entry": [636.3, 534.6], "garden-seat:terrace": [836.0, 546.0], "garden-seat:murphy-side": [805.9, 588.0], "garden-seat:garden-path": [860.5, 487.2], "vanity:bath": [573.0, 359.0], "vanity:hall": [594.9, 390.8], "sofa-end:lounge": [218.0, 465.0], "sofa-end:living": [308.0, 419.0], "sofa-end:dining": [220.0, 349.0], "sink-aisle:kitchen": [388.0, 370.0], "sink-aisle:island": [427.7, 381.6], "coat-closet:entry": [433.0, 479.0], "coat-closet:living": [338.7, 421.6], "coat-closet:island": [465.0, 463.0], "passage:hall": [581.0, 454.0], "passage:entry": [433.0, 479.0], "king-door:king": [701.3, 467.8], "king-door:king-foot": [730.0, 430.0], "king-door:hall": [578.4, 440.2], "garden-path:garden-seat": [900.0, 516.0], "garden-path:terrace": [836.0, 546.0], "garden-path:king": [782.0, 449.0], "murphy-entry:hall": [581.0, 454.0], "murphy-entry:murphy": [649.0, 605.0], "murphy-entry:murphy-foot": [629.6, 557.9]};
function textureFor(id){if(!cache.has(id))cache.set(id,loader.loadAsync(asset('pan-'+id+'.jpg')).then(t=>{t.colorSpace=THREE.SRGBColorSpace;return t}).catch(e=>{cache.delete(id);throw e}));return cache.get(id)}
async function visit(id,keepHeading=false){if(!points[id])return;stopGlide();const seq=++request;awaiting=true;$('instruction').textContent='Loading '+points[id].label+'…';
 try{const imageId=id+furnitureSuffix(id,furnishedViews)+(alternateViews.has(id)?(regularDouble?'-double':folded?'-closed':''):'');const t=await textureFor(imageId);if(seq!==request)return;sphere.material.map=t;sphere.material.needsUpdate=true;active=id;awaiting=false;updateBedButton(id);$('styleControl').hidden=!furnishedViews.has(id);$('productLinks').hidden=styleChoice.value!=='west-elm'||!furnishedViews.has(id);$('model').textContent=styleChoice.value==='original'?'3D model':'Original 3D model';for(const [k,v] of cache){if(cache.size<=4)break;if(k===imageId)continue;cache.delete(k);v.then(old=>{if(old!==sphere.material.map)old.dispose()}).catch(()=>{})}const p=points[id];if(!keepHeading){yaw=Math.atan2(p.aim[0]-p.pos[0],p.pos[1]-p.aim[1]);pitch=id.startsWith('murphy')?-.32:-.20}
 const clearance=id.startsWith('king')?' · About 28 in beside the mattress':id.startsWith('murphy')?(regularDouble?' · Double bed':folded?' · Murphy bed up':' · About 44 in across the walkway'):'';$('place').textContent=(regularDouble?p.label.replace('Murphy bedroom','Small bedroom').replace('Murphy bed','double bed'):p.label)+clearance;history.replaceState(null,'','#'+id);$('rooms').value=id;$('instruction').textContent='Tap a floor circle to move · Drag to look around';
 $('spots').replaceChildren();rings.length=0;for(const next of p.near){const pt=turns[id+':'+next]||points[next].pos,el=document.createElement('button');el.className='hotspot';el.setAttribute('aria-label',points[next].label);el.onclick=()=>visit(next,true);$('spots').append(el);rings.push([el,new THREE.Vector3((pt[0]-p.pos[0])*step,-eye+.02,(pt[1]-p.pos[1])*step)])}
 }catch(e){if(seq===request){awaiting=false;$('instruction').textContent='View unavailable. Choose another room.'}}}
for(const [k,p] of Object.entries(points))$('rooms').add(new Option(p.label,k));$('rooms').onchange=e=>visit(e.target.value);
function zoom(f){stopGlide();cam.fov=THREE.MathUtils.clamp(f,48,92);cam.updateProjectionMatrix()}
$('plus').onclick=()=>zoom(cam.fov-6);$('minus').onclick=()=>zoom(cam.fov+6);
const contacts=new Map();
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
let pinch=0, speedX=0, speedY=0, lastMove=0, glideTime=0;
function stopGlide(){speedX=0;speedY=0;glideTime=0}
function pan(dx,dy){yaw+=dx;pitch=THREE.MathUtils.clamp(pitch+dy,-1.48,1.48)}
function advanceGlide(now){
 if(!glideTime)return;
 const dt=Math.max(0,(now-glideTime)/1000), decay=Math.exp(-dt/.17);
 pan(speedX*.17*(1-decay),speedY*.17*(1-decay));
 speedX*=decay;speedY*=decay;glideTime=now;
 if(Math.hypot(speedX,speedY)<.015)stopGlide();
}
document.addEventListener('pointerdown',stopGlide,true);
document.addEventListener('visibilitychange',stopGlide);
window.addEventListener('blur',stopGlide);
canvas.onpointerdown=e=>{
 canvas.focus();canvas.setPointerCapture(e.pointerId);contacts.set(e.pointerId,[e.clientX,e.clientY]);
 pinch=0;lastMove=e.timeStamp;
};
canvas.onpointermove=e=>{
 const prev=contacts.get(e.pointerId);if(!prev)return;
 contacts.set(e.pointerId,[e.clientX,e.clientY]);
 if(contacts.size>1){
  const [a,b]=contacts.values(),d=Math.hypot(a[0]-b[0],a[1]-b[1]);
  if(pinch&&d)zoom(cam.fov*pinch/d);
  pinch=d;stopGlide();return;
 }
 const gain=cam.fov*Math.PI/180/innerHeight,dx=(prev[0]-e.clientX)*gain,dy=(e.clientY-prev[1])*gain;
 const dt=Math.max(.008,(e.timeStamp-lastMove)/1000),weight=1-Math.exp(-dt/.025);
 pan(dx,dy);lastMove=e.timeStamp;
 speedX+=weight*(THREE.MathUtils.clamp(dx/dt,-3,3)-speedX);
 speedY+=weight*(THREE.MathUtils.clamp(dy/dt,-3,3)-speedY);
};
canvas.onpointerup=canvas.onpointercancel=canvas.onlostpointercapture=e=>{
 if(!contacts.delete(e.pointerId))return;
 pinch=0;
 if(e.type==='pointerup'&&!contacts.size&&!reducedMotion.matches&&e.timeStamp-lastMove<90&&Math.hypot(speedX,speedY)>.05)glideTime=performance.now();
 else stopGlide();
 lastMove=e.timeStamp;
};
canvas.onwheel=e=>{e.preventDefault();zoom(cam.fov+e.deltaY*.045)};
canvas.onkeydown=e=>{const k=e.key;if(k.startsWith('Arrow')){stopGlide();e.preventDefault();if(k==='ArrowLeft')yaw-=.12;if(k==='ArrowRight')yaw+=.12;if(k==='ArrowUp')pitch=Math.min(1.48,pitch+.10);if(k==='ArrowDown')pitch=Math.max(-1.48,pitch-.10)}};
function showPhoto(){let v=$('shots').value;$('photo').src=asset(v+furnitureSuffix(v,furnishedStills)+'-render.jpg');$('photo').alt=$('shots').selectedOptions[0].text+' eye-level Blender render'}
$('photos').onclick=()=>{$('shots').value=active.startsWith('murphy')?(regularDouble?'double':folded?'murphy-closed':'murphy'):active.startsWith('king')?'king':['garden-seat','terrace','garden-path'].includes(active)?'garden':['kitchen','island','sink-aisle'].includes(active)?'kitchen':['bath','vanity'].includes(active)?'bath':'living';showPhoto();$('gallery').showModal()};$('shots').onchange=showPhoto;
$('model').onclick=()=>{const f=$('modelFrame');if(!f.src&&!f.srcdoc){if(window.modelDocument)f.srcdoc=window.modelDocument;else f.src='model-view.html'}$('modelPanel').hidden=false};$('return').onclick=()=>{$('modelPanel').hidden=true;canvas.focus()};
function resize(){cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)}onresize=resize;resize();
const tmp=new THREE.Vector3();function draw(){requestAnimationFrame(draw);if(!$('modelPanel').hidden||$('gallery').open)return;advanceGlide(performance.now());cam.lookAt(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch));cam.updateMatrixWorld();
 for(const [el,pos] of rings){tmp.copy(pos).project(cam);el.hidden=awaiting||tmp.z<0||tmp.z>1||Math.abs(tmp.x)>1||Math.abs(tmp.y)>1;el.style.left=(tmp.x+1)*50+'%';el.style.top=(1-tmp.y)*50+'%'}renderer.render(scene,cam)}
const starting=location.hash.slice(1);visit(Object.hasOwn(points,starting)?starting:'living');draw();

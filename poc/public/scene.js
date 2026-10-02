import * as THREE from 'three';

const canvas = document.getElementById('universe-canvas');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' }); }
catch { document.documentElement.classList.add('no-webgl'); }

if (renderer) {
  document.documentElement.classList.add('has-webgl');
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.55;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(43, 1, .1, 200);
  const system = new THREE.Group(); system.position.x = 4.8; scene.add(system);
  scene.add(new THREE.AmbientLight(0xb5bbd8, 1.65));
  const sunlight = new THREE.PointLight(0xffaf58, 150, 35, 1.5); system.add(sunlight);

  // Atmospheric blue-violet nebula and constellation motifs inspired by the
  // supplied reference video. These coordinates are decorative, not a sky map.
  const nebulaCanvas = document.createElement('canvas'); nebulaCanvas.width = 512; nebulaCanvas.height = 256;
  const nebulaContext = nebulaCanvas.getContext('2d');
  for (const cloud of [{x:150,y:132,r:138,c:'rgba(84,112,185,.23)'},{x:280,y:104,r:124,c:'rgba(106,87,166,.19)'},{x:366,y:160,r:132,c:'rgba(57,126,157,.15)'}]) {
    const cloudGradient = nebulaContext.createRadialGradient(cloud.x,cloud.y,4,cloud.x,cloud.y,cloud.r);
    cloudGradient.addColorStop(0,cloud.c); cloudGradient.addColorStop(.48,cloud.c.replace(/\.\d+\)/,'.07)')); cloudGradient.addColorStop(1,'rgba(30,42,80,0)');
    nebulaContext.fillStyle=cloudGradient; nebulaContext.fillRect(cloud.x-cloud.r,cloud.y-cloud.r,cloud.r*2,cloud.r*2);
  }
  const nebulaTexture = new THREE.CanvasTexture(nebulaCanvas);
  const nebulaMaterial = new THREE.SpriteMaterial({map:nebulaTexture,transparent:true,opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending});
  for (const [x,y,z,sx,sy] of [[-6,2,-12,19,9],[4,-2,-19,22,11],[11,7,-28,25,12]]) {
    const cloud=new THREE.Sprite(nebulaMaterial); cloud.position.set(x,y,z); cloud.scale.set(sx,sy,1); scene.add(cloud);
  }
  const constellationGroup = new THREE.Group();
  constellationGroup.position.z = -3;
  const constellations = [
    [[-13,8],[-11,6],[-9,7],[-8,4],[-6,5]],
    [[-4,9],[-2,7],[0,8],[1,5],[-1,3],[-3,5]],
    [[4,10],[6,8],[8,9],[10,6],[12,7],[13,4]],
    [[-11,1],[-9,-1],[-7,0],[-5,-3],[-3,-2]]
  ];
  const constellationPositions=[];
  for (const stars of constellations) {
    const nodes=stars.map(([x,y])=>new THREE.Vector3(x,y,-Math.abs(x)*.08));
    constellationPositions.push(...nodes.flatMap(node=>[node.x,node.y,node.z]));
    const links=[];
    for(let i=0;i<nodes.length-1;i++) links.push(nodes[i],nodes[i+1]);
    if(nodes.length>4) links.push(nodes[0],nodes[nodes.length-1]);
    constellationGroup.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(links),new THREE.LineBasicMaterial({color:0x9cb9e8,transparent:true,opacity:.24,depthWrite:false}))); 
  }
  const starGeometry=new THREE.BufferGeometry(); starGeometry.setAttribute('position',new THREE.Float32BufferAttribute(constellationPositions,3));
  constellationGroup.add(new THREE.Points(starGeometry,new THREE.PointsMaterial({color:0xd8e5ff,size:.105,transparent:true,opacity:.88,sizeAttenuation:true})));
  scene.add(constellationGroup);

  function stripedTexture(colors, wave = 0) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 256;
    const cx = c.getContext('2d');
    colors.forEach((color, i) => { cx.fillStyle = color; cx.fillRect(0, i * c.height / colors.length, c.width, c.height / colors.length + 2); });
    if (wave) { for(let y=0;y<250;y+=17){cx.strokeStyle='rgba(255,255,255,.11)';cx.lineWidth=3;cx.beginPath();for(let x=0;x<=512;x+=6){const yy=y+Math.sin(x*.027+y)*wave;if(x===0)cx.moveTo(x,yy);else cx.lineTo(x,yy);}cx.stroke();} }
    const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace; return map;
  }
  const sunMap = stripedTexture(['#f4c26f','#e9a34e','#f3b662','#dd8a41','#f1b05b','#f7c476','#e69c4e','#efb15e'], 5);
  const sun = new THREE.Mesh(new THREE.SphereGeometry(1.35, 56, 40), new THREE.MeshBasicMaterial({ map: sunMap }));
  system.add(sun);
  const glowCanvas = document.createElement('canvas'); glowCanvas.width = glowCanvas.height = 256;
  const ctx = glowCanvas.getContext('2d');
  const grad = ctx.createRadialGradient(128,128,9,128,128,128);
  grad.addColorStop(0,'rgba(255,209,139,0.95)'); grad.addColorStop(.23,'rgba(255,146,65,0.45)'); grad.addColorStop(.55,'rgba(219,91,32,0.12)'); grad.addColorStop(1,'rgba(219,91,32,0)');
  ctx.fillStyle=grad; ctx.fillRect(0,0,256,256);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map:new THREE.CanvasTexture(glowCanvas), color:0xffb36c, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false }));
  glow.scale.set(7.8,7.8,1); system.add(glow);

  const orbitDefs = [
    { r:2.5, size:.24, color:0xb7aaa0, speed:.12, phase:.8 },
    { r:3.5, size:.36, color:0xc9935d, speed:.085, phase:2.5 },
    { r:4.6, size:.4, color:0x518eb5, speed:.065, phase:5.1 },
    { r:5.75, size:.32, color:0xbf6552, speed:.052, phase:3.85 },
    { r:7.5, size:.68, color:0xc9ae81, speed:.028, phase:1.75 },
    { r:9.4, size:.73, color:0xa99a75, speed:.021, phase:4.6 }
  ];
  const planets = [];
  for (const def of orbitDefs) {
    const pts=[]; for(let i=0;i<=160;i++){const a=i/160*Math.PI*2;pts.push(new THREE.Vector3(Math.cos(a)*def.r,0,Math.sin(a)*def.r));}
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color:0x727d91, transparent:true, opacity:.22 })); system.add(line);
    const map = def.r === 7.5 ? stripedTexture(['#d8b38d','#ad836a','#e2c6a2','#b4846a','#efd0a3','#b29379','#d7b88e','#a9775c'],3) : def.r === 9.4 ? stripedTexture(['#c8b897','#877961','#d8c6a5','#aa9673','#d0bc98','#8f8068'],2) : null;
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(def.size,32,24),new THREE.MeshStandardMaterial({ color:map?0xffffff:def.color, map, roughness:.85, metalness:.05 }));
    system.add(mesh); planets.push({ mesh, ...def });
  }
  const saturn = planets[5].mesh;
  const ring = new THREE.Mesh(new THREE.RingGeometry(.95,1.6,64),new THREE.MeshBasicMaterial({ color:0xb5a07e, transparent:true, opacity:.72, side:THREE.DoubleSide }));
  ring.rotation.x = 1.16; saturn.add(ring);

  // Three depth layers of small stars; decorative, not astronomical coordinates.
  for (const [count, spread, size, opacity] of [[200,35,.065,.45],[130,55,.09,.5],[70,80,.12,.42]]) {
    const arr = new Float32Array(count*3);
    for (let i=0;i<count;i++){arr[i*3]=(Math.random()-.5)*spread;arr[i*3+1]=(Math.random()-.5)*spread;arr[i*3+2]=-12-Math.random()*28;}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(arr,3));
    scene.add(new THREE.Points(geo,new THREE.PointsMaterial({color:0xc9d4f0,size,transparent:true,opacity,sizeAttenuation:true})));
  }
  let pointerX=0,pointerY=0,scroll=0,shown=true;
  function resize(){const w=innerWidth,h=innerHeight;renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  function onScroll(){const home=document.getElementById('home');scroll=Math.min(1,Math.max(0,scrollY/Math.max(1,home.offsetHeight-innerHeight)));}
  addEventListener('resize',resize);addEventListener('scroll',onScroll,{passive:true});
  addEventListener('pointermove',e=>{pointerX=(e.clientX/innerWidth-.5)*2;pointerY=(e.clientY/innerHeight-.5)*2;},{passive:true});
  document.addEventListener('visibilitychange',()=>{shown=!document.hidden;});
  resize();onScroll();
  const clock=new THREE.Clock();
  function frame(){requestAnimationFrame(frame);if(!shown||!document.getElementById('home').classList.contains('active'))return;
    const t=reduced.matches?0:clock.getElapsedTime();
    for(const p of planets){const a=p.phase+t*p.speed;p.mesh.position.set(Math.cos(a)*p.r,0,Math.sin(a)*p.r);p.mesh.rotation.y=t*.11;}
    const x=(innerWidth<760?0:0.2)+(reduced.matches?0:pointerX*.22);
    const y=7.1-scroll*2+(reduced.matches?0:-pointerY*.17);
    camera.position.lerp(new THREE.Vector3(x,y,27-scroll*10),reduced.matches?1:.06);
    camera.lookAt(system.position.x*.8,0,0);
    system.rotation.y=reduced.matches?0:scroll*.4;
    constellationGroup.rotation.z=reduced.matches?0:pointerX*.002;
    renderer.render(scene,camera);
  }
  frame();
}

// Hero starfield. Decorative only: star positions are random and never represent
// calculated planets. Three.js draws it; if WebGL is unavailable or the user asks for
// reduced motion we paint the same kind of field once on a 2D canvas, and if even
// that fails the page falls back to the static assets/stars.webp (body.no-sky).
import * as THREE from 'three';

const canvas = document.getElementById('sky');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

const state = { pointerX: 0, pointerY: 0, scroll: 0 };
addEventListener('pointermove', event => {
  state.pointerX = event.clientX / innerWidth - 0.5;
  state.pointerY = event.clientY / innerHeight - 0.5;
}, { passive: true });
addEventListener('scroll', () => { state.scroll = scrollY; }, { passive: true });

function starCount() { return Math.max(160, Math.round(innerWidth * innerHeight / 9000)); }

/* ---------- 2D fallback: a still starfield (also used for reduced motion) ---------- */
function paint2d() {
  const ctx = canvas.getContext('2d');
  if (!ctx) { document.body.classList.add('no-sky'); return; }
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const draw = () => {
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < starCount(); i++) {
      ctx.globalAlpha = 0.35 + Math.random() * 0.55;
      ctx.fillStyle = Math.random() < 0.25 ? '#eab66d' : '#f5f0e7';
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, (Math.random() * 1.3 + 0.2) * dpr, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  draw();
  let timer;
  addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(draw, 150); });
}

/* ---------- WebGL starfield with pointer and scroll parallax ---------- */
function roundSprite() {
  const size = 64, c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d'), grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(0.35, 'rgba(255,255,255,.55)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad; g.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

function layer(count, depth, size, sprite) {
  const positions = new Float32Array(count * 3), colors = new Float32Array(count * 3);
  const white = new THREE.Color('#f5f0e7'), gold = new THREE.Color('#eab66d');
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 220;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 320;
    positions[i * 3 + 2] = -depth - Math.random() * 40;
    const color = Math.random() < 0.25 ? gold : white;
    colors.set([color.r, color.g, color.b], i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({ size, map: sprite, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, sizeAttenuation: true });
  return new THREE.Points(geometry, material);
}

function startWebGL() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
  } catch { return false; }
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 400);
  const sprite = roundSprite();
  const layers = [layer(Math.round(starCount() * 0.5), 40, 1.1, sprite), layer(Math.round(starCount() * 0.3), 90, 1.8, sprite), layer(Math.round(starCount() * 0.12), 140, 3, sprite)];
  layers.forEach(points => scene.add(points));

  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  }
  resize(); addEventListener('resize', resize);

  let visible = true;
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });
  const clock = new THREE.Clock();
  const camTarget = new THREE.Vector3();
  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const t = clock.getElapsedTime();
    camTarget.set(state.pointerX * 6, -state.pointerY * 4 - state.scroll * 0.012, 0);
    camera.position.lerp(camTarget, 0.05);
    layers.forEach((points, index) => {
      points.position.y = state.scroll * 0.01 * (index + 1);
      points.material.opacity = 0.7 + 0.25 * Math.sin(t * (0.6 + index * 0.35) + index);
    });
    renderer.render(scene, camera);
  }
  frame();
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); document.body.classList.add('no-sky'); }, false);
  return true;
}

if (reduced.matches || !startWebGL()) paint2d();

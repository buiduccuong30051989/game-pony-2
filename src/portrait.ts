// Dev-only: chụp mặt pony từ model 3D làm ảnh chân dung (public/img/portraits/<name>.png).
// /portrait.html?model=models/ponies/rarity.glb&yaw=0.35 → window.__png = dataURL PNG 320×320 nền trong.
// Chụp hàng loạt bằng trình duyệt headless (xem README: "Ảnh chân dung").
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { paintEyes } from './eyes';

const q = new URLSearchParams(location.search);
const url = q.get('model') ?? 'models/ponies/rarity.glb';
const yaw = Number(q.get('yaw') ?? 0.35);
const zoom = Number(q.get('zoom') ?? 1);
const lift = Number(q.get('lift') ?? 0);
const S = 320;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(S, S);
renderer.setClearColor(0x000000, 0);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xfff9ec, 0xd8c8f0, 1.6));
const key = new THREE.DirectionalLight(0xffffff, 2.0);
key.position.set(0.5, 2, 4);
scene.add(key);
const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100);

new GLTFLoader().load(url, (gltf) => {
  const obj = gltf.scene;
  obj.rotation.y = yaw;
  obj.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    for (const mat of mats) if ('metalness' in mat) { (mat as THREE.MeshStandardMaterial).metalness = 0; (mat as THREE.MeshStandardMaterial).roughness = 0.9; }
  });
  // &eyes=material_3,3f9a3a: vẽ mắt cho model rip từ Source (như trong game, src/eyes.ts)
  const eyesQ = new URLSearchParams(location.search).get('eyes');
  if (eyesQ) { const [m, c] = eyesQ.split(','); paintEyes(obj, m, parseInt(c, 16)); }
  scene.add(obj);
  obj.updateMatrixWorld(true);
  // vùng đầu: xương Head nếu có, không thì đỉnh-trước của khối (pony hướng +z trước khi xoay)
  const all = new THREE.Box3().setFromObject(obj, true);
  const H = all.max.y - all.min.y;
  let head: THREE.Box3 | null = null;
  let headBone: THREE.Object3D | undefined;
  if (q.has('bone')) obj.traverse((o) => { if ((o as THREE.Bone).isBone && /^head/i.test(o.name)) headBone = o; });
  if (headBone) {
    const c = headBone.getWorldPosition(new THREE.Vector3());
    head = new THREE.Box3().setFromCenterAndSize(c.add(new THREE.Vector3(0, H * 0.06, 0)), new THREE.Vector3(H * 0.34, H * 0.34, H * 0.34));
  } else {
    const fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    let fMax = -Infinity, fMin = Infinity;
    const v = new THREE.Vector3();
    const pts: THREE.Vector3[] = [];
    obj.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const pos = m.geometry.attributes.position;
      for (let i = 0; i < pos.count; i += 3) {
        m.getVertexPosition(i, v);
        v.applyMatrix4(m.matrixWorld);
        pts.push(v.clone());
        const f = v.dot(fwd);
        if (f > fMax) fMax = f; if (f < fMin) fMin = f;
      }
    });
    head = new THREE.Box3();
    for (const p of pts) if (p.y > all.min.y + H * Number(q.get('top') ?? 0.6) && p.dot(fwd) > fMax - (fMax - fMin) * Number(q.get('front') ?? 0.42)) head.expandByPoint(p);
  }
  const c = head.getCenter(new THREE.Vector3());
  c.y += lift * H;
  const size = head.getSize(new THREE.Vector3());
  let r = Math.max(size.x, size.y, size.z) * 0.62 / zoom;
  // khung chỉnh tay: &f=fx,fy,fz (tỉ lệ trong hộp bao cả con) &r=bán kính (tỉ lệ chiều cao)
  const f = q.get('f');
  if (f) {
    const [fx, fy, fz] = f.split(',').map(Number);
    c.set(all.min.x + fx * (all.max.x - all.min.x), all.min.y + fy * H, all.min.z + fz * (all.max.z - all.min.z));
    r = Number(q.get('r') ?? 0.2) * H;
  }
  const dist = r / Math.tan(THREE.MathUtils.degToRad(15));
  camera.position.set(c.x, c.y + r * 0.1, c.z + dist);
  camera.lookAt(c);
  renderer.render(scene, camera);
  (window as unknown as { __png: string }).__png = renderer.domElement.toDataURL('image/png');
});

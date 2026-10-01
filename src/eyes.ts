// Mắt cho model pony rip từ Source (Big Mac, Shining Armor, Surprise, Bạc Hà, Sunburst): nhãn cầu chỉ là khối trắng trơn
// (shader mắt của Source không xuất ra glTF) → nhìn như mắt trắng dã. Vẽ mống mắt + con ngươi + đốm sáng thẳng vào
// vertex color của lưới nhãn cầu, nên mắt đi theo xương đầu khi auto-rig (không gắn vật con bị tụt lại).
import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);

/**
 * `model` đã fitHeight, đứng yaw 0 (mặt hướng +z). `mat` = tên material của lưới nhãn cầu (cả 2 mắt chung 1 lưới).
 * Hình học dùng chung giữa các bản sao → chỉ vẽ 1 lần (đánh dấu trong userData).
 */
export function paintEyes(model: THREE.Object3D, mat: string, iris: number): void {
  model.updateMatrixWorld(true);
  const meshes: THREE.Mesh[] = [];
  model.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh && !Array.isArray(m.material) && m.material.name === mat) meshes.push(m);
  });
  const cIris = new THREE.Color(iris);
  const cDark = new THREE.Color(iris).multiplyScalar(0.55);
  const cPupil = new THREE.Color(0x15101e);
  const cWhite = new THREE.Color(0xffffff);
  for (const mesh of meshes) {
    const geo = mesh.geometry as THREE.BufferGeometry;
    const material = mesh.material as THREE.MeshStandardMaterial;
    material.vertexColors = true;
    material.needsUpdate = true;
    if (geo.userData.eyesPainted) continue;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const n = pos.count;
    const world: THREE.Vector3[] = [];
    let cx = 0;
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
      world.push(v);
      cx += v.x;
    }
    cx /= n;
    const colors = new Float32Array(n * 3).fill(1);
    for (const side of [-1, 1]) {
      const idx: number[] = [];
      for (let i = 0; i < n; i++) if ((world[i].x - cx) * side > 0) idx.push(i);
      if (idx.length < 8) continue;
      const box = new THREE.Box3();
      for (const i of idx) box.expandByPoint(world[i]);
      const c = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const r = Math.max(size.y, size.z, size.x) * 0.5;
      // mắt pony nhìn thẳng ra trước, hơi chếch ra ngoài
      const gaze = new THREE.Vector3(side * 0.45, 0, 1).normalize();
      let best = idx[0], bd = -Infinity;
      for (const i of idx) { const d = world[i].clone().sub(c).dot(gaze); if (d > bd) { bd = d; best = i; } }
      const front = world[best];
      // đốm sáng: lệch lên trên + ra ngoài
      const glint = front.clone().addScaledVector(UP, r * 0.32).addScaledVector(new THREE.Vector3(side, 0, 0), r * 0.12);
      for (const i of idx) {
        const d = world[i].clone().sub(front);
        // con ngươi pony là hình bầu dục đứng → nén khoảng cách theo chiều cao
        const t = Math.hypot(d.x, d.y * 0.72, d.z) / r;
        let col = cWhite;
        if (world[i].distanceTo(glint) < r * 0.13) col = cWhite;
        else if (t < 0.3) col = cPupil;
        else if (t < 0.48) col = cDark;
        else if (t < 0.64) col = cIris;
        colors[i * 3] = col.r; colors[i * 3 + 1] = col.g; colors[i * 3 + 2] = col.b;
      }
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.userData.eyesPainted = true;
  }
}

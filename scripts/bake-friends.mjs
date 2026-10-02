// Bớt draw call cho bạn ngựa nhỏ rip từ Source (Big Mac, Shining Armor, Surprise, Bạc Hà, Sunburst):
//  1. vẽ sẵn mống mắt + con ngươi vào COLOR_0 của lưới nhãn cầu (trước đây src/eyes.ts vẽ lúc tải, dựa vào tên vật liệu),
//  2. gom các vật liệu không texture vào 1 texture bảng màu (gltf-transform palette) rồi gộp primitive cùng vật liệu.
// Kết quả: 8–15 draw call/bạn → 4–7. Chạy 1 lần trên models/friends/lod/*.glb (đã commit): node scripts/bake-friends.mjs
// Bỏ qua file đã có COLOR_0 ở lưới mắt (chạy lại không vẽ chồng).
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { palette, flatten, join, dedup, prune } from '@gltf-transform/functions';
import { dirname, join as pjoin } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = pjoin(dirname(fileURLToPath(import.meta.url)), '..');
/** bạn → [tên vật liệu nhãn cầu, màu mống mắt] (trước đây ở CAST[].eyes) */
const ONLY = process.argv.slice(2);
const EYES = {
  applemint: ['material_1', 0xc4701c], bigmac: ['material_3', 0x3f9a3a],
  // surprise: KHÔNG bake (lưới mắt của bản này bake ra 1 mắt đen thui) → vẽ lúc tải bằng src/eyes.ts (CAST.surprise.eyes)
  shining: ['material_2', 0x2f6fd8], sunburst: ['material_0', 0x3fa38a],
};
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const hexRgb = (h) => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
// vertex color glTF là tuyến tính → đổi sRGB sang linear
const lin = (c) => c.map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
const mul = (m, v) => [m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12], m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13], m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14]];

for (const [id, [matName, iris]] of Object.entries(EYES)) {
  if (ONLY.length && !ONLY.includes(id)) continue;
  const file = pjoin(root, `public/models/friends/lod/${id}.glb`);
  const doc = await io.read(file);
  const count = () => doc.getRoot().listMeshes().reduce((a, m) => a + m.listPrimitives().length, 0);
  const before = count();
  let painted = 0;
  for (const node of doc.getRoot().listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    const W = node.getWorldMatrix();
    for (const prim of mesh.listPrimitives()) {
      if (prim.getMaterial()?.getName() !== matName || prim.getAttribute('COLOR_0')) continue;
      const pos = prim.getAttribute('POSITION');
      const n = pos.getCount();
      const world = [];
      let cx = 0;
      for (let i = 0; i < n; i++) { const v = mul(W, pos.getElement(i, [])); world.push(v); cx += v[0]; }
      cx /= n;
      const cIris = lin(hexRgb(iris)), cDark = cIris.map((v) => v * 0.3), cPupil = lin(hexRgb(0x15101e)), cWhite = [1, 1, 1];
      const colors = new Float32Array(n * 3).fill(1);
      for (const side of [-1, 1]) {
        const idx = [];
        for (let i = 0; i < n; i++) if ((world[i][0] - cx) * side > 0) idx.push(i);
        if (idx.length < 8) continue;
        const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
        for (const i of idx) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], world[i][k]); hi[k] = Math.max(hi[k], world[i][k]); }
        const c = lo.map((v, k) => (v + hi[k]) / 2);
        const r = Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) * 0.5;
        const g = [side * 0.45, 0, 1]; const gl = Math.hypot(...g); const gaze = g.map((v) => v / gl);
        let best = idx[0], bd = -Infinity;
        for (const i of idx) { const d = (world[i][0] - c[0]) * gaze[0] + (world[i][1] - c[1]) * gaze[1] + (world[i][2] - c[2]) * gaze[2]; if (d > bd) { bd = d; best = i; } }
        const front = world[best];
        const glint = [front[0] + side * r * 0.12, front[1] + r * 0.32, front[2]];
        for (const i of idx) {
          const d = world[i].map((v, k) => v - front[k]);
          const t = Math.hypot(d[0], d[1] * 0.72, d[2]) / r;
          let col = cWhite;
          if (Math.hypot(...world[i].map((v, k) => v - glint[k])) < r * 0.13) col = cWhite;
          else if (t < 0.3) col = cPupil;
          else if (t < 0.48) col = cDark;
          else if (t < 0.64) col = cIris;
          colors.set(col, i * 3);
        }
      }
      const acc = doc.createAccessor().setType('VEC3').setArray(colors).setBuffer(doc.getRoot().listBuffers()[0]);
      prim.setAttribute('COLOR_0', acc);
      painted++;
    }
  }
  await doc.transform(dedup(), palette({ min: 2 }), flatten(), join({ keepNamed: false }), prune());
  await io.write(file, doc);
  console.log(`${id}: vẽ mắt ${painted} lưới, primitive ${before} → ${count()}`);
}

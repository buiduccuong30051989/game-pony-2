// Giảm lưới model nặng cho iPad (ngân sách trận cuối ≤ 300k tam giác). Chạy tay 1 lần, kết quả đã commit:
//   node scripts/optimize-models.mjs
// Đọc bản gốc ở ../02-pony-three/public/models/<file> (game gốc, cùng thư mục kid-games), ghi đè public/models/<file>.
// meshoptimizer simplify (giữ đường nối UV) rồi nếu chưa đủ thì simplifySloppy (bỏ qua đường nối) tới đúng số tam giác đích.
import { NodeIO, PropertyType } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { weld, simplify, prune, dedup } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
/** file trong public/models → số tam giác đích */
const TARGETS = {
  'ponies/celestia.glb': 24000,
  'ponies/nightmare.glb': 26000,
  'ponies/spike.glb': 8000,
  'ponies/rarity.glb': 19000,
  'ponies/rainbow.glb': 18000,
  'ponies/applejack.glb': 18000,
  'friends/lod/sunburst.glb': 7000,
  'friends/lod/fluttershy.glb': 7000,
  'friends/lod/shining.glb': 6500,
};
const only = process.argv.slice(2);

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
await MeshoptSimplifier.ready;
const count = (doc) => {
  let t = 0;
  for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) { const i = p.getIndices(); t += (i ? i.getCount() : p.getAttribute('POSITION').getCount()) / 3; }
  return Math.round(t);
};

/** Sloppy simplify từng primitive về tỉ lệ `ratio` (bỏ qua đường nối UV → giảm được lưới rip nhiều mảnh). */
function sloppy(doc, ratio) {
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const idx = prim.getIndices();
      const pos = prim.getAttribute('POSITION');
      if (!idx || !pos) continue;
      const indices = new Uint32Array(idx.getArray());
      const positions = new Float32Array(pos.getArray());
      const target = Math.max(3, Math.floor((indices.length / 3) * ratio) * 3);
      if (indices.length <= 300) continue; // mảnh nhỏ (mắt, sừng) giữ nguyên
      const [out] = MeshoptSimplifier.simplifySloppy(indices, positions, 3, null, target, 0.05);
      if (out.length >= 3) idx.setArray(pos.getCount() > 65535 ? out : new Uint16Array(out));
    }
  }
}

for (const [file, goal] of Object.entries(TARGETS)) {
  if (only.length && !only.includes(file)) continue;
  const dst = join(root, 'public/models', file);
  const orig = join(root, '../02-pony-three/public/models', file);
  if (!existsSync(orig)) throw new Error(`thiếu bản gốc ${orig}`);
  const doc = await io.read(orig);
  const before = count(doc);
  await doc.transform(weld(), simplify({ simplifier: MeshoptSimplifier, ratio: Math.min(1, goal / before), error: 0.004, lockBorder: false }));
  let mid = count(doc);
  if (mid > goal * 1.08) sloppy(doc, goal / mid);
  // không gộp vật liệu trùng: src/eyes.ts / bake-friends.mjs tìm nhãn cầu theo TÊN vật liệu
  await doc.transform(prune(), dedup({ propertyTypes: [PropertyType.ACCESSOR, PropertyType.MESH, PropertyType.TEXTURE] }));
  await io.write(dst, doc);
  console.log(`${file}: ${before} → ${mid} → ${count(doc)} tam giác`);
}

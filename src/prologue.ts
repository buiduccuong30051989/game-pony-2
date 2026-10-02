// MỞ ĐẦU (~35 s, có ⏩): thư viện của bà Tuyết. Bà dạy Nhím đọc chữ; trên giá vẽ là ẢNH THẬT của Nhím (thiếu ảnh →
// chân dung Twilight vẽ tay). Phép màu xoáy, ảnh hoá thành Twilight. Nữ hoàng Bóng Đêm phá cửa sổ, thổi 29 chữ cái
// thành sao bay đi khắp nơi, bắt cả nhà đi. Bạn rồng nhỏ ở lại cùng Nhím.
import * as THREE from 'three';
import type { World } from './world';
import type { Hero } from './hero';
import { CAST, PALETTE, type CastId } from './data';
import { Actor } from './actors';
import { Cine } from './cine';
import { LetterStar } from './letterstar';
import { LETTER_ORDER } from './letters';
import { photoCanvas, firstPhoto } from './photos';
import { sfx } from './audio';
import { flash, titleCard } from './ui';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export async function playPrologue(world: World, hero: Hero): Promise<void> {
  world.clearChapter();
  world.setNight(0);
  const room = new THREE.Group();
  world.scene.add(room);

  // ---- phòng thư viện ấm áp
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(26, 18), new THREE.MeshStandardMaterial({ color: 0xe9b98a, roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  const rug = new THREE.Mesh(new THREE.CircleGeometry(4.2, 48), new THREE.MeshStandardMaterial({ color: 0xffb3d6, roughness: 1 }));
  rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.01, 0.5);
  const rug2 = new THREE.Mesh(new THREE.RingGeometry(3.6, 3.9, 48), new THREE.MeshStandardMaterial({ color: 0xfff1a8, roughness: 1 }));
  rug2.rotation.x = -Math.PI / 2; rug2.position.set(0, 0.02, 0.5);
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xffefd2, roughness: 1 });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(26, 12), wallMat);
  back.position.set(0, 6, -6);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(14, 12), wallMat);
  left.position.set(-11, 6, 0); left.rotation.y = Math.PI / 2.4;
  const right = left.clone(); right.position.x = 11; right.rotation.y = -Math.PI / 2.4;
  room.add(floor, rug, rug2, back, left, right);
  // cửa sổ tròn to (trời xanh, sau đó bị phá thành tím)
  const winMat = new THREE.MeshBasicMaterial({ color: 0xbfe6ff });
  const win = new THREE.Mesh(new THREE.CircleGeometry(2.1, 40), winMat);
  win.position.set(0, 6.3, -5.95);
  const winFrame = new THREE.Mesh(new THREE.RingGeometry(2.1, 2.45, 40), new THREE.MeshStandardMaterial({ color: 0xc58cf0 }));
  winFrame.position.set(0, 6.3, -5.93);
  const crossA = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.16, 0.05), winFrame.material);
  crossA.position.set(0, 6.3, -5.9);
  const crossB = crossA.clone(); crossB.rotation.z = Math.PI / 2;
  room.add(win, winFrame, crossA, crossB);
  // kệ sách 2 bên: sách màu (InstancedMesh → 1 draw call)
  const shelfMat = new THREE.MeshStandardMaterial({ color: 0xa8683f, roughness: 0.8 });
  const bookGeo = new THREE.BoxGeometry(0.28, 1, 0.7);
  const books = new THREE.InstancedMesh(bookGeo, new THREE.MeshStandardMaterial({ roughness: 0.8 }), 160);
  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  const BOOK = [0xff6fa8, 0x5fb8ff, 0xffc94a, 0x7ed67a, 0xb98cf0, 0xff9a5a];
  let bi = 0;
  for (const sx of [-7, -4, 4, 7]) {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.8, 5.2, 0.9), shelfMat);
    frame.position.set(sx, 2.6, -5.5);
    room.add(frame);
    for (let row = 0; row < 4; row++) {
      let x = sx - 1.2;
      while (x < sx + 1.15 && bi < 160) {
        const h = 0.7 + Math.random() * 0.35;
        m4.compose(V(x + 0.14, 0.55 + row * 1.25 + h / 2, -5.0), new THREE.Quaternion(), V(1, h, 1));
        books.setMatrixAt(bi, m4);
        books.setColorAt(bi, col.setHex(BOOK[Math.floor(Math.random() * BOOK.length)]));
        x += 0.32; bi++;
      }
    }
  }
  books.count = bi;
  room.add(books);
  // giá vẽ + khung ảnh của Nhím
  const easelMat = new THREE.MeshStandardMaterial({ color: 0xc98a52, roughness: 0.8 });
  for (const dx of [-0.6, 0.6]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8), easelMat);
    leg.position.set(-2.6 + dx, 1.5, -2.2);
    leg.rotation.z = dx * 0.12;
    room.add(leg);
  }
  const frameMesh = new THREE.Mesh(new THREE.BoxGeometry(1.9, 2.4, 0.12), new THREE.MeshStandardMaterial({ color: 0xffc94a, roughness: 0.4, metalness: 0.2 }));
  frameMesh.position.set(-2.6, 2.4, -2.05);
  frameMesh.rotation.y = 0.35;
  const photoTex = new THREE.CanvasTexture(await photoCanvas(firstPhoto('nhim-1', 'nhim-2'), 3 / 4, 600));
  photoTex.colorSpace = THREE.SRGBColorSpace;
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.1), new THREE.MeshBasicMaterial({ map: photoTex, transparent: true }));
  photo.position.set(0, 0, 0.07);
  frameMesh.add(photo);
  room.add(frameMesh);
  const lamp = new THREE.PointLight(0xffd9a0, 18, 16, 1.6);
  lamp.position.set(0, 6, 2);
  room.add(lamp);

  // ---- nhân vật
  const famIds: CastId[] = ['ba-tuyet', 'me-yen', 'ba-cuong', 'ong-cuong', 'spike'];
  const fam = await Promise.all(famIds.map((id) => Actor.create(world, id)));
  const spots: Record<string, [number, number, number]> = {
    'ba-tuyet': [0.4, -2.6, -0.6], 'me-yen': [3.2, 0.2, -0.9], 'ba-cuong': [4.8, -1.2, -1.0], 'ong-cuong': [-4.6, -0.2, 0.9], spike: [-0.9, 1.6, 0.6],
  };
  for (const a of fam) {
    const [x, z, yaw] = spots[a.id];
    a.place(x, z, yaw);
    world.scene.add(a.root);
  }
  const cats = (['mun', 'rom'] as CastId[]).map((id, i) => {
    const sp = world.emojiSprite(CAST[id].emoji, 1.0);
    sp.position.set(1.6 + i * 0.9, 0.55, 2.0);
    room.add(sp);
    return sp;
  });
  const famUpd = (dt: number) => { for (const a of fam) a.update(dt); };
  world.updaters.add(famUpd);
  hero.root.visible = false;
  hero.x = -2.6; hero.z = -1.2; hero.y = 0; hero.locked = true;
  hero.faceTo(1, 4);

  let boss: Actor | null = null;
  const stars: LetterStar[] = [];
  const bubbles: THREE.Group[] = [];
  await Cine.play(world, async (c) => {
    c.camNow(V(0, 5.2, 12.5), V(0, 2.4, -2), 42);
    titleCard('Nhím và những ngôi sao chữ', 'Mở đầu', 3600);
    await c.nar('p_1');
    await c.cam(V(-1, 3.6, 7.5), V(-1.2, 2.2, -2.2), 1800);
    // bà dạy chữ: 2 sao chữ a, b bay quanh khung ảnh
    for (const [i, l] of ['a', 'b'].entries()) {
      const s = new LetterStar({ label: l, size: 0.55 });
      s.setPos(-1.2 + i * 1.2, 3.8, -1.6);
      world.scene.add(s.root);
      world.updaters.add((dt) => s.update(dt, world.camera));
      void s.appear(i * 200);
      stars.push(s);
    }
    await c.say('ba-tuyet', 'p_2');
    // phép màu xoáy quanh ảnh
    const fc = frameMesh.getWorldPosition(new THREE.Vector3());
    const swirl = (dt: number, t: number) => {
      for (let i = 0; i < 4; i++) {
        const a = t * 6 + i * 1.6, r = 1.4 - (t % 1) * 0.4;
        world.magic.emit({ x: fc.x + Math.cos(a) * r, y: fc.y + Math.sin(a * 0.7) * 1.2, z: fc.z + 0.4 + Math.sin(a) * 0.3,
          color: i % 2 ? PALETTE.magicPink : 0xffd166, vy: 0.3, max: 0.9, size: 0.3 });
      }
    };
    world.updaters.add(swirl);
    void c.cam(V(-2.2, 2.8, 5), V(-2.6, 2.2, -2), 3200);
    await c.nar('p_3');
    sfx('sfx_win', 0.6);
    await c.tween(900, (k) => { photo.scale.setScalar(1 + k * 0.2); (photo.material as THREE.MeshBasicMaterial).opacity = 1 - k * 0.9; });
    world.updaters.delete(swirl);
    void flash(700);
    world.magic.burst(fc, 160, 0xffffff, 3.6, 0.36, 1.1, -1);
    world.magic.burst(fc, 90, PALETTE.magic, 2.8, 0.3, 1.0, -1);
    photo.visible = false;
    hero.root.visible = true;
    hero.update(0, (x, z) => [x, z]);
    await c.tween(700, (k) => hero.root.scale.setScalar(Math.max(0.01, k)));
    await c.nar('p_4');
    void hero.celebrate();
    await c.say('twilight', 'p_5');
    // Nữ hoàng Bóng Đêm phá cửa sổ
    winMat.color.setHex(0x3a2a7a);
    sfx('sfx_soft', 0.8);
    void c.cam(V(0, 4.5, 11), V(0, 4.2, -3), 1500, 46);
    void world.tweenNight(0.75, 1600);
    boss = await Actor.fromDef(world, { ...CAST['bac-hanh'], model: 'models/ponies/nightmare.glb', height: 3.4 });
    boss.hover = 2.2;
    boss.idleOn = false;
    boss.place(0, -7.5, 0);
    boss.y = 5.5;
    world.scene.add(boss.root);
    const bb = boss;
    world.updaters.add((dt) => bb.update(dt));
    await c.tween(1400, (k) => { bb.z = -7.5 + k * 6.5; bb.y = 5.5 - k * 2.6; });
    for (let i = 0; i < 3; i++) world.shadow.burst(V(0, 4.2, -1), 60, 0x5a2fb0, 3, 0.5, 1.2, -0.5);
    await c.say('nightmare', 'p_6');
    // 29 chữ cái thành sao bay ra cửa sổ
    const out: Promise<void>[] = [];
    LETTER_ORDER.forEach((l, i) => {
      const s = new LetterStar({ label: l, size: 0.45 });
      s.setPos((Math.random() - 0.5) * 9, 1 + Math.random() * 3, 1 + Math.random() * 2);
      world.scene.add(s.root);
      world.updaters.add((dt) => s.update(dt, world.camera));
      stars.push(s);
      out.push(c.wait(i * 70).then(() => s.flyTo(V((Math.random() - 0.5) * 2, 6.3, -9), 1300, 0.2, 1.5)).then(() => { s.root.visible = false; }));
    });
    for (const s of stars.slice(0, 2)) void s.flyTo(V(0, 6.3, -9), 1200, 0.2, 1);
    void c.nar('p_7');
    await Promise.all(out);
    await c.wait(600);
    // bắt cả nhà vào bong bóng bóng đêm, bay ra cửa sổ
    const kidnapped = fam.filter((a) => a.id !== 'spike');
    for (const a of kidnapped) {
      const { group } = world.makeBubble(a.def.height * 0.75, true);
      group.position.copy(a.center());
      world.scene.add(group);
      bubbles.push(group);
    }
    void c.say('nightmare', 'p_8');
    const starts = bubbles.map((b) => b.position.clone());
    const actorStarts = kidnapped.map((a) => [a.x, a.y, a.z] as const);
    await c.tween(2600, (k) => {
      bubbles.forEach((b, i) => {
        const p = starts[i].clone().lerp(V(0, 6.3, -9), k);
        p.y += Math.sin(k * Math.PI) * 2;
        b.position.copy(p);
        const a = kidnapped[i];
        a.x = p.x; a.z = p.z; a.y = p.y - a.def.height * 0.55;
        void actorStarts;
      });
      cats.forEach((sp, i) => { sp.position.lerpVectors(V(1.6 + i * 0.9, 0.55, 2.0), V(0, 6.3, -9), k); });
      bb.z = -1 + k * -8; bb.y = 2.9 + k * 3;
    });
    for (const a of kidnapped) a.root.visible = false;
    cats.forEach((s) => (s.visible = false));
    bubbles.forEach((b) => (b.visible = false));
    bb.root.visible = false;
    void world.tweenNight(0.45, 1500);
    await c.cam(V(-1.5, 3.4, 7), V(-1.6, 1.2, -0.5), 1500, 42);
    const sp = fam.find((a) => a.id === 'spike')!;
    sp.faceTo(hero.x, hero.z);
    sp.hop(5);
    await c.say('spike', 'p_9');
    await c.nar('p_10');
  });

  // dọn
  world.updaters.clear();
  for (const s of stars) s.dispose();
  for (const a of fam) a.dispose();
  (boss as Actor | null)?.dispose();
  for (const b of bubbles) b.removeFromParent();
  world.scene.remove(room);
  hero.root.visible = true;
  hero.root.scale.setScalar(1);
  hero.locked = false;
  world.setCamera(null);
}

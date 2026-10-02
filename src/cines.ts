// Cảnh phim giữa chương (20–40 s): camera lượn theo đường, phụ đề người kể, thẻ nhân vật. Có nút ⏩.
// Toạ độ theo bố cục chương trong src/data.ts (đảo dài theo x, bắt đầu x ≈ −32, cứu người ở x ≈ 29–30).
import * as THREE from 'three';
import type { CineId } from './data';
import type { World } from './world';
import { pathZ } from './world';
import type { Hero } from './hero';
import { Cine } from './cine';
import { titleCard } from './ui';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
/** Góc nhìn cận 1 điểm trên đường. */
const near = (x: number, h = 7.5, back = 12) => ({ pos: V(x - 2, h, pathZ(x) + back), look: V(x, 1.6, pathZ(x)) });

/** Bóng tối xoáy (Nữ hoàng Bóng Đêm thoáng qua) ở 1 điểm. */
function darkSwirl(world: World, x: number, z: number, ms = 2200): void {
  const t0 = performance.now();
  const iv = setInterval(() => {
    const k = (performance.now() - t0) / ms;
    if (k > 1) { clearInterval(iv); return; }
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * Math.PI * 2, r = 1 + Math.random() * 2;
      world.shadow.emit({ x: x + Math.cos(a) * r, y: 1 + Math.random() * 4, z: z + Math.sin(a) * r, color: Math.random() < 0.5 ? 0x5a2fb0 : 0x8f5cff,
        vx: -Math.sin(a) * 2, vz: Math.cos(a) * 2, vy: 0.8, max: 1.2, size: 0.5 });
    }
  }, 60);
}

export async function playChapterCine(world: World, hero: Hero, id: CineId): Promise<void> {
  const hx = hero.x, hz = hero.z;
  const home = { pos: V(hx, 11.9, hz + 15.6), look: V(hx, 1, hz - 1.2) };
  await Cine.play(world, async (c) => {
    switch (id) {
      case 'c1_intro': {
        c.camNow(V(-14, 26, 30), V(0, 0, -2), 46);
        titleCard('Chương 1', 'Rừng Everfree');
        await c.nar('c1i_1');
        void c.cam(V(-26, 12, 18), V(-30, 1, 0), 5000, 40);
        await c.nar('c1i_2');
        const cage = near(30, 8, 13);
        await c.cam(cage.pos, cage.look, 1800);
        darkSwirl(world, 30, pathZ(30) - 1);
        await c.say('mun', 'c1i_3');
        await c.say('spike', 'c1i_4');
        await c.say('nightmare', 'c1i_5');
        await c.cam(home.pos, home.look, 2000, 38);
        await c.say('spike', 'c1i_6');
        break;
      }
      case 'c1_mid': {
        const cage = near(30, 8, 13);
        await c.cam(cage.pos, cage.look, 2200);
        await c.nar('c1m_1');
        await c.say('rom', 'c1m_2');
        const ghost = near(-1, 7, 11);
        darkSwirl(world, 0, pathZ(-1) - 3);
        await c.cam(ghost.pos, ghost.look, 1800);
        await c.say('nightmare', 'c1m_3');
        await c.cam(home.pos, home.look, 1800);
        await c.say('spike', 'c1m_4');
        break;
      }
      case 'c2_intro': {
        c.camNow(V(-10, 24, 30), V(0, 0, -2), 46);
        titleCard('Chương 2', 'Ponyville');
        await c.nar('c2i_1');
        void c.cam(V(-20, 11, 18), V(-24, 1, 0), 4500, 40);
        await c.nar('c2i_2');
        const tower = { pos: V(26, 9, 17), look: V(29, 4.5, pathZ(29) - 3) };
        await c.cam(tower.pos, tower.look, 2000);
        await c.nar('c2i_3');
        await c.say('me-yen', 'c2i_4');
        await c.say('ba-cuong', 'c2i_5');
        darkSwirl(world, 30, pathZ(29) - 3);
        await c.say('nightmare', 'c2i_6');
        await c.cam(home.pos, home.look, 2000, 38);
        await c.say('spike', 'c2i_7');
        break;
      }
      case 'c2_mid': {
        const dr = near(0, 7.5, 12);
        await c.cam(dr.pos, dr.look, 2200);
        darkSwirl(world, 0.5, pathZ(-1) - 3.6);
        await c.nar('c2m_1');
        await c.say('spike', 'c2m_2');
        await c.say('nightmare', 'c2m_3');
        await c.cam(home.pos, home.look, 1800, 38);
        break;
      }
      case 'c3_intro': {
        c.camNow(V(-8, 25, 30), V(0, 2, -4), 46);
        titleCard('Chương 3', 'Canterlot');
        await c.nar('c3i_1');
        void c.cam(V(-18, 12, 18), V(-24, 2, -2), 5000, 40);
        await c.nar('c3i_2');
        const tower = { pos: V(26, 9.5, 18), look: V(29, 5, pathZ(29) - 3) };
        await c.cam(tower.pos, tower.look, 2000);
        await c.say('ba-tuyet', 'c3i_3');
        await c.say('ong-cuong', 'c3i_4');
        darkSwirl(world, 30, pathZ(29) - 3);
        await c.say('nightmare', 'c3i_5');
        await c.cam(home.pos, home.look, 2000, 38);
        await c.say('spike', 'c3i_6');
        break;
      }
      case 'c3_mid': {
        const w = near(0, 7.5, 12);
        await c.cam(w.pos, w.look, 2200);
        darkSwirl(world, 0.5, pathZ(-1) - 3.6);
        await c.nar('c3m_1');
        await c.say('spike', 'c3m_2');
        await c.cam(home.pos, home.look, 1800, 38);
        await c.say('me-yen', 'c3m_3');
        break;
      }
      default: break;
    }
  });
  world.setCamera(null);
}

// Hàng người đi theo Twilight: bám vết chân, ĐI HÀNG ĐÔI, tối đa MAX_PARADE (12). Lúc làm bài thì túm lại sau lưng
// Nhím (tránh chỗ đang học). Đẩy tách mỗi khung để không ai chồng lên nhau / lên Nhím / lên quái.
import { MAX_PARADE } from './data';
import type { World } from './world';
import type { Hero } from './hero';
import { Actor, Trail } from './actors';

export class Parade {
  list: Actor[] = [];
  private trail = new Trail();
  /** đang làm bài: túm lại sau lưng Nhím, tránh xa điểm này */
  huddleAt: { x: number; z: number } | null = null;
  /** chỗ phải tránh thêm (quái, bong bóng) */
  avoid: { x: number; z: number; r: number }[] = [];

  constructor(private world: World, private hero: Hero) {}

  /** Thêm người vào hàng. Đầy hàng → bạn ngựa nhỏ đi lâu nhất "về nhà" (vẫn có ở trận cuối). */
  add(a: Actor, front = false): void {
    if (this.list.includes(a)) return;
    if (this.list.length >= MAX_PARADE) {
      const old = this.list.find((x) => x.def.friend);
      if (old) { this.list = this.list.filter((x) => x !== old); void old.goHome(); }
    }
    if (front) {
      // người nhà đứng sau Spike + mèo, trước bạn ngựa nhỏ
      const i = this.list.findIndex((x) => x.def.friend);
      this.list.splice(i < 0 ? this.list.length : i, 0, a);
    } else this.list.push(a);
    if (!a.root.parent) this.world.scene.add(a.root);
  }

  private gap(a: Actor): number {
    if (a.def.kind === 'cat') return 0.9;
    if (a.def.kind === 'dragon') return 1.0;
    if (a.def.kind === 'flyer') return 1.8;
    return Math.max(1.0, a.def.height * 0.75);
  }
  private radius(a: Actor): number {
    return a.def.kind === 'cat' ? 0.4 : a.def.kind === 'flyer' ? 0.85 : Math.max(0.42, a.def.height * 0.34);
  }

  /** Đặt cả hàng ngay sau lưng Nhím (vào chương / nhảy cóc). */
  placeAll(): void {
    const h = this.hero;
    this.trail.reset(h.x, h.z, h.yaw);
    this.list.forEach((a, i) => {
      const p = this.slot(i);
      a.place(p.x, p.z, h.yaw);
      if (!a.root.parent) this.world.scene.add(a.root);
    });
  }

  /** Chỗ của người thứ i: hàng đôi (cặp trái/phải) dọc vết chân. */
  private slot(i: number): { x: number; z: number } {
    const row = Math.floor(i / 2);
    let dist = 1.4;
    for (let r = 0; r < row; r++) dist += Math.max(this.gap(this.list[r * 2]), this.gap(this.list[r * 2 + 1] ?? this.list[r * 2]));
    dist += this.gap(this.list[i]) * 0.3;
    const p = this.trail.at(dist), q = this.trail.at(dist + 0.4);
    let tx = p.x - q.x, tz = p.z - q.z;
    const tl = Math.hypot(tx, tz) || 1;
    tx /= tl; tz /= tl;
    const side = i % 2 === 0 ? -1 : 1;
    const w = 0.62 + (this.radius(this.list[i]) - 0.42) * 0.8;
    return { x: p.x - tz * side * w, z: p.z + tx * side * w };
  }

  /** Chỗ túm tụm sau lưng Nhím (tránh xa `from`): hàng 4, so le. */
  private huddleSpot(i: number, from: { x: number; z: number }): { x: number; z: number } {
    const h = this.hero;
    let bx = h.x - from.x, bz = h.z - from.z;
    const bl = Math.hypot(bx, bz) || 1;
    bx /= bl; bz /= bl;
    const lx = -bz, lz = bx;
    const row = Math.floor(i / 4), col = (i % 4) - 1.5;
    const back = 1.9 + row * 1.25, side = col * 1.25 + (row % 2) * 0.6;
    const [x, z] = this.world.clampToIsland(h.x + bx * back + lx * side, h.z + bz * back + lz * side);
    return { x, z };
  }

  update(dt: number): void {
    const h = this.hero;
    this.trail.push(h.x, h.z);
    const clamp = (x: number, z: number) => this.world.clampToIsland(x, z);
    this.list.forEach((a, i) => {
      const p = this.huddleAt ? this.huddleSpot(i, this.huddleAt) : this.slot(i);
      a.follow(dt, p.x, p.z, clamp, this.huddleAt ? 0.25 : 0.35);
      if (this.huddleAt && !a.busy && a.grounded && Math.hypot(p.x - a.x, p.z - a.z) < 0.5) a.turnTo(Math.atan2(this.huddleAt.x - a.x, this.huddleAt.z - a.z));
    });
    this.separate();
    for (const a of this.list) a.update(dt);
  }

  private separate(): void {
    const h = this.hero;
    const list = this.list;
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (a.busy) continue;
      const ra = this.radius(a);
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j];
        const min = ra + this.radius(b);
        let dx = b.x - a.x, dz = b.z - a.z;
        let d = Math.hypot(dx, dz);
        if (d >= min) continue;
        if (d < 1e-4) { dx = Math.random() - 0.5; dz = Math.random() - 0.5; d = Math.hypot(dx, dz); }
        const push = (min - d) * 0.5 / d;
        if (!b.busy) { b.x += dx * push; b.z += dz * push; }
        a.x -= dx * push; a.z -= dz * push;
      }
      const away = (x: number, z: number, min: number) => {
        const dx = a.x - x, dz = a.z - z, d = Math.hypot(dx, dz);
        if (d < min && d > 1e-4) { a.x = x + (dx / d) * min; a.z = z + (dz / d) * min; }
      };
      away(h.x, h.z, ra + 0.7);
      for (const o of this.avoid) away(o.x, o.z, ra + o.r);
      [a.x, a.z] = this.world.clampToIsland(a.x, a.z);
    }
  }

  /** Cả hàng nhảy cẫng lần lượt. */
  cheer(): void { this.list.forEach((a, i) => setTimeout(() => a.hop(4.5 + Math.random()), 80 * i)); }

  dispose(): void {
    for (const a of this.list) a.dispose();
    this.list = [];
    this.avoid = [];
    this.huddleAt = null;
  }
}

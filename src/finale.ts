// CHƯƠNG 4 – TRẬN CANTERLOT (học trước, phim sau):
//  1. Mở (~20 s): trời tối, Nữ hoàng Bóng Đêm hạ xuống cùng đội quân bóng tối 15 con; đối diện là Twilight, cả nhà,
//     2 mèo, các bạn đã cứu. Camera lượn từ trên cao xuống quét 2 phe.
//  2. 5 vòng Hài Hoà, mỗi vòng 1 bài (tìm chữ / ghép ba, mẹ, bà). Đúng: 1 người nhà ra chiêu (ông đá hậu, các bạn xông lên,
//     ba bay vệt cầu vồng, mẹ nổ ngọc, bà chiếu nắng) → 3 quái được thanh tẩy, đổi phe; 1 ngọc Hài Hoà sáng.
//     Sai: Nữ hoàng cười, bóng tối tiến lên một chút. Không có thua.
//  3. Cao trào (~30 s): 5 ngọc xoay quanh Twilight, Twilight sáng rực bay lên dang cánh, ẢNH THẬT của Nhím loé trong ánh sáng,
//     niệm "Bằng phép màu của tình bạn và gia đình…", tia cầu vồng, màn trắng.
//  4. Kết: Nữ hoàng hoá bác Hanh (Luna), bình minh, cả nhà ôm nhau, pháo hoa, ảnh lớn "Nhím đã cứu cả nhà!", cả cuốn album.
import * as THREE from 'three';
import { CHAPTERS, CAST, HARMONY, PALETTE, ALL_FRIENDS, type CastId, type MonsterKind, type FriendId } from './data';
import type { World } from './world';
import type { Hero } from './hero';
import { Actor } from './actors';
import { Monster } from './monster';
import { Parade } from './parade';
import { Cine } from './cine';
import { SpellActivity, pickDistractors, withTimeout, type Ctx } from './activities';
import { LetterStar, glowTexture, type Pickable } from './letterstar';
import { nameKey } from './letters';
import { spellExample } from './example';
import { play, sfx, stopSpeech } from './audio';
import { findLine, bankLine } from './voice';
import { say, narrate } from './talk';
import { markWeak, markStrong, saveProgress, type Progress } from './progress';
import { setAnswer } from './testhook';
import { photoCanvas, firstPhoto } from './photos';
import { showBigPhoto, showAlbumBook } from './album';
import { showHud, showPlay, setChapterTitle, setHarmony, confetti, whiteOut, titleCard, setBoardCount } from './ui';
import { tween, wait, easeOutQuad } from './tween';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const RAINBOW = [0xff4d5e, 0xff9a2e, 0xffe066, 0x5bd96b, 0x4fb3ff, 0x9b6bff];
const HERO = V(0, 0, 4.6);
const BOSS = V(0, 0, -10);
const BOSS_HOVER = 2.6;
const BOSS_H = 4.0;
/** camera nhìn 2 phe đối mặt (từ sau lưng phe Nhím, hơi cao) */
const BATTLE_CAM = { pos: V(0, 10.5, 21.5), look: V(0, 1.8, -2.5), fov: 50 };

/** Đội quân bóng tối: 10 con (2 con / vòng), ít mesh (draw call) — slime, yêu tinh, ma, rồng nhỏ. */
const ARMY: MonsterKind[] = ['slime_jt', 'goblin', 'slime', 'ghost', 'goblin', 'dragon_ev', 'slime_jt', 'slime', 'ghost', 'goblin'];
const PER_ROUND = 2;

export interface FinaleOpts {
  /** số vòng đã xong sẵn (debug ?round=N) */
  round: number;
  /** 'climax' | 'ending': nhảy thẳng tới phim (debug ?cine=) */
  cine: string | null;
  auto: boolean;
}

export class Finale {
  private boss!: Actor;
  private luna!: Actor;
  private family: Actor[] = [];
  private parade!: Parade;
  private army: Monster[] = [];
  private gems: THREE.Mesh[] = [];
  private lit = 0;
  private gemSpin = 0.7;
  private t = 0;
  private alive = true;
  private aura!: THREE.Mesh;
  private pickables = new Set<Pickable>();
  private onPick: ((p: Pickable) => void) | null = null;
  private stars: LetterStar[] = [];
  private ctx!: Ctx;
  private glowWings: THREE.Sprite | null = null;
  phase = 'setup';

  constructor(private world: World, private hero: Hero, private progress: Progress) {}

  /** Cho main.ts raycast. */
  get tapTargets(): Set<Pickable> { return this.pickables; }
  tap(p: Pickable): void { this.onPick?.(p); }

  async setup(): Promise<void> {
    const { world, hero } = this;
    const def = CHAPTERS[3];
    await world.buildChapter(def, [[0, 0, 13]]);
    world.setShadows(false);
    world.scene.add(hero.root);
    hero.x = HERO.x; hero.z = HERO.z; hero.locked = true;
    hero.stop();
    hero.faceTo(BOSS.x, BOSS.z);
    this.parade = new Parade(world, hero);
    const self = this;
    this.ctx = {
      world, hero, parade: this.parade, progress: this.progress,
      alive: () => this.alive,
      pickables: this.pickables,
      get onPick() { return self.onPick; },
      set onPick(f) { self.onPick = f; },
      poke: () => {}, setIdle: () => {},
      onWrong: () => this.laugh(),
    };
    // phe Nhím: cả nhà hàng trước, mèo + Spike, bạn ngựa nhỏ hàng sau
    const famIds: CastId[] = ['ong-cuong', 'ba-cuong', 'me-yen', 'ba-tuyet', 'spike', 'mun', 'rom'];
    const SPOT: Record<string, [number, number]> = {
      'ong-cuong': [-5.8, 5.8], 'ba-cuong': [-3.0, 7.0], 'me-yen': [3.0, 7.0], 'ba-tuyet': [6.0, 5.6], spike: [-1.2, 8.3], mun: [0.6, 8.6], rom: [1.7, 8.3],
    };
    // Cadance (model đứng chồm 2 chân) và Derpy (rip có xương, không auto-rig → đứng thẳng đơ) nhìn lạ giữa đám đông → không đứng ở trận cuối
    const ODD: FriendId[] = ['cadance', 'derpy'];
    const friends: FriendId[] = (this.progress.friends.length ? this.progress.friends : ALL_FRIENDS).filter((f) => !ODD.includes(f)).slice(-12);
    const [fam, fr, boss, luna] = await Promise.all([
      Promise.all(famIds.map((id) => Actor.create(world, id))),
      Promise.all(friends.map((id) => Actor.create(world, id))),
      Actor.fromDef(world, { ...CAST['bac-hanh'], model: 'models/ponies/nightmare.glb', height: BOSS_H }),
      Actor.create(world, 'bac-hanh'),
    ]);
    fam.forEach((a) => { const [x, z] = SPOT[a.id]; a.place(x, z, Math.PI); a.idleOn = true; world.scene.add(a.root); });
    fr.forEach((a, i) => {
      const row = Math.floor(i / 6), col = i % 6;
      const x = (col - 2.5) * 2.4 + (row % 2) * 1.2;
      a.place(x, 10.0 + row * 1.7, Math.PI);
      a.idleOn = true;
      world.scene.add(a.root);
    });
    this.family = [...fam, ...fr];
    // bớt draw call: bạn ngựa nhỏ hàng sau không cần bóng tròn
    for (const a of fr) a.blobOn = false;
    this.boss = boss;
    boss.hover = BOSS_HOVER; boss.idleOn = false;
    boss.place(BOSS.x, BOSS.z, 0);
    world.scene.add(boss.root);
    this.luna = luna;
    luna.hover = BOSS_HOVER; luna.idleOn = false;
    luna.place(BOSS.x, BOSS.z, 0);
    luna.root.visible = false;
    world.scene.add(luna.root);
    // quầng bóng tối quanh Nữ hoàng
    this.aura = new THREE.Mesh(new THREE.SphereGeometry(3.0, 32, 16), new THREE.MeshBasicMaterial({ color: 0x3a1a8a, transparent: true, opacity: 0.32, depthWrite: false }));
    this.aura.position.set(BOSS.x, BOSS_HOVER + BOSS_H * 0.5, BOSS.z);
    world.chapterGroup?.add(this.aura);
    // đội quân: 3 hàng so le trước mặt Nữ hoàng
    this.army = await Promise.all(ARMY.map((k, i) => {
      const row = Math.floor(i / 5), col = i % 5;
      const x = (col - 2) * 3.2 + (row % 2) * 1.5 - 0.75;
      return Monster.create(world, k, x, -2.8 - row * 2.2, false);
    }));
    for (const m of this.army) { m.faceTo(m.x, 10); world.scene.add(m.root); }
    // 5 ngọc Hài Hoà quanh Twilight
    for (const h of HARMONY) {
      const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0),
        new THREE.MeshStandardMaterial({ color: h.color, emissive: h.color, emissiveIntensity: 0.05, roughness: 0.35, transparent: true, opacity: 0.45 }));
      m.scale.set(1, 1.4, 1);
      world.scene.add(m);
      this.gems.push(m);
    }
    world.updaters.add((dt) => this.update(dt));
    world.setCamera(BATTLE_CAM.pos, BATTLE_CAM.look, true, BATTLE_CAM.fov);
    setChapterTitle('4. Trận Canterlot');
    setBoardCount(this.progress.letters.length);
    setHarmony(HARMONY.map((h) => '#' + h.color.toString(16).padStart(6, '0')), 0);
  }

  private update(dt: number): void {
    this.t += dt;
    const b = this.boss;
    if (b.root.visible) {
      b.update(dt);
      this.aura.position.set(b.x, b.y + BOSS_H * 0.5, b.z);
      this.aura.scale.setScalar((1 + Math.sin(this.t * 2.2) * 0.04) * (1 - this.lit * 0.12));
      if (Math.random() < 0.6 - this.lit * 0.1) {
        const a = Math.random() * Math.PI * 2;
        this.world.shadow.emit({ x: b.x + Math.cos(a) * 2.8, y: b.y + BOSS_H * 0.5 + (Math.random() - 0.5) * 3, z: b.z + Math.sin(a) * 2.8,
          color: Math.random() < 0.5 ? 0x6a4cff : 0x3a1a8a, vy: 0.4, max: 1.2, size: 0.45 });
      }
    }
    if (this.luna.root.visible) this.luna.update(dt);
    for (const a of this.family) a.update(dt);
    for (const m of this.army) m.update(dt);
    const hx = this.hero.x, hz = this.hero.z, hy = this.hero.y;
    this.gems.forEach((m, i) => {
      if (!m.visible) return;
      const ang = this.t * this.gemSpin + (i / this.gems.length) * Math.PI * 2;
      const r = this.phase === 'climax' ? 1.9 : 1.5;
      m.position.set(hx + Math.cos(ang) * r, hy + 2.5 + Math.sin(this.t * 2 + i) * 0.15, hz + Math.sin(ang) * r);
      m.rotation.y += dt * 2;
      if (i < this.lit && Math.random() < 0.25) this.world.magic.twinkle(m.position, HARMONY[i].color, 1, 0.3);
    });
  }

  private async laugh(): Promise<void> {
    void tween(600, (q) => { this.boss.pivot.rotation.z = Math.sin(q * Math.PI * 4) * 0.12 * (1 - q); });
    // bóng tối tiến lên một chút (quái còn bị nhập nhích về phía Nhím, có giới hạn)
    for (const m of this.army) if (m.possessed && m.z < 0.5) void m.travel(m.x, m.z + 0.35, 500, 0.15);
    const l = bankLine('laugh');
    await say('nightmare', l.key, l.text, 900);
  }

  private lightGem(i: number): void {
    const m = this.gems[i];
    const mat = m.material as THREE.MeshStandardMaterial;
    this.lit = Math.max(this.lit, i + 1);
    setHarmony(HARMONY.map((h) => '#' + h.color.toString(16).padStart(6, '0')), this.lit);
    sfx('sfx_win', 0.5);
    void tween(500, (k) => {
      mat.emissiveIntensity = 0.05 + k * 1.1;
      mat.opacity = 0.45 + k * 0.55;
      m.scale.set(1 + Math.sin(k * Math.PI) * 0.8, 1.4 + Math.sin(k * Math.PI) * 1.1, 1 + Math.sin(k * Math.PI) * 0.8);
    });
    this.world.magic.burst(m.position, 50, HARMONY[i].color, 2.2, 0.3, 0.8, -1);
  }

  private group(r: number): Monster[] { return this.army.slice(r * PER_ROUND, r * PER_ROUND + PER_ROUND); }

  /** Quái nhóm r đổi phe ngay (debug / nhảy cóc). */
  private convertNow(r: number): void {
    this.group(r).forEach((m, i) => {
      void m.purify(true);
      const [x, z] = this.allySpot(r * PER_ROUND + i);
      m.place(x, z);
      m.faceTo(m.x, -10);
    });
  }
  private allySpot(i: number): [number, number] {
    const side = i % 2 ? 1 : -1;
    return [side * (8.5 + (i % 3) * 1.6), 2.5 + Math.floor(i / 2) * 1.3];
  }

  /** Chiêu của người nhà → nhóm quái r được thanh tẩy và đổi phe. */
  private async signature(r: number): Promise<void> {
    const { world } = this;
    const who = HARMONY[r].hero;
    const grp = this.group(r);
    const gc = grp.reduce((v, m) => v.add(V(m.x, 0, m.z)), V(0, 0, 0)).multiplyScalar(1 / Math.max(1, grp.length));
    const find = (id: CastId) => this.family.find((a) => a.id === id);
    const hit = V(gc.x, 1.2, gc.z);
    if (who === 'ong-cuong') {
      const a = find('ong-cuong')!;
      void say('ong-cuong', 'f_move_ong');
      const x0 = a.x, z0 = a.z;
      await a.travel(gc.x - 0.5, gc.z + 2.2, 900, 0.6);
      a.faceTo(gc.x + 3, gc.z + 6); // quay lưng → đá hậu
      await tween(380, (k) => { a.pivot.rotation.x = Math.sin(k * Math.PI) * 0.55; });
      for (let i = 0; i < 8; i++) { const s = world.emojiSprite('🍎', 0.5); s.position.copy(hit); world.scene.add(s); const d = V((Math.random() - 0.5) * 6, 3 + Math.random() * 3, (Math.random() - 0.5) * 4); void tween(1100, (k) => { s.position.set(hit.x + d.x * k, hit.y + d.y * k - 6 * k * k, hit.z + d.z * k); }).then(() => s.removeFromParent()); }
      world.magic.burst(hit, 90, 0xff9a2e, 3.4, 0.32, 0.9, -1);
      await this.purifyGroup(grp, r);
      await a.travel(x0, z0, 900, 0.6);
      a.faceTo(BOSS.x, BOSS.z);
    } else if (who === 'friends') {
      void narrate('f_move_friends');
      const runners = this.family.filter((a) => a.def.friend || a.def.kind === 'cat' || a.id === 'spike');
      const homes = runners.map((a) => [a.x, a.z] as const);
      await Promise.all(runners.map((a, i) => wait(i * 60).then(() => a.travel(a.x * 0.8 + gc.x * 0.2, a.z - 3.2, 800, 0.9))));
      for (let i = 0; i < 4; i++) { world.magic.burst(hit.clone().add(V((Math.random() - 0.5) * 3, Math.random(), 0)), 50, i % 2 ? 0xff7ac8 : 0xffe066, 3, 0.32, 0.9, -1); await wait(120); }
      await this.purifyGroup(grp, r);
      await Promise.all(runners.map((a, i) => a.travel(homes[i][0], homes[i][1], 800, 0.6)));
      for (const a of runners) a.faceTo(BOSS.x, BOSS.z);
    } else if (who === 'ba-cuong') {
      const a = find('ba-cuong')!;
      void say('ba-cuong', 'f_move_ba');
      const x0 = a.x, z0 = a.z, y0 = a.y;
      a.busy = true;
      let last = 0;
      await tween(1500, (k) => {
        const p = k < 0.5 ? k * 2 : (1 - k) * 2;
        a.x = x0 + (gc.x - x0) * p; a.z = z0 + (gc.z - z0) * p;
        a.y = y0 + Math.sin(k * Math.PI * 2) * 2.4 + p * 1.5;
        a.yaw = Math.atan2(gc.x - x0, gc.z - z0) + (k > 0.5 ? Math.PI : 0);
        if (k - last > 0.012) { last = k; world.magic.emit({ x: a.x, y: a.y + 0.9, z: a.z, color: RAINBOW[Math.floor(k * 60) % 6], vy: -0.1, max: 1.1, size: 0.55 }); }
        if (Math.abs(k - 0.5) < 0.02) world.magic.burst(hit, 30, RAINBOW[Math.floor(Math.random() * 6)], 3, 0.32, 0.8, -1);
      });
      a.x = x0; a.z = z0; a.y = y0; a.busy = false;
      a.faceTo(BOSS.x, BOSS.z);
      await this.purifyGroup(grp, r);
    } else if (who === 'me-yen') {
      const a = find('me-yen')!;
      void say('me-yen', 'f_move_me');
      a.hop(6);
      const horn = a.center().add(V(0, 1, 0));
      await world.magic.beam(horn, hit.clone().add(V(0, 2, 0)), 0x7fe8ff, 0xffffff, 0.7);
      for (let i = 0; i < 10; i++) {
        const s = world.emojiSprite('💎', 0.6);
        s.position.copy(hit).add(V((Math.random() - 0.5) * 4, 4, (Math.random() - 0.5) * 2));
        world.scene.add(s);
        const y0 = s.position.y;
        void tween(900, (k) => { s.position.y = y0 - k * 3.5; s.material.rotation = k * 4; }).then(() => { world.magic.burst(s.position, 16, 0x9fe8ff, 2, 0.25, 0.6, -1); s.removeFromParent(); });
      }
      await wait(800);
      await this.purifyGroup(grp, r);
    } else {
      const a = find('ba-tuyet')!;
      void say('ba-tuyet', 'f_move_batuyet');
      a.setFlap(1);
      const sky = hit.clone().add(V(-2, 14, -4));
      await Promise.all([0, 1, 2].map((i) => wait(i * 120).then(() => world.magic.beam(sky, hit.clone().add(V((i - 1) * 1.2, 0, 0)), 0xffd166, 0xffffff, 0.8))));
      world.magic.burst(hit, 160, 0xffe066, 4, 0.4, 1.1, -0.5);
      await this.purifyGroup(grp, r);
      a.setFlap(0.4);
    }
  }

  private async purifyGroup(grp: Monster[], r: number): Promise<void> {
    await Promise.all(grp.map((m, i) => wait(i * 150).then(() => m.purify())));
    confetti(40);
    // đổi phe: chạy về phía Nhím, đứng 2 cánh, quay mặt về Nữ hoàng
    await Promise.all(grp.map((m, i) => { const [x, z] = this.allySpot(r * PER_ROUND + i); return m.travel(x, z, 1300, 0.8).then(() => m.faceTo(m.x, -10)); }));
  }

  /** Vòng tìm chữ: 3 sao lơ lửng giữa sân, chạm đúng chữ. */
  private async letterRound(r: number, count: number): Promise<void> {
    const got = this.progress.letters.length ? this.progress.letters : ['a', 'o', 'b', 'm', 'e'];
    const weak = Object.keys(this.progress.weak).filter((c) => got.includes(c));
    const pool = [...weak, ...[...got].sort(() => Math.random() - 0.5)];
    const targets: string[] = [];
    for (const c of pool) if (!targets.includes(c) && targets.length < count) targets.push(c);
    for (const target of targets) {
      if (!this.alive) return;
      const labels = [target, ...pickDistractors(target, got, 2)].sort(() => Math.random() - 0.5);
      const opts = labels.map((l, i) => {
        const s = new LetterStar({ label: l, size: 1.0 });
        s.setPos((i - 1) * 3.2, 2.0, 1.6);
        this.world.scene.add(s.root);
        this.world.updaters.add((dt) => s.update(dt, this.world.camera));
        void s.appear(i * 120);
        this.stars.push(s);
        return s;
      });
      const correct = opts[labels.indexOf(target)];
      const prompt = () => play(findLine(target));
      for (const o of opts) this.pickables.add(o);
      let wrong = 0, busy = false;
      void prompt();
      await new Promise<void>((resolve) => {
        const pick = (p: Pickable) => {
          if (busy || p.gone) return;
          if (p === correct) { busy = true; resolve(); return; }
          wrong++; busy = true;
          sfx('sfx_soft', 0.4);
          void p.wobble();
          void (async () => { try { stopSpeech(); await withTimeout(this.laugh(), 6000); await withTimeout(play(nameKey(target)), 4000); } finally { busy = false; } })();
        };
        this.onPick = pick;
        setAnswer(`finale:${target}`, (ok) => pick(ok ? correct : opts.find((o) => o !== correct)!));
      });
      setAnswer(null, null);
      this.onPick = null;
      this.pickables.clear();
      if (wrong) markWeak(this.progress, target); else markStrong(this.progress, target);
      stopSpeech();
      void correct.pop();
      void this.hero.castPose(700);
      await this.world.magic.beam(this.hero.hornWorld(), correct.worldCenter(), PALETTE.magic, HARMONY[r].color, 0.5);
      this.world.magic.burst(correct.worldCenter(), 70, correct.color, 2.6, 0.3, 0.9, -1);
      await play(bankLine('ok').key);
      await spellExample(target, { short: true });
      for (const o of opts) void o.vanish();
    }
  }

  /** Chạy cả trận. */
  async run(opts: FinaleOpts): Promise<void> {
    const { world, hero } = this;
    showHud(true);
    showPlay(false);
    for (let r = 0; r < Math.min(opts.round, 5); r++) { this.lightGem(r); this.convertNow(r); }
    const startRound = Math.min(opts.round, 5);
    if (!opts.cine && startRound === 0) await this.intro();
    if (opts.cine !== 'ending') {
      if (!opts.cine) {
        this.phase = 'fight';
        world.setCamera(BATTLE_CAM.pos, BATTLE_CAM.look, false, BATTLE_CAM.fov);
        for (let r = startRound; r < HARMONY.length; r++) {
          if (!this.alive) return;
          const h = HARMONY[r];
          await narrate(`f_round_${r + 1}`);
          if (h.kind === 'letters') await this.letterRound(r, h.count ?? 1);
          else {
            const sa = new SpellActivity(this.ctx, [h.word!], 0, 0.2);
            await sa.setup();
            sa.onWord = async (w) => { await play(`wa_${w === 'ba' ? 'ba' : w === 'mẹ' ? 'mej' : 'baf'}`); };
            await sa.spellWord(h.word!);
          }
          if (!this.alive) return;
          await this.signature(r);
          this.lightGem(r);
          for (const [k, a] of this.family.entries()) setTimeout(() => a.hop(4.5), k * 60);
          if (r < 4) await say('nightmare', `f_taunt_${r + 1}`);
          saveProgress(this.progress);
        }
      }
      await this.climax();
    }
    await this.ending(opts.auto);
  }

  private async intro(): Promise<void> {
    const { world } = this;
    this.phase = 'intro';
    // quái + Nữ hoàng ẩn đầu cảnh, hạ xuống dần
    const bossY = this.boss.y;
    for (const m of this.army) m.root.visible = false;
    await Cine.play(world, async (c) => {
      c.camNow(V(0, 34, 26), V(0, 0, -4), 50);
      titleCard('Chương 4', 'Trận Canterlot');
      void world.tweenNight(0.92, 2500);
      await c.nar('f_1');
      void c.cam(V(-14, 12, -2), V(0, 2, -8), 5200, 46);
      this.boss.y = 14;
      void c.tween(2600, (k) => { this.boss.y = 14 - (14 - bossY) * k; });
      this.army.forEach((m, i) => setTimeout(() => {
        m.root.visible = true;
        world.shadow.burst(V(m.x, 1, m.z), 30, 0x5a2fb0, 2, 0.45, 1.0, -0.5);
      }, 600 + i * 110));
      await c.nar('f_2');
      await c.say('nightmare', 'f_3');
      await c.cam(V(12, 6, 14), V(0, 1.5, 4), 3000, 44);
      await c.nar('f_4');
      await c.say('ba-cuong', 'f_5');
      await c.cam(BATTLE_CAM.pos, BATTLE_CAM.look, 2200, BATTLE_CAM.fov);
      await c.say('spike', 'f_6');
    });
    this.boss.y = bossY;
    for (const m of this.army) m.root.visible = true;
  }

  /** Đôi cánh ánh sáng sau lưng Twilight. */
  private wingSprite(): THREE.Sprite {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    const g = c.getContext('2d')!;
    for (const s of [-1, 1]) {
      const grad = g.createRadialGradient(256 + s * 120, 128, 10, 256 + s * 120, 128, 140);
      grad.addColorStop(0, 'rgba(255,255,255,0.95)');
      grad.addColorStop(0.5, 'rgba(255,200,255,0.55)');
      grad.addColorStop(1, 'rgba(255,200,255,0)');
      g.fillStyle = grad;
      g.beginPath();
      g.ellipse(256 + s * 130, 120, 130, 70, s * -0.35, 0, Math.PI * 2);
      g.fill();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  }

  private async climax(): Promise<void> {
    const { world, hero } = this;
    this.phase = 'climax';
    for (let i = this.lit; i < 5; i++) this.lightGem(i);
    const photoTex = new THREE.CanvasTexture(await photoCanvas(firstPhoto('nhim-1', 'nhim-2'), 1, 512, { x: 0.47, y: 0.42, zoom: 1.5 }));
    photoTex.colorSpace = THREE.SRGBColorSpace;
    const photo = new THREE.Mesh(new THREE.CircleGeometry(1.3, 48), new THREE.MeshBasicMaterial({ map: photoTex, transparent: true, opacity: 0, depthWrite: false }));
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.3, 1.5, 48), new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0, depthWrite: false }));
    world.scene.add(photo, ring);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xfff0ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
    world.scene.add(halo);
    this.glowWings = this.wingSprite();
    this.glowWings.scale.set(0.01, 0.01, 1);
    world.scene.add(this.glowWings);
    const follow = () => {
      const p = V(hero.x, hero.y + 1.4, hero.z);
      halo.position.copy(p);
      this.glowWings!.position.copy(p).add(V(0, 0.4, -0.3));
      photo.position.copy(p).add(V(0, 2.3, 1.0));
      ring.position.copy(photo.position);
      photo.lookAt(world.camera.position); ring.lookAt(world.camera.position);
    };
    world.updaters.add(follow);
    await Cine.play(world, async (c) => {
      c.camNow(V(0, 4.6, 15), V(0, 2.6, 4), 46);
      this.gemSpin = 3.5;
      await c.nar('cl_1');
      void c.orbit(V(hero.x, 3.6, hero.z), 11, 4.8, 0.0, -0.6, 7000, 50);
      // sáng rực + bay lên + dang cánh
      void c.tween(3200, (k) => {
        hero.y = k * 2.6;
        halo.scale.setScalar(1 + k * 9);
        halo.material.opacity = k * 0.9;
        this.glowWings!.scale.set(0.01 + k * 7, 0.01 + k * 3.5, 1);
        if (Math.random() < 0.6) world.magic.twinkle(V(hero.x, hero.y + 1.4, hero.z), RAINBOW[Math.floor(Math.random() * 6)], 3, 2.4);
      }, easeOutQuad);
      await c.nar('cl_2');
      // ảnh thật của Nhím loé trong ánh sáng
      sfx('sfx_win', 0.7);
      await c.tween(700, (k) => { (photo.material as THREE.MeshBasicMaterial).opacity = k; (ring.material as THREE.MeshBasicMaterial).opacity = k; photo.scale.setScalar(0.7 + k * 0.75); ring.scale.copy(photo.scale); });
      await c.nar('cl_3'); // phụ đề đáy màn: không che ảnh của Nhím
      await c.tween(600, (k) => { (photo.material as THREE.MeshBasicMaterial).opacity = 1 - k; (ring.material as THREE.MeshBasicMaterial).opacity = 1 - k; });
      // tia cầu vồng
      await c.cam(V(7, 6, 10), V(0, 3, -5), 1200, 48);
      void c.nar('cl_4');
      const target = V(this.boss.x, this.boss.y + BOSS_H * 0.5, this.boss.z);
      const from = V(hero.x, hero.y + 1.8, hero.z);
      await Promise.all(RAINBOW.map((col, i) => c.wait(i * 80).then(() => world.magic.beam(from.clone().add(V((i - 2.5) * 0.15, 0, 0)), target, col, 0xffffff, 1.1))));
      for (let k = 0; k < 3; k++) { world.magic.burst(target, 140, RAINBOW[(k * 2) % 6], 5, 0.42, 1.2, -1); await c.wait(150); }
      whiteOut(true, 900);
      await c.wait(1200);
    });
    world.updaters.delete(follow);
    photo.removeFromParent(); ring.removeFromParent();
    halo.removeFromParent();
    this.glowWings?.removeFromParent();
    // màn trắng: đổi Nữ hoàng → bác Hanh (để phim kết mở ra là đã sáng)
    this.boss.root.visible = false;
    this.aura.visible = false;
    for (const m of this.army) if (m.possessed) void m.purify(true);
    whiteOut(true, 10);
  }

  private async ending(auto: boolean): Promise<void> {
    const { world, hero } = this;
    this.phase = 'ending';
    this.boss.root.visible = false;
    this.aura.visible = false;
    for (const m of this.army) if (m.possessed) { void m.purify(true); const [x, z] = this.allySpot(this.army.indexOf(m)); m.place(x, z); }
    hero.y = 0;
    this.gemSpin = 0.8;
    const L = this.luna;
    L.place(BOSS.x, BOSS.z + 4, 0);
    L.y = 3; L.root.visible = true; L.setFlap(1);
    world.setNight(0.7);
    await Cine.play(world, async (c) => {
      c.camNow(V(0, 6.8, 18), V(0, 2.4, -1), 46);
      whiteOut(false, 1600);
      void world.tweenNight(0.0, 5000);
      world.tweenGround(0xb8e986, 0x8fd16a, 5000);
      await c.nar('e_1');
      await c.nar('e_2');
      L.hover = 0.5;
      await L.travel(-1.8, HERO.z - 1.6, 1600, 0.8);
      L.faceTo(hero.x, hero.z);
      L.setFlap(0.5);
      await c.say('bac-hanh', 'e_3');
      // cả nhà + bạn bè ùa tới ôm Nhím
      hero.faceTo(hero.x, hero.z + 5);
      void c.cam(V(0, 4.8, 15.5), V(0, 1.6, 4.0), 2400, 44);
      const huggers = this.family.slice(0, 7);
      await Promise.all(huggers.map((a, i) => {
        // ôm quanh Nhím ở PHÍA SAU + 2 bên (camera nhìn từ trước) → không che Nhím
        const ang = Math.PI * (1.05 + 0.9 * (i / Math.max(1, huggers.length - 1)));
        return a.travel(hero.x + Math.cos(ang) * 2.6, hero.z - 0.2 + Math.sin(ang) * 1.9, 1400, 0.6).then(() => a.faceTo(hero.x, hero.z));
      }));
      for (const a of this.family) a.hop(5);
      void hero.celebrate();
      await c.say('ba-tuyet', 'e_4');
      // pháo hoa
      const fw = setInterval(() => {
        const p = V((Math.random() - 0.5) * 24, 9 + Math.random() * 6, -8 - Math.random() * 6);
        world.magic.burst(p, 90, RAINBOW[Math.floor(Math.random() * 6)], 4.5, 0.45, 1.3, -1.2);
      }, 380);
      confetti(80);
      await c.say('me-yen', 'e_6');
      await c.say('ba-cuong', 'e_7');
      await c.say('ong-cuong', 'e_8');
      await c.wait(1200);
      clearInterval(fw);
    });
    if (!this.progress.done.includes(4)) this.progress.done.push(4);
    this.progress.resume = null;
    saveProgress(this.progress);
    await showBigPhoto(auto);
    await narrate('e_9');
    await showAlbumBook(this.progress.done, auto);
  }

  dispose(): void {
    this.alive = false;
    stopSpeech();
    setHarmony(null);
    for (const a of this.family) a.dispose();
    this.boss?.dispose();
    this.luna?.dispose();
    for (const m of this.army) m.dispose();
    for (const s of this.stars) s.dispose();
    for (const g of this.gems) g.removeFromParent();
    this.world.clearChapter();
    this.world.setCamera(null);
    this.world.setShadows(true);
  }
}

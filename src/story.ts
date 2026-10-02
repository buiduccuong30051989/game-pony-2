// Điều phối 1 chương: dựng đảo, xếp hàng bạn, chạy lần lượt các nhịp (cảnh → chơi → học → … → cứu → ôn → album).
// "Chơi" = Twilight tự đi tới chỗ hoạt động kế tiếp (đường sao dẫn lối, nhặt ngọc). Lưu tiến độ sau mỗi nhịp để chơi tiếp.
import * as THREE from 'three';
import { CHAPTERS, CAST, FRIENDS_OF, MAX_PARADE, PALETTE, familyBefore, type CastId, type ChapterDef, type FriendId } from './data';
import type { World } from './world';
import type { Hero } from './hero';
import { Actor } from './actors';
import { Parade } from './parade';
import { makeActivity, HuntActivity, type Activity, type Ctx } from './activities';
import { RescueActivity } from './rescue';
import { playChapterCine } from './cines';
import { openBoard, runReview } from './board';
import { chapterPage, showAlbumPage } from './album';
import { sfx, stopSpeech } from './audio';
import { bankLine } from './voice';
import { say, clearTalk } from './talk';
import { saveProgress, type Progress } from './progress';
import type { Pickable } from './letterstar';
import { showHud, showPlay, setChapterTitle, setBoardCount, setGems } from './ui';
import { wait } from './tween';

export interface StoryEnv {
  world: World;
  hero: Hero;
  progress: Progress;
  /** debug: tự trả lời / tự đi (test headless) */
  auto: boolean;
}

/** Trạng thái chương đang chơi (main.ts đọc để xử lý chạm + test). */
export class ChapterRun {
  readonly parade: Parade;
  readonly pickables = new Set<Pickable>();
  onPick: ((p: Pickable) => void) | null = null;
  activities: (Activity | null)[] = [];
  beat = -1;
  /** đang cho bé tự đi */
  playing = false;
  private alive = true;
  private idleT = 0;
  private idleNext = 20;
  private idleFn: (() => void) | null = null;
  private guideT = 0;
  private target: { x: number; z: number; r: number } | null = null;
  gems = 0;
  readonly ctx: Ctx;

  constructor(private env: StoryEnv, readonly def: ChapterDef) {
    this.parade = new Parade(env.world, env.hero);
    this.ctx = {
      world: env.world, hero: env.hero, parade: this.parade, progress: env.progress,
      alive: () => this.alive,
      pickables: this.pickables,
      get onPick() { return run.onPick; },
      set onPick(f) { run.onPick = f; },
      poke: () => { this.idleT = 0; },
      setIdle: (fn) => { this.idleFn = fn; this.idleT = 0; this.idleNext = 20; },
    };
    const run = this;
  }

  stop(): void {
    this.alive = false;
    stopSpeech();
    clearTalk();
    for (const a of this.activities) a?.dispose();
    this.parade.dispose();
    this.pickables.clear();
    this.env.world.clearChapter();
  }
  get isAlive(): boolean { return this.alive; }

  /** Mỗi khung (main.ts gọi khi đang ở chương). */
  tick(dt: number): void {
    const { hero, world } = this.env;
    this.parade.update(dt);
    if (hero.moving) this.idleT = 0;
    // câu nhắc khi bé im lặng lâu: 20 s, rồi 40 s, 80 s… (không lải nhải)
    if (this.playing || this.idleFn) {
      this.idleT += dt;
      if (this.idleT > this.idleNext) {
        this.idleT = 0;
        this.idleNext = Math.min(this.idleNext * 2, 160);
        if (this.idleFn) this.idleFn();
        else { const l = bankLine('idle'); void say('spike', l.key, l.text); }
      }
    }
    // đường sao dẫn tới hoạt động kế tiếp
    if (this.playing && this.target) {
      this.guideT += dt;
      if (this.guideT > 0.35) {
        this.guideT = 0;
        const from = new THREE.Vector3(hero.x, 0.5, hero.z);
        const tg = new THREE.Vector3(this.target.x, 0.5, this.target.z);
        const d = from.distanceTo(tg);
        if (d > 3.5) {
          const dir = tg.clone().sub(from).normalize();
          for (let i = 0; i < 4; i++) {
            const p = from.clone().add(dir.clone().multiplyScalar(2.2 + i * 1.4));
            world.magic.emit({ x: p.x, y: 0.4 + Math.random() * 0.4, z: p.z, color: PALETTE.star, vy: 0.6, max: 0.9, size: 0.28 });
          }
        }
      }
    }
    // nhặt ngọc
    for (const g of world.gems) {
      if (!g.taken && Math.hypot(g.x - hero.x, g.z - hero.z) < 1.2 && hero.y < 1.6) {
        g.taken = true;
        this.gems++;
        setGems(this.gems);
        sfx('sfx_pop', 0.45);
        world.magic.burst(g.pos, 26, 0x7fd8ff, 1.8, 0.24, 0.6, -1);
      }
    }
  }

  /** Dựng chương. */
  async setup(): Promise<void> {
    const { world, hero, progress } = this.env;
    const def = this.def;
    const keep: [number, number, number][] = [[def.start[0], def.start[1], 4]];
    for (const b of def.beats) {
      if ('x' in b) {
        const r = b.t === 'rescue' ? 7.5 : b.t === 'bridge' || b.t === 'lock' ? 3.5 : 6.5;
        keep.push([b.x, ('z' in b ? b.z : 0), r]);
      }
    }
    await world.buildChapter(def, keep);
    // cầu / cổng: chặn cả bề ngang đảo → dọn cây trên đường suối / hàng rào
    world.scene.add(hero.root);
    hero.x = def.start[0]; hero.z = def.start[1];
    hero.locked = false;
    hero.stop();
    hero.faceTo(hero.x + 5, hero.z);
    world.snapFollow(hero.x, hero.z);
    // hàng đi theo: Spike, mèo, người nhà đã cứu, bạn ngựa nhỏ cứu ở chương trước
    const fam = familyBefore(def.n).filter((x) => x !== 'bac-hanh');
    const ids: CastId[] = ['spike', ...fam.filter((x) => CAST[x].kind === 'cat'), ...fam.filter((x) => CAST[x].kind !== 'cat')];
    const mine = FRIENDS_OF(def.n);
    const friends = progress.friends.filter((f) => !mine.includes(f)).slice(-(MAX_PARADE - ids.length));
    const actors = await Promise.all([...ids, ...friends].map((id) => Actor.create(world, id)));
    for (const a of actors) this.parade.add(a);
    this.parade.placeAll();
    // hoạt động
    const rescueWho = def.rescue;
    this.activities = def.beats.map((b) => (b.t === 'rescue' ? new RescueActivity(this.ctx, b, rescueWho) : makeActivity(this.ctx, b)));
    // ôn cách quãng: chữ yếu nhất (đã nhặt, không thuộc chương này) quay lại làm mục tiêu cuối của lần săn sao đầu tiên
    const weak = Object.entries(progress.weak).filter(([c]) => progress.letters.includes(c) && !def.letters.includes(c)).sort((a, b) => b[1] - a[1]);
    const firstHunt = this.activities.find((a) => a instanceof HuntActivity) as HuntActivity | undefined;
    if (weak.length && firstHunt) firstHunt.extra = weak[0][0];
    await Promise.all(this.activities.map((a) => a?.setup()));
    this.updateBarrier();
    setChapterTitle(`${def.n}. ${def.title}`);
    setBoardCount(progress.letters.length);
    setGems(0);
  }

  private updateBarrier(): void {
    this.env.world.barrierX = Math.min(Infinity, ...this.activities.filter((a) => a && !a.done).map((a) => a!.barrier()));
  }

  /** Chạy chương từ nhịp `from`. Trả về true nếu xong cả chương. */
  async run(from = 0): Promise<boolean> {
    const { world, hero, progress } = this.env;
    const def = this.def;
    // nhảy cóc: hoàn tất ngay các nhịp trước
    for (let k = 0; k < from && k < def.beats.length; k++) {
      const a = this.activities[k];
      if (a) {
        a.finishNow();
        if (a instanceof RescueActivity) for (const r of a.rescued) this.parade.add(r, true);
        const tg = a.trigger();
        hero.x = tg.x + 6; hero.z = tg.z + 1.5;
      }
    }
    if (from > 0) {
      if (def.beats.slice(0, from).some((b) => b.t === 'rescue') && def.n === 1) {
        // mèo đã cứu: thêm vào hàng
        for (const id of ['mun', 'rom'] as CastId[]) if (!this.parade.list.some((a) => a.id === id)) this.parade.add(await Actor.create(world, id), true);
      }
      [hero.x, hero.z] = world.clampToIsland(hero.x, hero.z);
      world.snapFollow(hero.x, hero.z);
      this.parade.placeAll();
      this.updateBarrier();
    }
    // trời sáng dần theo tiến độ (phép mạnh lên)
    const steps = def.beats.filter((b) => 'x' in b).length;
    let lit = def.beats.slice(0, from).filter((b) => 'x' in b).length;
    world.setNight(Math.max(0.05, def.theme.night * (1 - lit / steps)));
    showHud(true);

    for (let k = from; k < def.beats.length; k++) {
      if (!this.alive) return false;
      this.beat = k;
      progress.resume = { ch: def.n, beat: k };
      saveProgress(progress);
      const b = def.beats[k];
      const a = this.activities[k];
      if (b.t === 'cine') {
        showPlay(false);
        hero.stop();
        await playChapterCine(world, hero, b.id);
      } else if (a) {
        // chơi: tự đi tới chỗ hoạt động
        this.target = a.trigger();
        this.playing = true;
        showPlay(true);
        if (this.env.auto) hero.goTo(this.target.x, this.target.z);
        await this.waitArrive(this.target);
        if (!this.alive) return false;
        this.playing = false;
        this.target = null;
        const v = a.view();
        const tg = a.trigger();
        if (v) {
          hero.stop();
          hero.locked = true;
          showPlay(false);
          world.setCamera(v.pos, v.look, false, 40);
          this.parade.huddleAt = { x: tg.x + 4, z: tg.z };
        } else {
          showPlay(true);
          this.parade.huddleAt = null;
          world.focus = a.focus();
        }
        await a.run();
        if (!this.alive) return false;
        hero.locked = false;
        world.focus = null;
        world.setCamera(null);
        this.parade.huddleAt = null;
        this.updateBarrier();
        lit++;
        if (world.night > 0.06) void world.tweenNight(Math.max(0.05, def.theme.night * (1 - lit / steps)), 1800);
      } else if (b.t === 'review') {
        showPlay(false);
        hero.stop();
        await wait(400);
        await openBoard(progress.letters, { fresh: def.letters, autoCloseMs: this.env.auto ? 600 : 5500 });
        await runReview(progress, def.letters, 3);
        saveProgress(progress);
      } else if (b.t === 'album') {
        showPlay(false);
        await showAlbumPage(chapterPage(def.n), this.env.auto);
      }
    }
    if (!this.alive) return false;
    if (!progress.done.includes(def.n)) progress.done.push(def.n);
    progress.unlocked = Math.max(progress.unlocked, def.n + 1);
    progress.resume = null;
    saveProgress(progress);
    return true;
  }

  private waitArrive(t: { x: number; z: number; r: number }): Promise<void> {
    const { hero, world } = this.env;
    return new Promise((resolve) => {
      const check = () => {
        if (!this.alive) { world.updaters.delete(check); resolve(); return; }
        // tới gần chỗ bài học, hoặc đã đi QUA nó (bay vèo qua / chạy lố) → vẫn bắt đầu bài; chờ chạm đất
        const near = Math.hypot(hero.x - t.x, hero.z - t.z) < t.r || hero.x > t.x;
        if (near) hero.land();
        if (near && hero.grounded) { world.updaters.delete(check); resolve(); }
      };
      world.updaters.add(check);
    });
  }

  /** Bạn ngựa nhỏ đã cứu ở chương này (cho test). */
  friendsHere(): FriendId[] { return FRIENDS_OF(this.def.n).filter((f) => this.env.progress.friends.includes(f)); }
}

export const chapterDef = (n: number): ChapterDef => CHAPTERS[n - 1];

// HỌC TRONG CẢNH (không có bảng quiz bật lên):
//  - HuntActivity: sao chữ 3D đứng trong cảnh, giọng "Nhím ơi, tìm chữ ô nào!", bé điều khiển Twilight chạm vào sao đúng.
//  - BridgeActivity: cầu gãy qua suối, tấm ván có chữ lơ lửng, chạm đúng ván → lắp vào cầu.
//  - LockActivity: cổng khoá, ổ khoá có chữ, 3 sao bay vòng quanh, chạm đúng → khoá mở.
//  - SpellActivity: ghép chữ bằng phép (phụ âm + vần [+ dấu]) → 2 sao nhập thành tiếng, đọc đánh vần, đồ vật hiện ra.
// Đúng: sao bay vào bảng chữ. Sai: lắc nhẹ + đọc lại tên chữ cần tìm, không phạt (chữ sai ghi `weak` để ôn lại).
import * as THREE from 'three';
import { CAST, PALETTE, type Beat, type FriendId, type MonsterKind } from './data';
import type { World } from './world';
import { pathZ } from './world';
import type { Hero } from './hero';
import { Actor } from './actors';
import { Monster } from './monster';
import type { Parade } from './parade';
import { LetterStar, Plank, type Pickable, type ToneName } from './letterstar';
import { letter, nameKey, confusablesOf, LETTER_ORDER } from './letters';
import { spell, splitTone, slug } from './spell';
import { WORDS } from './words';
import { lockKey, spellKey, toneFindKey, FRIEND_THANKS, thanksKey } from './lines';
import { play, sfx, speakSequence, stopSpeech } from './audio';
import { sayBank, findLine, bankLine } from './voice';
import { say, narrate } from './talk';
import { addLetter, markWeak, markStrong, saveProgress, type Progress } from './progress';
import { setAnswer } from './testhook';
import { spellExample } from './example';
import { flyToBoard, setBoardCount, bumpBoard, confetti, showWord, hideWord, toast } from './ui';
import { tween, wait, easeOutBack } from './tween';

/** Mọi thứ hoạt động cần. */
export interface Ctx {
  world: World;
  hero: Hero;
  parade: Parade;
  progress: Progress;
  /** đổi chương / thoát → kịch bản cũ tự dừng */
  alive(): boolean;
  /** sao / ván đang chạm được (main.ts raycast khi bé chạm) */
  pickables: Set<Pickable>;
  /** chạm vào 1 vật chạm được → hàm này (null: chạm thì Twilight chạy tới vật) */
  onPick: ((p: Pickable) => void) | null;
  /** bé vừa tương tác (đi / chạm) → hoãn câu nhắc */
  poke(): void;
  /** đặt hàm nhắc khi bé im lặng lâu (20 s, rồi 40 s, 80 s…); null = nhắc mặc định (đi tiếp) */
  setIdle(fn: (() => void) | null): void;
  /** gọi thêm khi bé chọn sai (trận cuối: Nữ hoàng cười, bóng tối tiến lên) */
  onWrong?: () => Promise<void>;
}

/** Chữ nhiễu cho 1 chữ cần chọn: ưu tiên cặp dễ lẫn, rồi chữ bé đã biết, rồi chữ bất kỳ. */
export function pickDistractors(target: string, known: string[], n: number, avoid: string[] = []): string[] {
  const out: string[] = [];
  const ok = (c: string) => c !== target && !out.includes(c) && !avoid.includes(c);
  for (const c of confusablesOf(target).sort(() => Math.random() - 0.5)) if (ok(c) && out.length < n) out.push(c);
  for (const c of [...known].sort(() => Math.random() - 0.5)) if (ok(c) && out.length < n) out.push(c);
  for (const c of [...LETTER_ORDER].sort(() => Math.random() - 0.5)) if (ok(c) && out.length < n) out.push(c);
  return out;
}

const hex = (c: number) => '#' + c.toString(16).padStart(6, '0');

/** Nhặt 1 chữ: bay vào bảng chữ, cập nhật tiến độ. */
async function collect(ctx: Ctx, ch: string, from: THREE.Vector3, color: number): Promise<void> {
  const fresh = addLetter(ctx.progress, ch);
  saveProgress(ctx.progress);
  const s = ctx.world.toScreen(from);
  sfx('sfx_win', 0.45);
  await flyToBoard(s.x, s.y, ch, hex(color));
  setBoardCount(ctx.progress.letters.length);
  bumpBoard();
  if (fresh) toast(`${ch}  ${letter(ch).emoji}`, 1500);
}

/** Đồ vật của chữ hiện lên (emoji to) ở chỗ sao rồi bay lên tan. */
function popObject(world: World, at: THREE.Vector3, emoji: string, size = 1.6, ms = 2400): void {
  const sp = world.emojiSprite(emoji, 0.01);
  sp.position.copy(at);
  world.scene.add(sp);
  void tween(500, (k) => sp.scale.setScalar(Math.max(0.01, size * k)), easeOutBack)
    .then(() => wait(ms - 900))
    .then(() => tween(400, (k) => { sp.position.y += 0.02; sp.material.opacity = 1 - k; }))
    .then(() => { sp.removeFromParent(); sp.material.dispose(); });
}

/**
 * Chờ bé chạm đúng `correct` trong `opts` (tap). Sai: lắc + câu "chưa đúng" + đọc lại tên chữ cần tìm.
 * `prompt` đọc lại yêu cầu (lúc đầu, khi bé im lặng 20 s…). Trả về số lần sai.
 */
async function chooseTap(ctx: Ctx, opts: Pickable[], correct: Pickable, prompt: () => Promise<void>, sayName: () => Promise<void>, label: string): Promise<number> {
  for (const o of opts) ctx.pickables.add(o);
  let wrong = 0;
  let busy = false, busyAt = 0;
  void prompt();
  let watchdog = 0;
  try {
    await new Promise<void>((resolve) => {
      const pick = (p: Pickable) => {
        if (busy || p.gone) return;
        ctx.poke();
        if (p === correct) {
          busy = true;
          resolve();
          return;
        }
        wrong++;
        busy = true; busyAt = performance.now();
        sfx('sfx_soft', 0.4);
        void p.wobble();
        void (async () => {
          try { stopSpeech(); await withTimeout(ctx.onWrong ? ctx.onWrong() : sayBank('no'), 6000); await withTimeout(sayName(), 4000); }
          finally { busy = false; }
        })();
      };
      ctx.onPick = pick;
      ctx.setIdle(() => void prompt());
      // watchdog: khoá kẹt > 8 s → nhả + nhắc lại (không bao giờ đơ)
      let quietAt = performance.now();
      watchdog = window.setInterval(() => {
        const now = performance.now();
        if ((busy && now - busyAt > 8000) || (!busy && now - quietAt > 15000)) { busy = false; quietAt = now; for (const o of opts) if (!o.gone) ctx.pickables.add(o); void prompt(); }
      }, 1000);
      const pick0 = pick;
      ctx.onPick = (p) => { quietAt = performance.now(); pick0(p); };
      setAnswer(label, (ok) => pick(ok ? correct : opts.find((o) => o !== correct && !o.gone) ?? correct));
    });
  } finally {
    clearInterval(watchdog);
    ctx.onPick = null;
    ctx.setIdle(null);
    setAnswer(null, null);
    for (const o of opts) ctx.pickables.delete(o);
  }
  return wrong;
}

/** Chờ p nhưng không quá ms (audio treo / không giải mã được thì game vẫn chạy tiếp). */
export function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | void> {
  return Promise.race([p, new Promise<void>((r) => setTimeout(r, ms))]);
}

// ------------------------------------------------------------------ nền chung

export abstract class Activity {
  done = false;
  monster: Monster | null = null;
  friendActor: Actor | null = null;
  readonly stars: LetterStar[] = [];
  constructor(protected ctx: Ctx) {}
  /** dựng vật thể (thấy trước khi tới) */
  abstract setup(): Promise<void>;
  /** chỗ Twilight phải tới để bắt đầu (x, z, bán kính) */
  abstract trigger(): { x: number; z: number; r: number };
  abstract run(): Promise<void>;
  /** hoàn tất ngay (chơi tiếp từ giữa chương) */
  abstract finishNow(): void;
  /** hàng rào x (cầu / cổng) khi chưa xong, Infinity nếu không chặn */
  barrier(): number { return Infinity; }
  /** góc camera cố định khi làm bài (null = bám Twilight) */
  view(): { pos: THREE.Vector3; look: THREE.Vector3 } | null { return null; }
  /** camera bám Twilight nhưng nghiêng về điểm này (săn sao) */
  focus(): { x: number; z: number } | null { return null; }

  protected async addMonster(kind: MonsterKind | undefined, friend: FriendId | undefined, x: number, z: number): Promise<void> {
    if (!kind) return;
    const m = await Monster.create(this.ctx.world, kind, x, z);
    m.faceTo(x - 4, z + 6);
    this.ctx.world.scene.add(m.root);
    this.monster = m;
    this.ctx.world.updaters.add((dt) => m.update(dt));
    this.ctx.parade.avoid.push({ x, z, r: 1.2 });
    if (friend) {
      const a = await Actor.create(this.ctx.world, friend);
      m.holdFriend(a, x - 6, z + 4);
      this.friendActor = a;
      const bp = m.bubblePos!;
      this.ctx.parade.avoid.push({ x: bp.x, z: bp.z, r: 1.4 });
    }
  }

  /** Quái được thanh tẩy + bạn trong bong bóng ra cảm ơn rồi vào hàng. */
  protected async freeMonster(): Promise<void> {
    const m = this.monster;
    if (!m) return;
    const { world, hero } = this.ctx;
    void hero.castPose(900);
    await world.magic.beam(hero.hornWorld(), m.center(), PALETTE.magic, 0xffffff, 0.8);
    await m.purify();
    confetti(40);
    await sayBank('purify');
    const fr = await m.popBubble();
    if (fr && this.ctx.alive()) {
      await wait(500);
      fr.faceTo(hero.x, hero.z);
      fr.hop(6);
      world.magic.burst(fr.center(), 50, 0xffe08a, 2.0, 0.28, 0.8, -1);
      // lời cảm ơn riêng của bạn đó (tên tiếng Anh đọc bằng giọng tiếng Anh)
      const list = FRIEND_THANKS[fr.id] ?? [];
      const i = Math.floor(Math.random() * list.length);
      if (list.length) await say(fr.id, thanksKey(fr.id, i), list[i]);
      this.joinFriend(fr);
    }
    m.faceTo(hero.x, hero.z + 4);
  }

  private joinFriend(fr: Actor): void {
    const id = fr.id as FriendId;
    if (!this.ctx.progress.friends.includes(id)) this.ctx.progress.friends.push(id);
    saveProgress(this.ctx.progress);
    this.ctx.parade.add(fr);
  }

  protected freeMonsterNow(): void {
    const m = this.monster;
    if (!m) return;
    void m.purify(true);
    const fr = m.releaseNow();
    if (fr) this.joinFriend(fr);
  }

  protected track(s: LetterStar): LetterStar {
    this.stars.push(s);
    this.ctx.world.scene.add(s.root);
    this.ctx.world.updaters.add((dt) => s.update(dt, this.ctx.world.camera));
    return s;
  }

  dispose(): void {
    for (const s of this.stars) s.dispose();
    this.monster?.dispose();
    if (this.monster?.friend) this.monster.friend.dispose();
  }
}

// ------------------------------------------------------------------ săn sao chữ

export class HuntActivity extends Activity {
  private cx: number; private cz: number;
  /** ôn cách quãng: 1 chữ bé từng chọn sai ở chương trước, thêm làm mục tiêu cuối */
  extra: string | null = null;
  constructor(ctx: Ctx, private b: Extract<Beat, { t: 'hunt' }>) {
    super(ctx);
    this.cx = b.x; this.cz = pathZ(b.x) + b.z;
  }
  trigger() { return { x: this.cx - 7.5, z: this.cz, r: 5.5 }; }
  focus() { return { x: this.cx + 0.5, z: this.cz }; }

  private get targets(): string[] { return this.extra ? [...this.b.letters, this.extra] : this.b.letters; }

  async setup(): Promise<void> {
    const all = [...this.targets, ...this.b.decoys.filter((d) => d !== this.extra)].sort(() => Math.random() - 0.5);
    // sao xếp vòng cung trước mặt camera quanh tâm, cách nhau ≥ 2.6, phía trước chỗ Twilight dừng
    const n = all.length;
    all.forEach((ch, i) => {
      const a = n === 1 ? 0 : -1 + (2 * i) / (n - 1);
      const s = this.track(new LetterStar({ label: ch, size: 1.25 }));
      s.setPos(this.cx + 0.5 + a * 3.6, 1.35, this.cz + 1.6 - Math.abs(a) * 1.6 + (i % 2) * 0.9);
      s.root.userData.letter = ch;
    });
    await this.addMonster(this.b.monster, this.b.friend, this.cx + 1.5, this.cz - 3.6);
  }

  async run(): Promise<void> {
    const { ctx } = this;
    const { hero, world } = ctx;
    await sayBank('hunt');
    for (const target of this.targets) {
      if (!ctx.alive()) return;
      const prompt = () => play(findLine(target));
      void prompt();
      let wrong = 0;
      const armed = new Set<LetterStar>(this.stars.filter((s) => !s.gone));
      let watchdog = 0;
      let restorePoke = () => {};
      const star = await new Promise<LetterStar>((resolve) => {
        // lock = đang đọc câu "chưa đúng" (không nhận chạm). LUÔN được nhả: finally + hạn giờ + watchdog.
        let lock = false, lockAt = 0;
        const onTouch = (s: LetterStar) => {
          if (lock) return;
          ctx.poke();
          if (s.label === target) { lock = true; world.updaters.delete(watch); resolve(s); return; }
          wrong++;
          if (wrong === 1) markWeak(ctx.progress, target);
          sfx('sfx_soft', 0.4);
          void s.wobble();
          void this.monster?.giggle();
          lock = true; lockAt = performance.now();
          void (async () => {
            try { stopSpeech(); await withTimeout(sayBank('no'), 5000); await withTimeout(play(nameKey(target)), 4000); }
            finally { lock = false; }
          })();
        };
        const watch = () => {
          for (const s of this.stars) {
            if (s.gone) continue;
            const d = Math.hypot(s.root.position.x - hero.x, s.root.position.z - hero.z);
            // BUG cũ (đơ): chạm sao lúc đang khoá (vừa chọn sai) thì "tiêu" mất lần chạm → Twilight đứng ngay trên sao đúng
            // mà không bao giờ nhận. Giờ: đang khoá thì KHÔNG tiêu lần chạm, nhả khoá xong sẽ nhận.
            if (d < 1.15 && armed.has(s) && !lock) { armed.delete(s); onTouch(s); }
            else if (d > 1.9) armed.add(s);
          }
        };
        world.updaters.add(watch);
        // chạm vào sao → Twilight chạy tới đó; đang đứng sát sao đó rồi thì nhận luôn
        ctx.onPick = (p) => {
          if (!(p instanceof LetterStar) || p.gone) return;
          ctx.poke();
          if (Math.hypot(p.root.position.x - hero.x, p.root.position.z - hero.z) < 1.3) { armed.delete(p); onTouch(p); }
          else hero.goTo(p.root.position.x, p.root.position.z + 0.2);
        };
        for (const s of this.stars) if (!s.gone) ctx.pickables.add(s);
        ctx.setIdle(() => void prompt());
        // watchdog: khoá kẹt > 8 s (audio treo) → nhả, nạp lại mọi sao, nhắc lại
        // + 15 s không có gì xảy ra → nạp lại mọi sao (Twilight đang đứng sẵn trên sao đúng thì nhận ngay) + nhắc lại
        let quietAt = performance.now();
        const poke0 = ctx.poke;
        ctx.poke = () => { quietAt = performance.now(); poke0(); };
        watchdog = window.setInterval(() => {
          const now = performance.now();
          if ((lock && now - lockAt > 8000) || (!lock && now - quietAt > 15000)) {
            lock = false; quietAt = now;
            for (const s of this.stars) if (!s.gone) armed.add(s);
            void prompt();
          }
        }, 1000);
        restorePoke = () => { ctx.poke = poke0; };
        setAnswer(`hunt:${target}`, (ok) => {
          const s = ok ? this.stars.find((x) => x.label === target && !x.gone) : this.stars.find((x) => x.label !== target && !x.gone);
          if (s) onTouch(s);
        });
      });
      clearInterval(watchdog);
      restorePoke();
      setAnswer(null, null);
      ctx.setIdle(null);
      ctx.onPick = null;
      ctx.pickables.clear();
      if (!wrong) markStrong(ctx.progress, target);
      // đúng!
      stopSpeech();
      void star.pop();
      world.magic.burst(star.worldCenter(), 70, star.color, 2.6, 0.3, 0.9, -1);
      const at = star.worldCenter();
      popObject(world, at.clone().add(new THREE.Vector3(0, 0.6, 0)), letter(target).emoji, 2.2, 6500);
      await play(bankLine('ok').key);
      void star.vanish(500);
      // từ ví dụ: "ô… ô" / "ê… ếch: ê – chờ – ếch" đọc chậm, chữ sáng theo token; xong mới chơi tiếp
      await Promise.all([collect(ctx, target, at, star.color), spellExample(target, { short: false })]);
      // tia phép làm quái yếu dần
      if (this.monster) void world.magic.beam(hero.hornWorld(), this.monster.center(), PALETTE.magicPink, PALETTE.star, 0.7);
    }
    for (const s of this.stars) if (!s.gone) void s.vanish();
    await this.freeMonster();
  }

  finishNow(): void {
    for (const s of this.stars) { s.gone = true; s.root.visible = false; }
    for (const ch of this.b.letters) addLetter(this.ctx.progress, ch);
    this.freeMonsterNow();
  }
}

// ------------------------------------------------------------------ cầu gãy

export class BridgeActivity extends Activity {
  private planks: Plank[] = [];
  private gaps: THREE.Vector3[] = [];
  private group = new THREE.Group();
  private cz: number;
  constructor(ctx: Ctx, private b: Extract<Beat, { t: 'bridge' }>) {
    super(ctx);
    this.cz = pathZ(b.x);
  }
  trigger() { return { x: this.b.x - 3.4, z: this.cz, r: 3.2 }; }
  barrier(): number { return this.done ? Infinity : this.b.x - 2.3; }
  view() { return { pos: new THREE.Vector3(this.b.x - 1, 8.8, this.cz + 13), look: new THREE.Vector3(this.b.x, 1.0, this.cz + 0.5) }; }

  async setup(): Promise<void> {
    const { world } = this.ctx;
    const X = this.b.x;
    const rz = 15;
    // suối xanh cắt ngang đảo + bờ cát
    const water = new THREE.Mesh(new THREE.PlaneGeometry(3.8, rz * 2.2), new THREE.MeshStandardMaterial({ color: 0x5cc8f0, roughness: 0.3, emissive: 0x1a6fa0, emissiveIntensity: 0.25 }));
    water.rotation.x = -Math.PI / 2;
    water.position.set(X, 0.03, 0);
    const bank = new THREE.Mesh(new THREE.PlaneGeometry(4.6, rz * 2.2), new THREE.MeshStandardMaterial({ color: PALETTE.sand, roughness: 1 }));
    bank.rotation.x = -Math.PI / 2;
    bank.position.set(X, 0.02, 0);
    this.group.add(bank, water);
    // cầu: 5 ván, thiếu letters.length ván
    const n = 5;
    const missing = this.b.letters.length === 1 ? [2] : this.b.letters.length === 2 ? [1, 3] : [1, 2, 3];
    const wood = new THREE.MeshStandardMaterial({ color: 0xc98a52, roughness: 0.85 });
    for (let i = 0; i < n; i++) {
      const p = new THREE.Vector3(X - 1.6 + i * 0.8, 0.22, this.cz);
      if (missing.includes(i)) { this.gaps.push(p); continue; }
      const board = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.16, 3.0), wood);
      board.position.copy(p);
      board.castShadow = true;
      this.group.add(board);
    }
    for (const s of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.14, 0.14), wood);
      rail.position.set(X, 0.9, this.cz + s * 1.55);
      const posts = [-2, 0, 2].map((dx) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.9, 8), wood); m.position.set(X + dx, 0.45, this.cz + s * 1.55); return m; });
      this.group.add(rail, ...posts);
    }
    world.chapterGroup?.add(this.group);
    // ván có chữ lơ lửng trên suối, phía trước (gần camera)
    const all = [...this.b.letters, ...this.b.decoys].sort(() => Math.random() - 0.5);
    all.forEach((ch, i) => {
      const pl = new Plank(ch);
      pl.root.position.set(X + (i - (all.length - 1) / 2) * 1.5, 1.3, this.cz + 3.6 + (i % 2) * 0.5);
      pl.baseY = 1.25 + (i % 2) * 0.3;
      pl.root.rotation.y = 0.3;
      world.scene.add(pl.root);
      world.updaters.add((dt) => pl.update(dt, world.camera));
      this.planks.push(pl);
    });
  }

  async run(): Promise<void> {
    const { ctx } = this;
    await say('spike', Math.random() < 0.5 ? 'bridge_1' : 'bridge_2');
    for (let k = 0; k < this.b.letters.length; k++) {
      if (!ctx.alive()) return;
      const target = this.b.letters[k];
      const correct = this.planks.find((p) => p.label === target && !p.gone)!;
      const wrong = await chooseTap(ctx, this.planks.filter((p) => !p.gone), correct,
        () => play(findLine(target)), () => play(nameKey(target)), `bridge:${target}`);
      if (wrong) markWeak(ctx.progress, target); else markStrong(ctx.progress, target);
      stopSpeech();
      correct.gone = true;
      ctx.world.magic.burst(correct.worldCenter(), 60, 0xffd166, 2.4, 0.3, 0.8, -1);
      const from = correct.worldCenter();
      void play(bankLine('ok').key);
      // ván bay vào chỗ trống
      const gap = this.gaps[k];
      const p0 = correct.root.position.clone(), r0 = correct.root.rotation.clone();
      correct.sign.visible = true;
      await tween(800, (q) => {
        correct.root.position.lerpVectors(p0, gap, q);
        correct.root.position.y += Math.sin(q * Math.PI) * 1.2;
        correct.root.rotation.set(r0.x * (1 - q), r0.y * (1 - q), 0);
        correct.board.rotation.x = 0;
      }, easeOutBack);
      correct.sign.position.y = 0.55;
      correct.sign.scale.setScalar(0.7);
      sfx('sfx_tap', 0.5);
      await Promise.all([collect(ctx, target, from, 0xffd166), spellExample(target, { short: false })]);
    }
    for (const p of this.planks) if (!p.gone) { p.gone = true; void tween(400, (q) => p.root.scale.setScalar(Math.max(0.01, 1 - q))).then(() => (p.root.visible = false)); }
    this.done = true;
    confetti(40);
    await play('bridge_done');
  }

  finishNow(): void {
    for (const ch of this.b.letters) addLetter(this.ctx.progress, ch);
    this.planks.forEach((p) => {
      const i = this.b.letters.indexOf(p.label);
      if (i >= 0 && this.gaps[i]) { p.root.position.copy(this.gaps[i]); p.root.rotation.set(0, 0, 0); p.sign.position.y = 0.55; p.sign.scale.setScalar(0.7); }
      else p.root.visible = false;
      p.gone = true;
    });
    this.done = true;
  }

  dispose(): void {
    super.dispose();
    for (const p of this.planks) p.root.removeFromParent();
  }
}

// ------------------------------------------------------------------ cổng khoá

export class LockActivity extends Activity {
  private doors: THREE.Group[] = [];
  private lock = new THREE.Group();
  private lockFace!: THREE.Mesh;
  private cz: number;
  private orbit: LetterStar[] = [];
  private orbitT = 0;
  constructor(ctx: Ctx, private b: Extract<Beat, { t: 'lock' }>) {
    super(ctx);
    this.cz = pathZ(b.x);
  }
  trigger() { return { x: this.b.x - 3.2, z: this.cz, r: 3.2 }; }
  barrier(): number { return this.done ? Infinity : this.b.x - 1.3; }
  view() { return { pos: new THREE.Vector3(this.b.x - 1.5, 6.6, this.cz + 12.5), look: new THREE.Vector3(this.b.x, 2.0, this.cz) }; }

  private faceTex(label: string): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d')!;
    g.fillStyle = '#ffd34d'; g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#fff8e0';
    g.beginPath(); g.arc(128, 128, 104, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#7a3fb8';
    g.font = "800 190px 'Baloo 2', system-ui, sans-serif";
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(label, 128, 140);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  async setup(): Promise<void> {
    const { world } = this.ctx;
    const X = this.b.x, Z = this.cz;
    const g = new THREE.Group();
    // hàng rào hoa phía sau (phía trước để trống cho camera nhìn thấy ổ khoá) + 2 trụ trắng + cổng 2 cánh
    const hedge = new THREE.MeshStandardMaterial({ color: 0x5fbf5a, roughness: 1 });
    const len = 9;
    const h = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.25, len), hedge);
    h.position.set(X, 0.62, Z - (1.9 + len / 2));
    h.castShadow = true;
    g.add(h);
    for (let k = 0; k < 5; k++) {
      const f = world.emojiSprite(k % 2 ? '🌸' : '🌼', 0.6);
      f.position.set(X + 0.55, 1.0 + (k % 3) * 0.2, Z - (2.4 + k * 1.6));
      g.add(f);
    }
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 3.2, 12), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }));
    post.position.set(X, 1.6, Z - 1.9);
    const cap = world.emojiSprite('⭐', 0.7);
    cap.position.set(X, 3.5, Z - 1.9);
    g.add(post, cap);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0xb97cf0, roughness: 0.7 });
    for (const s of [-1, 1]) {
      const hinge = new THREE.Group();
      hinge.position.set(X, 0, Z + s * 1.75);
      const d = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.6, 1.72), doorMat);
      d.position.set(0, 1.3, -s * 0.86);
      d.castShadow = true;
      hinge.add(d);
      g.add(hinge);
      this.doors.push(hinge);
    }
    // ổ khoá vàng TO treo trước cổng, mặt có chữ quay về phía camera (+z)
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.15, 0.5), new THREE.MeshStandardMaterial({ color: 0xffc928, roughness: 0.4, metalness: 0.2, emissive: 0x6a4a00, emissiveIntensity: 0.25 }));
    const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.1, 10, 24, Math.PI), new THREE.MeshStandardMaterial({ color: 0xd9d9e6, roughness: 0.3, metalness: 0.5 }));
    shackle.position.y = 0.57;
    this.lockFace = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), new THREE.MeshBasicMaterial({ map: this.faceTex(this.b.letters[0]) }));
    this.lockFace.position.set(0, -0.02, 0.26);
    this.lock.add(body, shackle, this.lockFace);
    this.lock.position.set(X - 0.4, 2.0, Z + 2.4);
    this.lock.rotation.y = -0.12;
    g.add(this.lock);
    world.chapterGroup?.add(g);
    await this.addMonster(this.b.monster, this.b.friend, X - 3.2, Z - 4.4);
  }

  async run(): Promise<void> {
    const { ctx } = this;
    const { world } = ctx;
    await say('spike', 'lock_intro');
    for (const target of this.b.letters) {
      if (!ctx.alive()) return;
      (this.lockFace.material as THREE.MeshBasicMaterial).map?.dispose();
      (this.lockFace.material as THREE.MeshBasicMaterial).map = this.faceTex(target);
      world.magic.burst(this.lock.getWorldPosition(new THREE.Vector3()), 40, 0xffd166, 1.6, 0.25, 0.7, -1);
      const labels = [target, ...pickDistractors(target, ctx.progress.letters, 2)].sort(() => Math.random() - 0.5);
      this.orbit = labels.map((l) => this.track(new LetterStar({ label: l, size: 0.85 })));
      this.orbit.forEach((s, i) => void s.appear(i * 120));
      const upd = (dt: number) => this.placeOrbit(dt);
      world.updaters.add(upd);
      const correct = this.orbit.find((s) => s.label === target)!;
      const wrong = await chooseTap(ctx, this.orbit, correct, () => play(lockKey(slug(target))), () => play(nameKey(target)), `lock:${target}`);
      if (wrong) markWeak(ctx.progress, target); else markStrong(ctx.progress, target);
      world.updaters.delete(upd);
      stopSpeech();
      void play(bankLine('ok').key);
      const lp = this.lock.getWorldPosition(new THREE.Vector3());
      const from = correct.worldCenter();
      await correct.flyTo(lp, 600, 0.3, 0.6);
      void correct.vanish(200);
      world.magic.burst(lp, 90, 0xffd166, 2.8, 0.3, 0.9, -1);
      sfx('sfx_tap', 0.6);
      await tween(400, (k) => { this.lock.rotation.z = Math.sin(k * Math.PI * 3) * 0.2; });
      for (const s of this.orbit) if (s !== correct) void s.vanish();
      popObject(world, lp.clone().add(new THREE.Vector3(1.6, 0.6, 0.6)), letter(target).emoji, 2.2, 6500);
      await Promise.all([collect(ctx, target, from, correct.color), spellExample(target, { short: false })]);
    }
    // khoá bật, cổng mở
    await tween(500, (k) => { this.lock.position.y = 2.0 - k * 2.0; this.lock.rotation.x = k * 1.2; });
    this.lock.visible = false;
    void play('lock_done');
    await this.openDoors(900);
    this.done = true;
    await this.freeMonster();
  }

  private placeOrbit(dt: number): void {
    this.orbitT += dt * 0.5;
    const c = this.lock.getWorldPosition(new THREE.Vector3());
    this.orbit.forEach((s, i) => {
      if (s.gone || s.frozen) return;
      // vòng quay trong mặt phẳng màn hình (camera nhìn từ +z) → 3 sao không che nhau
      const a = this.orbitT + (i / this.orbit.length) * Math.PI * 2;
      s.root.position.set(c.x + Math.cos(a) * 2.7, 0, c.z + 0.9);
      s.baseY = c.y + 0.2 + Math.sin(a) * 1.3;
    });
  }

  private async openDoors(ms: number): Promise<void> {
    await tween(ms, (k) => { this.doors.forEach((d, i) => { d.rotation.y = (i === 0 ? 1 : -1) * k * 1.9; }); });
  }

  finishNow(): void {
    for (const ch of this.b.letters) addLetter(this.ctx.progress, ch);
    this.lock.visible = false;
    this.doors.forEach((d, i) => { d.rotation.y = (i === 0 ? 1 : -1) * 1.9; });
    this.done = true;
    this.freeMonsterNow();
  }
}

// ------------------------------------------------------------------ ghép chữ bằng phép

/** Một bước chọn khi ghép: chữ hoặc dấu. */
interface SpellStep { kind: 'letter' | 'tone'; value: string }

/** Tách từ thành các bước bé chạm: phụ âm, nguyên âm (vần 1 chữ), dấu. */
export function spellSteps(word: string): SpellStep[] {
  const sp = spell(word);
  const { base } = splitTone(word);
  const steps: SpellStep[] = [];
  const chars = Array.from(base);
  if (sp.onset) steps.push({ kind: 'letter', value: sp.onset });
  for (const c of chars.slice(Array.from(sp.onset).length)) steps.push({ kind: 'letter', value: c });
  if (sp.tone) steps.push({ kind: 'tone', value: sp.tone });
  return steps;
}

const TONE_OTHERS: Record<string, string> = { huyen: 'sac', sac: 'huyen', hoi: 'nga', nga: 'hoi', nang: 'huyen' };

export class SpellActivity extends Activity {
  readonly cx: number; readonly cz: number;
  private altar = new THREE.Group();
  /** sau khi ghép xong 1 từ (rescue dùng để mở bong bóng) */
  onWord: ((word: string) => Promise<void>) | null = null;
  constructor(ctx: Ctx, private words: string[], x: number, z: number, private mon?: MonsterKind, private friend?: FriendId) {
    super(ctx);
    this.cx = x; this.cz = pathZ(x) + z;
  }
  static fromBeat(ctx: Ctx, b: Extract<Beat, { t: 'spell' }>): SpellActivity {
    return new SpellActivity(ctx, b.words, b.x, b.z, b.monster, b.friend);
  }
  trigger() { return { x: this.cx - 3.5, z: this.cz, r: 3.6 }; }
  view() { return { pos: new THREE.Vector3(this.cx - 0.5, 8.4, this.cz + 13.5), look: new THREE.Vector3(this.cx, 1.6, this.cz) }; }

  async setup(): Promise<void> {
    const { world } = this.ctx;
    // vòng phép trên cỏ
    const ring = new THREE.Mesh(new THREE.RingGeometry(2.0, 2.35, 48), new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.85 }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    const inner = new THREE.Mesh(new THREE.CircleGeometry(2.0, 48), new THREE.MeshBasicMaterial({ color: 0xf3d9ff, transparent: true, opacity: 0.5 }));
    inner.rotation.x = -Math.PI / 2;
    inner.position.y = 0.04;
    this.altar.add(ring, inner);
    for (let i = 0; i < 6; i++) {
      const sp = world.emojiSprite('✨', 0.5);
      const a = (i / 6) * Math.PI * 2;
      sp.position.set(Math.cos(a) * 2.2, 0.4, Math.sin(a) * 2.2);
      this.altar.add(sp);
    }
    this.altar.position.set(this.cx, 0, this.cz - 1.2);
    world.chapterGroup?.add(this.altar);
    await this.addMonster(this.mon, this.friend, this.cx + 3.4, this.cz - 4);
  }

  async run(): Promise<void> {
    const { ctx } = this;
    await say('spike', 'spell_intro');
    for (const w of this.words) {
      if (!ctx.alive()) return;
      await this.spellWord(w);
    }
    await this.freeMonster();
  }

  /** Ghép 1 từ: bé chạm lần lượt phụ âm, nguyên âm, dấu → nhập lại, đọc đánh vần. */
  async spellWord(word: string): Promise<void> {
    const { ctx } = this;
    const { world, hero } = ctx;
    const sp = spell(word);
    const steps = spellSteps(word);
    await play(spellKey(sp.id));
    // các ô trống lơ lửng trên vòng phép
    const slotY = 3.0;
    const slotX = (i: number) => this.cx + (i - (steps.length - 1) / 2) * 1.7;
    const slots = steps.map((_, i) => {
      const m = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.74, 36), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
      m.position.set(slotX(i), slotY, this.cz - 1.2);
      world.scene.add(m);
      return m;
    });
    const placed: LetterStar[] = [];
    for (let i = 0; i < steps.length; i++) {
      if (!ctx.alive()) return;
      const st = steps[i];
      const known = ctx.progress.letters;
      const labels = st.kind === 'tone'
        ? [st.value, TONE_OTHERS[st.value]]
        : [st.value, ...pickDistractors(st.value, known, i === 0 ? 2 : 1, steps.map((s) => s.value))];
      labels.sort(() => Math.random() - 0.5);
      const opts = labels.map((l, k) => {
        const s = this.track(new LetterStar(st.kind === 'tone' ? { label: '', tone: l as ToneName, size: 0.9 } : { label: l, size: 0.95 }));
        s.setPos(this.cx + (k - (labels.length - 1) / 2) * 2.4, 1.2, this.cz + 1.6);
        void s.appear(k * 120);
        return s;
      });
      const correct = opts[labels.indexOf(st.value)];
      const prompt = st.kind === 'tone' ? () => play(toneFindKey(st.value)) : () => play(findLine(st.value));
      const sayName = st.kind === 'tone' ? () => play(`tl_${st.value}`) : () => play(nameKey(st.value));
      const wrong = await chooseTap(ctx, opts, correct, prompt, sayName, `spell:${word}:${st.value}`);
      if (st.kind === 'letter') { if (wrong) markWeak(ctx.progress, st.value); else markStrong(ctx.progress, st.value); }
      stopSpeech();
      // Twilight bắn phép vào sao, sao bay lên ô
      hero.faceTo(correct.root.position.x, correct.root.position.z);
      void hero.castPose(700);
      await world.magic.beam(hero.hornWorld(), correct.worldCenter(), PALETTE.magic, PALETTE.magicPink, 0.5);
      void play(st.kind === 'tone' ? `tl_${st.value}` : nameKey(st.value));
      for (const o of opts) if (o !== correct) void o.vanish();
      await correct.flyTo(new THREE.Vector3(slotX(i), slotY, this.cz - 1.2), 650, 0.85, 0.8);
      correct.gone = true;
      placed.push(correct);
      if (st.kind === 'letter' && !ctx.progress.letters.includes(st.value)) await collect(ctx, st.value, correct.worldCenter(), correct.color);
    }
    // nhập lại thành tiếng
    const mid = new THREE.Vector3(this.cx, slotY, this.cz - 1.2);
    await Promise.all(placed.map((s) => s.flyTo(mid, 500, 0.3, 0.2)));
    for (const s of placed) s.root.visible = false;
    for (const m of slots) { m.removeFromParent(); m.geometry.dispose(); }
    world.magic.burst(mid, 140, 0xffffff, 3.6, 0.36, 1.0, -1);
    world.magic.burst(mid, 70, PALETTE.magicPink, 2.6, 0.3, 0.9, -1);
    sfx('sfx_win', 0.6);
    const plate = this.track(new LetterStar({ label: word, size: 1.25, color: 0xff7ac8 }));
    plate.setPos(this.cx, slotY, this.cz - 1.2);
    await plate.appear();
    // đọc đánh vần theo token, chữ đang đọc sáng lên
    const keys = sp.tokens.map((t) => t.audio);
    await speakSequence(keys, (i) => showWord(word, sp.tokens[i].lit, i === keys.length - 1), 140);
    showWord(word, [], true);
    confetti(50);
    const def = WORDS[word];
    if (def?.emoji) popObject(world, mid.clone().add(new THREE.Vector3(2.0, -0.6, 0.6)), def.emoji, 2.0, 2600);
    if (this.onWord) await this.onWord(word);
    else if (def) await narrate(def.after[0], def.after[1]);
    hideWord();
    await plate.vanish();
  }

  finishNow(): void {
    for (const w of this.words) for (const st of spellSteps(w)) if (st.kind === 'letter') addLetter(this.ctx.progress, st.value);
    this.freeMonsterNow();
  }
}

/** Tạo hoạt động cho 1 nhịp (null với cảnh / ôn / album / cứu). */
export function makeActivity(ctx: Ctx, b: Beat): Activity | null {
  if (b.t === 'hunt') return new HuntActivity(ctx, b);
  if (b.t === 'bridge') return new BridgeActivity(ctx, b);
  if (b.t === 'lock') return new LockActivity(ctx, b);
  if (b.t === 'spell') return SpellActivity.fromBeat(ctx, b);
  return null;
}

/** Tên hiện của người nhà (bảng tên). */
export const castName = (id: keyof typeof CAST) => CAST[id].name;

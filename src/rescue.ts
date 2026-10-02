// Cảnh CỨU người nhà cuối chương:
//  - Chương 1: lồng bóng tối nhốt Mun + Rơm → chạm ✨ Đại phép → lồng vỡ, hai bạn mèo chạy ra.
//  - Chương 2: bong bóng bóng đêm trên tháp đồng hồ nhốt ba + mẹ, khắc chữ "ba" → bé GHÉP b + a → bong bóng vỡ, "Ba đây!".
//  - Chương 3: bong bóng trên tháp nhốt ông + bà, khắc "bà" → ghép → "Bà đây!", bà kéo mặt trời lên.
import * as THREE from 'three';
import { CAST, PALETTE, type Beat, type CastId } from './data';
import { pathZ } from './world';
import { Actor } from './actors';
import { Activity, SpellActivity, type Ctx } from './activities';
import { play, sfx } from './audio';
import { say, narrate } from './talk';
import { WORDS } from './words';
import { waitBigSpell, confetti, flash } from './ui';
import { tween, wait } from './tween';

const WORD_SPEAKER: Record<string, CastId> = { ba: 'ba-cuong', 'bà': 'ba-tuyet' };

export class RescueActivity extends Activity {
  private cx: number; private cz: number;
  private g = new THREE.Group();
  private bars: THREE.Mesh[] = [];
  private catSprites: THREE.Sprite[] = [];
  private bubble: { group: THREE.Group; mesh: THREE.Mesh; holder: THREE.Group } | null = null;
  private trapped: Actor[] = [];
  private spellAct: SpellActivity | null = null;
  /** Người được cứu (theo thứ tự): chương 1 mèo, 2 ba mẹ, 3 ông bà. */
  constructor(ctx: Ctx, private b: Extract<Beat, { t: 'rescue' }>, private who: CastId[]) {
    super(ctx);
    this.cx = b.x; this.cz = pathZ(b.x) + b.z;
  }
  trigger() { return { x: this.cx - 4.6, z: this.cz + 0.5, r: 3.6 }; }
  view() {
    return this.b.word
      ? { pos: new THREE.Vector3(this.cx - 2, 9.5, this.cz + 15.5), look: new THREE.Vector3(this.cx - 0.5, 3.0, this.cz) }
      : { pos: new THREE.Vector3(this.cx - 3, 7.5, this.cz + 11.5), look: new THREE.Vector3(this.cx - 0.5, 1.4, this.cz) };
  }

  async setup(): Promise<void> {
    const { world } = this.ctx;
    this.g.position.set(this.cx, 0, this.cz);
    world.chapterGroup?.add(this.g);
    if (!this.b.word) {
      // lồng bóng tối (tím, mềm, không đáng sợ)
      const barMat = new THREE.MeshStandardMaterial({ color: 0x5b3aa8, emissive: 0x2a1060, emissiveIntensity: 0.6, roughness: 0.4 });
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.0, 0.3, 24), barMat);
      base.position.y = 0.15;
      const top = new THREE.Mesh(new THREE.SphereGeometry(1.9, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), barMat);
      top.position.y = 2.6;
      top.scale.y = 0.5;
      this.g.add(base, top);
      this.bars.push(base, top);
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.4, 8), barMat);
        bar.position.set(Math.cos(a) * 1.8, 1.4, Math.sin(a) * 1.8);
        this.g.add(bar);
        this.bars.push(bar);
      }
      const moon = world.emojiSprite('🌙', 1.0);
      moon.position.y = 3.6;
      this.g.add(moon);
      this.bars.push(moon as unknown as THREE.Mesh);
      this.who.forEach((id, i) => {
        const sp = world.emojiSprite(CAST[id].emoji, 1.2);
        sp.position.set(i === 0 ? -0.55 : 0.55, 0.95, 0.3);
        this.g.add(sp);
        this.catSprites.push(sp);
      });
      world.updaters.add((dt, t) => this.catSprites.forEach((s, i) => { if (s.visible) s.position.y = 0.95 + Math.abs(Math.sin(t * 3 + i * 1.7)) * 0.25; }));
    } else {
      // tháp + bong bóng bóng đêm nhốt 2 người
      const castle = this.ctx.world.def?.theme.scene === 'castle';
      const wall = new THREE.MeshStandardMaterial({ color: castle ? 0xfdf8ff : 0xffd0dc, roughness: 0.85 });
      const roofMat = new THREE.MeshStandardMaterial({ color: castle ? 0xffc94a : 0x8f6bd9, roughness: 0.6 });
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.8, 3.6, 20), wall);
      tower.position.set(1.5, 1.8, -2.6);
      tower.castShadow = true;
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.4, 20), roofMat);
      rim.position.set(1.5, 3.7, -2.6);
      const face = world.emojiSprite(castle ? '👑' : '🕰️', 1.3);
      face.position.set(1.5, 2.4, -0.9);
      this.g.add(tower, rim, face);
      const R = this.who.includes('ba-tuyet') ? 2.5 : 2.2;
      this.bubble = world.makeBubble(R, true);
      this.bubble.group.position.set(1.5, 3.9 + R, -2.6);
      this.g.add(this.bubble.group);
      const actors = await Promise.all(this.who.map((id) => Actor.create(world, id)));
      actors.forEach((a, i) => {
        a.allowHop = false;
        a.hover = 0;
        a.idleOn = true;
        a.place((i - 0.5) * 1.5, 0.3, -0.3);
        a.root.rotation.y = -0.4;
        this.bubble!.holder.add(a.root);
        this.trapped.push(a);
      });
      world.updaters.add((dt, t) => {
        if (!this.bubble) return;
        this.bubble.group.position.y = 3.9 + R + Math.sin(t * 1.4) * 0.15;
        for (const a of this.trapped) if (a.root.parent === this.bubble.holder) a.update(dt);
        if (Math.random() < 0.3) {
          const p = this.bubble.group.getWorldPosition(new THREE.Vector3());
          const an = Math.random() * Math.PI * 2;
          world.shadow.emit({ x: p.x + Math.cos(an) * R, y: p.y + (Math.random() - 0.5) * R, z: p.z + Math.sin(an) * R, color: 0x6a3cc8, vy: 0.6, max: 1.0, size: 0.4 });
        }
      });
      this.spellAct = new SpellActivity(this.ctx, [this.b.word], this.cx - 1.2, this.b.z + 1.2);
      await this.spellAct.setup();
    }
  }

  async run(): Promise<void> {
    if (!this.b.word) await this.runCage();
    else await this.runBubble();
    this.done = true;
  }

  private async runCage(): Promise<void> {
    const { world, hero } = this.ctx;
    await narrate('c1r_1');
    await say('spike', 'c1r_2');
    await waitBigSpell(new URLSearchParams(location.search).has('auto'));
    sfx('sfx_win', 0.6);
    const c = new THREE.Vector3(this.cx, 1.4, this.cz);
    world.magic.ring(new THREE.Vector3(hero.x, 0.1, hero.z), PALETTE.star, 90, 3);
    void hero.castPose(1200);
    await Promise.all([
      world.magic.beam(hero.hornWorld(), c, PALETTE.magic, PALETTE.star, 1.0),
      world.magic.beam(hero.hornWorld().add(new THREE.Vector3(0, 0.3, 0)), c, PALETTE.magicPink, 0xffffff, 1.1),
    ]);
    await tween(600, (k) => { this.g.scale.setScalar(1 + Math.sin(k * Math.PI * 6) * 0.05 * (1 + k)); });
    world.magic.burst(c, 180, 0xffffff, 4, 0.36, 1.1, -1.5);
    world.magic.burst(c, 90, PALETTE.magicPink, 3, 0.3, 1.0, -1.5);
    for (const b of this.bars) b.visible = false;
    confetti(80);
    void narrate('c1r_3');
    // mèo chạy ra
    const cats = await Promise.all(this.who.map((id) => Actor.create(world, id)));
    this.catSprites.forEach((s) => (s.visible = false));
    cats.forEach((a, i) => { a.place(this.cx + (i - 0.5) * 1.1, this.cz + 0.4, 0); world.scene.add(a.root); a.hop(6); });
    const upd = (dt: number) => { for (const a of cats) a.update(dt); };
    world.updaters.add(upd);
    await wait(700);
    await Promise.all(cats.map((a, i) => a.travel(hero.x + 1.2 + i * 0.9, hero.z + 1.0, 900, 1.4)));
    world.updaters.delete(upd);
    await say('mun', 'c1r_4');
    void play('meow');
    await narrate('c1r_5');
    for (const a of [...cats].reverse()) this.ctx.parade.add(a, true);
  }

  private async runBubble(): Promise<void> {
    const sa = this.spellAct!;
    const ch = this.b.word === 'ba' ? 2 : 3;
    await narrate(ch === 2 ? 'c2r_1' : 'c3r_1');
    await say('spike', ch === 2 ? 'c2r_2' : 'c3r_2');
    sa.onWord = async (w) => { await this.popBubble(w); };
    await sa.spellWord(this.b.word!);
  }

  private async popBubble(word: string): Promise<void> {
    const { world, hero } = this.ctx;
    const bb = this.bubble!;
    void hero.castPose(1200);
    const c = bb.group.getWorldPosition(new THREE.Vector3());
    await world.magic.beam(hero.hornWorld(), c, PALETTE.magic, PALETTE.star, 0.9);
    await tween(600, (k) => { bb.mesh.scale.setScalar(1 + Math.sin(k * Math.PI * 6) * 0.08 * (1 + k)); });
    world.magic.burst(c, 180, 0xffffff, 4, 0.36, 1.1, -1.5);
    world.magic.burst(c, 90, PALETTE.magicPink, 3, 0.3, 1.0, -1.5);
    void flash(500);
    bb.group.visible = false;
    confetti(90);
    if (this.b.word === 'ba') void narrate('c2r_3');
    // người nhà bay xuống đứng cạnh Nhím
    const spots = this.trapped.map((_, i) => new THREE.Vector3(hero.x + 1.6 + i * 1.6, 0, hero.z + 1.4));
    for (const a of this.trapped) {
      const wp = a.root.getWorldPosition(new THREE.Vector3());
      world.scene.add(a.root);
      a.place(wp.x, wp.z, 0);
      a.y = wp.y;
      a.allowHop = true;
      a.hover = a.flyer ? 0.55 : 0;
    }
    const upd = (dt: number) => { for (const a of this.trapped) a.update(dt); };
    world.updaters.add(upd);
    await Promise.all(this.trapped.map((a, i) => a.travel(spots[i].x, spots[i].z, 1300, 1.5)));
    for (const a of this.trapped) { a.faceTo(hero.x, hero.z + 3); }
    hero.faceTo(hero.x, hero.z + 3);
    void hero.celebrate();
    const speaker = WORD_SPEAKER[word];
    await say(speaker, WORDS[word].after[0]);
    if (word === 'ba') {
      await say('me-yen', 'c2r_me');
      this.trapped[0]?.id === 'ba-cuong' && void this.trapped[0].loopAround();
      await say('ba-cuong', 'c2r_4');
    } else {
      await say('ong-cuong', 'c3r_ong');
      await say('ba-tuyet', 'c3r_3');
      await this.raiseSun(this.trapped.find((a) => a.id === 'ba-tuyet') ?? null);
      await narrate('c3r_4');
    }
    world.updaters.delete(upd);
    for (const a of this.trapped) this.ctx.parade.add(a, true);
  }

  /** Bà Tuyết bay lên kéo mặt trời: tia vàng lên trời, trời sáng hẳn. */
  private async raiseSun(cel: Actor | null): Promise<void> {
    const { world } = this.ctx;
    if (cel) {
      cel.busy = true;
      cel.setFlap(1);
      const y0 = cel.y;
      await tween(900, (k) => { cel.y = y0 + k * 2.2; });
      const horn = cel.center().add(new THREE.Vector3(0, 1.3, 0.3));
      void world.magic.beam(horn, horn.clone().add(new THREE.Vector3(6, 14, -10)), 0xffd166, 0xffffff, 1.2);
      world.magic.burst(horn, 120, 0xffd166, 3.5, 0.4, 1.4, -0.5);
    }
    void narrate('sun_rise');
    await world.tweenNight(0.0, 3200);
    if (cel) {
      const y1 = cel.y;
      await tween(700, (k) => { cel.y = y1 + (cel.hover - y1) * k; });
      cel.setFlap(0.4);
      cel.busy = false;
    }
  }

  finishNow(): void {
    if (!this.b.word) {
      for (const b of this.bars) b.visible = false;
      this.catSprites.forEach((s) => (s.visible = false));
    } else if (this.bubble) {
      this.bubble.group.visible = false;
      for (const a of this.trapped) { this.ctx.world.scene.add(a.root); a.allowHop = true; a.hover = a.flyer ? 0.55 : 0; }
      if (this.who.includes('ba-tuyet')) this.ctx.world.setNight(0);
    }
    this.done = true;
  }

  /** Người được cứu (để story thêm vào hàng khi nhảy cóc). */
  get rescued(): Actor[] { return this.trapped; }

  dispose(): void {
    super.dispose();
    this.spellAct?.dispose();
  }
}


// Nhân vật chính: Nhím = Twilight (ngựa có cánh, auto-rig 4 chân). Chạm đất → chạy tới đó (giữ kéo ngón tay thì
// đi theo ngón); phím mũi tên trên Mac. Nhảy, nhún-nhảy, đứng chơi (thở, ngó quanh, phẩy đuôi).
import * as THREE from 'three';
import type { World } from './world';
import { tween, easeOutQuad } from './tween';
import { autoRigQuadruped, type Walker, type WalkerPose } from './rig';

type HeroKind = 'pony';

interface HeroConfig {
  path: string;
  height: number;
  hornForward: number;   // sừng cách tâm bao xa về phía trước
  hornUp: number;        // sừng cao bao nhiêu
  hop: number;
}

const CONFIGS: Record<HeroKind, HeroConfig> = {
  pony: { path: 'models/twilight_static/scene.gltf', height: 1.75, hornForward: 0.55, hornUp: 1.62, hop: 0.07 },
};

const GRAVITY = 24;
/** độ cao bay (vừa phải: vẫn chạm sao chữ được, không bay khỏi đảo vì x/z luôn bị kẹp trong đảo + hàng rào) */
const FLY_H = 2.2;
const FLY_TIME = 4;
const JUMP_V = 8.5;
const SPEED = 5.5;
const TURN = 10; // rad/s xoay người

export class Hero {
  readonly root = new THREE.Group();   // vị trí thế giới + hướng
  readonly pivot = new THREE.Group();  // nhún, nghiêng, scale
  x = 0; z = 0; y = 0; vy = 0;
  yaw = 0;              // hướng đang nhìn (model forward = +z, yaw 0 = nhìn về +z / phía camera)
  private mx = 0; private mz = 0;  // vector di chuyển
  grounded = true;
  locked = false;
  private t = 0;
  private landSquash = 0;
  private walkK = 0;   // 0..1 mức độ đang đi (mượt)
  private walker: Walker | null = null;
  private pose: WalkerPose | null = null;
  // đứng chơi khi bé không bấm: thở, ngó quanh, phẩy đuôi, quay ra camera, nhảy cẫng
  private idleT = 0;
  private nextIdle = 2.5;
  private actT = 0;
  private lookGoal = 0;
  private pitchGoal = 0;
  private tailGoal = 0;
  private yawGoal: number | null = null;
  private readonly cfg: HeroConfig;
  private goal: { x: number; z: number } | null = null;
  /** model gốc (để làm sáng khi cao trào) */
  model!: THREE.Object3D;

  private constructor(readonly kind: HeroKind, model: THREE.Object3D) {
    this.cfg = CONFIGS[kind];
    this.pivot.add(model);
    this.root.add(this.pivot);
    this.root.add(this.wings);
  }

  static async load(world: World, kind: HeroKind = 'pony'): Promise<Hero> {
    const cfg = CONFIGS[kind];
    const { obj } = await world.instance(cfg.path);
    world.fitHeight(obj, cfg.height);
    const hero = new Hero(kind, obj);
    hero.model = obj;
    hero.walker = autoRigQuadruped(obj);
    if (!hero.walker) console.warn('[hero] không rig được, dùng nhún-nhảy');
    world.scene.add(hero.root);
    return hero;
  }

  /** Vector di chuyển (-1..1 mỗi trục), z dương = về phía camera. */
  setMove(dx: number, dz: number): void {
    this.goal = null;
    if (this.locked) { this.mx = this.mz = 0; return; }
    const len = Math.hypot(dx, dz);
    if (len > 1e-3) { this.mx = dx / len; this.mz = dz / len; } else { this.mx = this.mz = 0; }
  }

  /** Chạy tới điểm (chạm đất). */
  goTo(x: number, z: number): void {
    if (this.locked) return;
    this.goal = { x, z };
  }
  /** Dừng mọi di chuyển. */
  stop(): void { this.goal = null; this.mx = this.mz = 0; }

  get moving(): boolean { return (this.mx !== 0 || this.mz !== 0) && !this.locked; }

  /** Đang bay (nút 🪽): ~4 s, cao FLY_H, đi bằng chạm như thường; hạ cánh nhẹ, nghỉ 1.2 s mới bay lại. */
  flying = false;
  private landing = false;
  private flyT = 0;
  private flyCool = 0;
  /** đôi cánh ánh sáng vỗ khi bay (mô hình Twilight không có xương cánh) */
  readonly wings: THREE.Sprite = Hero.makeWings();
  get canFly(): boolean { return !this.locked && !this.flying && !this.landing && this.flyCool <= 0; }
  get airborne(): boolean { return this.flying || this.landing || !this.grounded; }

  /** Bấm 🪽: cất cánh (đang bay thì hạ cánh). */
  fly(): boolean {
    if (this.flying) { this.land(); return true; }
    if (!this.canFly) return false;
    this.flying = true;
    this.flyT = FLY_TIME;
    this.grounded = false;
    this.vy = 0;
    return true;
  }
  land(): void {
    if (!this.flying) return;
    this.flying = false;
    this.landing = true;
    this.flyCool = 1.2;
  }

  private static makeWings(): THREE.Sprite {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    const g = c.getContext('2d')!;
    for (const s of [-1, 1]) {
      const grad = g.createRadialGradient(256 + s * 120, 128, 10, 256 + s * 120, 128, 140);
      grad.addColorStop(0, 'rgba(255,255,255,0.95)');
      grad.addColorStop(0.5, 'rgba(230,190,255,0.6)');
      grad.addColorStop(1, 'rgba(230,190,255,0)');
      g.fillStyle = grad;
      g.beginPath();
      g.ellipse(256 + s * 130, 120, 130, 66, s * -0.4, 0, Math.PI * 2);
      g.fill();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    sp.position.set(0, 1.35, -0.1);
    sp.visible = false;
    return sp;
  }

  jump(): boolean {
    if (this.locked || !this.grounded) return false;
    this.vy = JUMP_V;
    this.grounded = false;
    return true;
  }

  private idleTick(dt: number): void {
    const free = !this.moving && this.grounded && !this.locked;
    if (!free) {
      this.idleT = 0; this.yawGoal = null;
      this.lookGoal = this.pitchGoal = this.tailGoal = 0;
      return;
    }
    this.idleT += dt;
    if (this.actT > 0) { this.actT -= dt; if (this.actT <= 0) { this.lookGoal = this.pitchGoal = this.tailGoal = 0; } }
    if (this.idleT > this.nextIdle) {
      this.idleT = 0;
      this.nextIdle = 2.2 + Math.random() * 3;
      const acts = this.walker?.look ? ['look', 'look', 'tail', 'sniff', 'camera', 'hop'] : ['camera', 'hop', 'camera'];
      const a = acts[Math.floor(Math.random() * acts.length)];
      if (a === 'look') { this.lookGoal = (Math.random() < 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.3); this.actT = 1.6; }
      else if (a === 'tail') { this.tailGoal = 1; this.actT = 1.3; }
      else if (a === 'sniff') { this.pitchGoal = 0.35; this.actT = 1.1; }
      else if (a === 'camera') this.yawGoal = 0;
      else if (a === 'hop') { this.vy = 5; this.grounded = false; }
    }
    if (this.yawGoal !== null) {
      let d = this.yawGoal - this.yaw;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      this.yaw += d * Math.min(1, dt * 2.5);
    }
  }

  /** Quay mặt về một điểm. */
  faceTo(x: number, z: number): void {
    this.yaw = Math.atan2(x - this.x, z - this.z);
    this.root.rotation.y = this.yaw;
  }

  /** Điểm sừng (thế giới) để bắn tia phép. */
  hornWorld(): THREE.Vector3 {
    return new THREE.Vector3(
      this.x + Math.sin(this.yaw) * this.cfg.hornForward,
      this.y + this.cfg.hornUp,
      this.z + Math.cos(this.yaw) * this.cfg.hornForward,
    );
  }

  update(dt: number, clamp: (x: number, z: number) => [number, number]): void {
    this.t += dt;
    if (this.locked) this.goal = null;
    if (this.goal) {
      const dx = this.goal.x - this.x, dz = this.goal.z - this.z, d = Math.hypot(dx, dz);
      if (d < 0.25) { this.goal = null; this.mx = this.mz = 0; }
      else { this.mx = dx / d; this.mz = dz / d; }
    }
    if (this.moving) {
      const px = this.x;
      const sp = this.flying ? SPEED * 1.15 : SPEED;
      this.x += this.mx * sp * dt;
      this.z += this.mz * sp * dt;
      [this.x, this.z] = clamp(this.x, this.z);
      // kẹt (mép đảo / hàng rào) → bỏ đích để không chạy tại chỗ mãi
      if (this.goal && Math.abs(this.x - px) < SPEED * dt * 0.05 && Math.abs(this.mx) > 0.9) { this.goal = null; this.mx = this.mz = 0; }
      const target = Math.atan2(this.mx, this.mz);
      let d = target - this.yaw;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      this.yaw += d * Math.min(1, dt * TURN);
    }
    this.idleTick(dt);
    const L = this.walker?.look;
    if (L) {
      const r = Math.min(1, dt * 4);
      L.yaw += (this.lookGoal - L.yaw) * r;
      L.pitch += (this.pitchGoal - L.pitch) * r;
      L.tail += (this.tailGoal - L.tail) * r;
    }
    this.flyCool = Math.max(0, this.flyCool - dt);
    if (this.flying) {
      // bay: lên êm tới FLY_H, vỗ cánh ánh sáng; hết giờ (hoặc bị khoá) thì hạ cánh nhẹ
      this.flyT -= dt;
      this.y += (FLY_H + Math.sin(this.t * 3) * 0.12 - this.y) * Math.min(1, dt * 2.5);
      if (this.flyT <= 0 || this.locked) this.land();
    } else if (this.landing) {
      this.y = Math.max(0, this.y - dt * 1.9);
      if (this.y <= 0) { this.landing = false; this.grounded = true; this.vy = 0; this.landSquash = 1; }
    } else if (!this.grounded) {
      this.vy -= GRAVITY * dt;
      this.y += this.vy * dt;
      if (this.y <= 0) { this.y = 0; this.vy = 0; this.grounded = true; this.landSquash = 1; }
    }
    const air = this.flying || this.landing;
    this.wings.visible = air;
    if (air) {
      const flap = 0.75 + 0.25 * Math.sin(this.t * 13);
      const k = Math.min(1, this.y / FLY_H + 0.2);
      this.wings.scale.set(3.4 * flap * k, 1.9 * k, 1);
    }
    this.root.position.set(this.x, this.y, this.z);
    this.root.rotation.y = this.yaw;
    const target = this.moving && this.grounded ? 1 : 0;
    this.walkK += (target - this.walkK) * Math.min(1, dt * 10);
    this.pose = (this.walker?.update(this.t, this.walkK, this.yaw) as WalkerPose | undefined) ?? null;
    this.animate(dt);
  }

  /** Nhún-nhảy khi đi, thở khi đứng, ép dẹt khi tiếp đất, ngửa nhẹ khi bay. */
  private animate(dt: number): void {
    const p = this.pivot;
    let bob = 0, pitch = 0, roll = 0, sy = 1, sx = 1;
    if (this.pose) {
      bob = this.pose.bob; pitch = this.pose.pitch; roll = this.pose.roll;
      if (!this.grounded) { pitch += -Math.min(0.25, this.vy * 0.03); sy = 1.06; sx = 0.96; }
      else if (!this.moving) sy = 1 + Math.sin(this.t * 2.2) * 0.015;
    } else if (this.moving && this.grounded) {
      const w = this.t * 11;
      bob = Math.abs(Math.sin(w)) * this.cfg.hop;
      pitch = Math.sin(w) * 0.05;
      sy = 1 + Math.sin(w * 2) * 0.03;
    } else if (this.grounded) {
      sy = 1 + Math.sin(this.t * 2.2) * 0.015;
    } else {
      pitch = -Math.min(0.25, this.vy * 0.03);
      sy = 1.06; sx = 0.96;
    }
    if (this.landSquash > 0) {
      this.landSquash = Math.max(0, this.landSquash - dt * 5);
      const k = Math.sin(this.landSquash * Math.PI);
      sy *= 1 - k * 0.18; sx *= 1 + k * 0.12;
    }
    p.position.y = bob;
    p.rotation.x = pitch;
    p.rotation.z = roll;
    p.scale.set(sx, sy, sx);
  }

  /** Nhảy xoay ăn mừng. */
  async celebrate(): Promise<void> {
    const wasLocked = this.locked;
    this.locked = true;
    const yaw0 = this.yaw;
    await tween(700, (k) => {
      this.root.position.y = this.y + Math.sin(k * Math.PI) * 1.2;
      this.root.rotation.y = yaw0 + k * Math.PI * 2;
    }, easeOutQuad);
    this.root.rotation.y = yaw0;
    this.root.position.y = this.y;
    this.locked = wasLocked;
  }

  /** Tư thế làm phép: hơi ngẩng, nhún. */
  async castPose(ms: number): Promise<void> {
    await tween(ms, (k) => {
      this.pivot.rotation.x = -0.18 * Math.sin(k * Math.PI);
      this.pivot.position.y = 0.12 * Math.sin(k * Math.PI);
    });
  }
}

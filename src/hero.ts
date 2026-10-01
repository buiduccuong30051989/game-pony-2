// Nhân vật: ngựa Twilight (màn 1) hoặc Twilight người (màn 2). Đi 4 hướng trên đảo, nhảy, nhún-nhảy bằng code.
import * as THREE from 'three';
import type { HeroKind } from './data';
import type { World } from './world';
import { tween, easeOutQuad } from './tween';
import { autoRigQuadruped, makeHumanWalker, type Walker, type WalkerPose } from './rig';

interface HeroConfig {
  path: string;
  height: number;
  hornForward: number;   // sừng cách tâm bao xa về phía trước
  hornUp: number;        // sừng cao bao nhiêu
  hop: number;
  fixHuman?: boolean;    // hạ tay T-pose + giấu đầu thừa
}

const CONFIGS: Record<HeroKind, HeroConfig> = {
  pony: { path: 'models/twilight_static/scene.gltf', height: 1.75, hornForward: 0.55, hornUp: 1.62, hop: 0.07 },
  human: { path: 'models/twilight/scene.gltf', height: 2.0, hornForward: 0.15, hornUp: 2.05, hop: 0.05, fixHuman: true },
};

const GRAVITY = 24;
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
  private readonly cfg: HeroConfig;

  private constructor(readonly kind: HeroKind, model: THREE.Object3D) {
    this.cfg = CONFIGS[kind];
    this.pivot.add(model);
    this.root.add(this.pivot);
  }

  static async load(world: World, kind: HeroKind): Promise<Hero> {
    const cfg = CONFIGS[kind];
    const { obj } = await world.instance(cfg.path);
    world.fitHeight(obj, cfg.height);
    if (cfg.fixHuman) Hero.fixHuman(obj, cfg.height);
    const hero = new Hero(kind, obj);
    hero.walker = kind === 'pony' ? autoRigQuadruped(obj) : makeHumanWalker(obj, cfg.height);
    if (!hero.walker) console.warn('[hero] không rig được, dùng nhún-nhảy');
    world.scene.add(hero.root);
    return hero;
  }

  /** Model người: giấu mesh lệch tâm (đầu thừa), hạ hai tay T-pose bằng xương tìm theo vị trí. */
  private static fixHuman(obj: THREE.Object3D, height: number): void {
    obj.updateMatrixWorld(true);
    const whole = new THREE.Box3().setFromObject(obj, true);
    const center = whole.getCenter(new THREE.Vector3());
    const width = whole.max.x - whole.min.x;
    obj.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const b = new THREE.Box3().setFromObject(m, true);
      const c = b.getCenter(new THREE.Vector3());
      const size = b.getSize(new THREE.Vector3());
      if (Math.abs(c.x - center.x) > width * 0.22 && size.x < width * 0.35 && c.y > whole.min.y + height * 0.6) m.visible = false;
    });
    obj.updateMatrixWorld(true);
  }

  /** Vector di chuyển (-1..1 mỗi trục), z dương = về phía camera. */
  setMove(dx: number, dz: number): void {
    if (this.locked) { this.mx = this.mz = 0; return; }
    const len = Math.hypot(dx, dz);
    if (len > 1e-3) { this.mx = dx / len; this.mz = dz / len; } else { this.mx = this.mz = 0; }
  }

  get moving(): boolean { return (this.mx !== 0 || this.mz !== 0) && !this.locked; }

  jump(): boolean {
    if (this.locked || !this.grounded) return false;
    this.vy = JUMP_V;
    this.grounded = false;
    return true;
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
    if (this.moving) {
      this.x += this.mx * SPEED * dt;
      this.z += this.mz * SPEED * dt;
      [this.x, this.z] = clamp(this.x, this.z);
      const target = Math.atan2(this.mx, this.mz);
      let d = target - this.yaw;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      this.yaw += d * Math.min(1, dt * TURN);
    }
    if (!this.grounded) {
      this.vy -= GRAVITY * dt;
      this.y += this.vy * dt;
      if (this.y <= 0) { this.y = 0; this.vy = 0; this.grounded = true; this.landSquash = 1; }
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

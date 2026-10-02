// Quái dễ thương (GLB Quaternius / poly.pizza) bị BÓNG TỐI NHẬP: tô tím đậm, mắt phát sáng, khói bóng tối bốc lên.
// Trả lời đúng → được THANH TẨY: nổ sao, về màu thật (vài con đổi màu tươi hơn), chơi clip vui, đứng về phe Nhím.
// Mỗi quái có thể giữ 1 bạn ngựa nhỏ trong bong bóng pha lê bên cạnh (vỡ khi quái được thanh tẩy).
import * as THREE from 'three';
import type { MonsterKind } from './data';
import type { World } from './world';
import type { Actor } from './actors';
import { tween, easeOutQuad, easeInOutSine } from './tween';
import { glowTexture } from './letterstar';

interface KindDef {
  file: string;
  /** chiều cao trong game */
  h: number;
  /** bay lơ lửng */
  hover?: number;
  idle: string;
  happy: string;
  /** model không có vật liệu mắt riêng → đặt 2 đốm sáng: [cao (0..1 theo h), lệch ngang (theo h), ra trước (theo h)] */
  eyes?: [number, number, number];
  /** màu "thật" khi thanh tẩy cho vật liệu tối màu (tên vật liệu → màu) */
  purified?: Record<string, number>;
}

export const MONSTERS: Record<MonsterKind, KindDef> = {
  slime_jt: { file: 'slime_enemy_j_toastie.glb', h: 1.0, idle: 'Hop', happy: 'Hop' },
  slime: { file: 'slime_quaternius.glb', h: 1.05, idle: 'Slime_Idle', happy: 'Slime_Walk' },
  slime_horn: { file: 'slime_enemy_quaternius.glb', h: 1.25, idle: 'Idle', happy: 'Dance' },
  ghost: {
    file: 'ghost_quaternius.glb', h: 1.6, hover: 0.25, idle: 'Flying_Idle', happy: 'Yes',
    purified: { Ghost_Main: 0xf3eaff, Eye_White: 0xffffff, Eye_Black: 0x3b2a5a },
  },
  goblin: { file: 'goblin_quaternius.glb', h: 1.55, idle: 'Idle', happy: 'Jump', eyes: [0.73, 0.14, 0.24] },
  dragon: {
    file: 'dragon_quaternius.glb', h: 1.5, hover: 0.3, idle: 'Dragon_Flying', happy: 'Dragon_Flying',
    purified: { Main: 0x6fd6a8, Belly: 0xffe08a, Wings: 0x8fd0ff, Claws: 0xfff4d6 },
  },
  dragon_ev: { file: 'dragon_evolved_quaternius.glb', h: 1.55, hover: 0.3, idle: 'Flying_Idle', happy: 'Yes' },
  wizard: { file: 'animated_wizard_quaternius.glb', h: 1.65, idle: 'Idle', happy: 'Spell1', eyes: [0.8, 0.04, 0.16] },
  witch: { file: 'witch_quaternius.glb', h: 1.75, idle: 'Idle', happy: 'Wave', eyes: [0.86, 0.035, 0.1] },
};

const SHADOW = new THREE.Color(0x7a3fd8);
const SHADOW_EMISSIVE = new THREE.Color(0x4a16a0);
const EYE_GLOW = new THREE.Color(0xff5ce1);
const BUBBLE_R = 1.1;

interface MatRec { mat: THREE.MeshStandardMaterial; color: THREE.Color; true: THREE.Color; emissive: THREE.Color; eye: boolean; textured: boolean }

export class Monster {
  readonly root = new THREE.Group();
  readonly pivot = new THREE.Group();
  x = 0; z = 0;
  possessed = true;
  /** bạn ngựa nhỏ bị giữ trong bong bóng bên cạnh */
  friend: Actor | null = null;
  private bubble: THREE.Group | null = null;
  private bubbleMesh: THREE.Mesh | null = null;
  private bubbleBaseY = 0;
  private mixer: THREE.AnimationMixer;
  private actions = new Map<string, THREE.AnimationAction>();
  private current: THREE.AnimationAction | null = null;
  private mats: MatRec[] = [];
  private eyeSprites: THREE.Sprite[] = [];
  private aura: THREE.Sprite;
  private t = Math.random() * 10;
  private wispT = 0;
  private hover: number;

  private constructor(private world: World, readonly kind: MonsterKind, obj: THREE.Object3D, clips: THREE.AnimationClip[], withAura: boolean) {
    const def = MONSTERS[kind];
    this.hover = def.hover ?? 0;
    this.root.add(this.pivot);
    this.pivot.add(obj);
    world.fitHeight(obj, def.h);
    // vật liệu riêng cho từng con (tô bóng tối / thanh tẩy độc lập)
    obj.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = false;
      m.frustumCulled = false; // xương động làm hộp bao lệch
      const list = (Array.isArray(m.material) ? m.material : [m.material]).map((src) => {
        const mat = (src as THREE.MeshStandardMaterial).clone();
        mat.metalness = 0; mat.roughness = 0.75;
        const eye = /eye/i.test(src.name) && mat.color.getHSL({ h: 0, s: 0, l: 0 }).l < 0.45;
        const tr = def.purified?.[src.name];
        this.mats.push({
          mat, color: mat.color.clone(), true: tr !== undefined ? new THREE.Color(tr) : mat.color.clone(),
          emissive: mat.emissive.clone(), eye, textured: !!mat.map,
        });
        return mat;
      });
      m.material = Array.isArray(m.material) ? list : list[0];
    });
    if (def.eyes) {
      const [y, dx, dz] = def.eyes;
      for (const s of [-1, 1]) {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: EYE_GLOW, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
        sp.scale.setScalar(def.h * 0.13);
        sp.position.set(s * dx * def.h, y * def.h, dz * def.h);
        this.pivot.add(sp);
        this.eyeSprites.push(sp);
      }
    }
    // quầng bóng tối tím sau lưng (tan khi thanh tẩy)
    this.aura = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0x7a3cff, transparent: true, depthWrite: false, opacity: 0.55 }));
    this.aura.scale.setScalar(def.h * 2.3);
    this.aura.position.set(0, def.h * 0.5, -0.3);
    if (withAura) this.pivot.add(this.aura);
    this.mixer = new THREE.AnimationMixer(obj);
    for (const c of clips) {
      const short = c.name.split('|').pop()!;
      this.actions.set(short, this.mixer.clipAction(c));
    }
    this.setPossessed(1);
    this.playClip(def.idle);
    this.mixer.update(Math.random() * 2);
  }

  /** aura = false: bỏ quầng sáng (đám đông trận cuối, bớt draw call). */
  static async create(world: World, kind: MonsterKind, x: number, z: number, aura = true): Promise<Monster> {
    const { obj, clips } = await world.instance(`models/monsters/${MONSTERS[kind].file}`);
    const m = new Monster(world, kind, obj, clips, aura);
    m.place(x, z);
    return m;
  }

  place(x: number, z: number): void {
    this.x = x; this.z = z;
    this.root.position.set(x, this.hover, z);
  }

  faceTo(x: number, z: number): void { this.root.rotation.y = Math.atan2(x - this.x, z - this.z); }

  center(): THREE.Vector3 { return new THREE.Vector3(this.x, this.hover + MONSTERS[this.kind].h * 0.55, this.z); }

  private playClip(name: string, fade = 0.3): void {
    const a = this.actions.get(name) ?? this.actions.get(MONSTERS[this.kind].idle) ?? [...this.actions.values()][0];
    if (!a || a === this.current) return;
    a.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(fade).play();
    this.current?.fadeOut(fade);
    this.current = a;
  }

  /** k = 1: bị nhập hoàn toàn; 0: màu thật. */
  private setPossessed(k: number): void {
    for (const r of this.mats) {
      if (r.textured) r.mat.color.copy(r.true).lerp(new THREE.Color(0x8a6ad8), k * 0.75);
      else r.mat.color.copy(r.true).lerp(SHADOW, k * 0.7);
      if (r.eye) { r.mat.emissive.copy(r.emissive).lerp(EYE_GLOW, k); r.mat.emissiveIntensity = 1 + k * 1.5; }
      else { r.mat.emissive.copy(r.emissive).lerp(SHADOW_EMISSIVE, k); r.mat.emissiveIntensity = 1; }
    }
    for (const s of this.eyeSprites) { s.material.opacity = k; s.visible = k > 0.02; }
    if (this.aura) { this.aura.material.opacity = 0.55 * k; this.aura.visible = k > 0.02; }
  }

  /** Nhốt `actor` vào bong bóng pha lê nhỏ cạnh quái (lệch phải-sau để quái không che). */
  holdFriend(actor: Actor, faceX: number, faceZ: number): void {
    const { group, mesh, holder } = this.world.makeBubble(BUBBLE_R);
    const bx = this.x + 2.3, bz = this.z - 1.6;
    this.bubbleBaseY = BUBBLE_R + 0.25;
    group.position.set(bx, this.bubbleBaseY, bz);
    this.world.scene.add(group);
    actor.allowHop = false;
    actor.hover = 0;
    actor.place(0, 0, Math.atan2(faceX - bx, faceZ - bz));
    holder.add(actor.root);
    this.friend = actor;
    this.bubble = group;
    this.bubbleMesh = mesh;
  }

  get bubblePos(): THREE.Vector3 | null { return this.bubble ? this.bubble.position.clone() : null; }

  /** Bong bóng rung rồi vỡ, bạn ngựa nhỏ rơi xuống cỏ. Trả về bạn đã tự do. */
  async popBubble(): Promise<Actor | null> {
    const b = this.bubble, mesh = this.bubbleMesh, a = this.friend;
    if (!b || !mesh || !a) return null;
    await tween(380, (k) => { mesh.scale.setScalar(1 + Math.sin(k * Math.PI * 6) * 0.1 * (1 + k)); });
    const c = b.position.clone();
    this.world.magic.burst(c, 110, 0xffffff, 3.0, 0.32, 1.0, -1.5);
    this.world.magic.burst(c, 60, 0xff7ac8, 2.2, 0.28, 0.9, -1.5);
    const wp = a.root.getWorldPosition(new THREE.Vector3());
    this.world.scene.add(a.root);
    a.allowHop = true;
    a.place(wp.x, wp.z, a.yaw);
    a.y = wp.y;
    a.vy = 3.5;
    this.disposeBubble();
    this.friend = null;
    return a;
  }

  /** Thả bạn ngay (bỏ qua hiệu ứng) — dùng khi nhảy cóc qua nhịp đã xong. */
  releaseNow(): Actor | null {
    const a = this.friend;
    if (!a) return null;
    this.world.scene.add(a.root);
    a.allowHop = true;
    a.place(this.x + 2.3, this.z - 1.6, 0);
    this.disposeBubble();
    this.friend = null;
    return a;
  }

  private disposeBubble(): void {
    if (!this.bubble) return;
    this.bubble.removeFromParent();
    this.bubbleMesh?.geometry.dispose();
    this.bubble = null;
    this.bubbleMesh = null;
  }

  /** Thanh tẩy: nổ sao trắng-vàng, màu thật trở lại, nhảy múa. */
  async purify(instant = false): Promise<void> {
    if (!this.possessed) return;
    this.possessed = false;
    if (instant) { this.setPossessed(0); this.playClip(MONSTERS[this.kind].happy, 0); return; }
    const c = this.center();
    this.world.magic.burst(c, 120, 0xffffff, 3.2, 0.34, 1.0, -1);
    this.world.magic.burst(c, 70, 0xffd166, 2.6, 0.3, 0.9, -1);
    this.world.magic.ring(new THREE.Vector3(this.x, 0.15, this.z), 0xff9ad8, 60, 2.2);
    await tween(900, (k) => {
      this.setPossessed(1 - k);
      this.pivot.position.y = Math.sin(k * Math.PI) * 0.9;
      this.pivot.rotation.y = k * Math.PI * 2;
    }, easeOutQuad);
    this.pivot.rotation.y = 0;
    this.pivot.position.y = 0;
    this.playClip(MONSTERS[this.kind].happy);
  }

  /** Nhún cười khi bé chọn sai (không phạt). */
  async giggle(): Promise<void> {
    await tween(500, (k) => { this.pivot.rotation.z = Math.sin(k * Math.PI * 4) * 0.14 * (1 - k); });
    this.pivot.rotation.z = 0;
  }

  /** Đi / bay tới (x, z) trong ms. */
  async travel(x: number, z: number, ms: number, arc = 0.6): Promise<void> {
    const x0 = this.x, z0 = this.z;
    this.faceTo(x, z);
    await tween(ms, (k) => {
      this.place(x0 + (x - x0) * k, z0 + (z - z0) * k);
      this.root.position.y = this.hover + Math.sin(k * Math.PI) * arc;
    }, easeInOutSine);
  }

  update(dt: number): void {
    this.t += dt;
    this.mixer.update(dt);
    if (this.bubble) {
      this.bubble.position.y = this.bubbleBaseY + Math.sin(this.t * 1.7) * 0.14;
      this.friend?.update(dt);
    }
    if (this.hover) this.root.position.y = this.hover + Math.sin(this.t * 1.6) * 0.12;
    // khói bóng tối bốc lên quanh quái bị nhập
    if (this.possessed) {
      this.wispT += dt;
      while (this.wispT > 0.09) {
        this.wispT -= 0.09;
        const a = Math.random() * Math.PI * 2, r = MONSTERS[this.kind].h * 0.45;
        this.world.shadow.emit({
          x: this.x + Math.cos(a) * r, y: this.hover + 0.2 + Math.random() * MONSTERS[this.kind].h * 0.6, z: this.z + Math.sin(a) * r,
          color: Math.random() < 0.6 ? 0x6a3cc8 : 0x9b5cff, vy: 0.7, max: 1.1, size: 0.34,
        });
      }
    }
  }

  dispose(): void {
    this.root.removeFromParent();
    this.disposeBubble();
    this.mixer.stopAllAction();
    for (const r of this.mats) r.mat.dispose();
  }
}

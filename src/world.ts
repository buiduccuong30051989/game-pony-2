// Thế giới 3D: đảo dài giữa biển, camera bám sau lưng nhân vật (lùi xa ~25% so với game cũ để thấy cả hàng bạn),
// cảnh theo chương (rừng / làng / thành phố lâu đài / trận cuối), đường đi lát đá, ngọc nhặt dọc đường, ngày/đêm,
// bướm, chim, đom đóm, cỏ hoa đung đưa. Props tĩnh được GỘP theo vật liệu để ít draw call (iPad).
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PALETTE, type ChapterDef } from './data';
import { Magic } from './magic';
import { tween, updateTweens, easeInOutSine } from './tween';

export interface Gem { x: number; z: number; i: number; taken: boolean; pos: THREE.Vector3 }
export interface ChapterScene {
  group: THREE.Group;
  gems: Gem[];
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Camera bám nhân vật: lùi ~25% so với game cũ (9.5 / 12.5). */
export const CAM_OFFSET = new THREE.Vector3(0, 11.9, 15.6);
const lerpHex = (a: number, b: number, k: number, out = new THREE.Color()) => out.setHex(a).lerp(new THREE.Color(b), k);

interface Swayer { obj: THREE.Object3D; phase: number; amp: number }
interface Flier { sp: THREE.Sprite; ax: number; az: number; phase: number; r: number; speed: number; h: number; size: number }
interface Bird { g: THREE.Group; wings: THREE.Mesh[]; vx: number; phase: number }

/** Đường đi uốn lượn: z theo x. */
export const pathZ = (x: number): number => Math.sin(x * 0.11) * 2.2;

export class World {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly magic: Magic;
  /** hạt bóng tối (luôn trộn thường) */
  readonly shadow: Magic;
  private readonly timer = new THREE.Timer();
  private readonly loader = new GLTFLoader();
  private readonly cache = new Map<string, Promise<GLTF>>();
  private readonly recolored = new Map<THREE.Material, THREE.Material>();
  private readonly clouds: THREE.Group[] = [];
  private chapter: ChapterScene | null = null;
  /** chương đang dựng */
  def: ChapterDef | null = null;
  readonly camTarget = new THREE.Vector3();
  private sun!: THREE.DirectionalLight;
  private hemi!: THREE.HemisphereLight;
  private readonly recolorMap: Record<string, number> = {
    leafsGreen: PALETTE.leaf, grass: PALETTE.grassProp, woodBark: PALETTE.bark, dirt: PALETTE.bark,
  };
  private skyColors!: THREE.BufferAttribute;
  private skyUpperMat!: THREE.MeshBasicMaterial;
  private waterMat!: THREE.MeshStandardMaterial;
  private readonly hillMats: { mat: THREE.MeshStandardMaterial; far: boolean }[] = [];
  private moon!: THREE.Sprite;
  private sunDisc!: THREE.Sprite;
  private stars!: THREE.Points;
  private readonly cloudMat = new THREE.MeshStandardMaterial({ color: PALETTE.cloud, roughness: 1 });
  private cloudMesh!: THREE.InstancedMesh;
  private gemMesh: THREE.InstancedMesh | null = null;
  private readonly tmpObj = new THREE.Object3D();
  /** 0 = ngày, 1 = đêm */
  night = 0;
  private swayers: Swayer[] = [];
  private fliers: Flier[] = [];
  private birds: Bird[] = [];
  private fireflyT = 0;
  private camOverride: { pos: THREE.Vector3; look: THREE.Vector3 } | null = null;
  private readonly camLook = new THREE.Vector3();
  private fovGoal = 38;
  /** điểm camera nghiêng về (săn sao), null = bám Twilight */
  focus: { x: number; z: number } | null = null;
  /** hàng rào vô hình: Twilight + hàng bạn không đi quá x này (cầu gãy, cổng khoá) */
  barrierX = Infinity;
  /** mọi thứ cập nhật thêm mỗi khung (sao chữ, quái...) */
  readonly updaters = new Set<(dt: number, t: number) => void>();
  private groundMats: THREE.MeshStandardMaterial[] = [];
  private readonly ray = new THREE.Raycaster();
  private readonly groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  constructor(container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    // iPad: DPR 2 → giới hạn 1.5 cho nhẹ (vẫn nét nhờ antialias)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.info.autoReset = true;
    container.appendChild(this.renderer.domElement);

    this.scene.background = new THREE.Color(PALETTE.sky);
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400);
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.buildLights();
    this.buildBackdrop();
    this.magic = new Magic(this.scene);
    this.shadow = new Magic(this.scene, true);
    this.setNight(0);
  }

  private resize(): void {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private buildLights(): void {
    this.hemi = new THREE.HemisphereLight(0xfff9ec, 0xbfe09c, 1.35);
    this.scene.add(this.hemi);
    const sun = new THREE.DirectionalLight(0xfff5e2, 2.4);
    sun.position.set(8, 16, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -16; sun.shadow.camera.right = 16;
    sun.shadow.camera.top = 16; sun.shadow.camera.bottom = -16;
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 60;
    sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.04;
    sun.shadow.intensity = 0.42;
    this.scene.add(sun);
    this.scene.add(sun.target);
    this.sun = sun;
  }

  glowTexture(inner: string, outer: string, craters = false): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(128, 128, 30, 128, 128, 128);
    grad.addColorStop(0, outer);
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    g.fillStyle = inner;
    g.beginPath(); g.arc(128, 128, 56, 0, Math.PI * 2); g.fill();
    if (craters) {
      g.fillStyle = 'rgba(190,190,230,0.45)';
      for (const [x, y, r] of [[110, 110, 12], [150, 140, 9], [125, 160, 7], [146, 104, 6]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  /** Trời gradient, biển, đồi xa, mây, trăng, mặt trời, sao. Giữ qua các chương. */
  private buildBackdrop(): void {
    const geo = new THREE.PlaneGeometry(900, 60, 1, 1);
    this.skyColors = new THREE.BufferAttribute(new Float32Array(4 * 3), 3);
    geo.setAttribute('color', this.skyColors);
    const sky = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true }));
    sky.position.set(0, 14, -140);
    this.scene.add(sky);
    this.skyUpperMat = new THREE.MeshBasicMaterial({ color: PALETTE.skyTop });
    const skyUpper = new THREE.Mesh(new THREE.PlaneGeometry(900, 300), this.skyUpperMat);
    skyUpper.position.set(0, 190, -140.5);
    this.scene.add(skyUpper);

    this.waterMat = new THREE.MeshStandardMaterial({ color: PALETTE.water, roughness: 0.9 });
    const water = new THREE.Mesh(new THREE.PlaneGeometry(900, 500), this.waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, -1.4, -60);
    water.receiveShadow = true;
    this.scene.add(water);

    const rnd = mulberry32(7);
    // đồi xa: 2 InstancedMesh (gần / xa) → 2 draw call thay vì 22
    const hillGeo = new THREE.SphereGeometry(1, 20, 10);
    for (const far of [false, true]) {
      const mat = new THREE.MeshStandardMaterial({ color: far ? PALETTE.hillFar : PALETTE.hill, roughness: 1 });
      this.hillMats.push({ mat, far });
      const im = new THREE.InstancedMesh(hillGeo, mat, 11);
      const m4 = new THREE.Matrix4();
      for (let k = 0; k < 11; k++) {
        const i = k * 2 + (far ? 0 : 1);
        const r = far ? 22 + rnd() * 12 : 12 + rnd() * 8;
        m4.compose(new THREE.Vector3(-120 + i * 12 + rnd() * 6, -4, far ? -110 - rnd() * 20 : -75 - rnd() * 12), new THREE.Quaternion(), new THREE.Vector3(r, r * 0.4, r));
        im.setMatrixAt(k, m4);
      }
      im.frustumCulled = false;
      this.scene.add(im);
    }
    // mây: 1 InstancedMesh (12 cụm × 4 cục) trôi ngang → 1 draw call
    this.cloudMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), this.cloudMat, 48);
    this.cloudMesh.frustumCulled = false;
    for (let i = 0; i < 12; i++) {
      const g = new THREE.Group();
      for (let k = 0; k < 4; k++) {
        const s = new THREE.Object3D();
        s.scale.setScalar(1.6 + rnd() * 1.4);
        s.position.set(k * 2 - 3, rnd() * 0.8, 0);
        g.add(s);
      }
      g.position.set(-90 + i * 16 + rnd() * 8, 16 + rnd() * 8, -50 - rnd() * 40);
      g.userData.speed = 0.3 + rnd() * 0.4;
      this.clouds.push(g);
    }
    this.scene.add(this.cloudMesh);
    this.updateClouds();

    this.moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTexture('#f4f2ff', 'rgba(200,205,255,0.55)', true), transparent: true, depthWrite: false }));
    this.moon.scale.setScalar(34);
    this.moon.position.set(-34, 23, -128);
    this.scene.add(this.moon);
    this.sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTexture('#fff3b0', 'rgba(255,214,102,0.6)'), transparent: true, depthWrite: false }));
    this.sunDisc.scale.setScalar(30);
    this.sunDisc.position.set(40, 28, -128);
    this.scene.add(this.sunDisc);

    const n = 260;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (rnd() * 2 - 1) * 220;
      pos[i * 3 + 1] = 10 + rnd() * 70;
      pos[i * 3 + 2] = -132;
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xfff6d0, size: 1.4, transparent: true, opacity: 0, depthWrite: false }));
    this.scene.add(this.stars);
  }

  // ---------- ngày / đêm ----------
  /** 0 = ngày trong vắt, 1 = đêm của Nữ hoàng Bóng Đêm (tím, vẫn đủ sáng cho bé nhìn rõ). */
  setNight(n: number): void {
    this.night = n;
    const top = lerpHex(PALETTE.skyTop, PALETTE.nightSkyTop, n);
    const bot = lerpHex(PALETTE.sky, PALETTE.nightSky, n);
    [top, top, bot, bot].forEach((c, i) => this.skyColors.setXYZ(i, c.r, c.g, c.b));
    this.skyColors.needsUpdate = true;
    this.skyUpperMat.color.copy(top);
    (this.scene.background as THREE.Color).copy(bot);
    lerpHex(PALETTE.water, PALETTE.nightWater, n, this.waterMat.color);
    for (const h of this.hillMats) lerpHex(h.far ? PALETTE.hillFar : PALETTE.hill, h.far ? PALETTE.nightHillFar : PALETTE.nightHill, n, h.mat.color);
    lerpHex(0xfff9ec, 0xd2caff, n, this.hemi.color);
    lerpHex(0xbfe09c, 0x7a78b8, n, this.hemi.groundColor);
    this.hemi.intensity = 1.35 - 0.25 * n;
    lerpHex(0xfff5e2, 0xd6dcff, n, this.sun.color);
    this.sun.intensity = 2.4 - 0.95 * n;
    lerpHex(0x000000, 0x6c62b8, n, this.cloudMat.emissive);
    const moonK = THREE.MathUtils.smoothstep(n, 0.25, 0.7);
    this.moon.material.opacity = moonK;
    this.moon.visible = moonK > 0.01;
    (this.stars.material as THREE.PointsMaterial).opacity = THREE.MathUtils.smoothstep(n, 0.3, 0.8);
    this.stars.visible = n > 0.3;
    this.sunDisc.material.opacity = 1 - THREE.MathUtils.smoothstep(n, 0.3, 0.75);
    this.sunDisc.visible = n < 0.75;
    this.sunDisc.position.y = 30 - 26 * n;
    this.magic.setAdditive(n > 0.4);
    document.documentElement.style.setProperty('--night', n.toFixed(3));
  }

  async tweenNight(to: number, ms: number): Promise<void> {
    const from = this.night;
    await tween(ms, (k) => this.setNight(from + (to - from) * k), easeInOutSine);
  }

  /** Đổi màu cỏ đảo (trận cuối: cỏ tím đêm → xanh khi trời sáng lại). */
  tweenGround(grass: number, rim: number, ms: number): void {
    const [g, r] = this.groundMats;
    if (!g || !r) return;
    const g0 = g.color.clone(), r0 = r.color.clone(), g1 = new THREE.Color(grass), r1 = new THREE.Color(rim);
    void tween(ms, (k) => { g.color.lerpColors(g0, g1, k); r.color.lerpColors(r0, r1, k); }, easeInOutSine);
  }

  // ---------- GLB ----------
  load(name: string): Promise<GLTF> {
    let p = this.cache.get(name);
    if (!p) { p = this.loader.loadAsync(`${import.meta.env.BASE_URL}${name}`); this.cache.set(name, p); }
    return p;
  }

  async instance(name: string): Promise<{ obj: THREE.Object3D; clips: THREE.AnimationClip[] }> {
    const gltf = await this.load(name);
    const obj = SkeletonUtils.clone(gltf.scene);
    obj.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = false;
        mesh.material = this.recolor(mesh.material);
      }
    });
    return { obj, clips: gltf.animations };
  }

  private recolor(mat: THREE.Material | THREE.Material[]): THREE.Material | THREE.Material[] {
    if (Array.isArray(mat)) return mat.map((m) => this.recolor(m) as THREE.Material);
    let out = this.recolored.get(mat);
    if (!out) {
      const m = (mat as THREE.MeshStandardMaterial).clone();
      if ('metalness' in m) { m.metalness = 0; m.roughness = 0.95; }
      const target = this.recolorMap[mat.name];
      if (target !== undefined) m.color.setHex(target);
      out = m;
      this.recolored.set(mat, out);
    }
    return out;
  }

  fitHeight(obj: THREE.Object3D, height: number): number {
    obj.updateMatrixWorld(true);
    obj.traverse((o) => { const sm = o as THREE.SkinnedMesh; if (sm.isSkinnedMesh) sm.computeBoundingBox(); });
    const box = new THREE.Box3().setFromObject(obj, true);
    const size = box.getSize(new THREE.Vector3());
    const s = height / Math.max(size.y, 1e-4);
    obj.scale.multiplyScalar(s);
    obj.updateMatrixWorld(true);
    const box2 = new THREE.Box3().setFromObject(obj, true);
    const c = box2.getCenter(new THREE.Vector3());
    obj.position.x -= c.x; obj.position.z -= c.z; obj.position.y -= box2.min.y;
    return s;
  }

  /** Giải phóng 1 model đã tải (hình học, vật liệu, texture) khỏi GPU + cache. */
  async release(name: string): Promise<void> {
    const p = this.cache.get(name);
    if (!p) return;
    this.cache.delete(name);
    let gltf: GLTF;
    try { gltf = await p; } catch { return; }
    const textures = new Set<THREE.Texture>();
    const disposeMat = (m: THREE.Material) => {
      for (const v of Object.values(m)) if (v && (v as THREE.Texture).isTexture) textures.add(v as THREE.Texture);
      m.dispose();
    };
    gltf.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry.dispose();
      for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        const r = this.recolored.get(m);
        if (r) { disposeMat(r); this.recolored.delete(m); }
        disposeMat(m);
      }
    });
    for (const t of textures) t.dispose();
  }

  private readonly emojiTex = new Map<string, THREE.CanvasTexture>();
  emojiSprite(emoji: string, size = 1): THREE.Sprite {
    let tex = this.emojiTex.get(emoji);
    if (!tex) {
      const c = document.createElement('canvas');
      c.width = c.height = 256;
      const ctx = c.getContext('2d')!;
      ctx.font = '200px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(emoji, 128, 140);
      tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      this.emojiTex.set(emoji, tex);
    }
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    sp.scale.setScalar(size);
    return sp;
  }

  // ---------- đảo ----------
  /** Kéo (x,z) vào trong đảo + không vượt hàng rào vô hình (cầu gãy / cổng khoá). */
  clampToIsland(x: number, z: number): [number, number] {
    if (x > this.barrierX) x = this.barrierX;
    if (!this.def) return [x, z];
    const { rx, rz } = this.def.island;
    const k = Math.hypot(x / (rx - 1.2), z / (rz - 1.2));
    if (k <= 1) return [x, z];
    return [x / k, z / k];
  }

  /** Bỏ cảnh chương cũ. */
  clearChapter(): void {
    if (this.chapter) this.scene.remove(this.chapter.group);
    for (const b of this.birds) this.scene.remove(b.g);
    this.swayers = []; this.fliers = []; this.birds = [];
    this.chapter = null;
    this.camOverride = null;
    this.barrierX = Infinity;
    this.focus = null;
    this.updaters.clear();
  }

  /**
   * Dựng đảo của chương: cỏ, đường đá, cây cối theo kiểu cảnh, ngọc dọc đường.
   * `keep`: chỗ phải để trống (hoạt động, cảnh cứu) [x, z, bán kính].
   */
  async buildChapter(def: ChapterDef, keep: [number, number, number][]): Promise<ChapterScene> {
    this.clearChapter();
    this.def = def;
    const group = new THREE.Group();
    this.scene.add(group);
    const rnd = mulberry32(def.n * 977 + 13);
    const { rx, rz } = def.island;
    const th = def.theme;

    // đảo: trụ ellipse, mặt cỏ, vách cát; viền cỏ đậm
    const grass = new THREE.MeshStandardMaterial({ color: th.grass, roughness: 1 });
    const sand = new THREE.MeshStandardMaterial({ color: PALETTE.sand, roughness: 1 });
    const island = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.07, 2.2, 128), [sand, grass, sand]);
    island.scale.set(rx, 1, rz);
    island.position.y = -1.1;
    island.receiveShadow = true;
    group.add(island);
    const rimMat = new THREE.MeshStandardMaterial({ color: th.grassDark, roughness: 1 });
    this.groundMats = [grass, rimMat];
    const rim = new THREE.Mesh(new THREE.RingGeometry(0.955, 1.0, 128), rimMat);
    rim.rotation.x = -Math.PI / 2;
    rim.position.y = 0.01;
    rim.scale.set(rx, rz, 1);
    group.add(rim);
    const shade = new THREE.Mesh(new THREE.CircleGeometry(1.12, 96), new THREE.MeshBasicMaterial({ color: 0x84cfe6, transparent: true, opacity: 0.5 }));
    shade.rotation.x = -Math.PI / 2;
    shade.position.y = -1.39;
    shade.scale.set(rx, rz, 1);
    group.add(shade);

    const battle = th.scene === 'battle';
    const inside = (x: number, z: number, margin: number) => Math.hypot(x / (rx - margin), z / (rz - margin)) < 1;
    const free = (x: number, z: number, pad = 0) =>
      keep.every(([kx, kz, r]) => Math.hypot(x - kx, z - kz) > r + pad) && (battle || Math.abs(z - pathZ(x)) > 3.4 + pad);

    // đường đá uốn lượn
    const statics = new THREE.Group();
    group.add(statics);
    if (!battle) {
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0xf6e7c4, roughness: 1 });
      const stoneGeo = new THREE.CylinderGeometry(0.55, 0.62, 0.12, 10);
      for (let x = -rx + 3; x < rx - 3; x += 1.5) {
        if (!inside(x, pathZ(x), 1.5)) continue;
        const st = new THREE.Mesh(stoneGeo, stoneMat);
        st.position.set(x + (rnd() - 0.5) * 0.3, 0.04, pathZ(x) + (rnd() - 0.5) * 0.5);
        st.scale.set(0.9 + rnd() * 0.4, 1, 0.8 + rnd() * 0.4);
        st.receiveShadow = true;
        statics.add(st);
      }
    }

    const jobs: Promise<unknown>[] = [];
    const place = (name: string, x: number, z: number, s: number, sway = 0, cast = true) => {
      jobs.push(this.addProp(sway ? group : statics, name + '.glb', x, z, s, rnd() * Math.PI * 2, sway, cast));
    };
    const scatter = (names: string[], count: number, sMin: number, sMax: number, margin: number, edgeBias: number, pad = 0, sway = 0, tall = false) => {
      let placed = 0, tries = 0;
      while (placed < count && tries++ < count * 30) {
        const x = (rnd() * 2 - 1) * rx, z = (rnd() * 2 - 1) * rz;
        if (!inside(x, z, margin) || !free(x, z, pad)) continue;
        // ưu tiên mép đảo + phía sau (z âm) để không che nhân vật
        const edge = Math.hypot(x / rx, z / rz);
        if (edge < edgeBias && rnd() < 0.75) continue;
        // không đặt vật cao phía trước đường đi (gần camera) → không che Twilight / sao chữ
        if (tall && z > pathZ(x) + 1.0) continue;
        if (!tall && z > pathZ(x) + 6 && rnd() < 0.5) continue;
        place(names[Math.floor(rnd() * names.length)], x, z, sMin + rnd() * (sMax - sMin), sway);
        keep.push([x, z, pad + 1.2]);
        placed++;
      }
    };

    const flowers = ['flower_yellowA', 'flower_redA', 'flower_purpleA', 'flower_yellowB', 'flower_redB', 'flower_purpleB'];
    if (th.scene === 'forest') {
      scatter(['tree_pineRoundA', 'tree_pineRoundC', 'tree_detailed', 'tree_default', 'tree_oak', 'tree_fat'], 40, 1.7, 2.6, 2.5, 0.2, 1.0, 0, true);
      scatter(['mushroom_redGroup', 'mushroom_redTall', 'mushroom_tanGroup', 'log', 'stone_largeA', 'stump_round'], 22, 1.0, 1.6, 2, 0.2, 0.3);
    } else if (th.scene === 'village') {
      this.buildVillage(statics, rnd, keep, inside, free);
      scatter(['tree_default', 'tree_oak', 'tree_fat', 'tree_small'], 16, 1.5, 2.1, 2.5, 0.3, 1.0, 0, true);
      scatter(['crop_pumpkin', 'plant_bush', 'tent_smallOpen', 'fence_simple'], 14, 1.0, 1.4, 2, 0.3, 0.3);
    } else if (th.scene === 'castle') {
      this.buildTowers(statics, rnd, keep, inside, free);
      scatter(['tree_cone', 'tree_pineRoundA', 'tree_detailed'], 16, 1.6, 2.2, 2.5, 0.3, 1.0, 0, true);
      scatter(['statue_column', 'plant_bush', 'stone_tallA'], 10, 1.1, 1.5, 2, 0.4, 0.3);
    } else {
      this.buildCastle(statics);
      scatter(['tree_cone', 'tree_pineRoundA'], 10, 1.6, 2.2, 2.5, 0.75, 1.0, 0, true);
      scatter(['statue_column'], 6, 1.2, 1.6, 2, 0.7, 0.3);
    }
    // hoa + cỏ đung đưa (không gộp); trận cuối: hoa tĩnh, gộp chung (bớt draw call)
    let placed = 0, tries = 0;
    const flowerCount = battle ? 30 : 70;
    while (placed < flowerCount && tries++ < 900) {
      const x = (rnd() * 2 - 1) * rx, z = (rnd() * 2 - 1) * rz;
      if (!inside(x, z, 1.5) || !free(x, z, -1.2)) continue;
      const isFlower = rnd() < th.flowers + 0.2;
      // trận cuối: chỉ 2 loại hoa (ít vật liệu → ít draw call sau khi gộp)
      const pool = battle ? ['flower_yellowA', 'flower_purpleA'] : flowers;
      const name = isFlower ? pool[Math.floor(rnd() * pool.length)] : 'grass';
      // chỉ 1/5 số hoa đung đưa (mỗi cây đung đưa = 1 draw call riêng), còn lại gộp tĩnh
      place(name, x, z, 0.9 + rnd() * 0.6, battle || placed % 5 ? 0 : isFlower ? 0.12 : 0.07, false);
      placed++;
    }
    await Promise.all(jobs);
    this.mergeStatic(statics);

    // bướm, chim (trận cuối không có: bớt draw call)
    const flyEmoji = '🦋';
    for (let i = 0; i < (battle ? 0 : 8); i++) {
      let x = 0, z = 0, k = 0;
      do { x = (rnd() * 2 - 1) * rx * 0.8; z = (rnd() * 2 - 1) * rz * 0.8; } while (!inside(x, z, 3) && k++ < 20);
      const sp = this.emojiSprite(flyEmoji, 0.5);
      group.add(sp);
      this.fliers.push({ sp, ax: x, az: z, phase: rnd() * 6, r: 1.2 + rnd() * 1.6, speed: 0.5 + rnd() * 0.6, h: 1.2 + rnd() * 0.9, size: 0.5 });
    }
    const birdMat = new THREE.MeshBasicMaterial({ color: 0x4a4a6a, side: THREE.DoubleSide });
    const wingGeo = new THREE.PlaneGeometry(0.7, 0.18).translate(0.35, 0, 0);
    for (let i = 0; i < (battle ? 0 : 4); i++) {
      const g = new THREE.Group();
      const wings: THREE.Mesh[] = [];
      for (const s of [1, -1]) {
        const w = new THREE.Mesh(wingGeo, birdMat);
        w.scale.x = s;
        g.add(w);
        wings.push(w);
      }
      g.position.set(-rx - 10 - rnd() * 30, 7 + rnd() * 3, -rz * 0.6 + rnd() * rz);
      this.scene.add(g);
      this.birds.push({ g, wings, vx: 2.5 + rnd() * 1.5, phase: rnd() * 6 });
    }

    // ngọc dọc đường (nhặt cho vui, không bắt buộc)
    // ngọc: 1 InstancedMesh (nhặt rồi thì thu về 0)
    const gems: Gem[] = [];
    if (!battle) {
      for (let x = -rx + 7; x < rx - 6; x += 2.6 + rnd() * 2) {
        const z = pathZ(x) + (rnd() - 0.5) * 4;
        if (keep.slice(0, 12).some(([kx, kz, r]) => Math.hypot(x - kx, z - kz) < r * 0.8)) continue;
        gems.push({ x, z, i: gems.length, taken: false, pos: new THREE.Vector3(x, 1, z) });
      }
    }
    this.gemMesh = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.32, 0),
      new THREE.MeshStandardMaterial({ color: 0x7fd8ff, emissive: 0x2a8fd8, emissiveIntensity: 0.6, roughness: 0.3 }), Math.max(1, gems.length));
    this.gemMesh.count = gems.length;
    this.gemMesh.frustumCulled = false;
    group.add(this.gemMesh);

    this.chapter = { group, gems };
    this.setNight(th.night);
    return this.chapter;
  }

  /** Nhà nhỏ xinh (khối + mái chóp) dọc 2 bên đường. */
  private buildVillage(g: THREE.Group, rnd: () => number, keep: [number, number, number][],
    inside: (x: number, z: number, m: number) => boolean, free: (x: number, z: number, pad?: number) => boolean): void {
    const walls = [0xffe1ef, 0xfff0c2, 0xd9f2ff, 0xe5ffd6, 0xf0e2ff].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 }));
    const roofs = [0xff7aa8, 0x8f6bd9, 0x4fb3ff, 0xff9a2e, 0x58c26b].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 }));
    const door = new THREE.MeshStandardMaterial({ color: 0x9b5d3a, roughness: 0.9 });
    const win = new THREE.MeshBasicMaterial({ color: 0xfff1a8 });
    const body = new THREE.BoxGeometry(2.6, 2.0, 2.2);
    const roof = new THREE.ConeGeometry(2.1, 1.6, 4).rotateY(Math.PI / 4);
    let placed = 0, tries = 0;
    while (placed < 12 && tries++ < 400) {
      const x = (rnd() * 2 - 1) * 34, z = -(5.5 + rnd() * 6.5);
      if (!inside(x, z, 3) || !free(x, z, 1.8)) continue;
      const h = new THREE.Group();
      const b = new THREE.Mesh(body, walls[placed % walls.length]); b.position.y = 1;
      const r = new THREE.Mesh(roof, roofs[(placed * 2) % roofs.length]); r.position.y = 2.8;
      const d = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.1, 0.05), door); d.position.set(0, 0.55, 1.12);
      const w1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.05), win); w1.position.set(-0.8, 1.3, 1.12);
      const w2 = w1.clone(); w2.position.x = 0.8;
      h.add(b, r, d, w1, w2);
      h.position.set(x, 0, z);
      h.rotation.y = z > 0 ? Math.PI + (rnd() - 0.5) * 0.4 : (rnd() - 0.5) * 0.4;
      h.scale.setScalar(1 + rnd() * 0.25);
      h.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).castShadow = true; });
      g.add(h);
      keep.push([x, z, 2.8]);
      placed++;
    }
  }

  /** Tháp trắng mái vàng (thành phố lâu đài). */
  private buildTowers(g: THREE.Group, rnd: () => number, keep: [number, number, number][],
    inside: (x: number, z: number, m: number) => boolean, free: (x: number, z: number, pad?: number) => boolean): void {
    const wall = new THREE.MeshStandardMaterial({ color: 0xfdf8ff, roughness: 0.8 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xffc94a, roughness: 0.5, emissive: 0x6a4a00, emissiveIntensity: 0.25 });
    const blue = new THREE.MeshStandardMaterial({ color: 0x7fa8ff, roughness: 0.6 });
    let placed = 0, tries = 0;
    while (placed < 10 && tries++ < 400) {
      const x = (rnd() * 2 - 1) * 34, z = -(8 + rnd() * 5);
      if (!inside(x, z, 2.5) || !free(x, z, 1.6)) continue;
      const h = 3.5 + rnd() * 3, r = 0.9 + rnd() * 0.5;
      const t = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.1, h, 16), wall); t.position.set(x, h / 2, z);
      const c = new THREE.Mesh(new THREE.ConeGeometry(r * 1.35, r * 2.6, 16), placed % 3 === 0 ? blue : gold); c.position.set(x, h + r * 1.3, z);
      t.castShadow = c.castShadow = true;
      g.add(t, c);
      keep.push([x, z, r + 1.6]);
      placed++;
    }
  }

  /** Lâu đài Canterlot (trận cuối): trắng, mái vàng/xanh, cửa sổ vàng ấm. Đêm thì tím, sáng lại khi thắng. */
  private buildCastle(group: THREE.Group): void {
    const wall = new THREE.MeshStandardMaterial({ color: 0xf4efff, roughness: 0.85 });
    const roof = new THREE.MeshStandardMaterial({ color: 0xffc94a, roughness: 0.6 });
    const roof2 = new THREE.MeshStandardMaterial({ color: 0x8fa6ff, roughness: 0.6 });
    const win = new THREE.MeshBasicMaterial({ color: 0xffe58a });
    const castle = new THREE.Group();
    const keepM = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.9, 8, 24), wall);
    keepM.position.y = 4;
    castle.add(keepM);
    const keepRoof = new THREE.Mesh(new THREE.ConeGeometry(3.2, 4.4, 24), roof);
    keepRoof.position.y = 10.2;
    castle.add(keepRoof);
    for (const [x, z, h] of [[-6.5, 1, 6], [6.5, 1, 6], [-3.6, -2.5, 9], [3.6, -2.5, 9], [-10, 2, 4.5], [10, 2, 4.5]] as const) {
      const tw = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.25, h, 16), wall);
      tw.position.set(x, h / 2, z);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(1.5, 2.8, 16), Math.abs(x) > 8 ? roof2 : roof);
      cap.position.set(x, h + 1.4, z);
      castle.add(tw, cap);
      const w = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.7), win);
      w.position.set(x, h * 0.6, z + 1.26);
      castle.add(w);
    }
    const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(20, 3.4, 1), wall);
    wallMesh.position.set(0, 1.7, 1.2);
    castle.add(wallMesh);
    const door = new THREE.Mesh(new THREE.CircleGeometry(1.2, 20, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x8a6ad8 }));
    door.position.set(0, 0.01, 1.71);
    castle.add(door);
    castle.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && m.material !== win) m.castShadow = true; });
    castle.position.set(0, 0, -15.5);
    group.add(castle);
  }

  private async addProp(group: THREE.Group, name: string, x: number, z: number, scale: number, rot: number, sway = 0, cast = true): Promise<THREE.Object3D> {
    const { obj } = await this.instance('models/' + name);
    obj.position.set(x, 0, z);
    obj.rotation.y = rot;
    obj.scale.setScalar(scale);
    obj.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).castShadow = cast && !sway; });
    if (sway > 0) {
      const pivot = new THREE.Group();
      pivot.position.copy(obj.position);
      obj.position.set(0, 0, 0);
      pivot.add(obj);
      group.add(pivot);
      this.swayers.push({ obj: pivot, phase: x * 0.35 + z * 0.2, amp: sway });
      return obj;
    }
    group.add(obj);
    return obj;
  }

  /** Gộp mọi mesh tĩnh trong `g` theo vật liệu → vài draw call thay vì vài trăm. */
  private mergeStatic(g: THREE.Group): void {
    g.updateMatrixWorld(true);
    const buckets = new Map<string, { mat: THREE.Material; geos: THREE.BufferGeometry[]; cast: boolean }>();
    const remove: THREE.Mesh[] = [];
    g.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || Array.isArray(m.material) || (m as unknown as THREE.SkinnedMesh).isSkinnedMesh) return;
      const geo = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
      for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k);
      if (!geo.attributes.normal) geo.computeVertexNormals();
      geo.applyMatrix4(m.matrixWorld);
      // gộp theo THUỘC TÍNH vật liệu (Kenney: mỗi file GLB có vật liệu riêng dù cùng màu) → ít nhóm hơn
      const mm = m.material as THREE.MeshStandardMaterial;
      const key = mm.map ? mm.uuid : `${mm.type}|${mm.color?.getHexString()}|${mm.emissive?.getHexString()}|${mm.transparent}|${mm.side}`;
      const sig = `${key}|${Object.keys(geo.attributes).sort().join(',')}|${m.castShadow}`;
      let b = buckets.get(sig);
      if (!b) { b = { mat: m.material, geos: [], cast: m.castShadow }; buckets.set(sig, b); }
      b.geos.push(geo);
      remove.push(m);
    });
    for (const m of remove) m.removeFromParent();
    for (const b of buckets.values()) {
      const merged = mergeGeometries(b.geos, false);
      if (!merged) continue;
      const mesh = new THREE.Mesh(merged, b.mat);
      mesh.castShadow = b.cast;
      mesh.receiveShadow = true;
      g.add(mesh);
    }
    // nhóm con rỗng
    g.position.set(0, 0, 0);
  }

  private bubbleMat: THREE.MeshPhysicalMaterial | null = null;
  /** Bong bóng pha lê bán kính R: vỏ trong suốt + 🌙 + ✨, `holder` ở đáy để gắn người bị nhốt. */
  makeBubble(R: number, dark = false): { group: THREE.Group; mesh: THREE.Mesh; holder: THREE.Group } {
    if (!this.bubbleMat) {
      this.bubbleMat = new THREE.MeshPhysicalMaterial({ color: 0xe4dcff, transparent: true, opacity: 0.34, roughness: 0.1, metalness: 0, clearcoat: 1, depthWrite: false });
    }
    const mat = dark ? new THREE.MeshPhysicalMaterial({ color: 0x6a3cc8, transparent: true, opacity: 0.42, roughness: 0.1, clearcoat: 1, depthWrite: false, emissive: 0x2a0f60 }) : this.bubbleMat;
    const group = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(R, 32, 24), mat);
    mesh.renderOrder = 2;
    group.add(mesh);
    const holder = new THREE.Group();
    holder.position.y = -R * 0.8;
    group.add(holder);
    const k = Math.sqrt(R / 1.5);
    const moonBadge = this.emojiSprite('🌙', 0.8 * k);
    moonBadge.position.set(R * 0.62, R * 0.62, R * 0.4);
    group.add(moonBadge);
    const shine = this.emojiSprite('✨', 0.7 * k);
    shine.position.set(-R * 0.5, R * 0.55, R * 0.5);
    group.add(shine);
    return { group, mesh, holder };
  }

  private updateClouds(): void {
    let i = 0;
    for (const g of this.clouds) {
      g.updateMatrixWorld(true);
      for (const s of g.children) this.cloudMesh.setMatrixAt(i++, s.matrixWorld);
    }
    this.cloudMesh.instanceMatrix.needsUpdate = true;
  }

  /** Bật / tắt bóng đổ thật (trận cuối tắt để giữ ngân sách draw call). */
  setShadows(on: boolean): void { this.sun.castShadow = on; }

  // ---------- chạm ----------
  /** Toạ độ màn hình (px) → tia từ camera. */
  private setRay(px: number, py: number): void {
    const v = new THREE.Vector2((px / window.innerWidth) * 2 - 1, -(py / window.innerHeight) * 2 + 1);
    this.ray.setFromCamera(v, this.camera);
  }
  /** Vật chạm trúng đầu tiên trong `objs` (đệ quy), null nếu không. */
  pick(px: number, py: number, objs: THREE.Object3D[]): THREE.Intersection | null {
    if (!objs.length) return null;
    this.setRay(px, py);
    return this.ray.intersectObjects(objs, true)[0] ?? null;
  }
  /** Điểm trên mặt đất (y = 0) dưới ngón tay. */
  groundAt(px: number, py: number): THREE.Vector3 | null {
    this.setRay(px, py);
    return this.ray.ray.intersectPlane(this.groundPlane, new THREE.Vector3());
  }
  /** Chiếu điểm thế giới ra px màn hình. */
  toScreen(p: THREE.Vector3): { x: number; y: number } {
    const v = p.clone().project(this.camera);
    return { x: (v.x + 1) / 2 * window.innerWidth, y: (1 - v.y) / 2 * window.innerHeight };
  }

  // ---------- vòng lặp ----------
  start(update: (dt: number) => void): void {
    let t = 0;
    this.renderer.setAnimationLoop(() => {
      this.timer.update();
      const dt = Math.min(this.timer.getDelta(), 0.05);
      t += dt;
      updateTweens(dt);
      update(dt);
      for (const u of this.updaters) u(dt, t);
      this.magic.update(dt);
      this.shadow.update(dt);
      this.renderer.render(this.scene, this.camera);
    });
  }

  /** Camera cố định (cảnh phim, trận cuối); null = bám nhân vật. snap = nhảy ngay. */
  setCamera(pos: THREE.Vector3 | null, look?: THREE.Vector3, snap = false, fov = 38): void {
    this.camOverride = pos ? { pos: pos.clone(), look: (look ?? new THREE.Vector3()).clone() } : null;
    if (pos && snap) { this.camera.position.copy(pos); this.camLook.copy(look ?? new THREE.Vector3()); this.camera.lookAt(this.camLook); }
    this.fovGoal = pos ? fov : 38;
    if (snap || !pos) { this.camera.fov = this.fovGoal; this.camera.updateProjectionMatrix(); }
  }
  get cameraOverridden(): boolean { return !!this.camOverride; }

  /** Đặt ngay mục tiêu camera bám (khi đổi chương / nhảy cóc). */
  snapFollow(x: number, z: number): void { this.camTarget.set(x, 0, z); }

  /** Camera bám nhân vật, mây trôi, ngọc xoay, bướm/chim/cỏ/đom đóm. */
  follow(dt: number, hx: number, hz: number, t: number): void {
    // đang săn sao: camera nhìn giữa Twilight và chỗ các sao → thấy đủ sao
    if (this.focus) { hx = hx * 0.45 + this.focus.x * 0.55; hz = hz * 0.6 + this.focus.z * 0.4; }
    this.camTarget.x += (hx - this.camTarget.x) * Math.min(1, dt * 3.5);
    this.camTarget.z += (hz - this.camTarget.z) * Math.min(1, dt * 3.5);
    if (this.camOverride) {
      const r = Math.min(1, dt * 2.5);
      this.camera.position.lerp(this.camOverride.pos, r);
      this.camLook.lerp(this.camOverride.look, r);
      this.camera.lookAt(this.camLook);
      if (Math.abs(this.camera.fov - this.fovGoal) > 0.05) { this.camera.fov += (this.fovGoal - this.camera.fov) * r; this.camera.updateProjectionMatrix(); }
      this.sun.position.set(this.camLook.x + 8, 16, this.camLook.z + 12);
      this.sun.target.position.set(this.camLook.x, 0, this.camLook.z);
    } else {
      this.camera.position.copy(this.camTarget).add(CAM_OFFSET);
      this.camLook.set(this.camTarget.x, 1.0, this.camTarget.z - 1.2);
      this.camera.lookAt(this.camLook);
      this.sun.position.set(this.camTarget.x + 8, 16, this.camTarget.z + 10);
      this.sun.target.position.set(this.camTarget.x, 0, this.camTarget.z);
    }
    for (const c of this.clouds) {
      c.position.x += c.userData.speed * dt;
      if (c.position.x > 110) c.position.x -= 220;
    }
    this.updateClouds();
    if (!this.chapter) return;
    if (this.gemMesh && this.chapter.gems.length) {
      const o = this.tmpObj;
      for (const g of this.chapter.gems) {
        g.pos.y = 1.0 + Math.sin(t * 3 + g.x) * 0.12;
        o.position.copy(g.pos);
        o.rotation.set(0, t * 2 + g.x, 0);
        o.scale.setScalar(g.taken ? 0.0001 : 1);
        o.updateMatrix();
        this.gemMesh.setMatrixAt(g.i, o.matrix);
      }
      this.gemMesh.instanceMatrix.needsUpdate = true;
    }
    for (const s of this.swayers) {
      s.obj.rotation.z = Math.sin(t * 1.8 + s.phase) * s.amp;
      s.obj.rotation.x = Math.sin(t * 1.3 + s.phase * 1.7) * s.amp * 0.5;
    }
    for (const f of this.fliers) {
      const a = t * f.speed + f.phase;
      f.sp.position.set(f.ax + Math.sin(a) * f.r, f.h + Math.sin(a * 2.3) * 0.35, f.az + Math.sin(a * 0.7) * Math.cos(a) * f.r);
      const flap = 0.55 + 0.45 * Math.abs(Math.sin(t * 14 + f.phase));
      f.sp.scale.set(f.size * flap, f.size, 1);
    }
    const showBirds = this.night < 0.6;
    const edge = (this.def?.island.rx ?? 30) + 25;
    for (const bd of this.birds) {
      bd.g.visible = showBirds;
      bd.g.position.x += bd.vx * dt;
      if (bd.g.position.x > edge) bd.g.position.x = -edge;
      const a = Math.sin(t * 9 + bd.phase) * 0.6;
      bd.wings[0].rotation.z = a; bd.wings[1].rotation.z = -a;
    }
    if (this.night > 0.35) {
      this.fireflyT += dt * this.night;
      while (this.fireflyT > 0.1) {
        this.fireflyT -= 0.1;
        const [cx, cz] = this.clampToIsland(this.camTarget.x + (Math.random() * 2 - 1) * 16, this.camTarget.z + (Math.random() * 2 - 1) * 9);
        this.magic.emit({ x: cx, y: 0.4 + Math.random() * 2.2, z: cz, color: Math.random() < 0.7 ? 0xfff2a0 : 0xc5ffb0,
          vx: (Math.random() - 0.5) * 0.4, vy: 0.15, vz: (Math.random() - 0.5) * 0.4, max: 2.2, size: 0.18 });
      }
    }
  }

  get gems(): Gem[] { return this.chapter?.gems ?? []; }
  get chapterGroup(): THREE.Group | null { return this.chapter?.group ?? null; }
}

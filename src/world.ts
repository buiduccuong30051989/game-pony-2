// Thế giới 3D: đảo ellipse rộng giữa biển, camera bám sau lưng nhân vật, props Kenney, ngọc, bong bóng.
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { PALETTE, type LevelDef } from './data';
import { Magic } from './magic';
import { updateTweens } from './tween';

export interface Gem { x: number; z: number; mesh: THREE.Mesh; taken: boolean }
export interface LevelHandles { gems: Gem[]; bubble: THREE.Group; bubbleMesh: THREE.Mesh; rescueSprite: THREE.Sprite; group: THREE.Group }

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CAM_OFFSET = new THREE.Vector3(0, 9.5, 12.5);

export class World {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly magic: Magic;
  private readonly timer = new THREE.Timer();
  private readonly loader = new GLTFLoader();
  private readonly cache = new Map<string, Promise<GLTF>>();
  private readonly recolored = new Map<THREE.Material, THREE.Material>();
  private readonly clouds: THREE.Group[] = [];
  private level: LevelHandles | null = null;
  private levelDef: LevelDef | null = null;
  private readonly camTarget = new THREE.Vector3();
  private sun!: THREE.DirectionalLight;
  private readonly recolorMap: Record<string, number> = {
    leafsGreen: PALETTE.leaf, grass: PALETTE.grassProp, woodBark: PALETTE.bark, dirt: PALETTE.bark,
  };

  constructor(container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.NoToneMapping;
    container.appendChild(this.renderer.domElement);

    this.scene.background = new THREE.Color(PALETTE.sky);
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400);
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.buildLights();
    this.buildBackdrop();
    this.magic = new Magic(this.scene);
  }

  private resize(): void {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private buildLights(): void {
    this.scene.add(new THREE.HemisphereLight(0xfff9ec, 0xbfe09c, 1.25));
    const sun = new THREE.DirectionalLight(0xfff5e2, 2.4);
    sun.position.set(8, 16, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -18; sun.shadow.camera.right = 18;
    sun.shadow.camera.top = 18; sun.shadow.camera.bottom = -18;
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 60;
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
    sun.shadow.intensity = 0.45;
    this.scene.add(sun);
    this.scene.add(sun.target);
    this.sun = sun;
  }

  /** Trời gradient, biển, đồi xa phía sau, mây. Giữ qua các màn. */
  private buildBackdrop(): void {
    const geo = new THREE.PlaneGeometry(900, 60, 1, 1);
    const colors = new Float32Array(4 * 3);
    const top = new THREE.Color(PALETTE.skyTop), bot = new THREE.Color(PALETTE.sky);
    [top, top, bot, bot].forEach((c, i) => { colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b; });
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const sky = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true }));
    sky.position.set(0, 14, -140);
    this.scene.add(sky);
    const skyUpper = new THREE.Mesh(new THREE.PlaneGeometry(900, 300), new THREE.MeshBasicMaterial({ color: PALETTE.skyTop }));
    skyUpper.position.set(0, 190, -140.5);
    this.scene.add(skyUpper);

    const water = new THREE.Mesh(new THREE.PlaneGeometry(900, 500), new THREE.MeshStandardMaterial({ color: PALETTE.water, roughness: 0.9 }));
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, -1.4, -60);
    water.receiveShadow = true;
    this.scene.add(water);

    const rnd = mulberry32(7);
    for (let i = 0; i < 22; i++) {
      const far = i % 2 === 0;
      const hill = new THREE.Mesh(
        new THREE.SphereGeometry(far ? 22 + rnd() * 12 : 12 + rnd() * 8, 24, 12),
        new THREE.MeshStandardMaterial({ color: far ? PALETTE.hillFar : PALETTE.hill, roughness: 1 }),
      );
      hill.scale.y = 0.4;
      hill.position.set(-120 + i * 12 + rnd() * 6, -4, far ? -110 - rnd() * 20 : -75 - rnd() * 12);
      this.scene.add(hill);
    }
    for (let i = 0; i < 14; i++) {
      const g = new THREE.Group();
      const m = new THREE.MeshStandardMaterial({ color: PALETTE.cloud, roughness: 1 });
      for (let k = 0; k < 4; k++) {
        const s = new THREE.Mesh(new THREE.SphereGeometry(1.6 + rnd() * 1.4, 14, 10), m);
        s.position.set(k * 2 - 3, rnd() * 0.8, 0);
        g.add(s);
      }
      g.position.set(-90 + i * 14 + rnd() * 8, 16 + rnd() * 8, -50 - rnd() * 40);
      g.userData.speed = 0.3 + rnd() * 0.4;
      this.scene.add(g);
      this.clouds.push(g);
    }
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

  emojiSprite(emoji: string, size = 1): THREE.Sprite {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d')!;
    ctx.font = '200px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 128, 140);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    sp.scale.setScalar(size);
    return sp;
  }

  // ---------- đảo ----------
  /** Kéo (x,z) vào trong đảo nếu lọt ra ngoài mép. */
  clampToIsland(x: number, z: number): [number, number] {
    if (!this.levelDef) return [x, z];
    const { rx, rz } = this.levelDef.island;
    const k = Math.hypot(x / (rx - 1.2), z / (rz - 1.2));
    if (k <= 1) return [x, z];
    return [x / k, z / k];
  }

  async buildLevel(def: LevelDef): Promise<LevelHandles> {
    if (this.level) this.scene.remove(this.level.group);
    this.levelDef = def;
    const group = new THREE.Group();
    this.scene.add(group);
    const rnd = mulberry32(def.id.length * 977 + def.island.rx);
    const { rx, rz } = def.island;

    // đảo: trụ ellipse, mặt cỏ, vách cát; viền cỏ đậm
    const grass = new THREE.MeshStandardMaterial({ color: PALETTE.grassTop, roughness: 1 });
    const sand = new THREE.MeshStandardMaterial({ color: PALETTE.sand, roughness: 1 });
    const island = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.07, 2.2, 128), [sand, grass, sand]);
    island.scale.set(rx, 1, rz);
    island.position.y = -1.1;
    island.receiveShadow = true;
    group.add(island);
    const rim = new THREE.Mesh(new THREE.RingGeometry(0.955, 1.0, 128), new THREE.MeshStandardMaterial({ color: PALETTE.grassDark, roughness: 1 }));
    rim.rotation.x = -Math.PI / 2;
    rim.position.y = 0.01;
    rim.scale.set(rx, rz, 1);
    group.add(rim);
    const shade = new THREE.Mesh(new THREE.CircleGeometry(1.12, 96), new THREE.MeshBasicMaterial({ color: 0x84cfe6, transparent: true, opacity: 0.5 }));
    shade.rotation.x = -Math.PI / 2;
    shade.position.y = -1.39;
    shade.scale.set(rx, rz, 1);
    group.add(shade);

    // chỗ cần trống: quái, ngọc, bong bóng, xuất phát
    const keep: [number, number, number][] = [
      ...def.monsters.map((m) => [m.x, m.z, 3.2] as [number, number, number]),
      ...def.gems.map(([x, z]) => [x, z, 1.6] as [number, number, number]),
      [def.bubble[0], def.bubble[1], 3.5], [def.start[0], def.start[1], 3],
    ];
    const free = (x: number, z: number) => keep.every(([kx, kz, r]) => Math.hypot(x - kx, z - kz) > r);
    const inside = (x: number, z: number, margin: number) => Math.hypot(x / (rx - margin), z / (rz - margin)) < 1;

    const jobs: Promise<unknown>[] = [];
    const trees = ['tree_default', 'tree_fat', 'tree_oak', 'tree_small'];
    const smalls = ['plant_bush', 'plant_bushSmall', 'flower_yellowA', 'flower_redA', 'flower_purpleA', 'rock_smallA', 'mushroom_red', 'grass', 'grass_large'];
    let placed = 0, tries = 0;
    while (placed < 26 && tries++ < 400) {
      const x = (rnd() * 2 - 1) * rx, z = (rnd() * 2 - 1) * rz;
      if (!inside(x, z, 2.5) || !free(x, z)) continue;
      // cây ưu tiên gần mép và phía sau (z âm) để không che nhân vật
      const edge = Math.hypot(x / rx, z / rz);
      if (edge < 0.55 && rnd() < 0.7) continue;
      jobs.push(this.addProp(group, trees[Math.floor(rnd() * trees.length)] + '.glb', x, z, 1.4 + rnd() * 0.7, rnd()));
      keep.push([x, z, 2.2]);
      placed++;
    }
    placed = 0; tries = 0;
    while (placed < 90 && tries++ < 900) {
      const x = (rnd() * 2 - 1) * rx, z = (rnd() * 2 - 1) * rz;
      if (!inside(x, z, 1.5) || !free(x, z)) continue;
      jobs.push(this.addProp(group, smalls[Math.floor(rnd() * smalls.length)] + '.glb', x, z, 0.8 + rnd() * 0.6));
      placed++;
    }
    await Promise.all(jobs);

    // ngọc
    const gemGeo = new THREE.OctahedronGeometry(0.32, 0);
    const gemMat = new THREE.MeshStandardMaterial({ color: 0x7fd8ff, emissive: 0x2a8fd8, emissiveIntensity: 0.5, roughness: 0.3 });
    const gems: Gem[] = def.gems.map(([x, z]) => {
      const mesh = new THREE.Mesh(gemGeo, gemMat);
      mesh.position.set(x, 1.0, z);
      mesh.castShadow = true;
      group.add(mesh);
      return { x, z, mesh, taken: false };
    });

    // bong bóng + người thân
    const bubble = new THREE.Group();
    const bubbleMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 32, 24),
      new THREE.MeshPhysicalMaterial({ color: 0xd8f3ff, transparent: true, opacity: 0.38, roughness: 0.1, metalness: 0, clearcoat: 1 }),
    );
    bubble.add(bubbleMesh);
    const rescueSprite = this.emojiSprite(def.rescue.emoji, 1.7);
    rescueSprite.position.y = -0.1;
    bubble.add(rescueSprite);
    const shine = this.emojiSprite('✨', 0.7);
    shine.position.set(-0.7, 0.8, 0.7);
    bubble.add(shine);
    bubble.position.set(def.bubble[0], 1.9, def.bubble[1]);
    group.add(bubble);

    this.level = { gems, bubble, bubbleMesh, rescueSprite, group };
    this.camTarget.set(def.start[0], 0, def.start[1]);
    return this.level;
  }

  private async addProp(group: THREE.Group, name: string, x: number, z: number, scale: number, tint?: number): Promise<void> {
    const { obj } = await this.instance('models/' + name);
    obj.position.set(x, 0, z);
    obj.rotation.y = Math.random() * Math.PI * 2;
    obj.scale.setScalar(scale);
    if (tint !== undefined) {
      obj.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh && !Array.isArray(mesh.material) && mesh.material.name === 'leafsGreen') {
          const m = (mesh.material as THREE.MeshStandardMaterial).clone();
          m.color.offsetHSL((tint - 0.5) * 0.06, 0, (tint - 0.5) * 0.12);
          mesh.material = m;
        }
      });
    }
    group.add(obj);
  }

  start(update: (dt: number) => void): void {
    this.renderer.setAnimationLoop(() => {
      this.timer.update();
      const dt = Math.min(this.timer.getDelta(), 0.05);
      updateTweens(dt);
      update(dt);
      this.magic.update(dt);
      this.renderer.render(this.scene, this.camera);
    });
  }

  /** Camera bám sau lưng nhân vật (góc cố định), mây trôi, ngọc xoay, bong bóng nhún. */
  follow(dt: number, hx: number, hz: number, t: number): void {
    this.camTarget.x += (hx - this.camTarget.x) * Math.min(1, dt * 4);
    this.camTarget.z += (hz - this.camTarget.z) * Math.min(1, dt * 4);
    this.camera.position.copy(this.camTarget).add(CAM_OFFSET);
    this.camera.lookAt(this.camTarget.x, 1.0, this.camTarget.z);
    this.sun.position.set(this.camTarget.x + 8, 16, this.camTarget.z + 10);
    this.sun.target.position.set(this.camTarget.x, 0, this.camTarget.z);
    for (const c of this.clouds) {
      c.position.x += c.userData.speed * dt;
      if (c.position.x > 110) c.position.x -= 220;
    }
    if (this.level) {
      for (const g of this.level.gems) {
        if (g.taken) continue;
        g.mesh.rotation.y += dt * 2;
        g.mesh.position.y = 1.0 + Math.sin(t * 3 + g.x) * 0.12;
      }
      this.level.bubble.position.y = 1.9 + Math.sin(t * 1.6) * 0.18;
    }
  }
}

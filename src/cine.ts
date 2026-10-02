// Cảnh phim (20–40 s): camera chạy theo đường, phụ đề người kể, thẻ nhân vật, nút ⏩ bỏ qua.
// Bỏ qua: mọi bước còn lại chạy NGAY (tween nhảy tới cuối, câu thoại không đọc) → kịch bản luôn kết thúc ở đúng trạng thái cuối.
import * as THREE from 'three';
import type { World } from './world';
import { stopSpeech } from './audio';
import { say, narrate, cancelTalk, clearTalk, raceSkip, type Speaker } from './talk';
import { tween as rawTween, wait as rawWait, easeInOutSine } from './tween';
import { showSkip, setCinema } from './ui';

export class Cine {
  skipped = false;
  private constructor(private world: World) {}

  /** Chạy 1 cảnh. `skippable`: có nút ⏩ (mặc định có). */
  static async play(world: World, script: (c: Cine) => Promise<void>, skippable = true): Promise<boolean> {
    const c = new Cine(world);
    setCinema(true);
    if (skippable) showSkip(() => c.skip());
    try { await script(c); } finally {
      showSkip(null);
      setCinema(false);
      clearTalk();
    }
    return c.skipped;
  }

  skip(): void {
    if (this.skipped) return;
    this.skipped = true;
    stopSpeech();
    cancelTalk();
  }

  /** Người kể chuyện. */
  async nar(key: string): Promise<void> { if (!this.skipped) await narrate(key); }
  /** Nhân vật nói. */
  async say(who: Speaker, key: string): Promise<void> { if (!this.skipped) await say(who, key); }
  async wait(ms: number): Promise<void> { if (!this.skipped) await raceSkip(rawWait(ms)); }

  /** Tween bỏ qua được: bị ⏩ thì nhảy tới k = 1 ngay và bỏ các bước giữa. */
  async tween(ms: number, fn: (k: number) => void, ease = easeInOutSine): Promise<void> {
    if (this.skipped) { fn(1); return; }
    let finished = false;
    const p = rawTween(ms, (k) => { if (!this.skipped) fn(k); }, ease).then(() => { finished = true; });
    await raceSkip(p);
    if (!finished || this.skipped) fn(1);
  }

  /** Camera bay tới (pos, look) trong ms. */
  async cam(pos: THREE.Vector3, look: THREE.Vector3, ms: number, fov?: number): Promise<void> {
    const cam = this.world.camera;
    const p0 = cam.position.clone();
    const dir = new THREE.Vector3();
    cam.getWorldDirection(dir);
    const l0 = p0.clone().add(dir.multiplyScalar(p0.distanceTo(look)));
    const f0 = cam.fov, f1 = fov ?? cam.fov;
    await this.tween(ms, (k) => {
      this.world.setCamera(p0.clone().lerp(pos, k), l0.clone().lerp(look, k), true, f0 + (f1 - f0) * k);
    });
  }
  /** Đặt camera ngay. */
  camNow(pos: THREE.Vector3, look: THREE.Vector3, fov = 38): void { this.world.setCamera(pos, look, true, fov); }

  /** Camera bay vòng cung quanh tâm `c` (góc a0 → a1, bán kính r, cao h). */
  async orbit(c: THREE.Vector3, r: number, h: number, a0: number, a1: number, ms: number, fov = 40): Promise<void> {
    await this.tween(ms, (k) => {
      const a = a0 + (a1 - a0) * k;
      this.world.setCamera(new THREE.Vector3(c.x + Math.sin(a) * r, h, c.z + Math.cos(a) * r), c, true, fov);
    });
  }
}

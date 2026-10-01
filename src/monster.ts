// Quái vật tròn dễ thương: thân cầu + mắt to + chân nhỏ. Bị phép thì tan thành bươm bướm.
import * as THREE from 'three';
import type { ChallengeKind } from './data';
import type { World } from './world';
import { tween, easeOutQuad } from './tween';

export class Monster {
  readonly group = new THREE.Group();
  defeated = false;
  private t = Math.random() * 10;
  private readonly body: THREE.Mesh;

  constructor(private world: World, readonly x: number, readonly z: number, readonly kind: ChallengeKind, color: number) {
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
    this.body = new THREE.Mesh(new THREE.SphereGeometry(0.8, 28, 20), mat);
    this.body.position.y = 0.85;
    this.body.castShadow = true;
    this.group.add(this.body);

    const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
    const black = new THREE.MeshStandardMaterial({ color: 0x2b2330, roughness: 0.6 });
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), white);
      eye.position.set(s * 0.3, 1.0, 0.62);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), black);
      pupil.position.set(s * 0.3, 1.0, 0.82);
      const glint = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), white);
      glint.position.set(s * 0.3 + 0.04, 1.05, 0.9);
      this.group.add(eye, pupil, glint);
      const foot = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), mat);
      foot.position.set(s * 0.35, 0.12, 0.15);
      foot.scale.y = 0.6;
      foot.castShadow = true;
      this.group.add(foot);
    }
    // má hồng + miệng cười
    const blush = new THREE.MeshStandardMaterial({ color: 0xff9ec4, roughness: 1 });
    for (const s of [-1, 1]) {
      const b = new THREE.Mesh(new THREE.CircleGeometry(0.09, 12), blush);
      b.position.set(s * 0.5, 0.78, 0.66);
      this.group.add(b);
    }
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 8, 16, Math.PI), black);
    mouth.rotation.z = Math.PI;
    mouth.position.set(0, 0.72, 0.78);
    this.group.add(mouth);
    // sừng nhỏ để biết là "quái"
    const hornMat = new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 1 });
    for (const s of [-1, 1]) {
      const h = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 8), hornMat);
      h.position.set(s * 0.4, 1.62, 0);
      h.rotation.z = -s * 0.4;
      this.group.add(h);
    }

    this.group.position.set(x, 0, z);
    world.scene.add(this.group);
  }

  get center(): THREE.Vector3 { return new THREE.Vector3(this.x, 0.9, this.z); }

  /** Quay mặt về phía nhân vật. */
  faceTo(x: number, z: number): void { this.group.rotation.y = Math.atan2(x - this.x, z - this.z); }

  update(dt: number): void {
    if (this.defeated) return;
    this.t += dt;
    const s = Math.sin(this.t * 3);
    this.body.scale.set(1 + s * 0.04, 1 - s * 0.05, 1 + s * 0.04);
    this.group.position.y = Math.max(0, Math.sin(this.t * 3) * 0.05);
  }

  /** Nhún cười khi bé trả lời sai (không phạt). */
  async giggle(): Promise<void> {
    await tween(500, (k) => { this.group.rotation.z = Math.sin(k * Math.PI * 4) * 0.12 * (1 - k); });
    this.group.rotation.z = 0;
  }

  /** Tan thành bươm bướm bay lên. */
  async defeat(): Promise<void> {
    this.defeated = true;
    const c = this.center;
    this.world.magic.burst(c, 120, 0xc084fc, 3.2, 0.36, 1.0);
    this.world.magic.burst(c, 60, 0xffe08a, 2.2, 0.28, 0.9);
    await tween(450, (k) => {
      this.group.scale.setScalar(1 - k * 0.9);
      this.group.rotation.y += 0.25;
    }, easeOutQuad);
    this.world.scene.remove(this.group);
    const flies: THREE.Sprite[] = [];
    for (let i = 0; i < 9; i++) {
      const sp = this.world.emojiSprite(i % 3 === 0 ? '🌸' : '🦋', 0.55);
      sp.position.copy(c).add(new THREE.Vector3((Math.random() - 0.5) * 1.2, Math.random() * 0.8, (Math.random() - 0.5) * 0.6));
      sp.userData.phase = Math.random() * 6;
      this.world.scene.add(sp);
      flies.push(sp);
    }
    await tween(2200, (k) => {
      for (const f of flies) {
        f.position.y += 0.012 + Math.sin(k * 20 + f.userData.phase) * 0.004;
        f.position.x += Math.sin(k * 6 + f.userData.phase) * 0.012;
        f.material.opacity = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
      }
    });
    for (const f of flies) this.world.scene.remove(f);
  }
}

// Điều phối: bản đồ → đảo → đi 4 hướng/nhảy/nhặt ngọc → quái → thử thách → phép → bong bóng → cứu.
import * as THREE from 'three';
import { LEVELS, RESCUE_ORDER, WORDS, PALETTE, type LevelDef } from './data';
import { World, type LevelHandles } from './world';
import { Hero } from './hero';
import { Monster } from './monster';
import { Challenge } from './challenge';
import { unlockAudio, preload, play, sfx, stopSpeech } from './audio';
import { els, showControls, setStars, setGems, toast, confetti, renderMap, hideMap, showPanel } from './ui';
import { tween, wait, easeOutBack } from './tween';

const AUDIO_KEYS = [
  'hint_move', 'monster', 'ask_count', 'ask_pick_number', 'right', 'magic', 'good', 'yay', 'retry', 'almost', 'hint_last',
  'star', 'stars3', 'bubble', 'bigspell', 'meow', 'level_done', 'gem',
  'sfx_tap', 'sfx_pop', 'sfx_win', 'sfx_soft',
  ...['n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8', 'n9', 'n10'],
  ...LEVELS.flatMap((l) => [l.introAudio, l.rescue.audio]),
  ...WORDS.flatMap((w) => [`ask_${w.id}`, `name_${w.id}`, ...w.tokens.map((t) => t.audio)]),
];

interface Progress { unlocked: number; done: string[] }
function loadProgress(): Progress {
  try { const p = JSON.parse(localStorage.getItem('haan-progress') || ''); if (p && typeof p.unlocked === 'number') return p; } catch { /* trống */ }
  return { unlocked: 1, done: [] };
}
function saveProgress(p: Progress): void { try { localStorage.setItem('haan-progress', JSON.stringify(p)); } catch { /* bỏ qua */ } }

async function boot(): Promise<void> {
  const world = new World(document.getElementById('app')!);
  const progress = loadProgress();
  let hero: Hero | null = null;
  let level: LevelDef | null = null;
  let handles: LevelHandles | null = null;
  let monsters: Monster[] = [];
  let stars = 0, gems = 0, t = 0;
  let inChallenge = false, rescued = false;
  let hornSparkle = 0, guideTimer = 0;

  const ready = Promise.all([world.load('models/twilight_static/scene.gltf'), world.load('models/tree_default.glb')]);
  world.start((dt) => {
    t += dt;
    if (hero) {
      hero.update(dt, (x, z) => world.clampToIsland(x, z));
      world.follow(dt, hero.x, hero.z, t);
      tick(dt);
    } else {
      world.follow(dt, 0, 0, t);
    }
  });

  await ready;
  els.startBtn.classList.add('ready');
  els.startBtn.addEventListener('click', async () => {
    unlockAudio();
    els.start.classList.add('hide');
    setTimeout(() => (els.start.hidden = true), 500);
    await preload(AUDIO_KEYS);
    openMap();
  }, { once: true });

  function openMap(): void {
    showControls(false);
    renderMap(progress.unlocked, progress.done, LEVELS.map((l) => l.id), (id) => void startLevel(id));
  }

  async function startLevel(id: string): Promise<void> {
    const def = LEVELS.find((l) => l.id === id)!;
    hideMap();
    stopSpeech();
    if (hero) world.scene.remove(hero.root);
    for (const m of monsters) world.scene.remove(m.group);
    hero = null; monsters = []; handles = null;
    level = def; stars = 0; gems = 0; rescued = false; inChallenge = false;
    setStars(0); setGems(0);
    handles = await world.buildLevel(def);
    monsters = def.monsters.map((m) => new Monster(world, m.x, m.z, m.kind, m.color));
    const h = await Hero.load(world, def.hero);
    h.x = def.start[0]; h.z = def.start[1];
    h.faceTo(def.monsters[0].x, def.monsters[0].z);
    hero = h;
    showControls(true);
    await play(def.introAudio);
    await play('hint_move');
  }

  /** Mục tiêu hiện tại: quái gần nhất chưa bị phép, hoặc bong bóng khi đủ sao. */
  function currentTarget(): THREE.Vector3 | null {
    if (!hero || !handles) return null;
    if (stars >= 3) return handles.bubble.position.clone().setY(0.5);
    let best: Monster | null = null, bd = Infinity;
    for (const m of monsters) {
      if (m.defeated) continue;
      const d = Math.hypot(m.x - hero.x, m.z - hero.z);
      if (d < bd) { bd = d; best = m; }
    }
    return best ? new THREE.Vector3(best.x, 0.5, best.z) : null;
  }

  // ---------- vòng lặp màn ----------
  function tick(dt: number): void {
    if (!hero || !level || !handles) return;
    for (const m of monsters) m.update(dt);

    hornSparkle += dt;
    if (hornSparkle > 0.12) { hornSparkle = 0; world.magic.twinkle(hero.hornWorld(), PALETTE.magicPink, 1, 0.3); }

    // đường sao dẫn lối tới mục tiêu (khi không trong thử thách)
    guideTimer += dt;
    if (guideTimer > 0.35 && !inChallenge) {
      guideTimer = 0;
      const tg = currentTarget();
      if (tg) {
        const from = new THREE.Vector3(hero.x, 0.5, hero.z);
        const dist = from.distanceTo(tg);
        if (dist > 4) {
          const dir = tg.clone().sub(from).normalize();
          for (let i = 0; i < 4; i++) {
            const p = from.clone().add(dir.clone().multiplyScalar(2.5 + i * 1.4));
            world.magic.emit({ x: p.x, y: 0.4 + Math.random() * 0.4, z: p.z, color: PALETTE.star, vy: 0.6, max: 0.9, size: 0.26 });
          }
        }
      }
    }

    // nhặt ngọc
    for (const g of handles.gems) {
      if (!g.taken && Math.hypot(g.x - hero.x, g.z - hero.z) < 1.2 && hero.y < 1.6) {
        g.taken = true;
        g.mesh.visible = false;
        gems++; setGems(gems);
        sfx('sfx_pop', 0.5);
        world.magic.burst(g.mesh.position, 26, 0x7fd8ff, 1.8, 0.24, 0.6, -1);
      }
    }

    // gặp quái
    if (!inChallenge && hero.grounded) {
      const hx = hero.x, hz = hero.z;
      const near = monsters.find((m) => !m.defeated && Math.hypot(m.x - hx, m.z - hz) < 2.8);
      if (near) void challengeAt(near);
    }

    // bong bóng cuối màn
    if (stars >= 3 && !rescued && !inChallenge && hero.grounded
      && Math.hypot(handles.bubble.position.x - hero.x, handles.bubble.position.z - hero.z) < 3.4) {
      void rescue();
    }
  }

  async function challengeAt(m: Monster): Promise<void> {
    if (!hero || !level) return;
    inChallenge = true;
    hero.locked = true; hero.setMove(0, 0);
    hero.faceTo(m.x, m.z);
    m.faceTo(hero.x, hero.z);
    const ch = new Challenge(level, { onWrong: () => void m.giggle() });
    await ch.run(m.kind);
    await play('magic');
    world.magic.ring(new THREE.Vector3(hero.x, 0.1, hero.z), PALETTE.magic, 70, 2.5);
    void hero.castPose(900);
    await world.magic.beam(hero.hornWorld(), m.center, PALETTE.magic, PALETTE.magicPink, 0.9);
    void m.defeat();
    stars++; setStars(stars);
    toast('⭐ +1');
    confetti(30);
    await play(stars >= 3 ? 'stars3' : 'star');
    if (stars >= 3) await hero.celebrate();
    hero.locked = false;
    inChallenge = false;
  }

  async function rescue(): Promise<void> {
    if (!hero || !level || !handles) return;
    rescued = true;
    inChallenge = true;
    hero.locked = true; hero.setMove(0, 0);
    hero.faceTo(handles.bubble.position.x, handles.bubble.position.z);
    await play('bubble');
    showPanel(true);
    els.cast.hidden = false;
    await new Promise<void>((r) => els.cast.addEventListener('click', () => r(), { once: true }));
    showPanel(false);
    await play('bigspell');
    const target = handles.bubble.position.clone();
    world.magic.ring(new THREE.Vector3(hero.x, 0.1, hero.z), PALETTE.star, 90, 3);
    void hero.castPose(1200);
    await Promise.all([
      world.magic.beam(hero.hornWorld(), target, PALETTE.magic, PALETTE.star, 1.1),
      world.magic.beam(hero.hornWorld().add(new THREE.Vector3(0, 0.3, 0)), target, PALETTE.magicPink, 0xffffff, 1.2),
    ]);
    const bm = handles.bubbleMesh;
    await tween(600, (k) => { bm.scale.setScalar(1 + Math.sin(k * Math.PI * 6) * 0.08 * (1 + k)); });
    world.magic.burst(target, 160, 0xffffff, 3.5, 0.34, 1.1, -1.5);
    world.magic.burst(target, 80, PALETTE.magicPink, 2.5, 0.3, 1.0, -1.5);
    bm.visible = false;
    confetti(80);
    const sp = handles.rescueSprite;
    const start = sp.getWorldPosition(new THREE.Vector3());
    world.scene.add(sp);
    sp.position.copy(start);
    const dir = new THREE.Vector3(Math.sin(hero.yaw), 0, Math.cos(hero.yaw));
    const end = new THREE.Vector3(hero.x, 0.9, hero.z).add(dir.multiplyScalar(1.8));
    await tween(900, (k) => {
      sp.position.lerpVectors(start, end, k);
      sp.position.y += Math.sin(k * Math.PI) * 1.5;
      sp.scale.setScalar(1.7 + k * 0.5);
    }, easeOutBack);
    void play('meow');
    await hero.celebrate();
    await play(level.rescue.audio);
    if (!progress.done.includes(level.id)) progress.done.push(level.id);
    const idx = RESCUE_ORDER.findIndex((r) => r.id === level!.id);
    progress.unlocked = Math.max(progress.unlocked, idx + 2);
    saveProgress(progress);
    await play('level_done');
    await wait(400);
    openMap();
    inChallenge = false;
  }

  // ---------- điều khiển: D-pad giữ để đi, ⬆ nhảy, phím mũi tên trên Mac ----------
  const held = { up: false, down: false, left: false, right: false };
  const applyMove = () => hero?.setMove((held.right ? 1 : 0) - (held.left ? 1 : 0), (held.down ? 1 : 0) - (held.up ? 1 : 0));
  function bindHold(btn: HTMLButtonElement, key: keyof typeof held): void {
    const down = (e: Event) => { e.preventDefault(); held[key] = true; btn.classList.add('down'); applyMove(); };
    const up = () => { held[key] = false; btn.classList.remove('down'); applyMove(); };
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('pointerleave', up);
  }
  bindHold(els.ctrlLeft, 'left');
  bindHold(els.ctrlRight, 'right');
  bindHold(els.ctrlUp, 'up');
  bindHold(els.ctrlDown, 'down');
  els.ctrlJump.addEventListener('pointerdown', (e) => { e.preventDefault(); if (hero?.jump()) sfx('sfx_tap', 0.4); });
  const keyMap: Record<string, keyof typeof held> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const k = keyMap[e.key];
    if (k) { held[k] = true; applyMove(); e.preventDefault(); }
    if (e.key === ' ') { if (hero?.jump()) sfx('sfx_tap', 0.4); e.preventDefault(); }
  });
  window.addEventListener('keyup', (e) => {
    const k = keyMap[e.key];
    if (k) { held[k] = false; applyMove(); }
  });
  window.addEventListener('blur', () => { (Object.keys(held) as (keyof typeof held)[]).forEach((k) => (held[k] = false)); applyMove(); });

  if (import.meta.env.DEV) (window as any).__game = { world, get hero() { return hero; }, get monsters() { return monsters; }, get stars() { return stars; }, startLevel, progress };
}

void boot();

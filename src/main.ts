// Khởi động: thế giới 3D, Twilight, tiến độ, màn bắt đầu (lần chạm đầu mở khoá tiếng), bản đồ 4 chương, điều khiển
// chạm (chạm đất = chạy tới, chạm sao = chọn, nút nhảy to), tham số debug và móc test `window.__game`.
// Debug URL (README): ?chapter=2[&beat=5] · ?finale=1[&round=5] · ?cine=prologue|c1_intro|…|f_intro|climax|ending ·
// ?unlock=all · ?reset=1 · ?auto=1 · ?mute=1 · ?album=1..4|all · ?board=1 · ?review=1 · ?perf=1
import { World } from './world';
import { Hero } from './hero';
import { ChapterRun, chapterDef } from './story';
import { Finale } from './finale';
import { playPrologue } from './prologue';
import { playChapterCine } from './cines';
import { openBoard, runReview } from './board';
import { chapterPage, showAlbumPage, showAlbumBook } from './album';
import { unlockAudio, preload, sfx, stopSpeech } from './audio';
import { loadProgress, saveProgress } from './progress';
import { ALL_FRIENDS, CHAPTERS, type CineId } from './data';
import { LETTER_ORDER } from './letters';
import { photoUrl, firstPhoto } from './photos';
import { testHook } from './testhook';
import { clearTalk } from './talk';
import { els, renderMap, hideMap, showHud, showPlay, setMeBadge, setBoardCount } from './ui';
import type { Pickable } from './letterstar';

const Q = new URLSearchParams(location.search);
const DEBUG = {
  chapter: Number(Q.get('chapter') ?? 0),
  beat: Number(Q.get('beat') ?? 0),
  finale: Q.has('finale'),
  round: Math.max(0, Math.min(5, Number(Q.get('round') ?? 0))),
  cine: Q.get('cine'),
  unlock: Q.get('unlock') === 'all',
  auto: Q.has('auto'),
  album: Q.get('album'),
  board: Q.has('board'),
  review: Q.has('review'),
  perf: Q.has('perf'),
};

type Phase = 'start' | 'map' | 'prologue' | 'chapter' | 'finale' | 'overlay';

async function boot(): Promise<void> {
  const world = new World(document.getElementById('app')!);
  const progress = loadProgress();
  if (DEBUG.unlock) {
    progress.unlocked = 4; progress.done = [1, 2, 3]; progress.prologue = true;
    progress.letters = [...LETTER_ORDER]; progress.friends = [...ALL_FRIENDS];
  }
  if (DEBUG.chapter > 1 && !DEBUG.unlock) {
    // chơi thử chương N: coi như đã có chữ + bạn của các chương trước
    for (const c of CHAPTERS.slice(0, DEBUG.chapter - 1)) for (const l of c.letters) if (!progress.letters.includes(l)) progress.letters.push(l);
    progress.friends = ALL_FRIENDS.slice(0, (DEBUG.chapter - 1) * 4);
  }
  if ((DEBUG.finale || DEBUG.cine === 'f_intro' || DEBUG.cine === 'climax' || DEBUG.cine === 'ending') && !progress.letters.length) {
    progress.letters = [...LETTER_ORDER]; progress.friends = [...ALL_FRIENDS];
  }

  let phase: Phase = 'start';
  let run: ChapterRun | null = null;
  let finale: Finale | null = null;
  void document.fonts?.load("800 100px 'Baloo 2'");
  const hero = await Hero.load(world);
  hero.root.visible = false;
  setMeBadge(await photoUrl(firstPhoto('nhim-1', 'nhim-2'), 1, 240));
  setBoardCount(progress.letters.length);

  // ---- vòng lặp
  let fpsT = 0, fpsN = 0, fps = 0;
  world.start((dt) => {
    fpsT += dt; fpsN++;
    if (fpsT >= 1) { fps = fpsN / fpsT; fpsT = 0; fpsN = 0; }
    hero.update(dt, (x, z) => world.clampToIsland(x, z));
    world.follow(dt, hero.x, hero.z, performance.now() / 1000);
    run?.tick(dt);
  });
  const perfEl = document.getElementById('perf')!;
  const perf = () => ({ fps: Math.round(fps), tris: world.renderer.info.render.triangles, calls: world.renderer.info.render.calls,
    geometries: world.renderer.info.memory.geometries, textures: world.renderer.info.memory.textures });
  if (DEBUG.perf) {
    perfEl.hidden = false;
    setInterval(() => { const p = perf(); perfEl.textContent = `${p.fps} fps · ${(p.tris / 1000).toFixed(0)}k tam giác · ${p.calls} draw`; }, 500);
  }

  // ---- màn bắt đầu
  els.startBtn.classList.add('ready');
  const begin = async () => {
    unlockAudio();
    els.start.classList.add('hide');
    setTimeout(() => (els.start.hidden = true), 500);
    await preload(['b_ok_0', 'b_no_0', 'sfx_pop', 'sfx_tap', 'sfx_win', 'sfx_soft']);
    await route();
  };
  if (DEBUG.auto) void begin();
  else els.startBtn.addEventListener('click', () => void begin(), { once: true });

  async function route(): Promise<void> {
    if (DEBUG.album) {
      phase = 'overlay';
      if (DEBUG.album === 'all') await showAlbumBook([1, 2, 3, 4], DEBUG.auto);
      else await showAlbumPage(chapterPage(Number(DEBUG.album)), DEBUG.auto);
      return openMap();
    }
    if (DEBUG.board) { phase = 'overlay'; await openBoard(progress.letters); return openMap(); }
    if (DEBUG.review) { phase = 'overlay'; await runReview(progress, progress.letters, 3); return openMap(); }
    if (DEBUG.cine) {
      const c = DEBUG.cine as CineId;
      if (c === 'prologue') { await prologue(); return openMap(); }
      if (c === 'f_intro' || c === 'climax' || c === 'ending') return startFinale(c === 'f_intro' ? 0 : 5, c === 'f_intro' ? null : c);
      const n = Number(c[1]);
      await startChapter(n, 0, c);
      return;
    }
    if (DEBUG.finale) return startFinale(DEBUG.round, null);
    if (DEBUG.chapter) return startChapter(DEBUG.chapter, DEBUG.beat);
    if (!progress.prologue) {
      await prologue();
      return startChapter(1, 0);
    }
    openMap();
  }

  async function prologue(): Promise<void> {
    phase = 'prologue';
    hideMap();
    showHud(false);
    hero.root.visible = true;
    await playPrologue(world, hero);
    progress.prologue = true;
    saveProgress(progress);
  }

  function openMap(): void {
    phase = 'map';
    run?.stop(); run = null;
    finale?.dispose(); finale = null;
    showHud(false);
    showPlay(false);
    clearTalk();
    hero.root.visible = false;
    renderMap({ unlocked: progress.unlocked, done: progress.done, letters: progress.letters.length, friends: progress.friends.length }, (n) => {
      sfx('sfx_tap', 0.4);
      if (n === 4) void startFinale(0, null);
      else void startChapter(n, progress.resume?.ch === n ? progress.resume.beat : 0);
    });
  }

  async function startChapter(n: number, beat: number, onlyCine?: string): Promise<void> {
    if (n === 4) return startFinale(0, null);
    hideMap();
    run?.stop();
    phase = 'chapter';
    hero.root.visible = true;
    const r = new ChapterRun({ world, hero, progress, auto: DEBUG.auto }, chapterDef(n));
    run = r;
    await r.setup();
    if (r !== run) return;
    if (onlyCine) {
      await playChapterCine(world, hero, onlyCine as CineId);
      return;
    }
    const done = await r.run(beat);
    if (done && r === run) openMap();
  }

  async function startFinale(round: number, cine: string | null): Promise<void> {
    hideMap();
    run?.stop(); run = null;
    finale?.dispose();
    phase = 'finale';
    hero.root.visible = true;
    const f = new Finale(world, hero, progress);
    finale = f;
    await f.setup();
    if (f !== finale) return;
    await f.run({ round, cine, auto: DEBUG.auto });
    if (f === finale) openMap();
  }

  // ---- nút bản đồ
  els.mapPrologue.addEventListener('click', () => { void prologue().then(openMap); });
  els.mapBoard.addEventListener('click', () => { void openBoard(progress.letters); });
  els.mapAlbum.addEventListener('click', () => { void showAlbumBook(progress.done, false); });
  els.boardBtn.addEventListener('click', (e) => { e.stopPropagation(); void openBoard(progress.letters); });
  els.home.addEventListener('click', (e) => {
    e.stopPropagation();
    if (phase !== 'chapter' && phase !== 'finale') return;
    sfx('sfx_tap', 0.4);
    stopSpeech();
    openMap();
  });

  // ---- chạm: sao chữ / ván → chọn; mặt đất → Twilight chạy tới (giữ kéo thì đi theo ngón)
  const canvas = world.renderer.domElement;
  let dragging = false;
  const tapTargets = (): Set<Pickable> | null => run?.pickables ?? finale?.tapTargets ?? null;
  const pickAt = (x: number, y: number): Pickable | null => {
    const set = tapTargets();
    if (!set || !set.size) return null;
    const objs = [...set].filter((p) => !p.gone).flatMap((p) => p.hits);
    const hit = world.pick(x, y, objs);
    return (hit?.object.userData.star as Pickable) ?? null;
  };
  const canWalk = () => phase === 'chapter' && !!run && !hero.locked && !document.body.classList.contains('cinema');
  canvas.addEventListener('pointerdown', (e) => {
    unlockAudio();
    const p = pickAt(e.clientX, e.clientY);
    if (p) {
      if (run?.onPick) run.onPick(p);
      else finale?.tap(p);
      run?.ctx.poke();
      return;
    }
    if (!canWalk()) return;
    const g = world.groundAt(e.clientX, e.clientY);
    if (g) { hero.goTo(g.x, g.z); dragging = true; run?.ctx.poke(); spawnTapRing(g.x, g.z); }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging || !canWalk()) return;
    const g = world.groundAt(e.clientX, e.clientY);
    if (g) hero.goTo(g.x, g.z);
  });
  const endDrag = () => { dragging = false; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  function spawnTapRing(x: number, z: number): void {
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      world.magic.emit({ x, y: 0.15, z, color: 0xffd166, vx: Math.cos(a) * 1.6, vz: Math.sin(a) * 1.6, vy: 0.3, max: 0.5, size: 0.22, drag: 0.9 });
    }
  }
  els.jump.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); unlockAudio(); if (hero.jump()) sfx('sfx_tap', 0.4); });

  // Mac: phím mũi tên + Space
  const held = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false };
  const applyKeys = () => hero.setMove((held.ArrowRight ? 1 : 0) - (held.ArrowLeft ? 1 : 0), (held.ArrowDown ? 1 : 0) - (held.ArrowUp ? 1 : 0));
  window.addEventListener('keydown', (e) => {
    if (e.key in held) { held[e.key as keyof typeof held] = true; if (canWalk()) applyKeys(); e.preventDefault(); run?.ctx.poke(); }
    if (e.key === ' ' && canWalk()) { if (hero.jump()) sfx('sfx_tap', 0.4); e.preventDefault(); }
  });
  window.addEventListener('keyup', (e) => { if (e.key in held) { held[e.key as keyof typeof held] = false; applyKeys(); } });
  window.addEventListener('blur', () => { for (const k of Object.keys(held)) held[k as keyof typeof held] = false; applyKeys(); });

  // ---- móc cho test / chụp màn hình
  (window as unknown as { __game: unknown }).__game = {
    world, hero, progress,
    get phase() { return phase; },
    get run() { return run; },
    get finale() { return finale; },
    get beat() { return run?.beat ?? -1; },
    get waiting() { return testHook.waiting; },
    answer(ok: boolean) { const f = testHook.answer; f?.(ok); return !!f; },
    perf,
    startChapter, startFinale, openMap,
  };
}

void boot();

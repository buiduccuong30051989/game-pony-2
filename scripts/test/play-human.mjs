// Kiểm tra hồi quy "không bao giờ đơ": chơi 1 chương như NGƯỜI THẬT — không ?auto, CÓ tiếng, chuột click xuống đất để đi
// (đôi khi bấm 🪽 bay / nhảy), click sao / ván / ngôi sao trên màn hình, chọn sai 1 lần rồi chọn đúng thật nhanh, click lung tung
// lúc đang đọc từ ví dụ. Đứng yên > 25 s ở 1 trạng thái = ĐƠ → exit 1 (kèm ảnh chụp).
//
// Cần: `pnpm dev` (cổng 5185) + playwright-core + chrome-headless-shell (đường dẫn qua biến môi trường nếu khác máy Adam):
//   node scripts/test/play-human.mjs [chương=1] [bay=1] [vội=1] [lệchY=0]
//   PW=/path/to/node_modules/playwright-core CHROME=/path/to/chrome-headless-shell node scripts/test/play-human.mjs 2
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const PW = process.env.PW ?? '/private/tmp/pw/node_modules/playwright-core';
const CHROME = process.env.CHROME ?? `${process.env.HOME}/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell`;
const { chromium } = await import(pathToFileURL(`${PW}/index.mjs`).href);
const [ch = '1', flyOpt = '1', rushOpt = '1', yOff = '0'] = process.argv.slice(2);
const PORT = process.env.PORT ?? '5185';
const W = 1180, H = 820;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const page = await (await browser.newContext({ viewport: { width: W, height: H }, hasTouch: true })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`http://localhost:${PORT}/?reset=1&chapter=${ch}`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#start-btn.ready', { timeout: 60000 });
await page.mouse.click(W / 2, H / 2 - 10);

const t0 = Date.now();
let lastKey = '', lastChange = Date.now(), ok = false;
const wrongDone = new Set();
const gates = new Set();
while (Date.now() - t0 < 420000) {
  const st = await page.evaluate(() => {
    const g = window.__game; if (!g) return null;
    const v = (id) => { const e = document.getElementById(id); return !!e && !e.hidden && !e.classList.contains('hide'); };
    const run = g.run, act = run?.activities?.[run.beat];
    const scr = (p) => g.world.toScreen(p);
    const targets = run ? [...run.pickables].filter((p) => !p.gone).map((p) => ({ label: p.label || p.tone, ...scr(p.worldCenter()) })) : [];
    const hunt = act?.stars && g.waiting?.startsWith('hunt') ? act.stars.filter((s) => !s.gone).map((s) => ({ label: s.label, ...scr(s.worldCenter()) })) : [];
    const tg = run?.playing && act ? act.trigger() : null;
    return { phase: g.phase, beat: g.beat, w: g.waiting, skip: v('skip'), big: v('bigspell'), album: v('album'), board: v('board'), review: v('review'), map: v('map'),
      playing: !!run?.playing, ex: v('example'), sub: v('subtitle') ? document.getElementById('subtitle').textContent : '', targets, hunt, tgs: tg ? scr(new g.hero.root.position.constructor(tg.x, 0, tg.z)) : null };
  });
  if (!st) { await sleep(300); continue; }
  // tiến triển = đổi nhịp / bài / câu đang nói (cảnh cứu dài > 25 s nhưng câu thoại vẫn đổi)
  const key = `${st.phase}|${st.beat}|${st.w}|${st.playing}|${st.ex}|${st.sub}`;
  if (key !== lastKey) { lastKey = key; lastChange = Date.now(); if (st.w) gates.add(st.w.split(':')[0]); }
  if (Date.now() - lastChange > 25000) {
    await page.screenshot({ path: join(tmpdir(), `play-human-STUCK-ch${ch}.png`) });
    console.error(`✗ ĐƠ ở chương ${ch}: ${key}`);
    break;
  }
  if (st.phase === 'map' && st.map) { ok = true; break; }
  const click = (sel) => page.click(sel, { timeout: 2000, force: true }).catch(() => {});
  if (st.skip) { await click('#skip'); await sleep(400); continue; }
  if (st.big) { await click('#bigspell'); await sleep(400); continue; }
  if (st.album) { await sleep(600); await click('#album-next'); await sleep(500); continue; }
  if (st.board) { await sleep(400); await click('#board-close'); await sleep(500); continue; }
  if (st.review) {
    const lbl = st.w?.split(':')[1];
    for (const b of await page.$$('.rv-card')) if ((await b.textContent()) === lbl) { await b.click({ force: true }).catch(() => {}); break; }
    await sleep(800); continue;
  }
  if (st.playing && st.tgs) {
    if (flyOpt === '1' && Math.random() < 0.3) await click('#fly-btn');
    if (Math.random() < 0.15) await click('#jump');
    await page.mouse.click(Math.min(W - 80, Math.max(80, st.tgs.x)), Math.min(H - 200, Math.max(150, st.tgs.y + Number(yOff))));
    await sleep(700); continue;
  }
  const kind = st.w?.split(':')[0], label = st.w?.split(':').pop();
  const list = kind === 'hunt' ? st.hunt : st.targets;
  if (st.w && list.length) {
    const right = list.find((t) => t.label === label), wrong = list.find((t) => t.label !== label);
    if (!wrongDone.has(kind) && wrong) { wrongDone.add(kind); await page.mouse.click(wrong.x, wrong.y); await sleep(rushOpt === '1' ? 150 : 2500); }
    if (right) { await page.mouse.click(right.x, right.y); if (rushOpt === '1') { await sleep(100); await page.mouse.click(right.x, right.y); } }
    await sleep(kind === 'hunt' ? 2500 : 900);
    continue;
  }
  if (rushOpt === '1' && st.ex) await page.mouse.click(W / 2, H / 2);
  await sleep(400);
}
await browser.close();
const errs = errors.filter((e) => !e.includes('Multiple instances'));
if (errs.length) console.error('lỗi console:\n  ' + errs.slice(0, 10).join('\n  '));
if (!ok || errs.length) process.exit(1);
console.log(`✓ chương ${ch} chơi kiểu người thật tới hết, không đơ (${((Date.now() - t0) / 1000).toFixed(0)} s; bài: ${[...gates].join(', ')})`);

// Lớp UI DOM: HUD (huy hiệu ảnh Nhím, tên chương, nút bảng chữ, ngọc), nút nhảy to, nút ⏩, khung phim,
// chữ đánh vần to, chữ bay vào bảng, nút Đại phép, toast, pháo giấy, chớp sáng, bản đồ chương.
import { CHAPTERS, CAST } from './data';
import { avatarEl } from './talk';

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

export const els = {
  start: $('#start'),
  startBtn: $<HTMLButtonElement>('#start-btn'),
  hud: $('#hud'),
  meBadge: $('#me-badge'),
  mePhoto: $<HTMLImageElement>('#me-photo'),
  chTitle: $('#ch-title'),
  boardBtn: $<HTMLButtonElement>('#board-btn'),
  boardCount: $('#board-count'),
  gemsPill: $('#gems-pill'),
  gems: $('#gems'),
  harmony: $('#harmony'),
  home: $<HTMLButtonElement>('#home'),
  skip: $<HTMLButtonElement>('#skip'),
  jump: $<HTMLButtonElement>('#jump'),
  bigspell: $<HTMLButtonElement>('#bigspell'),
  word: $('#word'),
  toast: $('#toast'),
  confetti: $('#confetti'),
  flash: $('#flash'),
  fly: $('#fly'),
  map: $('#map'),
  mapCards: $('#map-cards'),
  mapPrologue: $<HTMLButtonElement>('#map-prologue'),
  mapBoard: $<HTMLButtonElement>('#map-board'),
  mapAlbum: $<HTMLButtonElement>('#map-album'),
  mapHero: $('#map-hero'),
};

let cinema = false;
let playOn = false;
let hudOn = false;
function sync(): void {
  els.hud.hidden = !hudOn || cinema;
  els.home.hidden = !hudOn || cinema;
  els.jump.hidden = !playOn || cinema;
  document.body.classList.toggle('cinema', cinema);
}
export function showHud(v: boolean): void { hudOn = v; sync(); }
/** Nút nhảy (chỉ khi đang tự đi). */
export function showPlay(v: boolean): void { playOn = v; sync(); }
/** Khung phim: 2 dải đen mỏng trên dưới, ẩn HUD + nút. */
export function setCinema(on: boolean): void { cinema = on; sync(); }

let skipFn: (() => void) | null = null;
els.skip.addEventListener('click', (e) => { e.stopPropagation(); skipFn?.(); });
/** Hiện nút ⏩ (fn = null để ẩn). */
export function showSkip(fn: (() => void) | null): void {
  skipFn = fn;
  els.skip.hidden = !fn;
}

export function setChapterTitle(text: string): void { els.chTitle.textContent = text; }
export function setBoardCount(n: number): void {
  els.boardCount.textContent = String(n);
}
export function bumpBoard(): void {
  els.boardBtn.classList.remove('bump');
  void els.boardBtn.offsetWidth;
  els.boardBtn.classList.add('bump');
}
export function setGems(n: number): void { els.gems.textContent = String(n); }

/** HUD trận cuối: 5 ngọc Hài Hoà (màu theo ngọc). */
export function setHarmony(colors: string[] | null, lit = 0): void {
  els.harmony.hidden = !colors;
  els.gemsPill.hidden = !!colors;
  if (!colors) return;
  if (els.harmony.childElementCount !== colors.length) {
    els.harmony.innerHTML = '';
    for (const c of colors) {
      const s = document.createElement('span');
      s.textContent = '◆';
      s.style.color = c;
      els.harmony.appendChild(s);
    }
  }
  els.harmony.querySelectorAll('span').forEach((s, i) => s.classList.toggle('on', i < lit));
}

/** Huy hiệu "đây là Nhím" góc HUD. */
export function setMeBadge(url: string): void { els.mePhoto.src = url; }

let toastTimer = 0;
export function toast(text: string, ms = 1300): void {
  els.toast.textContent = text;
  els.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => els.toast.classList.remove('show'), ms);
}

/** Chữ to giữa trên màn (đánh vần): chữ trong `lit` sáng lên. */
export function showWord(word: string, lit: number[] = [], whole = false): void {
  const w = els.word;
  w.hidden = false;
  w.innerHTML = '';
  Array.from(word).forEach((ch, i) => {
    const s = document.createElement('span');
    s.textContent = ch;
    s.className = lit.includes(i) ? 'lit' : '';
    w.appendChild(s);
  });
  w.classList.toggle('whole', whole);
}
export function hideWord(): void { els.word.hidden = true; els.word.classList.remove('whole'); }

/** Chữ bay từ điểm màn hình (x, y) vào nút bảng chữ cái. */
export function flyToBoard(x: number, y: number, label: string, color: string): Promise<void> {
  const b = els.boardBtn.getBoundingClientRect();
  const chip = document.createElement('div');
  chip.className = 'fly-chip';
  chip.textContent = label;
  chip.style.borderColor = color;
  chip.style.left = `${x}px`;
  chip.style.top = `${y}px`;
  els.fly.appendChild(chip);
  const tx = b.left + b.width / 2, ty = b.top + b.height / 2;
  const anim = chip.animate([
    { transform: 'translate(-50%,-50%) scale(1.4)', left: `${x}px`, top: `${y}px` },
    { transform: 'translate(-50%,-50%) scale(1.8)', left: `${(x + tx) / 2}px`, top: `${Math.min(y, ty) - 60}px`, offset: 0.4 },
    { transform: 'translate(-50%,-50%) scale(0.5)', left: `${tx}px`, top: `${ty}px` },
  ], { duration: 900, easing: 'ease-in-out', fill: 'forwards' });
  return new Promise((r) => { anim.onfinish = () => { chip.remove(); r(); }; setTimeout(() => { chip.remove(); r(); }, 1400); });
}

/** Nút Đại phép ✨ to giữa đáy màn; resolve khi bé chạm (hoặc tự bấm nếu `auto`). */
export function waitBigSpell(auto = false): Promise<void> {
  els.bigspell.hidden = false;
  return new Promise((resolve) => {
    const done = () => { els.bigspell.hidden = true; els.bigspell.onclick = null; resolve(); };
    els.bigspell.onclick = (e) => { e.stopPropagation(); done(); };
    if (auto) setTimeout(done, 400);
  });
}

const CONFETTI_COLORS = ['#ff9600', '#58cc02', '#1cb0f6', '#ffd887', '#f064a0', '#a06cd5'];
export function confetti(count = 50): void {
  for (let i = 0; i < count; i++) {
    const p = document.createElement('i');
    p.style.left = `${Math.random() * 100}%`;
    p.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    p.style.animationDelay = `${Math.random() * 0.4}s`;
    p.style.animationDuration = `${1.4 + Math.random() * 0.8}s`;
    p.style.transform = `rotate(${Math.random() * 360}deg)`;
    els.confetti.appendChild(p);
    setTimeout(() => p.remove(), 2600);
  }
}

/** Chớp sáng trắng toàn màn. hold: giữ trắng thêm ms trước khi tan. */
export function flash(ms = 900, hold = 0): Promise<void> {
  els.flash.hidden = false;
  els.flash.classList.remove('go');
  void els.flash.offsetWidth;
  els.flash.style.animationDuration = `${ms}ms`;
  els.flash.style.animationDelay = '0ms';
  els.flash.style.setProperty('--hold', `${hold}ms`);
  els.flash.classList.add('go');
  return new Promise((r) => setTimeout(() => { els.flash.hidden = true; els.flash.classList.remove('go'); r(); }, ms + 50));
}
/** Màn trắng loá (cao trào): trắng dần lên rồi giữ. */
export function whiteOut(on: boolean, ms = 900): void {
  els.flash.hidden = false;
  els.flash.classList.remove('go');
  els.flash.style.transition = `opacity ${ms}ms ease`;
  els.flash.style.opacity = on ? '1' : '0';
  if (!on) setTimeout(() => { els.flash.hidden = true; els.flash.style.opacity = ''; els.flash.style.transition = ''; }, ms + 30);
}

// ------------------------------------------------------------------ bản đồ chương
export interface MapState { unlocked: number; done: number[]; letters: number; friends: number }

/** 4 thẻ chương to (mặt người được cứu), chương chưa mở mờ đi, chương xong có sao. */
export function renderMap(st: MapState, onPick: (n: number) => void): void {
  els.mapCards.innerHTML = '';
  if (!els.mapHero.childElementCount) els.mapHero.appendChild(avatarEl('twilight', 'map-hero-ava'));
  for (const ch of CHAPTERS) {
    const enabled = ch.n <= st.unlocked;
    const done = st.done.includes(ch.n);
    const b = document.createElement('button');
    b.className = 'ch-card' + (enabled ? '' : ' locked') + (done ? ' done' : '') + (ch.n === 4 ? ' final' : '');
    b.style.setProperty('--i', String(ch.n));
    const faces = document.createElement('div');
    faces.className = 'ch-faces';
    for (const id of ch.rescue) {
      if (ch.n === 4 && !done) faces.appendChild(avatarEl('nightmare', 'ch-ava'));
      else faces.appendChild(avatarEl(id, 'ch-ava'));
    }
    const num = document.createElement('b');
    num.textContent = String(ch.n);
    const t = document.createElement('strong');
    t.textContent = ch.title;
    const s = document.createElement('small');
    s.textContent = ch.n === 4 && !done ? 'Trận chiến cuối cùng' : ch.sub;
    b.append(num, faces, t, s);
    b.disabled = !enabled;
    if (enabled) b.addEventListener('click', () => onPick(ch.n));
    els.mapCards.appendChild(b);
  }
  els.mapBoard.querySelector('b')!.textContent = `${st.letters}/29`;
  els.map.hidden = false;
  els.map.classList.remove('hide');
}
export function hideMap(): void {
  els.map.classList.add('hide');
  setTimeout(() => (els.map.hidden = true), 450);
}

/** Tên hiện (bảng tên) của người nhà — dùng ở album / kết. */
export const familyName = (id: keyof typeof CAST) => CAST[id].name;

/** Thẻ tên chương to giữa màn (cảnh mở chương), tự tắt. */
export function titleCard(top: string, title: string, ms = 3200): void {
  const el = document.querySelector<HTMLElement>('#title-card')!;
  el.querySelector('small')!.textContent = top;
  el.querySelector('strong')!.textContent = title;
  el.hidden = false;
  el.classList.remove('go'); void el.offsetWidth; el.classList.add('go');
  setTimeout(() => { el.hidden = true; }, ms);
}

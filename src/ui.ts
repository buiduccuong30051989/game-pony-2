// Lớp UI DOM: HUD, bảng thử thách, toast, bản đồ 7 nút (mặt pony + tên), chớp sáng, màn kết, pháo giấy.
import { avatarEl, type Speaker } from './family';

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

export const els = {
  start: $('#start'),
  startBtn: $('#start-btn'),
  hud: $('#hud'),
  stars: $('#stars'),
  gemsPill: $('#gems-pill'),
  gems: $('#gems'),
  ctrlLeft: $<HTMLButtonElement>('#ctrl-left'),
  ctrlRight: $<HTMLButtonElement>('#ctrl-right'),
  ctrlUp: $<HTMLButtonElement>('#ctrl-up'),
  ctrlDown: $<HTMLButtonElement>('#ctrl-down'),
  ctrlJump: $<HTMLButtonElement>('#ctrl-jump'),
  home: $<HTMLButtonElement>('#home'),
  panel: $('#panel'),
  repeat: $<HTMLButtonElement>('#repeat'),
  word: $('#word'),
  counter: $('#counter'),
  gemrow: $('#gemrow'),
  options: $('#options'),
  cast: $<HTMLButtonElement>('#cast'),
  toast: $('#toast'),
  map: $('#map'),
  mapNodes: $('#map-nodes'),
  mapHero: $('#map-hero'),
  confetti: $('#confetti'),
  flash: $('#flash'),
  ending: $('#ending'),
  endingFam: $('#ending-fam'),
  endingHome: $<HTMLButtonElement>('#ending-home'),
};

/** Hiện/ẩn D-pad + nút nhảy (HUD đi kèm). */
export function showControls(v: boolean): void {
  els.ctrlLeft.hidden = els.ctrlRight.hidden = els.ctrlUp.hidden = els.ctrlDown.hidden = els.ctrlJump.hidden = !v;
}
export function showHud(v: boolean): void {
  els.hud.hidden = !v;
  els.home.hidden = !v;
}

/** HUD: 3 sao (màn thường) hoặc 5 ngọc Hài Hoà (trận cuối, màu theo ngọc). */
export function setHudMode(mode: 'stars' | 'harmony', colors: string[] = []): void {
  els.stars.innerHTML = '';
  const n = mode === 'stars' ? 3 : colors.length;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.textContent = mode === 'stars' ? '⭐' : '◆';
    if (mode === 'harmony') { s.className = 'hgem'; s.style.color = colors[i]; }
    els.stars.appendChild(s);
  }
  els.gemsPill.hidden = mode === 'harmony';
}

export function setStars(n: number): void {
  els.stars.querySelectorAll('span').forEach((s, i) => s.classList.toggle('on', i < n));
}

export function setGems(n: number): void {
  els.gems.textContent = String(n);
}

let toastTimer = 0;
export function toast(text: string, ms = 1200): void {
  els.toast.textContent = text;
  els.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => els.toast.classList.remove('show'), ms);
}

/** Bảng thử thách; `low` = đặt sát đáy màn (trận cuối, để thấy Nightmare Moon phía trên). */
export function showPanel(v: boolean, low = false): void {
  els.panel.hidden = !v;
  els.panel.classList.toggle('low', low);
  if (!v) {
    hideWord();
    setCounter(null);
    clearOptions();
    els.gemrow.hidden = true;
    els.gemrow.innerHTML = '';
    els.cast.hidden = true;
  }
}

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

export function setCounter(n: number | null): void {
  if (n === null) { els.counter.hidden = true; return; }
  els.counter.hidden = false;
  els.counter.textContent = String(n);
  els.counter.classList.remove('bump');
  void els.counter.offsetWidth;
  els.counter.classList.add('bump');
}

export interface Option { label: string; value: string }
export function showOptions(items: Option[], onPick: (value: string, btn: HTMLButtonElement) => void): HTMLButtonElement[] {
  clearOptions();
  return items.map((it) => {
    const b = document.createElement('button');
    b.className = 'opt';
    b.textContent = it.label;
    b.dataset.value = it.value;
    b.addEventListener('click', () => onPick(it.value, b));
    els.options.appendChild(b);
    return b;
  });
}
export function clearOptions(): void { els.options.innerHTML = ''; }

export function showGemRow(n: number, onTap: (btn: HTMLButtonElement, index: number) => void): void {
  els.gemrow.innerHTML = '';
  els.gemrow.hidden = false;
  for (let i = 0; i < n; i++) {
    const b = document.createElement('button');
    b.className = 'gem';
    b.textContent = '💎';
    b.addEventListener('click', () => onTap(b, i));
    els.gemrow.appendChild(b);
  }
}

export function wobbleEl(el: HTMLElement): void {
  el.classList.remove('wobble');
  void el.offsetWidth;
  el.classList.add('wobble');
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

/** Chớp sáng trắng toàn màn (cầu vồng hài hoà). */
export function flash(ms = 900): void {
  els.flash.hidden = false;
  els.flash.classList.remove('go');
  void els.flash.offsetWidth;
  els.flash.style.animationDuration = `${ms}ms`;
  els.flash.classList.add('go');
  setTimeout(() => { els.flash.hidden = true; els.flash.classList.remove('go'); }, ms + 50);
}

// ------------------------------------------------------------------ bản đồ
export interface MapNode {
  id: string;
  label: string;
  /** vai pony (dòng nhỏ dưới tên) */
  sub?: string;
  speaker: Speaker | null;
  emoji: string;
  color: string;
  enabled: boolean;
  done: boolean;
  /** màn cuối (nút to, nền đêm) */
  final?: boolean;
}

/** Bản đồ 7 nút trên đường cong: mặt pony người nhà + tên, nút chưa mở mờ đi, nút xong có sao. */
export function renderMap(nodes: MapNode[], onPick: (id: string) => void): void {
  els.mapNodes.innerHTML = '';
  if (!els.mapHero.childElementCount) els.mapHero.appendChild(avatarEl('twilight', 'map-hero-ava'));
  nodes.forEach((n, i) => {
    const b = document.createElement('button');
    b.className = 'node' + (n.enabled ? '' : ' locked') + (n.done ? ' done' : '') + (n.final ? ' final' : '');
    b.style.setProperty('--c', n.color);
    b.style.setProperty('--i', String(i));
    if (n.speaker) b.appendChild(avatarEl(n.speaker, 'node-ava'));
    else {
      const e = document.createElement('div');
      e.className = 'node-ava';
      e.textContent = n.emoji;
      e.style.borderColor = n.color;
      b.appendChild(e);
    }
    const label = document.createElement('small');
    label.textContent = n.label;
    b.appendChild(label);
    if (n.sub) {
      const sub = document.createElement('i');
      sub.textContent = n.sub;
      b.appendChild(sub);
    }
    const num = document.createElement('b');
    num.textContent = String(i + 1);
    b.appendChild(num);
    b.disabled = !n.enabled;
    if (n.enabled) b.addEventListener('click', () => onPick(n.id));
    els.mapNodes.appendChild(b);
  });
  els.map.hidden = false;
  els.map.classList.remove('hide');
}
export function hideMap(): void {
  els.map.classList.add('hide');
  setTimeout(() => (els.map.hidden = true), 450);
}

// ------------------------------------------------------------------ màn kết
export function showEnding(cast: Speaker[], onHome: () => void): void {
  els.endingFam.innerHTML = '';
  cast.forEach((id, i) => {
    const a = avatarEl(id, 'end-ava');
    a.style.animationDelay = `${i * 0.12}s`;
    els.endingFam.appendChild(a);
  });
  els.ending.hidden = false;
  els.ending.classList.remove('hide');
  els.endingHome.onclick = () => {
    els.ending.classList.add('hide');
    setTimeout(() => (els.ending.hidden = true), 450);
    onHome();
  };
}

// Lớp UI DOM: HUD, bảng thử thách, toast, bản đồ, pháo giấy.
import { RESCUE_ORDER } from './data';

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

export const els = {
  start: $('#start'),
  startBtn: $('#start-btn'),
  hud: $('#hud'),
  stars: $('#stars'),
  gems: $('#gems'),
  ctrlLeft: $<HTMLButtonElement>('#ctrl-left'),
  ctrlRight: $<HTMLButtonElement>('#ctrl-right'),
  ctrlUp: $<HTMLButtonElement>('#ctrl-up'),
  ctrlDown: $<HTMLButtonElement>('#ctrl-down'),
  ctrlJump: $<HTMLButtonElement>('#ctrl-jump'),
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
  confetti: $('#confetti'),
};

export function showControls(v: boolean): void {
  els.ctrlLeft.hidden = els.ctrlRight.hidden = els.ctrlUp.hidden = els.ctrlDown.hidden = els.ctrlJump.hidden = !v;
  els.hud.hidden = !v;
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

export function showPanel(v: boolean): void {
  els.panel.hidden = !v;
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

/** Bản đồ 6 nút: chỉ `unlocked` nút đầu bấm được, nút đã xong có sao. */
export function renderMap(unlocked: number, done: string[], playable: string[], onPick: (id: string) => void): void {
  els.mapNodes.innerHTML = '';
  RESCUE_ORDER.forEach((r, i) => {
    const b = document.createElement('button');
    const enabled = i < unlocked && playable.includes(r.id);
    b.className = 'big node' + (enabled ? '' : ' locked') + (done.includes(r.id) ? ' done' : '');
    b.innerHTML = `${r.emoji}<small>${r.label}</small>`;
    b.disabled = !enabled;
    if (enabled) b.addEventListener('click', () => onPick(r.id));
    els.mapNodes.appendChild(b);
  });
  els.map.hidden = false;
  els.map.classList.remove('hide');
}
export function hideMap(): void {
  els.map.classList.add('hide');
  setTimeout(() => (els.map.hidden = true), 450);
}

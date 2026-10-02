// Lời nói trên màn hình: thẻ nhân vật trượt vào (mặt pony + BẢNG TÊN: tên nhà to, tên tiếng Anh nhỏ — chỉ hiện,
// không đọc) và phụ đề của người kể chuyện ở đáy màn. Mọi câu đều có giọng (src/audio.ts) + chữ.
import photos from 'virtual:family-photos';
import { CAST, type CastId } from './data';
import { LINES, BANK_TEXT } from './lines';
import { WORDS } from './words';
import { play, sfx } from './audio';
import { wait } from './tween';

/** Ai nói: người trong CAST, hoặc Nữ hoàng Bóng Đêm / Nhím (Twilight). */
export type Speaker = CastId | 'nightmare' | 'twilight';

const EXTRA: Record<'nightmare' | 'twilight', { name: string; role: string; emoji: string; color: string }> = {
  nightmare: { name: 'Nữ hoàng Bóng Đêm', role: 'Nightmare Moon', emoji: '🌑', color: '#4b3b9a' },
  twilight: { name: 'Nhím', role: 'Twilight Sparkle', emoji: '🦄', color: '#a06cd5' },
};

const PORTRAIT: Partial<Record<Speaker, string>> = {
  twilight: 'twilight', nightmare: 'nightmare', 'me-yen': 'rarity', 'ba-cuong': 'rainbow', 'ong-cuong': 'applejack',
  'ba-tuyet': 'celestia', 'bac-hanh': 'luna', spike: 'spike',
};

export function speakerInfo(id: Speaker): { name: string; role: string; emoji: string; color: string } {
  return id === 'nightmare' || id === 'twilight' ? EXTRA[id] : CAST[id];
}

export function portraitUrl(id: Speaker): string | null {
  const p = PORTRAIT[id] ?? (id !== 'nightmare' && id !== 'twilight' && CAST[id].friend ? id : undefined);
  return p ? `${import.meta.env.BASE_URL}img/portraits/${p}.png` : null;
}

/** Ảnh thật người nhà (public/family/<id>.jpg) nếu ba mẹ đã thả vào. */
export function familyPhotoUrl(id: Speaker): string | null {
  const f = photos[id];
  return f ? `${import.meta.env.BASE_URL}family/${f}` : null;
}

/** Ô tròn mặt pony (hoặc emoji) + huy hiệu ảnh thật nếu có. */
export function avatarEl(id: Speaker, cls = 'fam-ava'): HTMLElement {
  const info = speakerInfo(id);
  const a = document.createElement('div');
  a.className = cls;
  a.style.borderColor = info.color;
  const url = portraitUrl(id);
  if (url) {
    const img = document.createElement('img');
    img.alt = info.name;
    img.src = url;
    img.onerror = () => { img.remove(); a.prepend(info.emoji); };
    a.appendChild(img);
  } else a.textContent = info.emoji;
  const ph = familyPhotoUrl(id);
  if (ph) {
    const badge = document.createElement('img');
    badge.className = 'fam-photo';
    badge.alt = '';
    badge.src = ph;
    badge.onerror = () => badge.remove();
    a.appendChild(badge);
  }
  return a;
}

/** Chữ của 1 khoá audio (thoại / ngân hàng). */
export function lineText(key: string): string {
  if (LINES[key]) return LINES[key][1];
  const m = /^b_([a-z_]+)_(\d+)$/.exec(key);
  if (m && BANK_TEXT[m[1]]) return BANK_TEXT[m[1]][1][Number(m[2])] ?? '';
  const w = Object.values(WORDS).find((x) => x.after[0] === key);
  return w ? w.after[1] : '';
}

let box: HTMLElement | null = null;
function container(): HTMLElement {
  if (!box) {
    box = document.createElement('div');
    box.id = 'family';
    document.body.appendChild(box);
  }
  return box;
}

function card(id: Speaker, text: string): HTMLElement {
  const info = speakerInfo(id);
  const c = document.createElement('div');
  c.className = 'fam-card' + (id === 'nightmare' ? ' dark' : '');
  c.style.setProperty('--fam', info.color);
  c.appendChild(avatarEl(id));
  const body = document.createElement('div');
  body.className = 'fam-body';
  const name = document.createElement('div');
  name.className = 'fam-name';
  name.textContent = info.name;
  const role = document.createElement('small');
  role.textContent = info.role;
  name.appendChild(role);
  const say = document.createElement('div');
  say.className = 'fam-say';
  say.textContent = text;
  body.append(name, say);
  c.appendChild(body);
  container().appendChild(c);
  return c;
}

function dismiss(c: HTMLElement): void {
  c.classList.add('out');
  setTimeout(() => c.remove(), 450);
}

/** Bị bỏ qua (nút ⏩): mọi câu đang chờ trả về ngay. */
let skipToken = 0;
const skipWaiters = new Set<() => void>();
export function cancelTalk(): void {
  skipToken++;
  for (const r of skipWaiters) r();
  skipWaiters.clear();
  if (box) box.innerHTML = '';
  hideSubtitle();
}

/** 1 nhân vật nói 1 câu (thẻ + giọng). Resolve khi đọc xong (tối thiểu `minMs`). */
export async function say(id: Speaker, key: string, text = lineText(key), minMs = 1400): Promise<void> {
  const my = skipToken;
  sfx('sfx_pop', 0.35);
  const c = card(id, text);
  await raceSkip(Promise.all([play(key), wait(minMs)]));
  dismiss(c);
  if (my === skipToken) await wait(150);
}

// ---- phụ đề người kể chuyện
let sub: HTMLElement | null = null;
function subtitleEl(): HTMLElement {
  if (!sub) {
    sub = document.createElement('div');
    sub.id = 'subtitle';
    sub.hidden = true;
    document.body.appendChild(sub);
  }
  return sub;
}
export function showSubtitle(text: string): void {
  const s = subtitleEl();
  s.textContent = text;
  s.hidden = false;
  s.classList.remove('in');
  void s.offsetWidth;
  s.classList.add('in');
}
export function hideSubtitle(): void { if (sub) sub.hidden = true; }

/** Người kể chuyện đọc 1 câu (phụ đề đáy màn). */
export async function narrate(key: string, text = lineText(key)): Promise<void> {
  const my = skipToken;
  showSubtitle(text);
  await raceSkip(play(key));
  if (my === skipToken) { await wait(250); hideSubtitle(); }
}

/** Chờ `p` nhưng trả về ngay khi bị ⏩ bỏ qua. */
export function raceSkip<T>(p: Promise<T>): Promise<unknown> {
  let done!: () => void;
  const skip = new Promise<void>((r) => { done = r; skipWaiters.add(r); });
  return Promise.race([p, skip]).finally(() => skipWaiters.delete(done));
}

export function clearTalk(): void {
  if (box) box.innerHTML = '';
  hideSubtitle();
}

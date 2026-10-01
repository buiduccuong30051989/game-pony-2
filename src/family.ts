// CẢ NHÀ NHÍM (hoá pony) + bạn bè: thẻ lời nói trượt vào từ mép phải (~2.5 s) kèm giọng đọc.
// Ảnh chân dung: public/img/portraits/<id>.png (chụp từ model 3D, xem README). Ảnh thật người nhà (tuỳ chọn):
// thả public/family/<id>.jpg → hiện thành huy hiệu tròn nhỏ cạnh mặt pony. Danh sách ảnh thật lấy từ module ảo
// 'virtual:family-photos' (vite.config.ts quét thư mục) → không gọi thử file thiếu, console sạch 404.
import photos from 'virtual:family-photos';
import { CAST, type CastId } from './data';
import { play, sfx } from './audio';
import { wait } from './tween';

/** Ai nói: người trong CAST, hoặc Nightmare Moon / Twilight (không nằm trong CAST). */
export type Speaker = CastId | 'nightmare' | 'twilight';

const EXTRA: Record<'nightmare' | 'twilight', { name: string; pony: string; emoji: string; color: string }> = {
  nightmare: { name: 'Nightmare Moon', pony: 'bóng tối', emoji: '🌑', color: '#4b3b9a' },
  twilight: { name: 'Nhím', pony: 'Twilight Sparkle', emoji: '🦄', color: '#a06cd5' },
};

/** Có chân dung PNG chụp sẵn (mèo thì dùng emoji). */
const PORTRAIT: Partial<Record<Speaker, string>> = {
  twilight: 'twilight', nightmare: 'nightmare', 'me-yen': 'rarity', 'ba-cuong': 'rainbow', 'ong-cuong': 'applejack',
  'ba-tuyet': 'celestia', 'bac-hanh': 'luna', spike: 'spike', pinkie: 'pinkie', fluttershy: 'fluttershy',
};

export function speakerInfo(id: Speaker): { name: string; pony: string; emoji: string; color: string } {
  return id === 'nightmare' || id === 'twilight' ? EXTRA[id] : CAST[id];
}

export function portraitUrl(id: Speaker): string | null {
  // bạn pony: ảnh trùng tên id (chụp bằng portrait.html)
  const p = PORTRAIT[id] ?? (id !== 'nightmare' && id !== 'twilight' && CAST[id].friend ? id : undefined);
  return p ? `${import.meta.env.BASE_URL}img/portraits/${p}.png` : null;
}

/** URL ảnh thật của 1 người nhà (nếu ba mẹ đã thả ảnh vào public/family/), không thì null. */
export function photoUrl(id: Speaker): string | null {
  const f = photos[id];
  return f ? `${import.meta.env.BASE_URL}family/${f}` : null;
}

/** Ô tròn: mặt pony (hoặc emoji), kèm huy hiệu ảnh thật nếu có. */
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
  const ph = photoUrl(id);
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

// ------------------------------------------------------------------ thẻ DOM
let box: HTMLElement | null = null;
function container(): HTMLElement {
  if (!box) {
    box = document.createElement('div');
    box.id = 'family';
    document.body.appendChild(box);
  }
  return box;
}

function card(id: Speaker, text: string, mini: boolean): HTMLElement {
  const info = speakerInfo(id);
  const c = document.createElement('div');
  c.className = 'fam-card' + (mini ? ' mini' : '') + (id === 'nightmare' ? ' dark' : '');
  c.style.setProperty('--fam', info.color);
  c.appendChild(avatarEl(id));
  const body = document.createElement('div');
  body.className = 'fam-body';
  const name = document.createElement('div');
  name.className = 'fam-name';
  name.textContent = info.name;
  const role = document.createElement('small');
  role.textContent = info.pony;
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

let showing = 0;
/** Đang có thẻ trên màn. */
export function familyBusy(): boolean { return showing > 0; }

/** 1 người nói 1 câu (thẻ + giọng). Resolve khi đọc xong (tối thiểu `minMs`). */
export async function say(id: Speaker, key: string, text: string, minMs = 2300): Promise<void> {
  showing++;
  try {
    sfx('sfx_pop', 0.4);
    const c = card(id, text, false);
    await Promise.all([play(key), wait(minMs)]);
    dismiss(c);
    await wait(200);
  } finally {
    showing--;
  }
}

/** Túi xáo trộn theo từng nhóm: lần lượt hết người rồi mới lặp. */
let bag: CastId[] = [];
let bagKey = '';
const lastLine = new Map<CastId, number>();

/** 1 người (ngẫu nhiên trong `pool`) khen Nhím. */
export async function cheer(pool: CastId[]): Promise<void> {
  if (!pool.length) return;
  const key = pool.join(',');
  if (key !== bagKey || !bag.length) { bagKey = key; bag = [...pool].sort(() => Math.random() - 0.5); }
  const id = bag.pop()!;
  const lines = CAST[id].lines;
  let i = Math.floor(Math.random() * lines.length);
  if (lines.length > 1 && i === lastLine.get(id)) i = (i + 1) % lines.length;
  lastLine.set(id, i);
  await say(id, lines[i][0], lines[i][1]);
}

/** Cả nhà lần lượt cổ vũ (cuối game): thẻ nhỏ xếp chồng, rồi cùng trượt ra. */
export async function cheerAll(ids: CastId[], finalKey = 'fam_all'): Promise<void> {
  showing++;
  const cards: HTMLElement[] = [];
  try {
    for (const id of ids) {
      const ball = CAST[id].ball ?? CAST[id].lines[0];
      sfx('sfx_pop', 0.4);
      cards.push(card(id, ball[1], true));
      await Promise.all([play(ball[0]), wait(1300)]);
    }
    await play(finalKey);
    await wait(500);
  } finally {
    cards.forEach((c, i) => setTimeout(() => dismiss(c), i * 90));
    showing--;
  }
}

/** Đổi màn: dọn thẻ còn sót. */
export function clearFamily(): void {
  if (box) box.innerHTML = '';
}

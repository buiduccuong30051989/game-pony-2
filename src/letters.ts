// 29 chữ cái tiếng Việt: thứ tự bảng chữ, tên gọi theo ÂM (SGK Tiếng Việt 1, GDPT 2018), đồ vật quen của mỗi chữ,
// các nhóm dễ lẫn (để chọn chữ nhiễu khi ôn). File THUẦN (chạy được bằng Node cho scripts/).
//
// Tên chữ: phụ âm gọi theo âm (bờ, cờ...), k = "ca", ă = "á", â = "ớ", i = "i ngắn", y = "i dài".
// q: tên chữ trong bảng là "cu" (quy) nhưng SGK lớp 1 dạy q luôn đi với u thành "qu", đọc "quờ" → game dùng "quờ".
import { slug } from './spell.ts';

export interface Letter {
  ch: string;
  /** tên đọc */
  name: string;
  /** đồ vật quen: chữ hiện + emoji (đọc: "bờ… bò") */
  obj: string;
  emoji: string;
  vowel: boolean;
}

const RAW: [string, string, string, string][] = [
  ['a', 'a', 'áo', '👕'], ['ă', 'á', 'trăng', '🌙'], ['â', 'ớ', 'ấm', '🫖'], ['b', 'bờ', 'bò', '🐄'],
  ['c', 'cờ', 'cá', '🐟'], ['d', 'dờ', 'dê', '🐐'], ['đ', 'đờ', 'đèn', '💡'], ['e', 'e', 'kem', '🍦'],
  ['ê', 'ê', 'ếch', '🐸'], ['g', 'gờ', 'gà', '🐔'], ['h', 'hờ', 'hoa', '🌸'], ['i', 'i ngắn', 'mì', '🍜'],
  ['k', 'ca', 'kẹo', '🍬'], ['l', 'lờ', 'lá', '🍃'], ['m', 'mờ', 'mèo', '🐈'], ['n', 'nờ', 'nơ', '🎀'],
  ['o', 'o', 'ong', '🐝'], ['ô', 'ô', 'cái ô', '☂️'], ['ơ', 'ơ', 'ớt', '🌶️'], ['p', 'pờ', 'pin', '🔋'],
  ['q', 'quờ', 'quà', '🎁'], ['r', 'rờ', 'rùa', '🐢'], ['s', 'sờ', 'sao', '⭐'], ['t', 'tờ', 'táo', '🍎'],
  ['u', 'u', 'ủng', '👢'], ['ư', 'ư', 'sư tử', '🦁'], ['v', 'vờ', 'vịt', '🦆'], ['x', 'xờ', 'xe', '🚗'],
  ['y', 'i dài', 'y tá', '👩‍⚕️'],
];
const VOWELS = new Set(Array.from('aăâeêioôơuưy'));

export const LETTERS: Letter[] = RAW.map(([ch, name, obj, emoji]) => ({ ch, name, obj, emoji, vowel: VOWELS.has(ch) }));
export const LETTER_ORDER = LETTERS.map((l) => l.ch);
const BY = new Map(LETTERS.map((l) => [l.ch, l]));
export function letter(ch: string): Letter {
  const l = BY.get(ch);
  if (!l) throw new Error(`không có chữ "${ch}"`);
  return l;
}
export function letterNameText(ch: string): string { return letter(ch).name; }

/** Nhóm dễ lẫn: chữ nhiễu ưu tiên lấy cùng nhóm khi cả hai đã mở. */
export const CONFUSABLE: string[][] = [
  ['b', 'd'], ['m', 'n'], ['o', 'ô', 'ơ'], ['u', 'ư'], ['a', 'ă', 'â'], ['e', 'ê'], ['p', 'q'], ['i', 'y'], ['d', 'đ'],
];
export function confusablesOf(ch: string): string[] {
  const out = new Set<string>();
  for (const g of CONFUSABLE) if (g.includes(ch)) for (const x of g) if (x !== ch) out.add(x);
  return [...out];
}

// ---- khoá audio
export const nameKey = (ch: string) => `ln_${slug(ch)}`;
export const objKey = (ch: string) => `lo_${slug(ch)}`;
export const findKey = (ch: string, i: number) => `find_${slug(ch)}_${i}`;
/** Mẫu câu tìm chữ ({n} = tên chữ). 8 mẫu × 29 chữ, xoay vòng không lặp liền. */
export const FIND_TEMPLATES = [
  'Nhím ơi, tìm chữ {n} nào!',
  'Chữ {n} đâu nhỉ?',
  'Nhím tìm giúp chữ {n} nhé!',
  'Ngôi sao chữ {n} ở đâu ta?',
  'Đi tìm chữ {n} nào!',
  'Chữ {n} đang trốn ở đâu nhỉ?',
  'Nhím ơi, chữ {n} ở đâu?',
  'Mình cần chữ {n}. Nhím tìm nhé!',
];

/** Mọi dòng audio của bảng chữ: tên, tên + đồ vật, câu tìm chữ. */
export function letterAudioLines(): [string, string][] {
  const out: [string, string][] = [];
  for (const l of LETTERS) {
    out.push([nameKey(l.ch), l.name]);
    out.push([objKey(l.ch), `${l.name}… ${l.obj}`]);
    FIND_TEMPLATES.forEach((t, i) => out.push([findKey(l.ch, i), t.replace('{n}', l.name)]));
  }
  return out;
}

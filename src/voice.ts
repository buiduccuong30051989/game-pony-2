// Chọn câu trong ngân hàng (src/lines.ts BANK_TEXT): ngẫu nhiên, không lặp 3 câu gần nhất của ngân hàng đó.
// + câu tìm chữ (8 mẫu / chữ, xoay vòng). Mọi lời nói ngắn của game đi qua đây để bé không nghe lặp.
import { BANK_TEXT, bankKey } from './lines';
import { FIND_TEMPLATES, findKey } from './letters';
import { play } from './audio';

const recent = new Map<string, number[]>();

function pick(name: string, n: number, keep = 3): number {
  const last = recent.get(name) ?? [];
  const free = Array.from({ length: n }, (_, i) => i).filter((i) => !last.includes(i));
  const i = free[Math.floor(Math.random() * free.length)] ?? 0;
  recent.set(name, [...last, i].slice(-Math.min(keep, n - 1)));
  return i;
}

/** Khoá audio của 1 câu trong ngân hàng + chữ hiện. */
export function bankLine(bank: keyof typeof BANK_TEXT | string): { key: string; text: string } {
  const [, list] = BANK_TEXT[bank];
  const i = pick(bank, list.length);
  return { key: bankKey(bank, i), text: list[i] };
}

/** Phát 1 câu ngân hàng, resolve khi đọc xong. */
export function sayBank(bank: string): Promise<void> {
  return play(bankLine(bank).key);
}

/** Khoá câu "tìm chữ …" (không lặp mẫu vừa dùng). */
export function findLine(ch: string): string {
  return findKey(ch, pick('find', FIND_TEMPLATES.length, 4));
}

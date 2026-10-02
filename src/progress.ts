// Tiến độ của bé (localStorage `nhim-story-v1`). Có tham số debug trên URL thì KHÔNG ghi đè tiến độ thật.
import { ALL_FRIENDS, type FriendId } from './data';
import { LETTER_ORDER } from './letters';

export interface Progress {
  /** đã xem mở đầu */
  prologue: boolean;
  /** chương cao nhất được chơi (1..4) */
  unlocked: number;
  /** chương đã xong */
  done: number[];
  /** đang chơi dở: chương + nhịp kế tiếp */
  resume: { ch: number; beat: number } | null;
  /** chữ đã nhặt (thứ tự nhặt) */
  letters: string[];
  /** chữ trả lời sai → ôn lại ở chương sau (chữ → số lần sai) */
  weak: Record<string, number>;
  /** bạn ngựa nhỏ đã cứu */
  friends: FriendId[];
}

const KEY = 'nhim-story-v1';
const Q = new URLSearchParams(location.search);
export const IS_DEBUG = [...Q.keys()].length > 0;

export function fresh(): Progress {
  return { prologue: false, unlocked: 1, done: [], resume: null, letters: [], weak: {}, friends: [] };
}

export function loadProgress(): Progress {
  if (Q.has('reset')) { try { localStorage.removeItem(KEY); } catch { /* bỏ qua */ } }
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (p && typeof p.unlocked === 'number') {
      const f = fresh();
      return {
        prologue: !!p.prologue,
        unlocked: Math.min(4, Math.max(1, p.unlocked)),
        done: Array.isArray(p.done) ? p.done.filter((x: unknown) => typeof x === 'number') : [],
        resume: p.resume && typeof p.resume.ch === 'number' ? p.resume : null,
        letters: Array.isArray(p.letters) ? p.letters.filter((l: string) => LETTER_ORDER.includes(l)) : f.letters,
        weak: p.weak && typeof p.weak === 'object' ? p.weak : {},
        friends: Array.isArray(p.friends) ? p.friends.filter((x: string) => (ALL_FRIENDS as string[]).includes(x)) : [],
      };
    }
  } catch { /* hỏng thì làm lại */ }
  return fresh();
}

export function saveProgress(p: Progress): void {
  if (IS_DEBUG && !Q.has('save')) return;
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* bỏ qua */ }
}

export function addLetter(p: Progress, ch: string): boolean {
  if (p.letters.includes(ch)) return false;
  p.letters.push(ch);
  return true;
}

export function markWeak(p: Progress, ch: string): void { p.weak[ch] = (p.weak[ch] ?? 0) + 1; }
/** Trả lời đúng 1 chữ yếu → bớt yếu. */
export function markStrong(p: Progress, ch: string): void {
  if (!p.weak[ch]) return;
  p.weak[ch]--;
  if (p.weak[ch] <= 0) delete p.weak[ch];
}

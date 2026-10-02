// Bảng chữ cái của Nhím (nút 🔤 trên HUD + cuối chương) và bài ôn của bạn rồng nhỏ.
// 29 ô đúng thứ tự; ô chưa có: mờ + ❓; ô có: sáng, chạm đọc "bờ… bò". Bài ôn: 2–3 câu "Nhím ơi, chữ ô đâu?",
// CHỈ dùng chữ đã mở, chữ nhiễu ưu tiên cặp dễ lẫn khi cả hai đã mở. Chữ sai → ghi `weak` để ôn lại chương sau.
import { LETTERS, confusablesOf, objKey, nameKey } from './letters';
import { slug } from './spell';
import { reviewKey } from './lines';
import { play, sfx, stopSpeech } from './audio';
import { sayBank, bankLine } from './voice';
import { avatarEl, say } from './talk';
import { spellExample } from './example';
import { markWeak, markStrong, type Progress } from './progress';
import { setAnswer } from './testhook';
import { wait } from './tween';
import { confetti } from './ui';

const $ = <T extends HTMLElement>(s: string) => document.querySelector<T>(s)!;

/** Mở bảng chữ. Resolve khi bé đóng (✖) — hoặc sau `autoCloseMs` (cuối chương). */
export function openBoard(got: string[], opts: { fresh?: string[]; autoCloseMs?: number } = {}): Promise<void> {
  const ov = $('#board');
  const grid = $('#board-grid');
  grid.innerHTML = '';
  let lastEmpty = 0;
  LETTERS.forEach((l, i) => {
    const have = got.includes(l.ch);
    const b = document.createElement('button');
    b.className = 'slot' + (have ? ' on' : '') + (opts.fresh?.includes(l.ch) ? ' fresh' : '');
    b.style.setProperty('--i', String(i));
    const big = document.createElement('span');
    big.className = 'slot-ch';
    big.textContent = have ? l.ch : '❓';
    const small = document.createElement('small');
    small.textContent = have ? l.emoji : '';
    b.append(big, small);
    b.addEventListener('click', () => {
      if (have) {
        sfx('sfx_tap', 0.3);
        b.classList.remove('say'); void b.offsetWidth; b.classList.add('say');
        void play(objKey(l.ch));
      } else if (performance.now() - lastEmpty > 4000) {
        lastEmpty = performance.now();
        void play('board_empty');
      }
    });
    grid.appendChild(b);
  });
  $('#board-count2').textContent = `${got.length}/29`;
  ov.hidden = false;
  ov.classList.remove('hide');
  return new Promise((resolve) => {
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      ov.classList.add('hide');
      setTimeout(() => { ov.hidden = true; }, 400);
      stopSpeech();
      resolve();
    };
    $<HTMLButtonElement>('#board-close').onclick = close;
    if (opts.autoCloseMs) setTimeout(close, opts.autoCloseMs);
  });
}

/** Chọn chữ ôn: chữ yếu (sai nhiều) đã mở trước, rồi chữ của chương (ngẫu nhiên). */
export function pickReview(p: Progress, chapterLetters: string[], n: number): string[] {
  const got = new Set(p.letters);
  const weak = Object.entries(p.weak).filter(([c]) => got.has(c)).sort((a, b) => b[1] - a[1]).map(([c]) => c);
  const pool = chapterLetters.filter((c) => got.has(c)).sort(() => Math.random() - 0.5);
  const out: string[] = [];
  for (const c of [...weak, ...pool, ...[...got].sort(() => Math.random() - 0.5)]) {
    if (out.length >= n) break;
    if (!out.includes(c)) out.push(c);
  }
  return out;
}

/** 2 chữ nhiễu cho `target`, chỉ trong chữ đã mở; ưu tiên cặp dễ lẫn. */
export function distractors(target: string, unlocked: string[], n = 2): string[] {
  const out: string[] = [];
  for (const c of confusablesOf(target).sort(() => Math.random() - 0.5)) if (unlocked.includes(c) && out.length < n) out.push(c);
  const rest = unlocked.filter((c) => c !== target && !out.includes(c)).sort(() => Math.random() - 0.5);
  while (out.length < n && rest.length) out.push(rest.pop()!);
  return out;
}

/** Bạn rồng nhỏ hỏi ôn 2–3 chữ. */
export async function runReview(p: Progress, chapterLetters: string[], n = 3): Promise<void> {
  const targets = pickReview(p, chapterLetters, n);
  if (!targets.length) return;
  const ov = $('#review');
  const cards = $('#review-cards');
  const spike = $('#review-spike');
  spike.innerHTML = '';
  spike.appendChild(avatarEl('spike', 'rv-ava'));
  ov.hidden = false;
  ov.classList.remove('hide');
  await say('spike', 'review_intro');
  for (const target of targets) {
    const opts = [target, ...distractors(target, p.letters)].sort(() => Math.random() - 0.5);
    cards.innerHTML = '';
    const btns = opts.map((ch) => {
      const b = document.createElement('button');
      b.className = 'rv-card';
      b.textContent = ch;
      cards.appendChild(b);
      return b;
    });
    const ask = () => play(reviewKey(slug(target)));
    $<HTMLButtonElement>('#review-repeat').onclick = () => void ask();
    void ask();
    let wrongOnce = false;
    await new Promise<void>((resolve) => {
      const pick = (ch: string, b: HTMLButtonElement) => {
        if (ch === target) {
          setAnswer(null, null);
          b.classList.add('correct');
          sfx('sfx_win', 0.5);
          confetti(30);
          if (!wrongOnce) markStrong(p, target);
          void (async () => { await play(bankLine('rv_ok').key); await spellExample(target); await wait(200); resolve(); })();
        } else {
          b.classList.remove('wobble'); void b.offsetWidth; b.classList.add('wobble');
          if (!wrongOnce) markWeak(p, target);
          wrongOnce = true;
          void (async () => { await sayBank('no'); await play(nameKey(target)); })();
        }
      };
      btns.forEach((b, i) => b.addEventListener('click', () => pick(opts[i], b)));
      setAnswer(`review:${target}`, (ok) => {
        const i = ok ? opts.indexOf(target) : opts.findIndex((c) => c !== target);
        pick(opts[i], btns[i]);
      });
    });
  }
  cards.innerHTML = '';
  await say('spike', 'review_done');
  ov.classList.add('hide');
  setTimeout(() => (ov.hidden = true), 400);
}

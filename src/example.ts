// Từ ví dụ sau mỗi chữ đúng: "ê… ếch: ê – chờ – ếch". Thẻ to giữa màn (đồ vật + từ), đọc CHẬM theo token đánh vần lớp 1
// (src/spell.ts), chữ đang đọc sáng lên. Game chỉ chạy tiếp sau khi đọc xong. Cùng 1 chữ vừa đánh vần (< 90 s) thì chỉ
// đọc ngắn "ê… ếch" (bài ôn trên bảng chữ cái).
import { letter, objKey } from './letters';
import { spell } from './spell';
import { play, speakSequence } from './audio';
import { wait } from './tween';

const recent = new Map<string, number>();
const $ = <T extends HTMLElement>(s: string) => document.querySelector<T>(s)!;

function render(word: string, lit: number[], whole = false): void {
  const w = $('#example-word');
  w.innerHTML = '';
  Array.from(word).forEach((ch, i) => {
    const s = document.createElement('span');
    s.textContent = ch;
    if (lit.includes(i)) s.className = 'lit';
    w.appendChild(s);
  });
  w.classList.toggle('whole', whole);
}

/** Đọc từ ví dụ của chữ `ch`. short: chỉ "ê… ếch" (không đánh vần lại). */
export async function spellExample(ch: string, opts: { short?: boolean } = {}): Promise<void> {
  const l = letter(ch);
  const sp = spell(l.word);
  const short = opts.short ?? (performance.now() - (recent.get(ch) ?? -1e9) < 90000);
  const box = $('#example');
  $('#example-emoji').textContent = l.emoji;
  $('#example-letter').textContent = ch;
  $('#example-obj').textContent = l.obj;
  render(l.word, []);
  box.hidden = false;
  box.classList.remove('in'); void box.offsetWidth; box.classList.add('in');
  await play(objKey(ch));
  if (!short) {
    await wait(300);
    await speakSequence(sp.tokens.map((t) => t.audio), (i) => render(l.word, sp.tokens[i].lit, i === sp.tokens.length - 1), 330);
    recent.set(ch, performance.now());
  }
  render(l.word, [], true);
  await wait(short ? 500 : 700);
  box.hidden = true;
}

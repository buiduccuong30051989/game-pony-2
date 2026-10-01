// Thử thách phép thuật (mini-game DOM): A1 nghe – chọn hình, B1 đếm ngọc – chọn số.
import { WORDS, NUMBER_AUDIO, type LevelDef, type WordDef, type ChallengeKind } from './data';
import { play, sfx, speakSequence, stopSpeech } from './audio';
import { els, showPanel, showWord, showOptions, showGemRow, setCounter, wobbleEl, hideWord } from './ui';
import { wait } from './tween';

export interface ChallengeHooks {
  /** quái cười / Nightmare Moon cười (không phạt); trả Promise thì chờ cười xong mới nhắc lại */
  onWrong: () => Promise<void> | void;
}

// 1 nút 🔊 dùng chung: chỉ thử thách đang chạy được nghe lại
let activeRepeat: (() => void) | null = null;
els.repeat.addEventListener('click', () => activeRepeat?.());

export class Challenge {
  private used = new Set<string>();
  private set repeatFn(fn: (() => void) | null) { activeRepeat = fn; }

  constructor(private level: LevelDef, private hooks: ChallengeHooks) {}

  /** Chạy 1 thử thách, resolve khi bé trả lời đúng (luôn thành công, không kẹt). low = bảng sát đáy màn. */
  async run(kind: ChallengeKind, introKey = 'monster', low = false): Promise<void> {
    showPanel(true, low);
    await play(introKey);
    if (kind === 'spell') await this.spell(); else await this.count();
    await wait(300);
    showPanel(false);
    this.repeatFn = null;
  }

  private pickWord(): WordDef {
    const pool = this.level.wordPool.filter((id) => !this.used.has(id));
    const ids = pool.length ? pool : this.level.wordPool;
    const id = ids[Math.floor(Math.random() * ids.length)];
    this.used.add(id);
    return WORDS.find((w) => w.id === id)!;
  }

  private distractors(target: WordDef, n: number): WordDef[] {
    const others = WORDS.filter((w) => w.id !== target.id).sort(() => Math.random() - 0.5);
    return others.slice(0, n);
  }

  /** A1: "Con nào là con mèo?" → 3 hình. Đúng thì đánh vần với thẻ chữ. */
  private async spell(): Promise<void> {
    const target = this.pickWord();
    const items = [target, ...this.distractors(target, 2)].sort(() => Math.random() - 0.5);
    let wrong = 0;
    this.repeatFn = () => void play(`ask_${target.id}`);
    await new Promise<void>((resolve) => {
      const buttons = showOptions(items.map((w) => ({ label: w.emoji, value: w.id })), async (value, btn) => {
        if (value !== target.id) {
          wrong++;
          sfx('sfx_soft', 0.5);
          wobbleEl(btn);
          if (wrong === 1) btn.classList.add('gone');
          await this.hooks.onWrong();
          if (wrong === 1) {
            await play('retry');
            await play(`ask_${target.id}`);
          } else {
            await play('hint_last');
            buttons.find((b) => b.dataset.value === target.id)?.classList.add('hint');
          }
          return;
        }
        buttons.forEach((b) => { b.classList.remove('hint'); if (b !== btn) b.classList.add('gone'); });
        btn.classList.add('correct');
        sfx('sfx_win', 0.5);
        await play('right');
        await this.spellOut(target);
        resolve();
      });
      void play(`ask_${target.id}`);
    });
  }

  /** con mèo → e – o – eo – mờ – eo – meo – huyền – mèo, tô cam chữ đang đọc, xong tô xanh. */
  private async spellOut(w: WordDef): Promise<void> {
    const all = Array.from(w.word).map((_, i) => i);
    showWord(w.word, all, true);
    this.repeatFn = () => void this.spellOut(w);
    const ok = await speakSequence([`name_${w.id}`, ...w.tokens.map((t) => t.audio)], (i) => {
      if (i === 0) showWord(w.word, all, true);
      else showWord(w.word, w.tokens[i - 1].lit, false);
    });
    if (ok) showWord(w.word, all, true);
    await wait(500);
    hideWord();
  }

  /** B1: quái giữ N ngọc → chạm từng viên (một, hai, ba…) → chọn số đúng. */
  private async count(): Promise<void> {
    const [lo, hi] = this.level.countRange;
    const n = lo + Math.floor(Math.random() * (hi - lo + 1));
    let counted = 0;
    this.repeatFn = () => void play('ask_count');
    await new Promise<void>((resolve) => {
      showGemRow(n, async (btn) => {
        if (btn.classList.contains('done')) { void play(NUMBER_AUDIO[Math.min(counted, 10)] || 'n1'); return; }
        btn.classList.add('done');
        counted++;
        sfx('sfx_pop', 0.5);
        setCounter(counted);
        await play(NUMBER_AUDIO[counted]);
        if (counted === n) { await wait(250); resolve(); }
      });
      void play('ask_count');
    });

    const opts = new Set<number>([n]);
    while (opts.size < 3) {
      const d = n + Math.floor(Math.random() * 5) - 2;
      if (d >= 1 && d <= 10) opts.add(d);
    }
    const list = [...opts].sort(() => Math.random() - 0.5);
    let wrong = 0;
    this.repeatFn = () => void play('ask_pick_number');
    await new Promise<void>((resolve) => {
      const buttons = showOptions(list.map((v) => ({ label: String(v), value: String(v) })), async (value, btn) => {
        if (Number(value) !== n) {
          wrong++;
          sfx('sfx_soft', 0.5);
          wobbleEl(btn);
          if (wrong === 1) btn.classList.add('gone');
          await this.hooks.onWrong();
          if (wrong === 1) {
            await play('retry');
            await play(NUMBER_AUDIO[n]);
          } else {
            await play('hint_last');
            buttons.find((b) => b.dataset.value === String(n))?.classList.add('hint');
          }
          return;
        }
        buttons.forEach((b) => { b.classList.remove('hint'); if (b !== btn) b.classList.add('gone'); });
        btn.classList.add('correct');
        sfx('sfx_win', 0.5);
        stopSpeech();
        await play('right');
        resolve();
      });
      void play('ask_pick_number');
    });
    els.gemrow.hidden = true;
    setCounter(null);
  }
}

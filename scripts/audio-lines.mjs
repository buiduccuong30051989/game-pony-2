// Gom MỌI dòng audio của game → scripts/audio/_all.gen.txt (key|giọng|câu), cho scripts/gen-audio.py sinh bằng edge-tts.
// Nguồn: src/lines.ts (thoại + ngân hàng), src/letters.ts (tên chữ, chữ + đồ vật, câu tìm chữ), src/spell.ts + src/words.ts
// (token đánh vần của từ game ghép). Node ≥ 22.18 tự bỏ kiểu TS khi import.
// Dùng: node scripts/audio-lines.mjs [--check]   (--check: chỉ soát khoá trùng / câu rỗng, không ghi file)
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const imp = (p) => import(pathToFileURL(join(root, p)).href);
const L = await imp('src/lines.ts');
const { letterAudioLines, LETTERS } = await imp('src/letters.ts');
const { spell, slug } = await imp('src/spell.ts');
const { WORDS } = await imp('src/words.ts');

const out = new Map();
let bad = 0;
const add = (key, voice, text) => {
  if (!/^[a-z0-9_]+$/.test(key)) { bad++; console.error(`✗ khoá lạ: ${key}`); return; }
  if (!text || !text.trim()) { bad++; console.error(`✗ câu rỗng: ${key}`); return; }
  if (!L.VOICES[voice]) { bad++; console.error(`✗ giọng lạ "${voice}" ở ${key}`); return; }
  const prev = out.get(key);
  if (prev && (prev[0] !== voice || prev[1] !== text)) { bad++; console.error(`✗ khoá ${key} trùng mà khác câu: "${prev[1]}" ≠ "${text}"`); return; }
  out.set(key, [voice, text]);
};

for (const [k, [v, t]] of Object.entries(L.LINES)) add(k, v, t);
for (const [bank, [v, list]] of Object.entries(L.BANK_TEXT)) list.forEach((t, i) => add(L.bankKey(bank, i), v, t));
for (const [k, t] of letterAudioLines()) add(k, 'my', t);
for (const l of LETTERS) {
  const s = slug(l.ch);
  add(L.lockKey(s), 'spike', L.LOCK_TEMPLATE.replaceAll('{n}', l.name));
  add(L.reviewKey(s), 'spike', L.REVIEW_TEMPLATE.replaceAll('{n}', l.name));
}
for (const [t, txt] of Object.entries(L.TONE_FIND)) add(L.toneFindKey(t), 'my', txt);
for (const [t, txt] of Object.entries(L.TONE_LABEL)) add(L.toneLabelKey(t), 'my', txt);
const WORD_VOICE = { ba: 'ba', 'bà': 'batuyet', 'mẹ': 'me' };
for (const w of Object.values(WORDS)) {
  const sp = spell(w.word);
  for (const [k, t] of sp.lines) add(k, 'my', t);
  add(L.spellKey(sp.id), 'spike', L.SPELL_TEMPLATE.replace('{w}', w.word));
  add(w.after[0], WORD_VOICE[w.word] ?? 'my', w.after[1]);
}

if (bad) { console.error(`audio-lines: ${bad} lỗi`); process.exit(1); }
if (!process.argv.includes('--check')) {
  const vo = Object.entries(L.VOICES).map(([k, v]) => `#voice ${k}|${v.voice}|${v.rate}|${v.pitch}`);
  const lines = [...out].sort(([a], [b]) => a.localeCompare(b)).map(([k, [v, t]]) => `${k}|${v}|${t}`);
  writeFileSync(join(root, 'scripts/audio/_all.gen.txt'),
    ['# TỰ SINH bởi scripts/audio-lines.mjs – ĐỪNG SỬA TAY. Sửa câu trong src/lines.ts / letters.ts / words.ts rồi `pnpm audio`.', ...vo, ...lines].join('\n') + '\n');
}
console.log(`audio-lines: ${out.size} dòng`);

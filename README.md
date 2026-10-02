# Nhím và những ngôi sao chữ (game 5: pony story, Three.js)

Nhím (Hà An, 5 tuổi) là **Twilight Sparkle**. Mở đầu ở thư viện của bà Tuyết: ảnh thật của Nhím trên giá vẽ hoá thành Twilight,
rồi Nữ hoàng Bóng Đêm (bác Hanh bị bóng tối biến thành Nightmare Moon) thổi 29 chữ cái thành **sao chữ** bay khắp xứ sở và bắt
cả nhà đi. Thiếu chữ thì phép yếu → Nhím đi nhặt lại chữ để cứu từng người. 4 chương, học **trong cảnh** (không có bảng quiz).

Fork từ `02-pony-three` (giữ engine: đảo 3D, rig pony, hàng bạn đi theo, hạt phép, audio). Kế hoạch + quyết định: `PLAN.md`.
Chạy / iPad / ảnh / giọng: `RUN.md`. Giấy phép: `CREDITS.md`.

## Truyện và bài học

| Chương | Nơi | Cứu | Học | Quái (bị bóng tối nhập) |
|---|---|---|---|---|
| Mở đầu | thư viện bà Tuyết | — | — | — |
| 1 | Rừng Everfree | mèo Mun + mèo Rơm (lồng → chạm ✨ Đại phép) | 12 nguyên âm a ă â e ê i o ô ơ u ư y (nghe-tìm) | slime, ma |
| 2 | Ponyville | ba Cường + mẹ Yến (bong bóng khắc "ba" → **ghép b + a**) | b c d đ h l m n + ghép phụ âm + a (ca, đa, ma, na, la, ba) | yêu tinh, rồng nhỏ |
| 3 | Canterlot | ông Cương + bà Tuyết (bong bóng "bà" → ghép + dấu huyền; bà kéo mặt trời) | g k p q r s t v x + ghép có dấu (cá, bò, mẹ, vẽ, tô, bà) | phù thuỷ, pháp sư |
| 4 | Trận Canterlot | bác Hanh | ôn chữ + đọc "ba", "mẹ", "bà" trong 5 vòng Hài Hoà | 15 quái trộn |

Nhịp mỗi chương (`CHAPTERS[].beats` trong `src/data.ts`): cảnh ngắn → đi (đường sao dẫn lối, nhặt ngọc) → bài học → cảnh ngắn →
đi → bài học → … → cảnh cứu → bạn rồng nhỏ ôn 2–3 chữ → 1 trang album ảnh thật. 6–8 khoảnh khắc học / chương.

**Bài học trong cảnh** (`src/activities.ts`):
- *Săn sao chữ*: sao chữ 3D to phát sáng đứng trong cảnh; giọng "Nhím ơi, tìm chữ ô nào!" (8 mẫu câu xoay vòng); bé cho Twilight
  chạy tới chạm ngôi sao đúng. Đúng: sao bay vào bảng chữ, đồ vật của chữ hiện ra ("ô… cái ô ☂️"). Sai: sao lắc, đọc lại tên chữ.
- *Cầu gãy*: suối cắt ngang đảo, cầu thiếu ván, ván có chữ lơ lửng, chạm đúng → ván lắp vào. *Cổng khoá*: ổ khoá có chữ, 3 sao bay
  vòng quanh, chạm đúng → khoá bật.
- *Ghép bằng phép*: chạm sao phụ âm → Twilight bắn phép, sao bay lên ô; chạm sao vần; (chương 3) chạm dấu thanh → các sao nhập lại
  thành tiếng, đọc đánh vần theo token, chữ đang đọc sáng lên trên bảng chữ to; đồ vật / người nhà hiện ra.
- Mỗi bài có 1 quái dễ thương bị bóng tối nhập (tím, mắt hồng sáng, khói tím) giữ 1 bạn ngựa nhỏ trong bong bóng. Xong bài →
  quái được thanh tẩy (màu thật + nhảy múa), bạn ngựa nhỏ ra cảm ơn rồi đi theo. 12 bạn, hàng đi theo tối đa 12, **đi hàng đôi**.
- **Bảng chữ cái** (`src/board.ts`): 29 ô đúng thứ tự, ô chưa có mờ + ❓, chạm ô có đọc "bờ… bò". **Ôn** cuối chương: chỉ chữ đã
  mở, chữ nhiễu ưu tiên cặp dễ lẫn (b–d, m–n, o–ô–ơ, u–ư, a–ă–â, e–ê, p–q, i–y, d–đ). Chữ sai → `weak` → quay lại ở bài ôn,
  lần săn sao đầu của chương sau và trận cuối (ôn cách quãng).

**Đánh vần** (`src/spell.ts`, port từ 03-princess + sửa vần tắc): vần c/ch/p/t đọc sắc, tiếng không dấu cũng đọc sắc rồi mới thêm
dấu: *vịt = i – tờ – ít, vờ – ít – vít – nặng – vịt*. Tên chữ theo SGK (gọi theo âm): ă "á", â "ớ", i "i ngắn", y "i dài", k "ca",
q "quờ" (lý do: PLAN.md §4). `scripts/check-spelling.mjs` (bảng vàng 35 từ + 29 tên chữ) chạy đầu `pnpm build`, lệch là build đỏ.

**Giọng**: Microsoft Hoài My qua edge-tts (sinh sẵn, chơi offline), mọi câu có trong `src/lines.ts`. Tên riêng tiếng Anh viết
`{Fluttershy}` → đọc bằng giọng tiếng Anh (Jenny / Ana / Guy) rồi ghép với phần tiếng Việt (cách 80 ms). Mọi câu hiện trong khung
phụ đề có nhãn người nói ("Ba Cường (Rainbow Dash):", "Fluttershy:", "Người kể chuyện:").
**Từ ví dụ**: chữ đúng → thẻ to "ê… ếch: ê – chờ – ếch" đọc chậm, chữ sáng theo token (`src/example.ts`); danh sách ở PLAN.md §12.
Ngân hàng 8–12 câu / tình huống (đúng, sai, nhắc, thanh tẩy, cảm ơn, Nữ hoàng cười…), không lặp 3 câu gần nhất. Nhắc khi bé im
lặng: lần đầu sau 20 s, rồi 40 s, 80 s, tối đa 160 s.

**Trận cuối** (`src/finale.ts`): phim mở (camera từ trên cao quét xuống 2 phe, 15 quái) → 5 vòng Hài Hoà (ông đá hậu, các bạn +
mèo xông lên, ba bay vệt cầu vồng, mẹ nổ ngọc, bà chiếu nắng; mỗi vòng 3 quái đổi phe + 1 ngọc sáng; sai thì Nữ hoàng cười, bóng
tối nhích lên) → cao trào (5 ngọc xoay, Twilight sáng rực bay lên dang cánh ánh sáng, ảnh thật của Nhím loé lên, niệm "Bằng phép
màu của tình bạn và gia đình…", tia cầu vồng, màn trắng) → kết (bác Hanh trở lại, bình minh, cả nhà ôm nhau, pháo hoa, ảnh lớn
"Nhím đã cứu cả nhà!", cả cuốn album).

## Điều khiển (iPad ngang)

Chạm đất → Twilight chạy tới (giữ kéo thì đi theo ngón); chạm sao / ván → chọn; nút tím to → nhảy; nút 🪽 → bay ~4 s; 🔤 bảng chữ; ⏩ bỏ qua phim;
🏠 về bản đồ. Mac: phím mũi tên + Space. Lần chạm đầu mở khoá tiếng. Màn dọc hiện nhắc xoay ngang.

## Debug URL

Có tham số debug thì KHÔNG ghi đè tiến độ thật trong localStorage (`nhim-story-v1`), trừ khi thêm `&save=1`.

| Tham số | Tác dụng |
|---|---|
| `?chapter=N` | vào thẳng chương N (1–3; 4 = trận cuối); coi như có chữ + bạn của các chương trước |
| `&beat=K` | bắt đầu ở nhịp K của chương (các nhịp trước hoàn tất ngay: chữ đã nhặt, quái đã thanh tẩy, người đã cứu) |
| `?finale=1[&round=R]` | trận cuối, R vòng đã xong sẵn (5 = nhảy tới cao trào) |
| `?cine=ID` | xem 1 cảnh: `prologue`, `c1_intro`, `c1_mid`, `c2_intro`, `c2_mid`, `c3_intro`, `c3_mid`, `f_intro`, `climax`, `ending` |
| `?unlock=all` | mở hết 4 chương, đủ 29 chữ, đủ 12 bạn |
| `?reset=1` | xoá tiến độ |
| `?album=1..4` / `?album=all` | 1 trang album / cả cuốn |
| `?board=1` / `?review=1` | bảng chữ cái / bài ôn của bạn rồng nhỏ |
| `&auto=1` | bỏ màn chạm bắt đầu, Twilight tự đi tới bài, Đại phép tự bấm, album tự lật |
| `&mute=1` | tắt tiếng, mỗi câu coi như 150 ms → chạy nhanh khi chụp màn hình |
| `&perf=1` | hiện fps · tam giác · draw call (`renderer.info`) |

`window.__game` cho test headless: `phase`, `beat`, `run`, `finale`, `progress`, `waiting` (bài đang chờ, vd `hunt:ô`),
`answer(true|false)` (chạm đáp án đúng / 1 đáp án sai), `perf()`, `startChapter(n, beat)`, `startFinale(round, cine)`.

## Cấu trúc

```
index.html         DOM đè canvas: HUD (huy hiệu ảnh Nhím, tên chương, 🔤 n/29, ngọc / 5 ngọc Hài Hoà), nút nhảy, ⏩, ✨,
                   chữ đánh vần to, bản đồ 4 chương, bảng chữ, bài ôn, album, ảnh lớn, màn bắt đầu, nhắc xoay ngang
src/main.ts        khởi động, bản đồ, điều hướng chương / trận cuối / debug URL, chạm (raycast sao → chọn, đất → chạy tới)
src/story.ts       ChapterRun: dựng đảo, hàng bạn, chạy nhịp, đường sao dẫn lối, nhắc khi im lặng, lưu tiến độ / chơi tiếp
src/activities.ts  săn sao, cầu gãy, cổng khoá, ghép chữ bằng phép (+ quái giữ bạn, chọn chữ nhiễu)
src/rescue.ts      cảnh cứu: lồng mèo + Đại phép; bong bóng ba mẹ / ông bà mở bằng ghép "ba" / "bà"; bà kéo mặt trời
src/prologue.ts    thư viện bà Tuyết (ảnh → Twilight, Nữ hoàng thổi 29 chữ, bắt cả nhà)
src/cines.ts       cảnh giữa chương; src/cine.ts khung phim (camera, phụ đề, ⏩: mọi bước nhảy tới trạng thái cuối)
src/finale.ts      trận cuối (phim mở, 5 vòng, chiêu người nhà, cao trào, kết)
src/monster.ts     quái GLB: bị nhập (tím, mắt sáng, khói) / thanh tẩy (màu thật, clip vui), bong bóng giữ bạn
src/letterstar.ts  sao chữ 3D (ngôi sao bevel + đĩa chữ quay về camera), dấu thanh vẽ tay, ván cầu có chữ
src/parade.ts      hàng đi theo hàng đôi, túm tụm sau lưng Nhím khi học, đẩy tách
src/board.ts       bảng chữ cái + bài ôn; src/album.ts album + ảnh lớn kết; src/photos.ts ảnh Nhím qua canvas (bỏ EXIF)
src/letters.ts     29 chữ: tên âm, đồ vật, nhóm dễ lẫn, câu tìm chữ; src/spell.ts đánh vần; src/words.ts từ ghép
src/lines.ts       MỌI câu thoại + ngân hàng + giọng; src/voice.ts chọn câu không lặp; src/talk.ts thẻ lời nói / phụ đề
src/world.ts       đảo, cảnh theo chương (rừng / làng / tháp / lâu đài), đường đá, ngày-đêm, props gộp theo vật liệu
src/hero.ts, actors.ts, rig.ts, eyes.ts, magic.ts, audio.ts, tween.ts, progress.ts, testhook.ts, viewer.ts (dev)
scripts/           check-spelling.mjs (bảng vàng), audio-lines.mjs + gen-audio.py (Hoài My), optimize-models.mjs (giảm lưới)
```

## Hiệu năng (iPad)

Ngân sách trận cuối ≤ 300k tam giác, ≤ 150 draw call. Đo headless (Chrome trên Mac, 1180×820, `renderer.info`):
trận cuối ~281k tam giác, ~200 draw call (tam giác đạt, draw call còn vượt — chi tiết PLAN.md §11); chương 1 ~160k / ~100.
Cách giữ ngân sách: Celestia / Nightmare Moon / Spike / gia đình giảm lưới bằng meshoptimizer (`scripts/optimize-models.mjs`),
bạn ngựa nhỏ dùng bản `lod/`, quái Quaternius 1–7k tam giác, props tĩnh gộp theo vật liệu (vài draw call cho cả rừng),
chỉ Twilight + props đổ bóng thật (người đi theo có bóng tròn mờ), shadow map 1024, pixel ratio ≤ 1.5, texture ≤ 1024 px.

## Đã biết / chưa làm

- Chưa test trên iPad thật (chỉ headless Chrome trên Mac). fps đo được là của Mac, iPad sẽ thấp hơn.
- Giọng Hoài My / Nam Minh do máy đọc: cần ba nghe thử các câu ngắn ("ớ", "i dài", "quờ", "dấu ngã") và giọng ba / ông / bạn rồng nhỏ.
- Twilight / pony không có xương thật: chân vung bằng auto-rig, cánh không vỗ (cao trào dùng cánh ánh sáng).

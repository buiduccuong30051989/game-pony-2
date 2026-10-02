# Plan game 5: "Nhím và những ngôi sao chữ" (pony story)

Fork của `02-pony-three` (game pony cả nhà chấm hay nhất). Giữ engine (đảo 3D, Twilight, rig pony, hàng bạn đi theo,
hạt phép, dàn người nhà, audio WebAudio), làm lại **cốt truyện** và **phần học**. Ngày 02/10/2026.

## 1. Góp ý của ba trên game cũ → cách sửa

| Góp ý | Sửa |
|---|---|
| Học lặp, "biểu tượng quá" (bảng emoji bật lên) | Bỏ hết bảng quiz. Học **trong cảnh**: săn sao chữ, khoá cửa, cầu gãy, ghép vần bằng phép |
| Quá nhiều màn | 7 màn → **4 chương**: 2 mèo chung 1 lần cứu, ba + mẹ 1 lần, ông + bà 1 lần, trận cuối |
| Muốn có truyện | Mỗi chương: cảnh ngắn → chơi → học → cảnh ngắn → chơi → học → cảnh cứu. Có lời kể chuyện |
| Giọng lặp, nói nhiều | Ngân hàng câu 8–15 biến thể / tình huống, xoay vòng không lặp liền; nhắc khi đứng yên chỉ sau ~20 s rồi giãn ra |
| Quái xấu | Bỏ quái cầu tự dựng; dùng quái GLB dễ thương (slime, ma, rồng nhỏ, yêu tinh, phù thuỷ) bị bóng tối nhập → được thanh tẩy thì về phe mình |
| Đánh vần sai ("vịt") | Port bộ sinh đánh vần của `03-princess` + sửa quy tắc vần tắc; bảng vàng `scripts/check-spelling.mjs` chạy trong `pnpm build` |
| Đọc tên tiếng Anh bằng giọng Việt | KHÔNG BAO GIỜ nói tên tiếng Anh. Gọi theo tên nhà (Nhím, ba Cường, bà Tuyết...), tên tiếng Anh chỉ ở bảng tên |
| Camera gần | Lùi camera ~25% (offset 9.5/12.5 → 11.9/15.6) để thấy cảnh + hàng bạn |
| iPad | Chạm đất để đi (Twilight chạy tới), nút nhảy to, ngang màn hình, mở khoá tiếng ở lần chạm đầu, ngân sách hiệu năng |

## 2. Dàn nhân vật (giữ nguyên)

Nhím = Twilight Sparkle (nhân vật chính) · bà Tuyết = Celestia · bác Hanh = Luna, bị biến thành Nightmare Moon tới cuối ·
ba Cường = Rainbow Dash · mẹ Yến = Rarity · ông Cương = Applejack · mèo Mun (đen), mèo Rơm (vàng) · Spike = bạn rồng.

**Tên khi NÓI** (giọng đọc): Nhím, ba Cường / ba, mẹ Yến / mẹ, ông Cương / ông, bà Tuyết / bà, bác Hanh / bác, Mun, Rơm,
"bạn rồng nhỏ" (Spike), "Nữ hoàng Bóng Đêm" (Nightmare Moon), "các bạn ngựa nhỏ" (bạn pony), "khu rừng bí ẩn",
"làng ngựa nhỏ", "thành phố lâu đài". Tên tiếng Anh (Twilight, Rainbow Dash, Everfree, Canterlot…) chỉ HIỆN chữ.

## 3. Cốt truyện

**Mở đầu** (~35 s, có ⏩): thư viện của bà Tuyết. Bà dạy Nhím đọc chữ; trên giá vẽ là **ảnh thật của Nhím**. Phép màu xoáy,
ảnh hoá thành Twilight. Nữ hoàng Bóng Đêm phá cửa sổ, thổi 29 chữ cái thành **sao chữ** bay khắp xứ sở, bắt cả nhà đi.
Thiếu chữ thì phép của Twilight yếu → phải nhặt lại chữ để cứu từng người.

| Chương | Nơi | Cứu | Học |
|---|---|---|---|
| 1 | Rừng Everfree | Mun + Rơm | nguyên âm a ă â e ê i o ô ơ u ư y — chỉ nghe-tìm chữ, chưa đánh vần |
| 2 | Ponyville | ba Cường + mẹ Yến | phụ âm b c d đ h l m n + ghép dễ nhất: phụ âm + a (ba ca da đa ha la ma na) |
| 3 | Canterlot | ông Cương + bà Tuyết | phụ âm g k p q r s t v x + ghép phụ âm + vần 1 chữ + dấu (bà, cá, bò, mẹ, vẽ, tô…) |
| 4 | Trận Canterlot | bác Hanh | ôn 29 chữ + đọc từ cả nhà (ba, mẹ, bà) |

Nhịp 1 chương (~10 phút): cảnh ngắn → chơi → học → cảnh ngắn → chơi → học → cảnh cứu → Spike ôn 2–3 chữ → trang album.
Mỗi chương 6–8 khoảnh khắc học. Cảnh 20–40 s, luôn có nút ⏩.

### Chương 1 – Rừng Everfree (quái: slime + ma)
1. Cảnh mở: Twilight + Spike tới bìa rừng tối, nghe Mun Rơm kêu meo, Nữ hoàng Bóng Đêm cười.
2. Săn sao A (slime giữ bạn): a, o, ô (+1 sao mồi). 3. Cầu gãy: ván e, ê.
4. Cảnh giữa: lồng của Mun Rơm ở cuối rừng, ma bóng tối bay ra.
5. Săn sao B (ma giữ bạn): ơ, u, ư. 6. Cổng khoá: ă rồi â. 7. Săn sao C (slime): i, y.
8. Cảnh cứu: Đại phép (chạm ✨) phá lồng → Mun + Rơm chạy ra. 9. Spike ôn. 10. Album.

### Chương 2 – Ponyville (quái: yêu tinh + rồng nhỏ)
1. Cảnh mở: làng, ba mẹ trong bong bóng đen trên tháp đồng hồ. 2. Săn sao A: c, d, đ.
3. Ghép phép: ca, đa. 4. Cảnh giữa. 5. Săn sao B: h, l, m, n. 6. Cổng khoá: b (nhiễu d) — ngay trước khi ghép "ba".
7. Ghép phép: ma, na, la. 8. Cảnh cứu: **ghép b + a = "ba"** → bong bóng vỡ, ba: "Ba đây!", mẹ: "Mẹ đây!". 9. Ôn. 10. Album.

### Chương 3 – Canterlot (quái: phù thuỷ + pháp sư, tay sai của Nữ hoàng)
1. Cảnh mở: thành phố lâu đài trắng mái vàng, ông bà bị nhốt trên tháp. 2. Săn sao A: g, k, r.
3. Ghép phép có dấu: cá, bò. 4. Cảnh giữa. 5. Săn sao B: p, q, s, t. 6. Cầu gãy: v, x.
7. Ghép phép: mẹ, vẽ, tô. 8. Cảnh cứu: **ghép "bà"** → bà: "Bà đây!", ông: "Ông đây!", bà kéo mặt trời lên. 9. Ôn. 10. Album.

### Chương 4 – Trận Canterlot
1. Cảnh mở (~20 s): trời tối, Nữ hoàng hạ xuống cùng đội quân bóng tối 15 con. Đối diện: Twilight, cả nhà, mèo, bạn đã cứu.
   Camera lượn từ trên cao xuống quét hai phe.
2. 5 vòng Hài Hoà (mỗi vòng 1 bài): (1) tìm chữ — ông Cương đá hậu; (2) tìm chữ — các bạn + mèo cùng xông lên;
   (3) đọc "ba" — ba bay vệt cầu vồng; (4) đọc "mẹ" — mẹ nổ ngọc; (5) đọc "bà" — bà chiếu tia nắng.
   Đúng: 3 quái được thanh tẩy, đổi phe; 1 trong 5 ngọc Hài Hoà quanh Twilight sáng. Sai: Nữ hoàng cười, bóng tối tiến lên chút. Không thua.
3. Cao trào (~30 s, chỉ sau bài cuối): 5 ngọc xoay quanh Twilight, Twilight phát sáng bay lên dang cánh, **ảnh thật của Nhím**
   loé trong ánh sáng, Twilight niệm "Bằng phép màu của tình bạn và gia đình…", tia cầu vồng bắn trúng, màn trắng.
4. Kết: ánh sáng tan, Nữ hoàng hoá bác Hanh (Luna), bình minh, cả nhà ôm nhau, ảnh lớn "Nhím đã cứu cả nhà!", pháo hoa,
   rồi cả cuốn album "Cuốn sách phiêu lưu của Nhím".

## 4. Học trong cảnh (không có bảng quiz bật lên)

- **Săn sao chữ**: sao chữ 3D to, phát sáng, đứng trong cảnh. Giọng: "Nhím ơi, tìm chữ ô nào!". Bé chạm đất / chạm sao
  cho Twilight chạy tới chạm vào. Đúng: sao bay vào bảng chữ cái, hiện đồ vật của chữ ("ô… cái ô"). Sai: sao lắc nhẹ, đọc lại tên chữ cần tìm, không phạt.
- **Cổng khoá**: ổ khoá to có chữ, 3 sao bay vòng quanh, chạm đúng sao → khoá mở. **Cầu gãy**: thiếu ván, ván có chữ bay lơ lửng, chạm đúng → ván lắp vào.
- **Ghép bằng phép**: chạm sao phụ âm → Twilight bắn, sao bay vào ô trái; chạm sao vần → ô phải; (chương 3) chạm dấu thanh.
  Hai sao nhập thành tiếng, đọc đánh vần theo token, chữ đang đọc sáng lên. Đồ vật/người hiện ra ("Ba đây!").
- **Đồ vật cho mỗi chữ** (emoji, hiện cạnh chữ khi nhặt + trên bảng chữ): a áo 👕 · ă trăng 🌙 · â ấm 🫖 · b bò 🐄 · c cá 🐟 ·
  d dê 🐐 · đ đèn 💡 · e kem 🍦 · ê ếch 🐸 · g gà 🐔 · h hoa 🌸 · i mì 🍜 · k kẹo 🍬 · l lá 🍃 · m mèo 🐈 · n nơ 🎀 · o ong 🐝 ·
  ô cái ô ☂️ · ơ ớt 🌶️ · p pin 🔋 · q quà 🎁 · r rùa 🐢 · s sao ⭐ · t táo 🍎 · u ủng 👢 · ư sư tử 🦁 · v vịt 🦆 · x xe 🚗 · y y tá 👩‍⚕️.
- **Bảng chữ cái** (nút 🔤 trên HUD + cuối chương): 29 ô đúng thứ tự `a ă â b c d đ e ê g h i k l m n o ô ơ p q r s t u ư v x y`.
  Ô chưa có: mờ + ❓. Ô có: sáng, chạm đọc "bờ… bò".
- **Spike ôn** cuối chương: 2–3 câu "Nhím ơi, chữ ô đâu?", CHỈ dùng chữ đã mở; chữ nhiễu ưu tiên cặp dễ lẫn khi cả hai đã mở
  (b–d, m–n, o–ô–ơ, u–ư, a–ă–â, e–ê, p–q).
- **Ôn cách quãng**: chữ trả lời sai được ghi `weak` → ưu tiên quay lại ở bài ôn / săn sao / trận cuối của chương sau.

### Tên âm chữ cái (SGK Tiếng Việt 1, GDPT 2018 – gọi theo âm)
a · ă = "á" · â = "ớ" · b bờ · c cờ · d dờ · đ đờ · e · ê · g gờ · h hờ · i = "i ngắn" · k = "ca" · l lờ · m mờ · n nờ · o · ô · ơ ·
p pờ · **q = "quờ"** · r rờ · s sờ · t tờ · u · ư · v vờ · x xờ · y = "i dài".
Về q: bảng chữ cái gọi tên chữ là "cu" (quy), nhưng SGK lớp 1 dạy q luôn đi với u thành "qu", đọc âm "quờ". Game học theo
âm (bờ, cờ…) nên dùng "quờ" cho đồng bộ.

### Đánh vần (bộ sinh `src/spell.ts`, port từ 03-princess, sửa vần tắc)
- Vần 1 chữ: âm đầu – vần – tiếng không dấu – dấu – tiếng: bờ – o – bo – huyền – bò.
- Vần 2+ chữ: đánh vần vần trước (e – o – eo), rồi tiếng (mờ – eo – meo), rồi dấu (huyền – mèo).
- **Vần kết thúc c/ch/p/t đọc với thanh sắc** (ít, óc, ác, ếch, ấp), tiếng không dấu cũng đọc sắc (vít), rồi mới thêm dấu:
  vịt = i – tờ – ít, vờ – ít – vít – nặng – vịt. Tiếng mang dấu sắc thì dừng ở tiếng sắc (hát = a – tờ – át, hờ – át – hát).
- Nguyên âm i gọi "i", y gọi "i" trong chuỗi đánh vần; "i ngắn / i dài" chỉ dùng khi gọi TÊN chữ.
- Bảng vàng `scripts/check-spelling.mjs` (ba, bà, cá, bò, mẹ, vẽ, tô, mèo, vịt, học, hát, ếch, ông, quả, gió…) chạy đầu `pnpm build`, lệch 1 token là build đỏ.

## 5. Giọng đọc: Microsoft Hoài My (edge-tts)
- `scripts/.venv` (python venv, `pip install edge-tts`), `pnpm audio` = `scripts/audio-lines.mjs` (gom mọi câu từ `src/lines.ts`,
  `src/letters.ts`, `src/spell.ts` → `scripts/audio/_all.gen.txt`) + `scripts/gen-audio.py` (sinh file còn thiếu).
- Giọng: `vi-VN-HoaiMyNeural` rate −10%. Người kể chuyện: Hoài My −18%, pitch −2 Hz (chậm, ấm). Nữ hoàng Bóng Đêm: Hoài My
  pitch −18 Hz rate −12%. Bác Hanh/bà Tuyết: Hoài My trầm nhẹ. Spike + ba Cường + ông Cương: `vi-VN-NamMinhNeural`
  (Spike pitch +28 Hz cho giống rồng con; ông trầm, chậm) — giọng nữ nói "Ba đây!" nghe sai với bé. Đổi 1 dòng trong `VOICES` là đổi.
- Bẫy: câu ngắn đôi khi trả về rỗng → thử lại 5 lần, vẫn rỗng thì dừng và báo lỗi. Cắt lặng đầu/cuối theo ngưỡng (−42 dBFS),
  chừa 25 ms đầu / 60 ms cuối để chuỗi đánh vần không hở.
- Mp3 → wav (`afconvert`) → cắt bằng Python (module `wave`) → m4a AAC 64 kbps (`afconvert`). Không cần ffmpeg.
- **Ngân hàng câu** (`src/lines.ts`): đúng, sai, nhắc khi đứng yên, cứu được, tìm chữ (8 mẫu × 29 chữ), thanh tẩy quái…
  mỗi ngân hàng 8–15 câu, chọn ngẫu nhiên không lặp 3 câu gần nhất. Nhắc khi đứng yên: lần đầu sau 20 s, rồi 40 s, 80 s.

## 6. Quái vật
Nguồn `assets-raw/polypizza/characters/`. LOẠI: zombie, mọi skeleton, ghost_skull, orc. Ứng viên: slime_enemy_quaternius,
slime_quaternius, slime_enemy_j_toastie, ghost_quaternius, dragon_quaternius, dragon_evolved_quaternius, goblin_quaternius,
blue_demon_quaternius, animated_wizard_quaternius, witch_quaternius. Render từng con trong viewer, NHÌN rồi chọn (ghi ở §11).
- Bị nhập: tô tím đậm (lerp màu vật liệu về #3b2466 + emissive tím), 2 mắt phát sáng, khói bóng tối bốc lên (hạt).
- Thanh tẩy: nổ sao, trả màu thật, chơi clip vui (Yes / Dance / Wave / Flying_Idle), đứng cổ vũ phe mình.
- Copy vào `public/models/monsters/`, ghi giấy phép ở CREDITS.md (CC-BY 3.0 phải ghi công).

## 7. Ảnh thật của Nhím
- `public/photos/nhim-1.jpg` (chân dung hoa hướng dương: khung tranh mở đầu, huy hiệu HUD, ảnh lớn kết), `nhim-2.jpg` (album).
- **Gitignore** (ảnh thật của bé). Plugin Vite quét `public/photos/` → module ảo `virtual:nhim-photos`. Thiếu ảnh → vẽ chân dung Twilight.
  Ô tuỳ chọn: `with-cats.jpg`, `with-ba-me.jpg`, `with-ong-ba.jpg`, `with-bac-hanh.jpg`, `ca-nha.jpg`; file lạ khác vẫn vào album.
- Ảnh luôn đi qua canvas trước khi dùng (bỏ EXIF, cắt, thu ≤ 800 px).
- Album sau mỗi chương: trang có khung Equestria (viền cầu vồng + sao), ảnh slot tương ứng (không có thì nhim-2 / nhim-1),
  người kể: "Nhím và ba mẹ lại ở bên nhau rồi!". Kết game: cả cuốn "Cuốn sách phiêu lưu của Nhím".

## 8. Điều khiển (iPad ngang)
- Chạm đất: Twilight chạy tới (giữ ngón tay kéo thì đi theo ngón). Chạm sao chữ / ván / ổ khoá: chọn. Nút nhảy tím to góc phải.
- HUD: huy hiệu ảnh Nhím (góc trái), tên chương, nút 🔤 bảng chữ (đếm n/29), 🏠, ⏩ khi đang xem cảnh.
- Mac: phím mũi tên + Space vẫn chạy.
- Lần chạm đầu mở khoá tiếng (iPad Safari: `touchend`/`click`, `audioSession.type = 'playback'`).
- Màn dọc: lớp phủ "xoay ngang iPad nhé".

## 9. Hiệu năng (iPad)
- Ngân sách: ≤ 300k tam giác trên màn, ≤ 150 draw call ở trận cuối (game cũ ~680k).
- Đo bằng `renderer.info` (HUD debug `?perf=1`, `window.__game.perf()`).
- Chỉ người nhà dùng model đủ; bạn pony dùng bản `lod/`; Celestia / Nightmare Moon / Luna giảm lưới mạnh cho trận cuối;
  quái Quaternius nhẹ (1–7k). Texture ≤ 1024 px (gltf-transform resize). Pixel ratio ≤ 1.5, bóng thật chỉ cho Twilight.
- Hàng bạn đi theo: tối đa 12, đi **hàng đôi**.

## 10. Kỹ thuật / file
- `src/main.ts` khởi động + vòng lặp + input; `src/story.ts` điều phối chương (beat list), lưu tiến độ; `src/chapters.ts` dữ liệu 4 chương;
  `src/activities.ts` săn sao / khoá / cầu / ghép; `src/letterstar.ts` sao chữ 3D; `src/cine.ts` cảnh (camera, phụ đề, ⏩);
  `src/prologue.ts` thư viện; `src/finale.ts` trận cuối; `src/monster.ts` quái GLB bị nhập / thanh tẩy; `src/board.ts` bảng chữ + ôn;
  `src/album.ts` album ảnh; `src/photos.ts` ảnh Nhím; `src/letters.ts` 29 chữ (tên âm, đồ vật, cặp dễ lẫn); `src/spell.ts` đánh vần;
  `src/lines.ts` mọi câu thoại + ngân hàng; `src/voice.ts` chọn câu không lặp.
- Tiến độ: localStorage `nhim-story-v1` = { unlocked, done, beat (chương + bước để chơi tiếp), letters, weak, friends, prologue }.
  Có tham số debug thì không ghi đè.
- Debug URL: `?chapter=2[&beat=5]`, `?finale=1&round=5`, `?cine=prologue|c1_intro|…|climax|ending`, `?unlock=all`, `?reset=1`,
  `?auto=1&mute=1`, `?album=1..4|all`, `?board=1`, `?review=1`, `?perf=1`. `window.__game.answer(true|false)` để test tự động.
- Cổng dev **5185**. Commit nhỏ, tiếng Anh, Conventional, không trailer. Không push.

## 11. Quyết định sau khi làm (02/10/2026)

**Quái** (đã render từng con trong viewer và nhìn):
- Chương 1 rừng: `slime_enemy_j_toastie` (slime tròn dễ thương nhất), `slime_quaternius`, `slime_enemy_quaternius` (có sừng, nhảy
  Dance), `ghost_quaternius` (màu thật tím đen + móng → khi thanh tẩy đổi sang ma trắng tím nhạt cho hiền).
- Chương 2 làng: `goblin_quaternius` (khối vuông ngộ nghĩnh), `dragon_quaternius` (nâu đỏ tối → thanh tẩy đổi xanh bạc hà),
  `dragon_evolved_quaternius`.
- Chương 3 lâu đài: `animated_wizard_quaternius`, `witch_quaternius` (tay sai của Nữ hoàng).
- Trận cuối: 10 con trộn slime / yêu tinh / ma / rồng nhỏ (2 con mỗi vòng; bỏ phù thuỷ vì 13 mesh = 13 draw call).
- Loại thêm `blue_demon_quaternius`: cầm gậy, trông hung.

**Đổi so với plan**: chương 2 săn sao A là c, d, đ và cổng khoá là **b** (nhiễu d) ngay trước khi ghép "ba" (để "ca" ở bài ghép
đầu dùng chữ c vừa học). Trận cuối 10 quái (đủ 10–16). Hàng đi theo lấy bạn mới nhất khi đầy 12.
Giọng ba Cường, ông Cương, bạn rồng nhỏ dùng Nam Minh (nam) — đổi 1 dòng `VOICES` nếu ba muốn Hoài My hết.
Hiệu ứng âm thanh tổng hợp bằng WebAudio (bỏ file .ogg cũ: Safari iPad cũ không giải mã Ogg).
Câu thần chú cao trào hiện phụ đề đáy màn (thẻ lời nói che mất ảnh Nhím).

**Hiệu năng đo headless** (Chrome trên Mac, 1180×820, `renderer.info`, tắt bóng đổ ở trận cuối):

| Cảnh | Tam giác | Draw call |
|---|---|---|
| Trận cuối, vòng ghép chữ (đủ 12 bạn + 7 người nhà/mèo/rồng + 10 quái + Nữ hoàng) | ~281k (tối đa 283k) | ~200 (tối đa ~230 khi có 3 sao chữ) |
| Chương 1 (săn sao) | ~160k | ~100 |
| Chương 3 cảnh cứu ông bà (hàng 12 + ông bà + 2 phù thuỷ) | ~266k | ~205 |

Tam giác đạt ngân sách 300k (game cũ 680k). Draw call trận cuối **chưa xuống 150**: phần lớn còn lại là 4 model rip có xương
(Nightmare Moon 26, Derpy 20, Celestia 18 draw call) — gộp được thì phải làm atlas texture, để sau nếu iPad thật bị giật.
Đã làm: giảm lưới Celestia 98k→25k, Nightmare Moon 143k→29k, Rarity/Rainbow/Applejack ~18k, Spike 8k; mây + đồi nền thành
InstancedMesh; ngọc InstancedMesh; props tĩnh gộp theo màu vật liệu; vẽ sẵn mắt + bảng màu cho 5 bạn rip Source
(`scripts/bake-friends.mjs`, 8–15 → 5–8 draw call/bạn); bạn ngựa nhỏ không có bóng tròn ở trận cuối; texture ≤ 1024 px.

# Cách chạy: Nhím và những ngôi sao chữ

Game web 3D (Vite + TypeScript + Three.js) cho Nhím (5 tuổi) học 29 chữ cái và ghép tiếng đầu tiên. Chơi trên **iPad ngang**
(chỉ chạm), mở từ Mac qua Wi-Fi. Không cần mạng khi chơi (giọng đọc đã sinh sẵn).

## Cần có

- Node.js 22.18 trở lên (`node -v`) — script kiểm tra đánh vần đọc thẳng file `.ts`.
- pnpm 9 trở lên: `corepack enable` (KHÔNG dùng npm).
- Chỉ khi muốn sinh lại giọng đọc: macOS (có sẵn `afconvert`) + Python 3 + mạng.

## Chạy lần đầu

```bash
cd 05-pony-story
pnpm install
pnpm dev          # http://localhost:5185
```

Chạm kỳ lân 🦄 giữa màn hình để bắt đầu (lần chạm đầu cũng mở khoá tiếng trên iPad).

## Chơi trên iPad

1. Mac và iPad cùng Wi-Fi. `pnpm dev` in dòng `Network: http://192.168.x.x:5185` → mở bằng Safari trên iPad.
2. Safari → Chia sẻ → **Thêm vào MH chính** để chạy toàn màn hình như app.
3. Xoay **ngang** iPad (màn dọc sẽ nhắc "xoay ngang máy nhé").
4. Không có tiếng: tắt chế độ im lặng, tăng âm lượng, chạm lại nút bắt đầu.
5. Muốn chạy bản build (nhẹ hơn): `pnpm build && pnpm preview` → `http://192.168.x.x:5185`.

## Cách chơi (cho ba mẹ biết để hướng dẫn)

- **Chạm xuống đất** chỗ nào thì Twilight chạy tới chỗ đó (giữ ngón tay kéo thì Twilight đi theo ngón). Nút tím to góc phải là **nhảy**,
  nút 🪽 bên cạnh là **bay** (~4 giây, tự hạ cánh; bấm lại để hạ sớm).
- Đường sao vàng lấp lánh chỉ chỗ cần tới. Tới nơi là bài học tự bắt đầu, không có chữ hướng dẫn, chỉ có giọng nói.
- **Săn sao chữ**: nghe "Nhím ơi, tìm chữ ô nào!" → cho Twilight chạy tới chạm ngôi sao đúng (hoặc chạm thẳng vào ngôi sao).
- **Cầu gãy / cổng khoá / ghép chữ**: chạm thẳng vào tấm ván / ngôi sao đúng.
- Sai không sao: ngôi sao lắc nhẹ, giọng đọc lại chữ cần tìm. Không có thua.
- Nút 🔤 trên cùng: **bảng chữ cái** của Nhím, chạm chữ đã có để nghe "bờ… bò". ⏩: bỏ qua đoạn phim. 🏠: về bản đồ (chơi tiếp đúng chỗ đang dở).
- 4 chương, mỗi chương ~10 phút, xong chương là về bản đồ (điểm dừng tự nhiên).

## Thêm ảnh của Nhím

Ảnh thật của bé **không đưa lên git** (`public/photos/` bị gitignore). Thả ảnh vào `public/photos/`:

| Tên file | Dùng ở |
|---|---|
| `nhim-1.jpg` | khung tranh mở đầu (ảnh hoá thành Twilight), huy hiệu "Nhím" góc màn hình, ảnh lớn "Nhím đã cứu cả nhà!", ánh sáng cao trào |
| `nhim-2.jpg` | album (khi chưa có ảnh riêng của chương) |
| `with-cats.jpg` | trang album chương 1 (Nhím với Mun, Rơm) |
| `with-ba-me.jpg` | trang album chương 2 |
| `with-ong-ba.jpg` | trang album chương 3 |
| `with-bac-hanh.jpg` | trang album chương 4 |
| `ca-nha.jpg` | trang cả nhà cuối album |
| tên bất kỳ khác | tự thêm vào cuối "Cuốn sách phiêu lưu của Nhím" |

Nhận `.jpg/.jpeg/.png/.webp`. Đang chạy `pnpm dev` thì thả ảnh vào là trang tự tải lại. Thiếu ảnh nào thì game vẽ chân dung
Twilight thay thế. Game luôn vẽ lại ảnh qua canvas (cắt, thu ≤ 800 px, bỏ EXIF) trước khi hiện.

Ảnh thật người nhà khác (tuỳ chọn, hiện thành huy hiệu nhỏ cạnh mặt pony trên thẻ lời nói): `public/family/<id>.jpg`, xem
`public/family/README.txt`.

## Sinh lại giọng đọc (Microsoft Hoài My)

Toàn bộ câu thoại nằm ở `src/lines.ts` (thoại, ngân hàng câu), `src/letters.ts` (tên chữ, đồ vật, câu tìm chữ), `src/words.ts`
(từ ghép). Sửa câu xong:

```bash
# lần đầu: tạo môi trường Python riêng cho edge-tts
python3 -m venv scripts/.venv
scripts/.venv/bin/pip install edge-tts

pnpm audio        # = node scripts/audio-lines.mjs (gom câu) + scripts/gen-audio.py (chỉ sinh câu mới/đổi)
scripts/.venv/bin/python scripts/gen-audio.py --force     # sinh lại tất cả (~600 câu, vài phút)
scripts/.venv/bin/python scripts/gen-audio.py c_b v_a     # sinh lại vài câu
```

- Giọng `vi-VN-HoaiMyNeural` tốc độ −10% (người kể chuyện −18%, trầm hơn chút). Bạn rồng nhỏ, ba Cường, ông Cương dùng giọng nam
  `vi-VN-NamMinhNeural`. Đổi giọng: bảng `VOICES` đầu `src/lines.ts`.
- Tên riêng tiếng Anh trong câu viết `{Rainbow Dash}`: đoạn đó đọc bằng giọng tiếng Anh (`en-US-JennyNeural` người lớn nữ,
  `en-US-AnaNeural` Nhím + các bạn ngựa nhỏ, `en-US-GuyNeural` ba / ông / Spike), rồi ghép với phần tiếng Việt.
  `node scripts/audio-lines.mjs` báo lỗi nếu phần tiếng Việt còn sót tên tiếng Anh.
- Câu ngắn đôi khi edge-tts trả về rỗng → script tự thử lại 5 lần, vẫn hỏng thì báo lỗi đỏ (chạy lại là được).
- Script tự cắt khoảng lặng đầu/cuối (để "bờ – a – ba" liền mạch) và xuất `public/audio/<key>.m4a`.
- Muốn thay bằng giọng ba mẹ: ghi âm rồi lưu đè file `.m4a` cùng tên.

## Lệnh khác

| Lệnh | Làm gì |
|---|---|
| `pnpm dev` | chạy bản dev (cổng 5185), tự tải lại khi sửa code |
| `pnpm build` | kiểm tra đánh vần (bảng vàng) + `tsc` + build ra `dist/` |
| `pnpm check:spelling` | chỉ chạy bảng vàng đánh vần (`scripts/check-spelling.mjs`) |
| `pnpm preview` | chạy thử bản `dist/` |
| `pnpm audio` | sinh giọng đọc còn thiếu |

## Link nhảy nhanh (ba mẹ / soát lỗi)

Có tham số trên URL thì game KHÔNG ghi đè tiến độ thật của bé.

- `/?chapter=2` vào thẳng chương 2 · `/?chapter=3&beat=7` nhảy tới cảnh cứu ông bà
- `/?finale=1` trận cuối · `/?finale=1&round=5` nhảy tới cao trào
- `/?cine=prologue` xem lại mở đầu · `/?cine=climax` · `/?cine=ending`
- `/?unlock=all` mở hết chương + đủ 29 chữ · `/?reset=1` xoá tiến độ
- `/?album=all` xem cả cuốn album · `/?board=1` bảng chữ · `/?review=1` bài ôn
- Thêm `&auto=1&mute=1` để tự chạy không tiếng (chụp màn hình), `&perf=1` để hiện fps / tam giác / draw call.
- Đầy đủ: mục debug trong `README.md`.

## Lưu ý

Nhân vật My Little Pony trong game là model 3D do fan làm (xem `CREDITS.md`), chỉ để chơi trong nhà, không dùng thương mại.

## Kiểm tra "không bao giờ đơ"

Cần `pnpm dev` đang chạy (cổng 5185) + playwright-core + chrome-headless-shell (đổi đường dẫn bằng biến `PW`, `CHROME`):

```bash
node scripts/test/play-human.mjs 1        # chương 1 chơi như người thật (click chuột, có tiếng, bay, chọn sai rồi đúng thật nhanh)
node scripts/test/play-human.mjs 2 0 0 60 # chương 2, không bay, không vội, đi lệch xuống dưới
```
Đứng yên một chỗ quá 25 s = đơ → báo lỗi + lưu ảnh `play-human-STUCK-ch<N>.png` vào thư mục tạm của máy.

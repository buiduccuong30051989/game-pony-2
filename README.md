# Nhím và phép thuật tình bạn (dự án 2: Three.js, đảo 3D)

Nhím (Hà An, 5 tuổi) là **Twilight Sparkle**. Nightmare Moon phủ màn đêm và nhốt cả nhà (đã hoá pony) vào bong bóng
pha lê mặt trăng trên 7 hòn đảo Equestria. Bé đi 4 hướng, gặp quái bóng đêm thì đánh vần hoặc đếm đúng để làm phép,
đủ 3 sao thì tới bong bóng làm Đại phép cứu người nhà. Người đã cứu đi theo Nhím ở các màn sau. Màn 7: đấu Nightmare Moon
bằng 5 ngọc Hài Hoà → cầu vồng → Nightmare Moon hoá lại công chúa Luna = bác Hanh, trời sáng, cả nhà ăn mừng.
Không có thua, sai chỉ bị quái/Nightmare Moon cười rồi gợi ý.

## Dàn nhân vật

| Người nhà | Vai | Ở đâu trong game |
|---|---|---|
| Nhím (Hà An) | Twilight Sparkle | nhân vật chính (màn 2: Twilight Equestria Girls) |
| Mèo Mun, mèo Rơm | mèo (emoji) | màn 1, 2 |
| Mẹ Yến | Rarity | màn 3 (rừng hoa) |
| Ba Cường | Rainbow Dash, nhanh và mạnh (hay bay vòng kéo cầu vồng) | màn 4 (đảo mây) |
| Ông Cương | Applejack | màn 5 (vườn táo) |
| Bà Tuyết | Công chúa Celestia: được cứu thì bay lên kéo mặt trời, trời sáng hẳn | màn 6 (đồi pha lê) |
| Bác Hanh | Công chúa Luna, bị bóng tối biến thành **Nightmare Moon** (trùm cuối, được cứu chứ không bị đánh) | màn 7 (lâu đài mặt trăng) |
| bạn bè | Spike (đi theo từ đầu, đứng yên 10 s thì nhắc đường) | |
| 18 bạn pony | mỗi quái giữ 1 bạn trong bong bóng nhỏ cạnh nó; trả lời đúng → bong bóng vỡ, bạn nhảy ra cảm ơn rồi vào hàng | màn 1–6, 3 bạn/màn |

**Bạn pony theo màn** (không bạn nào lặp lại; `LEVELS[].friends` trong `src/data.ts`): 1 Pinkie Pie, Fluttershy, Derpy ·
2 Minty, Babs Seed, Bạc Hà · 3 Starlight Glimmer, Sunset Shimmer, Cầu Vồng · 4 Zipp Storm, Pipp Petals, Surprise ·
5 Big Mac, Sunny, Izzy · 6 Công chúa Cadance, Shining Armor, Sunburst. Trận cuối không cứu thêm: TẤT CẢ bạn đã cứu đứng
sau người nhà cổ vũ (nhảy theo sóng mỗi viên ngọc, ngó Nightmare Moon).

**Hàng đi theo**: rắn bám vết chân Twilight (cách ~1.1–1.4), người nhà đứng đầu rồi tới bạn pony; tối đa 8 người (iPad),
bạn mới vào thì bạn đi lâu nhất "về nhà" (xoay, bụi sao). Lúc làm thử thách / cứu người cả hàng túm lại sau lưng Nhím;
không ai chồng lên nhau hay lên quái / bong bóng (đẩy tách mỗi khung). Bạn đã cứu lưu trong `haan-progress.friends`;
bản đồ có dải "🏡 Bạn pony đã cứu N/18" → chạm mở bộ sưu tập (ô chưa cứu là "?"), màn kết hiện mặt tất cả bạn.

Thẻ cổ vũ (mặt pony + tên + câu khen, có giọng đọc) hiện sau mỗi câu đúng và khi cứu được người. Ảnh thật người nhà
(tuỳ chọn): thả `public/family/<id>.jpg` (xem `public/family/README.txt`) → hiện thành huy hiệu tròn cạnh mặt pony.

## Chạy

```bash
pnpm install
pnpm dev        # http://localhost:5173 (thêm --host để mở trên iPad cùng Wi-Fi)
pnpm build      # ra dist/
pnpm audio      # sinh lại audio từ scripts/audio-manifest.txt (macOS, giọng Linh; đổi câu thì xoá m4a cũ không còn key)
pnpm exec tsc --noEmit
```

## Điều khiển

- iPad: D-pad ▲◀▶▼ giữ để đi, ⬆ (tím) nhảy, 🏠 về bản đồ (khi không đang làm thử thách). Mac: phím mũi tên, Space nhảy.
- Đi tới gần quái là tự dừng. Bảng thử thách: 🔊 nghe lại, 3 lựa chọn to. Sai lần 1 bỏ 1 đáp án sai; sai lần 2 đáp án đúng nhấp nháy.
- Đủ 3 ⭐ và tới bong bóng: bấm ✨ để làm Đại phép.
- Trận cuối không cần đi: chỉ trả lời 5 câu (bảng nằm sát đáy để thấy Nightmare Moon).

## Debug URL (chơi thử / chụp màn hình; có tham số debug thì KHÔNG ghi đè tiến độ thật trong localStorage)

| Tham số | Tác dụng |
|---|---|
| `?level=ong` hoặc `?level=5` | vào thẳng màn (id: `mun rom me ba ong ba_tuyet final`, hoặc số 1–7) sau khi chạm 🦄 |
| `&auto=1` | bỏ qua màn chạm 🦄 (trình duyệt phải cho phát tiếng không cần chạm, hoặc dùng kèm `mute`) |
| `&mute=1` | tắt tiếng, mỗi câu thoại coi như 150 ms → kịch bản chạy nhanh |
| `&done=all` hoặc `&done=mun,rom,me` | coi như đã cứu những màn đó (người đi theo, mặt trên bản đồ) |
| `&unlock=all` | mở hết nút bản đồ |
| `&stars=3` | vào màn với 3 sao sẵn (quái đã biến mất), đi tới bong bóng |
| `&rescue=1` | đặt Nhím cạnh bong bóng và tự làm Đại phép cứu (vd `?level=ba_tuyet&rescue=1&done=mun,rom,me,ba,ong&auto=1&mute=1` xem bà Tuyết kéo mặt trời) |
| `&battle=N` | màn cuối, N ngọc Hài Hoà đã sáng sẵn (0–5) |
| `&win=1` | màn cuối, nhảy thẳng tới cầu vồng + Nightmare Moon hoá Luna + ăn mừng |
| `&end=1` | mở thẳng màn kết "Nhím đã cứu cả nhà!" |
| `&friends=all` / `none` / `N` / `pinkie,derpy` | bạn pony đã cứu (không có thì suy từ `&done`: bạn của các màn đã xong) |

Ví dụ: `/?level=mun&friends=none&auto=1&mute=1` (màn 1 cứu 3 bạn), `/?level=ba&done=mun,rom,me&auto=1&mute=1` (8 người đi theo),
`/?unlock=all&done=mun,rom,me,ba&auto=1` (bản đồ + bộ sưu tập), `/?level=final&done=all&battle=2&auto=1&mute=1`, `/?level=final&done=all&win=1&auto=1`, `/?unlock=all&done=mun,rom,me,ba&auto=1`.
`window.__game` (phase, battlePhase, hero, followers, loose, monsters, progress, startLevel...) để công cụ test đọc trạng thái.

Trang dev khác: `/viewer.html?model=models/ponies/rarity.glb&yaw=0.7[&rig=1][&eyes=material_3,3f9a3a]` xem model (`rig=1` thử auto-rig + phi tại chỗ, ghi số tam giác); `/portrait.html?model=...&yaw=-0.2[&f=fx,fy,fz&r=0.2]`
chụp mặt pony (dataURL ở `window.__png`, `&eyes=` như viewer, `&zoom=0.75` lùi xa) → lưu thành `public/img/portraits/<tên>.png` (người nhà + 18 bạn).

## Cấu trúc

```
index.html        UI DOM đè lên canvas: HUD sao / 5 ngọc Hài Hoà, D-pad, 🏠, bảng thử thách, thẻ cổ vũ, bản đồ, màn kết, chớp sáng
src/main.ts       điều phối: bản đồ → màn → đi/nhặt ngọc → quái → thử thách → phép → bong bóng → cứu; hàng người đi theo; Spike nhắc; debug URL; lưu tiến độ
src/battle.ts     màn cuối: Nightmare Moon + lớp bóng tối nứt dần (canvas), 5 ngọc Hài Hoà, tia hài hoà, cầu vồng, hoá Luna, trời sáng, ăn mừng
src/actors.ts     Actor cho người nhà/bạn: pony auto-rig, công chúa bay (vỗ cánh), Spike, mèo emoji; đi theo vết chân có trễ, nhảy, quay ra camera, ngó nghiêng, ba Cường bay vòng cầu vồng; bóng tròn mờ dưới chân
src/family.ts     thẻ lời nói / cổ vũ (mặt pony chụp sẵn + huy hiệu ảnh thật), cheer ngẫu nhiên, cả nhà lần lượt khen
src/world.ts      đảo + props theo chủ đề màn (hoa, táo, mây, pha lê), ngày/đêm (setNight 0..1: trời, nước, đèn, trăng, sao, mặt trời, mây), bướm, chim, đom đóm, cỏ hoa đung đưa, lâu đài trăng, bong bóng pha lê, camera
src/hero.ts       Twilight: đi 4 hướng, nhảy, nhún; đứng yên thì thở, ngó quanh, phẩy đuôi, cúi ngửi, quay ra camera, nhảy cẫng
src/rig.ts        auto-rig ngựa không xương (11 xương: thân, 4 chân × 2, đầu, đuôi) + điều khiển nhìn/đuôi; người (dò xương); công chúa bay (xương sẵn: vỗ cánh, đung chân, vẫy đuôi)
src/monster.ts    quái tròn, cười khi sai, tan thành bươm bướm; giữ 1 bạn pony trong bong bóng nhỏ cạnh mình (vỡ khi đúng)
src/eyes.ts       vẽ mống mắt + con ngươi (vertex color) cho model rip từ Source có nhãn cầu trắng trơn
src/magic.ts      hạt 1 Points + shader; đêm cộng màu, ngày trộn thường (không loá trên nền sáng)
src/challenge.ts  A1 nghe – chọn hình (đánh vần GDPT 2018 với thẻ chữ), B1 đếm ngọc – chọn số
src/data.ts       palette, 16 từ + token đánh vần, CAST (cả nhà + bạn), 7 màn, 5 ngọc Hài Hoà
src/ui.ts, src/audio.ts, src/tween.ts
vite.config.ts    plugin quét public/family/ → module ảo 'virtual:family-photos'
scripts/          gen-audio.sh + audio-manifest.txt (~180 clip)
public/models/    twilight_static, twilight (EG), ponies/*.glb, friends/*.glb (+ friends/lod/ cho trận cuối) — xem CREDITS.md, props Kenney CC0
```

## Hiệu năng (iPad)

Người đi theo không đổ bóng thật (dùng bóng tròn mờ), pixel ratio tối đa 1.5. Trận cuối ~570k tam giác/khung
(Nightmare Moon 143k + Celestia 98k là 2 model nặng nhất; gltf-transform simplify không giảm thêm được vì lưới nhiều đường nối UV).
Model Celestia/Nightmare Moon/Luna chỉ tải khi vào màn 6–7. Bạn pony tải theo màn (3 bạn trong bong bóng + bạn đang đi
theo) và `World.release()` giải phóng lưới/texture khi rời màn; mỗi bạn 3–30k tam giác sau optimize. Pony có xương sẵn
(Starlight, Sunset, Derpy, Sunny, Izzy, Pipp, Zipp) không auto-rig được → nhún nhảy bằng pivot như Spike. Đo headless
1180×820: màn 4 với 8 người đi theo ~325k tam giác/khung; trận cuối cả 18 bạn (bản lod/) ~680k tam giác, ~640 draw call.

## Assets và giấy phép

Xem `CREDITS.md`. Nhân vật là IP Hasbro: **chỉ chơi trong nhà, không publish, không bán**.

## Đã biết / chưa làm

- Chân ngựa vung bằng heuristic (`src/rig.ts`), không có xương tai nên chưa vẫy tai; Luna có tên xương hỏng (mã hoá Nhật) nên chỉ bay nhún, không vỗ cánh.
- Chưa có ảnh thật người nhà, giọng ba mẹ (thay file m4a cùng tên là xong). Chưa test trên iPad thật.

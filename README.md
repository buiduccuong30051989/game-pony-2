# Hà An và phép thuật Twilight (dự án 2: Three.js side-scroller 3D)

Bé điều khiển Twilight Sparkle (màn 1: ngựa, màn 2: người) đi 4 hướng trên một hòn đảo rộng giữa biển, gặp quái vật thì đánh vần hoặc đếm đúng để làm phép, đủ 3 sao thì tới bong bóng cứu mèo Mun / mèo Rơm. Có "đường sao" lấp lánh dẫn tới quái gần nhất để bé không lạc. Plan chi tiết: `PLAN.md`.

## Chạy

```bash
pnpm install
pnpm dev        # http://localhost:5173 (thêm --host để mở trên iPad cùng Wi-Fi)
pnpm build      # ra dist/
pnpm audio      # sinh lại audio từ scripts/audio-manifest.txt (macOS, giọng Linh)
```

Trang dev xem model: `/viewer.html?model=models/twilight_static/scene.gltf&yaw=0.7` (thêm `&anim=0` để chạy animation nếu có).

## Điều khiển

- iPad: D-pad ▲◀▶▼ giữ để đi, ⬆ (tím) nhảy. Mac: phím mũi tên đi, Space nhảy.
- Đi tới gần quái là tự dừng. Bảng thử thách hiện: 🔊 nghe lại, 3 lựa chọn to.
- Sai lần 1: bỏ 1 đáp án sai, đọc lại. Sai lần 2: đáp án đúng nhấp nháy. Không bao giờ kẹt.
- Đi tới mép đảo thì dừng lại, không rơi.
- Đủ 3 ⭐ và tới bong bóng: bấm ✨ để làm Đại phép, cứu mèo, mở màn tiếp.

## Cấu trúc

```
index.html        UI DOM đè lên canvas: HUD sao/ngọc, 3 nút điều khiển, bảng thử thách, bản đồ, pháo giấy
src/main.ts       điều phối: bản đồ → màn → đi/nhảy/nhặt ngọc → quái → thử thách → phép → bong bóng → cứu; lưu tiến độ localStorage
src/world.ts      Three.js: đảo ellipse (trụ + viền + bóng dưới nước), camera bám sau lưng, trời gradient, đồi xa, mây, biển, props Kenney rải theo seed (recolor + metalness 0), ngọc, bong bóng, emoji sprite
src/hero.ts       nhân vật: load GLB, đi 4 hướng + xoay mượt, nhảy, nhún nhẹ, ăn mừng, tư thế làm phép; model người: giấu đầu thừa
src/rig.ts        cho model "cứng" đi được: ngựa (không xương) → tự gắn 11 xương (thân, 4 chân × hông+gối, đầu, đuôi) theo hình học (móng → 4 cụm → trọng số da, bờm/đuôi theo mesh tóc) rồi chạy phi nước đại có gập gối, nhún thân, gật đầu, phất đuôi; người (xương mất tên, có xương D trùng vị trí) → dò đùi/gối/tay theo vị trí rồi vung quanh trục ngang
src/monster.ts    quái tròn (cầu + mắt + má + sừng), cười khi sai, tan thành bươm bướm khi bị phép
src/magic.ts      hệ hạt 1 Points + shader riêng: burst, ring, twinkle, beam theo đường cong
src/challenge.ts  mini-game: A1 nghe – chọn hình (đánh vần chuẩn lớp 1 với thẻ chữ), B1 đếm ngọc – chọn số
src/ui.ts         helper DOM
src/data.ts       palette, 10 từ + token đánh vần, 2 màn, thứ tự cứu 6 người
src/audio.ts, src/tween.ts   dùng lại từ game 1
scripts/          gen-audio.sh + audio-manifest.txt (92 clip)
public/models/    twilight_static (Sketchfab, CC BY), twilight (Equestria Girls, Sketchfab, CC BY), haan.glb (Quaternius CC0, dự phòng), props Kenney CC0
```

## Assets và giấy phép

- Twilight Sparkle (ngựa) và Twilight (người): model fan-made trên Sketchfab, CC BY 4.0. Nhân vật là IP Hasbro: **chỉ chơi trong nhà, không publish, không bán**. Ghi công tác giả trong `assets-raw/sketchfab/*/license.txt`.
- Kenney Nature Kit, UI/Impact audio: CC0. Quaternius Animated Woman: CC0.
- Emoji: font hệ thống (Apple Color Emoji).
- Giọng đọc: giọng Linh của macOS (`say`), dùng cá nhân.

## Đã biết / chưa làm

- Chân ngựa/người vung bằng heuristic (`src/rig.ts`), chưa phải animation thật; biên độ chỉnh ở `amp`.
- Chưa có: biến hình Hà An → Twilight từng bộ phận (đang chờ Adam chốt lại sau khi đổi sang "màn 1 ngựa, màn 2 người"), màn 3–6, mini-game A2/B2/B3, ảnh thật người thân, giọng ba mẹ.
- Chưa test trên iPad thật.

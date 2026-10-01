# Plan game 2 (bản 2): "Hà An và phép thuật Twilight" (Three.js 3D side-scroller)

Trạng thái: PLAN bản 2 sau góp ý Adam 29/09/2026, chờ duyệt + 1 việc Adam tự tải model.

> **Cập nhật 01/10/2026 (bản 3, đã làm):** Adam chốt hướng khác — không biến hình Hà An từng bộ phận nữa. Nhím = Twilight
> từ đầu; cả nhà hoá pony (mẹ Yến = Rarity, ba Cường = Rainbow Dash, ông Cương = Applejack, bà Tuyết = Celestia,
> bác Hanh = Luna bị biến thành Nightmare Moon). 7 màn: Mun, Rơm, mẹ, ba, ông, bà (kéo mặt trời lên), trận cuối
> Nightmare Moon với 5 ngọc Hài Hoà. Xem README.md (dàn nhân vật, debug URL) và CREDITS.md. Phần dưới là plan bản 2, giữ để tham khảo.

## Thay đổi so với bản 1

- Bỏ pixel 2D Phaser. Adam muốn pony 3D đẹp nét → **Three.js 3D**, tái dùng engine game 1 (scene, audio, tween, loader GLB).
- Nhân vật chính là **Hà An** (bé gái), không phải Twilight từ đầu. Mỗi lần thắng quái → **biến thêm 1 bộ phận thành Twilight**. Cuối hành trình = Twilight hoàn chỉnh.
- Người cần cứu: **ba, mẹ, ông, bà, mèo Mun, mèo Rơm** (6 màn).
- Hiệu ứng phép thuật là điểm nhấn, phải đẹp.

## 1 câu

Hà An đi và nhảy qua vùng đất bị Mây Đen phủ, gặp quái thì đánh vần hoặc đếm đúng để làm phép; mỗi lần làm phép thành công thì bé biến thêm một phần thành Twilight Sparkle, và cuối mỗi màn giải cứu một người thân khỏi bong bóng.

## Luật vàng (giữ nguyên)

Chỉ tap 3 nút to ◀ ▶ ⬆ (Mac: phím mũi tên + Space), mọi hướng dẫn bằng tiếng, không chết, không game over, sai không phạt, 1 màn 3–5 phút.

## Biến hình Hà An → Twilight (mỗi lần thắng quái = 1 bước)

| Bước | Thay đổi | Cách làm kỹ thuật |
|---|---|---|
| 0 | Hà An: tóc đen, váy hồng | model Quaternius Animated Woman (CC0) thu tỉ lệ chibi (đầu to), đổi màu |
| 1 | Tóc chuyển tím Twilight | đổi màu material tóc + bụi sao |
| 2 | Sọc hồng trên tóc | thêm mảng màu |
| 3 | Mọc sừng kỳ lân | gắn hình nón tím vào xương Head, mọc dần bằng tween scale |
| 4 | Tai pony | 2 tai gắn Head |
| 5 | Đuôi tím sọc hồng | gắn xương Hips, đung đưa theo bước chân |
| 6 | Cánh alicorn | gắn Spine2, vỗ nhẹ khi nhảy |
| 7 | Dấu ấn ngôi sao (cutie mark) trên váy | decal ngôi sao tím |
| 8 | Sáng loà → **Twilight hoàn chỉnh** | swap sang model Twilight 3D + nổ sao |

Bản 1 có 2 màn × 3 quái = 6 bước; màn 3 và 4 hoàn tất 8 bước. Sau khi thành Twilight thì phép mạnh hơn (tia to hơn, cầu vồng), và Twilight vẫn đi tiếp cứu người còn lại.

## Cốt truyện và 6 màn

Mây Đen nhốt 6 thành viên vào bong bóng ở 6 vùng: 1 mèo Mun (vườn nhà) → 2 mèo Rơm (đồng cỏ) → 3 mẹ (rừng hoa) → 4 ba (bờ suối) → 5 bà (đồi pha lê) → 6 ông (lâu đài mây). Cứu xong 1 người thì trời sáng thêm 1 nấc, người đó ra ôm và nói "Cảm ơn con!" (thu giọng thật thì tốt nhất).

## Vòng chơi 1 màn

1. Bản đồ 6 nút, mở dần.
2. Đi ngang trong cảnh 3D (camera theo nhân vật, nhìn hơi chéo như diorama game 1): cỏ, cây, hoa Kenney, nền pastel tươi như game 1.
3. Trên đường: hố nhỏ để nhảy (hụt thì tự bay lên), ngọc đi qua nhặt, **3 quái** chặn đường.
4. Gặp quái → dừng, thử thách phép thuật (mini-game). Đúng → phép + biến hình 1 bước + 1 mảnh sao.
5. Cuối màn: 3 mảnh sao → Đại phép → bong bóng nổ → người thân chạy ra ôm.

## Thử thách phép thuật (mini-game, tap-only, có tiếng)

- A1 Nghe – chọn hình: "Con nào là con gà?" → 3 hình to.
- A2 Điền chữ thiếu: hình + `g _ à` → 3 nút chữ. Đúng thì đọc đánh vần chuẩn lớp 1 (gờ – a – ga – huyền – gà).
- B1 Đếm ngọc quái giữ (1–5 rồi 6–10) → chạm số.
- B2 Cộng trong 5 bằng hình. B3 Nhiều hơn / ít hơn.
- Mỗi màn 2 đánh vần + 1 toán. Sai lần 1: bỏ 1 đáp án sai, đọc lại. Sai lần 2: đáp án đúng nhấp nháy.

## Hiệu ứng phép thuật (điểm nhấn)

- Sừng phát sáng (glow sprite), tia phép tím xoắn ốc bay tới quái (đường cong + hạt sao), chạm quái thì nổ thành bươm bướm/hoa bay lên, quái tan thành lấp lánh.
- Biến hình: vòng sáng tím bao quanh Hà An, bụi sao xoáy, bộ phận mới mọc ra bằng tween scale, "ting" chuông.
- Đại phép: cầu vồng vẽ dần trên trời, bong bóng rung rồi nổ thành trái tim.
- Kỹ thuật: Three.js Points / InstancedMesh + texture hạt từ Kenney Particle Pack (CC0).

## Assets

| Thứ | Nguồn | Giấy phép | Trạng thái |
|---|---|---|---|
| Twilight Sparkle 3D | Sketchfab "Twilight Sparkle" của royalroyaltymodel112 (44k tam giác, 3 texture) hoặc "G4 Twilight Sparkle" của anderlenolan (45k, 1 texture) | CC BY 4.0 (fan-made, IP Hasbro → chỉ chơi trong nhà) | **Adam tự tải** (Sketchfab cần login): mở link → Download → glTF → bỏ zip vào `assets-raw/sketchfab/`. Model KHÔNG có rig → chuyển động kiểu nhún-nhảy (hop-trot) + nghiêng người + lắc bờm bằng code; nếu file tách phần chân thì cho chân vung. |
| Hà An | Quaternius "Animated Woman" (poly.pizza) | CC0 | ĐÃ TẢI `assets-raw/polypizza/animated_woman.glb`: Idle / Walking / Running / Jump / Jump2 / PickUp, xương Mixamo (Head, Spine2, Hips) để gắn sừng, tai, cánh, đuôi |
| Quái vật | dựng 3D từ khối cầu tròn + mắt to (cùng chất với cảnh), tham khảo Kenney Monster Builder | CC0 | |
| Cảnh | Kenney Nature Kit + Food Kit (đã có từ game 1) | CC0 | |
| Hạt / lấp lánh | Kenney Particle Pack | CC0 | tải khi code |
| Người thân trong bong bóng | ảnh thật ba, mẹ, ông, bà, Mun, Rơm (Adam đưa 6 ảnh) hoặc nhân vật khối | | đề xuất ảnh thật |
| Âm thanh | giọng Linh sinh sẵn + thu giọng ba mẹ ("Cảm ơn con!", "Hà An giỏi quá!") | | |

Đã tra Sketchfab API 29/09: không có Twilight nào vừa nhẹ vừa có animation; bản có animation là 340k tam giác (quá nặng cho iPad). Rainbow Dash của LunaEagle (11k, 1 animation) là pony rigged nhẹ duy nhất, để dự phòng nếu muốn có bạn đồng hành.

Link tải Twilight:
- https://sketchfab.com/3d-models/twilight-sparkle-5f56454bf21446939962cb5a3de55fc5
- https://sketchfab.com/3d-models/g4-twilight-sparkle-ca2f288901cf4fd99f4787d8761eb39b

## Stack

Vite 8 + TypeScript + Three.js r186. Không physics engine: nhân vật đi trên đường 1 chiều, nhảy parabol, hố là khoảng x. Tái dùng `audio.ts`, `tween.ts`, loader + recolor từ game 1.

## Phạm vi bản 1

- 2 màn: mèo Mun, mèo Rơm. 1 cảnh vườn nhà.
- Đi, nhảy, nhặt ngọc, 3 quái/màn, mini-game A1 + B1, 6 bước biến hình đầu, bong bóng cuối màn, bản đồ 6 nút.
- Twilight hoàn chỉnh (bước 8) chỉ hiện khi Adam đã tải model; chưa có thì dừng ở bước 6.

## Adam cần làm

1. Tải 1 model Twilight từ Sketchfab (2 phút, tài khoản miễn phí) và thả vào `02-pony-three/assets-raw/sketchfab/`.
2. Gật plan bản 2 (hoặc sửa bước biến hình / thứ tự cứu người).
3. Khi nào rảnh: 6 ảnh người thân + thu 3–5 câu giọng ba mẹ.

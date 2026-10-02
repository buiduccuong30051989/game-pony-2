# Ghi công tài nguyên

Nhân vật My Little Pony là IP của Hasbro; các model pony là fan-made trên Sketchfab (CC BY 4.0).
**Chỉ chơi trong nhà, không publish, không bán.**

## Pony (Sketchfab, CC BY 4.0)

| File | Vai trong game | Tên model | Tác giả | Link |
|---|---|---|---|---|
| models/twilight_static/ | Nhím = Twilight Sparkle | Twilight Sparkle | royalroyaltymodel112 | https://sketchfab.com/3d-models/twilight-sparkle-5f56454bf21446939962cb5a3de55fc5 |
| models/ponies/rarity.glb | Mẹ Yến = Rarity | Rarity | royalroyaltymodel112 | https://sketchfab.com/3d-models/rarity-243600fe8ad04ff382162b54640a323b |
| models/ponies/rainbow.glb | Ba Cường = Rainbow Dash | Rainbowdash | royalroyaltymodel112 | https://sketchfab.com/3d-models/rainbowdash-ff9edb048bda425eb154fce4f30ed1e6 |
| models/ponies/applejack.glb | Ông Cương = Applejack | Applejack | royalroyaltymodel112 | https://sketchfab.com/3d-models/applejack-9ca45b45ddd440bf8a7afbd6077d60b0 |
| models/ponies/spike.glb | Spike (bạn rồng nhỏ) | Spike | royalroyaltymodel112 | https://sketchfab.com/3d-models/spike-6c09aede26044e5e863667421ff36cfb |
| models/ponies/celestia.glb | Bà Tuyết = Công chúa Celestia | Princess Celestia (MLP) | VV2006 | https://sketchfab.com/3d-models/princess-celestia-mlp-34f9c62251e04e889192c72207a0a7b1 |
| models/ponies/luna.glb | Bác Hanh = Công chúa Luna | Princess Luna (MLP) | VV2006 | https://sketchfab.com/3d-models/princess-luna-mlp-df4812a692e943d3bbf232cb6a44af62 |
| models/ponies/nightmare.glb | Nightmare Moon (bác Hanh bị bóng tối biến) | Nightmare Moon (MLP) | VV2006 | https://sketchfab.com/3d-models/nightmare-moon-mlp-72e6242c89fa47c588d6ab113ba99fce |
| models/friends/lod/pinkie.glb, fluttershy.glb | Pinkie Pie, Fluttershy (bạn, chương 1) | Pinkie Pie / Fluttershy | royalroyaltymodel112 | https://sketchfab.com/3d-models/pinkie-pie-04c68b7f14ca4ff0b6b3688c14ba52a0 · https://sketchfab.com/3d-models/fluttershy-a8272dbdcfa44439a97e1885836545fd |
| models/friends/lod/derpy.glb | Derpy (chương 1) | Derpy Hooves (LEGACY) | beniciomieras0 | https://sketchfab.com/3d-models/derpy-hooves-legacy-4d5b1b8f9f104b89b1ddec04f5e9e355 |
| models/friends/lod/minty.glb | Minty (chương 1) | Minty (G3) | puzzlshield1 | https://sketchfab.com/3d-models/minty-g3-e81696bc888549ed9a632091d7881d8f |
| models/friends/lod/babs.glb | Babs Seed (chương 2) | Babs Seed | sembatarek3737 | https://sketchfab.com/3d-models/babs-seed-4906a370f490443aa515fd28cd80d39e |
| models/friends/lod/applemint.glb | Bạc Hà (chương 2, OC) | Pony power! | Whalenut | https://sketchfab.com/3d-models/pony-power-bb04007e9e3c464dae3a638cbb3fa00b |
| models/friends/lod/bigmac.glb | Big Mac (chương 2) | Big Mac pony | Whalenut | https://sketchfab.com/3d-models/big-mac-pony-9572ce7f1ea64768a968b600827e39b0 |
| models/friends/lod/surprise.glb | Surprise (chương 2) | surprise pony | Whalenut | https://sketchfab.com/3d-models/surprise-pony-331a4c80cc8e43f397d6ab31d1f34b2e |
| models/friends/lod/cadance.glb | Cadance (chương 3) | My Little Pony Gameloft Cyber Princess Cadance | PRIZMA | https://sketchfab.com/3d-models/my-little-pony-gameloft-cyber-princess-cadance-ee4a3498c44649c1a249eb3ddfd1a771 |
| models/friends/lod/shining.glb | Shining Armor (chương 3) | Shining amor | Whalenut | https://sketchfab.com/3d-models/shining-amor-3393f237d45b43a7af7223b0d74b354b |
| models/friends/lod/sunburst.glb | Sunburst (chương 3) | Sunburst | Whalenut | https://sketchfab.com/3d-models/sunburst-7c35de8aae324420b18449ba32b1c388 |
| models/friends/lod/rainbowswirl.glb | Cầu Vồng (chương 3, OC) | MLP inspired | procyonlotor | https://sketchfab.com/3d-models/mlp-inspired-62082b40500740e1bf14449b5f004f79 |

Chỉnh sửa (`scripts/optimize-models.mjs`, bản gốc ở `../02-pony-three/public/models`): giảm lưới bằng meshoptimizer
(simplify rồi simplifySloppy) cho trận cuối ≤ 300k tam giác: Celestia 98k → 30k, Nightmare Moon 143k → 35k, Spike 28k → 12k,
Rarity 37k → 26k, Rainbow Dash / Applejack 31k → 24k, Sunburst / Fluttershy / Shining Armor (lod) → 6–8k.
Texture Twilight 2048 → 1024 px (`sips -Z 1024`). Bạn ngựa nhỏ dùng bản `lod/` (giảm lưới, texture WebP ≤ 512).
Big Mac, Shining Armor, Surprise, Bạc Hà, Sunburst có nhãn cầu trắng trơn → game vẽ mống mắt (`src/eyes.ts`).
Ảnh chân dung `img/portraits/*.png` chụp lại từ chính các model trên.

## Quái dễ thương bị bóng tối nhập (poly.pizza)

| File | Dùng ở | Tên | Tác giả | Giấy phép | Link |
|---|---|---|---|---|---|
| models/monsters/slime_enemy_j_toastie.glb | chương 1, trận cuối | Slime Enemy | **J-Toastie** | **CC-BY 3.0** (ghi công) | https://poly.pizza/m/SW5h0gbCtq |
| models/monsters/slime_quaternius.glb | chương 1, trận cuối | Slime | Quaternius | CC0 | https://poly.pizza/m/LyjSUKHKnh |
| models/monsters/slime_enemy_quaternius.glb | chương 1 (cổng khoá) | Slime Enemy | Quaternius | CC0 | https://poly.pizza/m/eSLKTsbl7F |
| models/monsters/ghost_quaternius.glb | chương 1, trận cuối | Ghost | Quaternius | CC0 | https://poly.pizza/m/Iip30bDHmu |
| models/monsters/goblin_quaternius.glb | chương 2, trận cuối | Goblin | Quaternius | CC0 | https://poly.pizza/m/OdCOFSmEhl |
| models/monsters/dragon_quaternius.glb | chương 2 | Dragon | Quaternius | CC0 | https://poly.pizza/m/VBvzjFIYws |
| models/monsters/dragon_evolved_quaternius.glb | chương 2, trận cuối | Dragon Evolved | Quaternius | CC0 | https://poly.pizza/m/LlwD0QNUPj |
| models/monsters/animated_wizard_quaternius.glb | chương 3 | Animated Wizard | **Quaternius** | **CC-BY 3.0** (ghi công) | https://poly.pizza/m/kttbFvCl2C |
| models/monsters/witch_quaternius.glb | chương 3 | Witch | **Quaternius** | **CC-BY 3.0** (ghi công) | https://poly.pizza/m/QBEOV9ZUT8 |

Loại vì đáng sợ với bé 5 tuổi: zombie, mọi skeleton, ghost_skull, orc (và blue_demon cầm gậy). Khi bị nhập: màu tím, mắt
hồng phát sáng, khói bóng tối; khi thanh tẩy: về màu thật (ma đổi sang trắng tím nhạt, rồng nhỏ đổi xanh bạc hà cho tươi).

## Khác

- Kenney Nature Kit (cây, cỏ, hoa, đá, nấm, khúc gỗ, bí ngô, lều, cột): CC0. Kenney UI/Impact audio (`sfx_*.ogg`): CC0.
- Emoji: font hệ thống (Apple Color Emoji).
- Giọng đọc: Microsoft Edge TTS, giọng **Hoài My** (`vi-VN-HoaiMyNeural`) và **Nam Minh** (`vi-VN-NamMinhNeural`) qua gói
  `edge-tts`, sinh 1 lần, dùng cá nhân trong nhà.
- Font chữ: Baloo 2 (Google Fonts, SIL OFL).
- Ảnh thật của Nhím (`public/photos/`): ảnh gia đình, KHÔNG đưa lên git.

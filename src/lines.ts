// MỌI câu thoại của game (trừ tên chữ / đồ vật / câu tìm chữ: src/letters.ts; token đánh vần: src/spell.ts).
// File THUẦN: scripts/audio-lines.mjs đọc file này để sinh audio Hoài My (edge-tts). Đổi chữ → xoá m4a cũ → `pnpm audio`.
//
// LUẬT TÊN TIẾNG ANH (ba yêu cầu 02/10, đổi luật cũ): tên riêng tiếng Anh PHẢI đọc bằng giọng tiếng Anh. Viết tên trong
// ngoặc nhọn: "Mình là {Fluttershy}! Cảm ơn Nhím nhé!" → scripts/gen-audio.py sinh "{…}" bằng giọng EN (VOICES[].en),
// phần còn lại bằng giọng Việt, cắt lặng rồi ghép (cách nhau ~80 ms). scripts/audio-lines.mjs báo lỗi nếu phần tiếng
// Việt còn chứa tên tiếng Anh (EN_NAMES). Vẫn gọi tên nhà (Nhím, ba Cường…) khi tự nhiên hơn.

/** Ai nói → giọng edge-tts (xem VOICES). */
export type Voice = 'my' | 'nar' | 'twi' | 'spike' | 'nmm' | 'ba' | 'me' | 'ong' | 'batuyet' | 'bachanh' | 'friend' | 'cat';

/**
 * Giọng: Hoài My là giọng chính (rate −10% cho trẻ con). Người kể chậm + ấm hơn. Nhân vật khác là biến thể pitch/rate.
 * ba Cường / ông Cương / bạn rồng nhỏ dùng Nam Minh (giọng nam) — giọng nữ nói "Ba đây!" nghe sai với bé; đổi `voice` là xong.
 */
export interface VoiceDef { voice: string; rate: string; pitch: string; /** giọng tiếng Anh đọc {Tên riêng} trong câu */ en: string; enPitch: string }
const EN_F = 'en-US-JennyNeural';   // nữ người lớn: hợp với Hoài My (người kể, mẹ, bà, bác)
const EN_KID = 'en-US-AnaNeural';   // giọng bé gái: Nhím, các bạn ngựa nhỏ
const EN_M = 'en-US-GuyNeural';     // nam: ba, ông, bạn rồng nhỏ
export const VOICES: Record<Voice, VoiceDef> = {
  my: { voice: 'vi-VN-HoaiMyNeural', rate: '-10%', pitch: '+0Hz', en: EN_F, enPitch: '+0Hz' },
  nar: { voice: 'vi-VN-HoaiMyNeural', rate: '-18%', pitch: '-2Hz', en: EN_F, enPitch: '-2Hz' },
  twi: { voice: 'vi-VN-HoaiMyNeural', rate: '-8%', pitch: '+14Hz', en: EN_KID, enPitch: '+0Hz' },
  spike: { voice: 'vi-VN-NamMinhNeural', rate: '-4%', pitch: '+28Hz', en: EN_M, enPitch: '+28Hz' },
  nmm: { voice: 'vi-VN-HoaiMyNeural', rate: '-14%', pitch: '-18Hz', en: EN_F, enPitch: '-18Hz' },
  ba: { voice: 'vi-VN-NamMinhNeural', rate: '-6%', pitch: '+0Hz', en: EN_M, enPitch: '+0Hz' },
  me: { voice: 'vi-VN-HoaiMyNeural', rate: '-10%', pitch: '+3Hz', en: EN_F, enPitch: '+3Hz' },
  ong: { voice: 'vi-VN-NamMinhNeural', rate: '-16%', pitch: '-10Hz', en: EN_M, enPitch: '-10Hz' },
  batuyet: { voice: 'vi-VN-HoaiMyNeural', rate: '-16%', pitch: '-7Hz', en: EN_F, enPitch: '-7Hz' },
  bachanh: { voice: 'vi-VN-HoaiMyNeural', rate: '-12%', pitch: '-4Hz', en: EN_F, enPitch: '-4Hz' },
  friend: { voice: 'vi-VN-HoaiMyNeural', rate: '-4%', pitch: '+9Hz', en: EN_KID, enPitch: '+0Hz' },
  cat: { voice: 'vi-VN-HoaiMyNeural', rate: '+0%', pitch: '+24Hz', en: EN_KID, enPitch: '+0Hz' },
};

/** Tên riêng tiếng Anh có thể được ĐỌC (phần tiếng Việt không được chứa các tên này — scripts/audio-lines.mjs soát). */
export const EN_NAMES = [
  'Twilight Sparkle', 'Twilight', 'Spike', 'Rainbow Dash', 'Rarity', 'Applejack', 'Celestia', 'Luna', 'Nightmare Moon',
  'Fluttershy', 'Pinkie Pie', 'Derpy', 'Minty', 'Babs Seed', 'Big Mac', 'Surprise', 'Cadance', 'Shining Armor', 'Sunburst',
  'Equestria', 'Everfree', 'Ponyville', 'Canterlot', 'pony',
];

/** key → [giọng, câu]. Khoá chỉ dùng a-z 0-9 _ (tên file). */
export const LINES: Record<string, [Voice, string]> = {
  // ---------------------------------------------------------------- mở đầu: thư viện của bà Tuyết
  p_1: ['nar', 'Ngày xửa ngày xưa, ở xứ sở ngựa thần, có một cô bé tên là Nhím.'],
  p_2: ['batuyet', 'Nhím ơi, lại đây bà dạy đọc chữ nào. Đây là chữ a, còn đây là chữ bờ.'],
  p_3: ['nar', 'Bỗng nhiên, phép màu lấp lánh bay ra từ những trang sách…'],
  p_4: ['nar', 'và Nhím biến thành {Twilight Sparkle}, một bạn ngựa kỳ lân màu tím thật xinh!'],
  p_5: ['twi', 'Ôi! Mình có sừng phép thuật nè!'],
  p_6: ['nmm', 'Ha ha ha! Ta là {Nightmare Moon}, Nữ hoàng Bóng Đêm! Ta sẽ thổi bay hết chữ cái!'],
  p_7: ['nar', 'Gió bóng đêm thổi hai mươi chín chữ cái thành những ngôi sao, bay đi khắp nơi.'],
  p_8: ['nmm', 'Cả nhà của Nhím, ta bắt đi hết! Ha ha ha!'],
  p_9: ['spike', 'Nhím ơi, đừng lo! Có {Spike} đây. Mình đi nhặt lại chữ cái rồi cứu cả nhà nhé!'],
  p_10: ['nar', 'Không có chữ cái, phép thuật của Nhím yếu lắm. Mỗi ngôi sao chữ nhặt được sẽ làm phép mạnh thêm.'],

  // ---------------------------------------------------------------- chương 1: khu rừng bí ẩn (Mun + Rơm, nguyên âm)
  c1i_1: ['nar', 'Chương một. Khu rừng bí ẩn.'],
  c1i_2: ['nar', 'Nhím và bạn rồng {Spike} đi vào khu rừng {Everfree}. Cây cao vút, lá rì rào.'],
  c1i_3: ['cat', 'Meo meo! Meo meo!'],
  c1i_4: ['spike', 'Nghe kìa! Là tiếng của Mun và Rơm!'],
  c1i_5: ['nmm', 'Hi hi hi! Muốn cứu hai con mèo à? Phải tìm được chữ cái đã!'],
  c1i_6: ['spike', 'Nhím chạm xuống đất là chạy tới đó. Mình đi tìm ngôi sao chữ nào!'],
  c1m_1: ['nar', 'Ở cuối khu rừng, Mun và Rơm bị nhốt trong một chiếc lồng bóng tối.'],
  c1m_2: ['cat', 'Meo meo meo! Nhím ơi!'],
  c1m_3: ['nmm', 'Các bạn ma của ta, giữ chặt chữ cái cho ta!'],
  c1m_4: ['spike', 'Đừng sợ! Phép của Nhím sẽ làm các bạn ấy hết buồn đó.'],
  c1r_1: ['nar', 'Nhím đã tìm đủ chữ trong khu rừng rồi!'],
  c1r_2: ['spike', 'Chạm vào ngôi sao phép thuật to để phá lồng nào!'],
  c1r_3: ['nar', 'Chiếc lồng vỡ tan thành ngàn ánh sao!'],
  c1r_4: ['cat', 'Meo meo! Cảm ơn Nhím!'],
  c1r_5: ['nar', 'Mun và Rơm được cứu rồi! Hai bạn mèo sẽ đi cùng Nhím.'],

  // ---------------------------------------------------------------- chương 2: làng ngựa nhỏ (ba + mẹ, phụ âm + a)
  c2i_1: ['nar', 'Chương hai. Làng ngựa nhỏ.'],
  c2i_2: ['nar', 'Nhím tới làng {Ponyville}, có những ngôi nhà nhỏ xinh.'],
  c2i_3: ['nar', 'Trên tháp đồng hồ, ba Cường là {Rainbow Dash} và mẹ Yến là {Rarity} bị nhốt trong bong bóng bóng đêm!'],
  c2i_4: ['me', 'Nhím ơi! Ba mẹ ở trên này!'],
  c2i_5: ['ba', 'Nhím cố lên! Ba tin con!'],
  c2i_6: ['nmm', 'Bong bóng của ta chỉ vỡ khi có người đọc được chữ… ba! Ha ha!'],
  c2i_7: ['spike', 'Mình phải tìm chữ bờ và chữ a. Đi thôi Nhím!'],
  c2m_1: ['nar', 'Một chú rồng nhỏ bị bóng tối nhập, cắp mất mấy ngôi sao chữ bay đi.'],
  c2m_2: ['spike', 'Chú rồng ấy đang buồn đó. Phép của Nhím sẽ giúp chú vui lại.'],
  c2m_3: ['nmm', 'Hừm! Nhím biết đọc chữ rồi à? Còn lâu mới cứu được!'],
  c2r_1: ['nar', 'Nhím tới chân tháp đồng hồ. Bong bóng có khắc một chữ: ba.'],
  c2r_2: ['spike', 'Ghép chữ bờ với chữ a nào!'],
  c2r_3: ['nar', 'Bong bóng vỡ tung!'],
  c2r_me: ['me', 'Mẹ đây! Mẹ thương Nhím nhất!'],
  c2r_4: ['ba', 'Nhím giỏi quá! Cả nhà mình đi cứu ông bà nào!'],

  // ---------------------------------------------------------------- chương 3: thành phố lâu đài (ông + bà, có dấu)
  c3i_1: ['nar', 'Chương ba. Thành phố lâu đài.'],
  c3i_2: ['nar', 'Thành phố {Canterlot} trắng tinh, mái vàng lấp lánh. Ông Cương là {Applejack}, bà Tuyết là công chúa {Celestia}.'],
  c3i_3: ['batuyet', 'Nhím ơi, ông bà ở trên tháp cao này!'],
  c3i_4: ['ong', 'Cháu ông dũng cảm lắm! Ông chờ cháu!'],
  c3i_5: ['nmm', 'Các phù thuỷ của ta sẽ giữ chặt những chữ cái cuối cùng!'],
  c3i_6: ['spike', 'Ở đây có cả dấu thanh nữa đó Nhím. Dấu huyền, dấu sắc… Mình học nhé!'],
  c3m_1: ['nar', 'Các phù thuỷ nhỏ bị bóng tối nhập, vẫy gậy phép lung tung.'],
  c3m_2: ['spike', 'Mỗi lần Nhím đọc đúng, bóng tối lại tan bớt!'],
  c3m_3: ['me', 'Cố lên Nhím ơi, cả nhà ở đây với con!'],
  c3r_1: ['nar', 'Bong bóng trên tháp có khắc một chữ: bà.'],
  c3r_2: ['spike', 'Ghép chữ bờ, chữ a, rồi thêm dấu huyền nào!'],
  c3r_ong: ['ong', 'Ông đây! Cháu ông giỏi quá!'],
  c3r_3: ['batuyet', 'Bà sẽ kéo mặt trời lên cho cả nhà!'],
  c3r_4: ['nar', 'Mặt trời mọc rồi! Nhưng Nữ hoàng Bóng Đêm vẫn còn ở lâu đài…'],

  // ---------------------------------------------------------------- chương 4: trận chiến cuối cùng
  f_1: ['nar', 'Trận chiến cuối cùng.'],
  f_2: ['nar', 'Bầu trời tối sầm lại. {Nightmare Moon} bay xuống cùng đội quân bóng tối.'],
  f_3: ['nmm', 'Ha ha ha! Các ngươi không thắng được ta đâu!'],
  f_4: ['nar', 'Nhưng Nhím không một mình. Cả nhà, hai bạn mèo và các bạn ngựa nhỏ đều ở đây!'],
  f_5: ['ba', 'Cả nhà mình cùng nhau nào!'],
  f_6: ['spike', 'Mỗi lần Nhím đọc đúng, một viên ngọc Hài Hoà sẽ sáng lên!'],
  f_round_1: ['nar', 'Viên ngọc thứ nhất!'],
  f_round_2: ['nar', 'Viên ngọc thứ hai!'],
  f_round_3: ['nar', 'Viên ngọc thứ ba!'],
  f_round_4: ['nar', 'Viên ngọc thứ tư!'],
  f_round_5: ['nar', 'Viên ngọc cuối cùng!'],
  f_move_ong: ['ong', 'Ông đá một cái, bóng tối bay mất!'],
  f_move_friends: ['nar', 'Các bạn ngựa nhỏ và hai bạn mèo cùng xông lên!'],
  f_move_ba: ['ba', 'Ba bay nhanh như tia chớp cầu vồng!'],
  f_move_me: ['me', 'Ngọc của mẹ lấp lánh nè!'],
  f_move_batuyet: ['batuyet', 'Ánh nắng của bà đây!'],
  f_taunt_1: ['nmm', 'Hừm! Mới một viên ngọc thôi mà!'],
  f_taunt_2: ['nmm', 'Ối! Phép gì mà sáng thế!'],
  f_taunt_3: ['nmm', 'Bóng tối của ta… mỏng dần rồi!'],
  f_taunt_4: ['nmm', 'Không thể nào! Còn một viên nữa thôi sao?'],
  // cao trào
  cl_1: ['nar', 'Năm viên ngọc Hài Hoà bay vòng quanh Nhím.'],
  cl_2: ['nar', 'Nhím phát sáng, bay lên thật cao, và dang rộng đôi cánh!'],
  cl_3: ['twi', 'Bằng phép màu của tình bạn và gia đình…'],
  cl_4: ['twi', 'Bóng tối ơi, tan đi!'],
  // kết
  e_1: ['nar', 'Ánh sáng dịu dần. {Nightmare Moon} biến mất…'],
  e_2: ['nar', 'và bác Hanh trở lại thành công chúa {Luna}!'],
  e_3: ['bachanh', 'Ôi, bác được cứu rồi! Cảm ơn Nhím nhiều lắm!'],
  e_4: ['batuyet', 'Mặt trời mọc rồi! Cả nhà mình lại ở bên nhau.'],
  e_5: ['nar', 'Nhím đã cứu cả nhà!'],
  e_6: ['me', 'Mẹ thương Nhím nhất trên đời!'],
  e_7: ['ba', 'Con gái ba giỏi nhất!'],
  e_8: ['ong', 'Cháu ông tuyệt vời!'],
  e_9: ['nar', 'Và đây là cuốn sách phiêu lưu của Nhím.'],

  // ---------------------------------------------------------------- album
  al_1: ['nar', 'Nhím và hai bạn mèo lại ở bên nhau rồi!'],
  al_2: ['nar', 'Nhím và ba mẹ lại ở bên nhau rồi!'],
  al_3: ['nar', 'Nhím và ông bà lại ở bên nhau rồi!'],
  al_4: ['nar', 'Nhím và bác Hanh, cả nhà sum vầy!'],
  al_cover: ['nar', 'Cùng xem lại chuyến phiêu lưu của Nhím nhé!'],
  al_extra: ['nar', 'Thêm một kỷ niệm thật đẹp của Nhím.'],

  // ---------------------------------------------------------------- hoạt động
  bridge_1: ['spike', 'Cây cầu bị gãy rồi! Mình tìm tấm ván có chữ nhé.'],
  bridge_2: ['spike', 'Ôi, cầu thiếu ván! Chạm vào tấm ván đúng chữ nha.'],
  bridge_done: ['my', 'Cầu lành rồi! Đi qua thôi!'],
  lock_intro: ['spike', 'Cổng bị khoá rồi! Nhìn ổ khoá xem có chữ gì nào.'],
  lock_done: ['my', 'Cạch! Cổng mở rồi!'],
  spell_intro: ['spike', 'Mình dùng phép ghép chữ nhé! Chạm vào ngôi sao đúng chữ nha.'],
  big_spell: ['spike', 'Chạm vào ngôi sao phép thuật to nào!'],
  cage_hint: ['spike', 'Lồng ở đằng kia! Đi tới đó nhé.'],
  board_open: ['my', 'Bảng chữ cái của Nhím đây!'],
  board_empty: ['my', 'Chữ này Nhím chưa tìm thấy. Mình đi tìm nhé!'],
  review_intro: ['spike', 'Bạn rồng nhỏ hỏi bài nè! Nhím nhớ chữ nào rồi?'],
  review_done: ['spike', 'Nhím nhớ hết rồi! Giỏi quá đi!'],
  chapter_pick: ['my', 'Nhím muốn chơi chương nào?'],
  sun_rise: ['nar', 'Bà Tuyết kéo mặt trời lên. Trời sáng rồi!'],
  meow: ['cat', 'Meo meo!'],
  rotate: ['my', 'Nhím ơi, xoay ngang máy nhé!'],
};

/** Ngân hàng câu: chọn ngẫu nhiên, không lặp lại 3 câu gần nhất (src/voice.ts). */
export const BANK_TEXT: Record<string, [Voice, string[]]> = {
  ok: ['my', [
    'Đúng rồi!', 'Giỏi quá!', 'Hay lắm Nhím ơi!', 'Tuyệt vời!', 'Chính xác!', 'Nhím giỏi ghê!', 'Đúng chữ đó rồi!',
    'Ôi, Nhím tìm ra rồi!', 'Phép màu mạnh thêm rồi!', 'Hoan hô Nhím!', 'Xuất sắc!', 'Đúng rồi, giỏi lắm!',
  ]],
  no: ['my', [
    'Chưa đúng rồi, mình thử lại nha.', 'Ồ, không phải chữ này.', 'Gần đúng rồi! Thử chữ khác nhé.', 'Hì, chữ này khác cơ.',
    'Không sao, tìm lại nào!', 'Ừm, chưa phải rồi.', 'Thử lại nhé Nhím!', 'Ô, chữ này chưa đúng.', 'Nhìn kỹ lại nhé!',
    'Từ từ thôi, mình tìm tiếp.',
  ]],
  idle: ['spike', [
    'Nhím ơi, chạm xuống đất để đi nhé!', 'Ngôi sao chữ đang chờ Nhím đó!', 'Đi theo đường sao lấp lánh nào!',
    'Mình đi tiếp nhé Nhím!', 'Chạm vào chỗ muốn tới, Nhím sẽ chạy tới đó!', 'Còn ngôi sao chữ nữa kìa!',
    'Nhím ơi, đi tiếp thôi!', 'Cả nhà đang chờ Nhím đó!', 'Thử nhảy lên xem nào! Nút tím đó!', 'Mình ở đây nè, đi cùng nhau nhé!',
  ]],
  purify: ['my', [
    'Bóng tối tan rồi! Bạn ấy vui lại rồi!', 'Nhìn kìa, bạn ấy hết buồn rồi!', 'Phép của Nhím làm bạn ấy sáng bừng!',
    'Bạn ấy về phe mình rồi!', 'Ôi, bạn ấy dễ thương quá!', 'Bạn ấy đang nhảy múa kìa!', 'Hết bị bóng tối nhập rồi!',
    'Có thêm một người bạn mới!', 'Bạn ấy vẫy tay chào Nhím kìa!', 'Hoan hô! Bóng tối chạy mất rồi!',
  ]],
  hunt: ['spike', [
    'Có ngôi sao chữ ở đây nè!', 'Ồ, sao chữ sáng lấp lánh kìa!', 'Nhìn kìa, nhiều ngôi sao chữ quá!', 'Sao chữ đây rồi!',
    'Bạn ấy đang giữ ngôi sao chữ đó!', 'Mình nhặt sao chữ nào!', 'Sao chữ trốn ở đây nè!', 'Tìm thấy sao chữ rồi!',
  ]],
  collect: ['my', [
    'Bay vào bảng chữ cái nào!', 'Thêm một chữ nữa rồi!', 'Bảng chữ cái sáng thêm rồi!', 'Sao chữ về nhà rồi!',
    'Phép của Nhím mạnh hơn rồi!', 'Lại có chữ mới!', 'Vèo! Vào bảng chữ rồi!', 'Nhím có thêm chữ mới!',
  ]],
  laugh: ['nmm', [
    'Hô hô hô! Chưa đúng rồi!', 'Hi hi! Thử lại đi nào!', 'Ha ha! Bóng tối tiến lên!', 'Hừm hừm, sai rồi nhé!',
    'Hô hô! Ta vẫn còn mạnh lắm!', 'Hí hí! Chữ đó không phải đâu!', 'Ha ha ha! Nhìn kỹ lại xem!', 'Hô hô, chưa được đâu!',
  ]],
  rv_ok: ['spike', [
    'Đúng rồi! Nhím nhớ giỏi ghê!', 'Chuẩn luôn!', 'Đúng chữ đó!', 'Hay quá Nhím ơi!', 'Nhím nhớ hết luôn!', 'Giỏi quá đi!',
    'Đúng rồi nè!', 'Tuyệt vời Nhím ơi!',
  ]],
  tap: ['spike', [
    'Chạm vào ngôi sao đúng chữ nha!', 'Nhím chạm vào ngôi sao nhé!', 'Ngôi sao nào đây ta?', 'Chạm nhẹ vào ngôi sao nào!',
    'Nhím chọn ngôi sao nào?', 'Chạm vào chữ đúng nhé!', 'Ngôi sao đang chờ Nhím chạm đó!', 'Thử chạm một ngôi sao xem!',
  ]],
};

/** Lời cảm ơn riêng của từng bạn ngựa nhỏ (tên tiếng Anh đọc bằng giọng tiếng Anh). */
export const FRIEND_THANKS: Record<string, string[]> = {
  pinkie: ['Mình là {Pinkie Pie}! Cảm ơn Nhím, mình mở tiệc mừng nhé!', '{Pinkie Pie} đi theo Nhím nè!'],
  fluttershy: ['Mình là {Fluttershy}… Cảm ơn Nhím nhiều lắm!', '{Fluttershy} sẽ giúp Nhím nha!'],
  derpy: ['Mình là {Derpy}! Cảm ơn Nhím, tặng Nhím bánh muffin nè!', '{Derpy} đi cùng Nhím nhé!'],
  minty: ['Mình là {Minty}! Cảm ơn Nhím nha!', '{Minty} được tự do rồi!'],
  babs: ['Em là {Babs Seed}! Cảm ơn chị Nhím!', '{Babs Seed} đi theo chị Nhím nè!'],
  applemint: ['Mình là Bạc Hà! Cảm ơn Nhím nhiều nhé!', 'Bạc Hà đi cùng Nhím nha!'],
  bigmac: ['Anh là {Big Mac}! Cảm ơn Nhím nhé!', '{Big Mac} sẽ bảo vệ Nhím!'],
  surprise: ['Mình là {Surprise}! Bất ngờ chưa, cảm ơn Nhím!', '{Surprise} bay theo Nhím nè!'],
  cadance: ['Cô là công chúa {Cadance}! Cảm ơn Nhím nhé!', '{Cadance} thương Nhím lắm!'],
  shining: ['Anh là {Shining Armor}! Cảm ơn em Nhím!', '{Shining Armor} sẽ che chắn cho Nhím!'],
  sunburst: ['Mình là {Sunburst}! Phép của Nhím tuyệt quá!', '{Sunburst} đi cùng Nhím nhé!'],
  rainbowswirl: ['Mình là Cầu Vồng! Cảm ơn Nhím đã cứu mình!', 'Cầu Vồng đi theo Nhím nè!'],
};
export const thanksKey = (id: string, i: number) => `thx_${id}_${i}`;

/** Khoá audio của câu thứ i trong ngân hàng. */
export const bankKey = (bank: string, i: number) => `b_${bank}_${i}`;

/** Ổ khoá có chữ ... (sinh cho cả 29 chữ ở scripts/audio-lines.mjs). */
export const LOCK_TEMPLATE = 'Ổ khoá có chữ {n}! Chạm vào ngôi sao chữ {n} nhé.';
export const lockKey = (s: string) => `lk_${s}`;
/** Bạn rồng nhỏ hỏi ôn: "Nhím ơi, chữ ô đâu?" */
export const REVIEW_TEMPLATE = 'Nhím ơi, chữ {n} đâu?';
export const reviewKey = (s: string) => `rv_${s}`;
/** Ghép chữ: "Mình ghép chữ ba nhé!" */
export const SPELL_TEMPLATE = 'Mình ghép chữ {w} nhé!';
export const spellKey = (id: string) => `sp_${id}`;
/** Tìm dấu thanh. */
export const TONE_FIND: Record<string, string> = {
  huyen: 'Dấu huyền đâu nhỉ?', sac: 'Dấu sắc đâu nhỉ?', hoi: 'Dấu hỏi đâu nhỉ?', nga: 'Dấu ngã đâu nhỉ?', nang: 'Dấu nặng đâu nhỉ?',
};
export const toneFindKey = (t: string) => `tf_${t}`;
export const TONE_LABEL: Record<string, string> = { huyen: 'dấu huyền', sac: 'dấu sắc', hoi: 'dấu hỏi', nga: 'dấu ngã', nang: 'dấu nặng' };
export const toneLabelKey = (t: string) => `tl_${t}`;

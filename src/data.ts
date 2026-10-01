// Dữ liệu game 2: palette, từ vựng + token đánh vần, dàn nhân vật (cả nhà Nhím hoá pony), 7 màn chơi.

export const PALETTE = {
  sky: 0xfff4e4,
  skyTop: 0xbfe3fb,
  grassTop: 0xc6e88e,
  grassDark: 0xa2d276,
  sand: 0xf1ddb0,
  water: 0x9edff2,
  hill: 0xb9e39a,
  hillFar: 0xd2eec0,
  cloud: 0xffffff,
  leaf: 0x8fd072,
  grassProp: 0xaee08a,
  bark: 0xd49a6e,
  magic: 0xc084fc,
  magicPink: 0xff7ac8,
  star: 0xffd166,
  ink: 0x3b3220,
  // trời đêm của Nightmare Moon: tím oải hương, không đen (bé 5 tuổi không sợ)
  nightSky: 0x8f7fd0,
  nightSkyTop: 0x2e2f78,
  nightWater: 0x4c5fa8,
  nightHill: 0x5d6aa8,
  nightHillFar: 0x7b80c0,
} as const;

export interface SpellToken { audio: string; lit: number[] }
export interface WordDef { id: string; word: string; emoji: string; tokens: SpellToken[] }

/*
 * Đánh vần theo GDPT 2018: vần 2+ chữ đánh vần vần trước (e – o – eo), rồi tiếng
 * (mờ – eo – meo), rồi thanh (huyền – mèo). Gọi phụ âm theo ÂM (mờ, gờ, bờ...).
 * Tiếng không dấu (heo, voi, sao, hoa, cua, dê, nơ) dừng ở tiếng.
 * Khoá audio: v_ = vần/nguyên âm, c_ = phụ âm, s_ = tiếng chưa dấu, t_ = tên dấu, w_ = từ.
 * lit = vị trí chữ (theo Array.from(word), chữ dựng sẵn NFC) được tô khi đọc token.
 */
export const WORDS: WordDef[] = [
  { id: 'meo', word: 'mèo', emoji: '🐈', tokens: [
    { audio: 'v_e', lit: [1] }, { audio: 'v_o', lit: [2] }, { audio: 'v_eo', lit: [1, 2] },
    { audio: 'c_mo', lit: [0] }, { audio: 'v_eo', lit: [1, 2] }, { audio: 's_meo', lit: [0, 1, 2] },
    { audio: 't_huyen', lit: [1] }, { audio: 'w_meo', lit: [0, 1, 2] } ] },
  { id: 'ga', word: 'gà', emoji: '🐔', tokens: [
    { audio: 'c_go', lit: [0] }, { audio: 'v_a', lit: [1] }, { audio: 's_ga', lit: [0, 1] },
    { audio: 't_huyen', lit: [1] }, { audio: 'w_ga', lit: [0, 1] } ] },
  { id: 'bo', word: 'bò', emoji: '🐄', tokens: [
    { audio: 'c_bo', lit: [0] }, { audio: 'v_o', lit: [1] }, { audio: 's_bo', lit: [0, 1] },
    { audio: 't_huyen', lit: [1] }, { audio: 'w_bo', lit: [0, 1] } ] },
  { id: 'cho', word: 'chó', emoji: '🐕', tokens: [
    { audio: 'c_cho', lit: [0, 1] }, { audio: 'v_o', lit: [2] }, { audio: 's_cho', lit: [0, 1, 2] },
    { audio: 't_sac', lit: [2] }, { audio: 'w_cho', lit: [0, 1, 2] } ] },
  { id: 'heo', word: 'heo', emoji: '🐖', tokens: [
    { audio: 'v_e', lit: [1] }, { audio: 'v_o', lit: [2] }, { audio: 'v_eo', lit: [1, 2] },
    { audio: 'c_ho', lit: [0] }, { audio: 'v_eo', lit: [1, 2] }, { audio: 's_heo', lit: [0, 1, 2] } ] },
  { id: 'ca', word: 'cá', emoji: '🐟', tokens: [
    { audio: 'c_co', lit: [0] }, { audio: 'v_a', lit: [1] }, { audio: 's_ca', lit: [0, 1] },
    { audio: 't_sac', lit: [1] }, { audio: 'w_ca', lit: [0, 1] } ] },
  { id: 'vit', word: 'vịt', emoji: '🦆', tokens: [
    { audio: 'v_i', lit: [1] }, { audio: 'c_to', lit: [2] }, { audio: 'v_it', lit: [1, 2] },
    { audio: 'c_vo', lit: [0] }, { audio: 'v_it', lit: [1, 2] }, { audio: 's_vit', lit: [0, 1, 2] },
    { audio: 't_nang', lit: [1] }, { audio: 'w_vit', lit: [0, 1, 2] } ] },
  { id: 'tho', word: 'thỏ', emoji: '🐇', tokens: [
    { audio: 'c_tho', lit: [0, 1] }, { audio: 'v_o', lit: [2] }, { audio: 's_tho', lit: [0, 1, 2] },
    { audio: 't_hoi', lit: [2] }, { audio: 'w_tho', lit: [0, 1, 2] } ] },
  { id: 'voi', word: 'voi', emoji: '🐘', tokens: [
    { audio: 'v_o', lit: [1] }, { audio: 'v_i', lit: [2] }, { audio: 'v_oi', lit: [1, 2] },
    { audio: 'c_vo', lit: [0] }, { audio: 'v_oi', lit: [1, 2] }, { audio: 's_voi', lit: [0, 1, 2] } ] },
  { id: 'khi', word: 'khỉ', emoji: '🐒', tokens: [
    { audio: 'c_kho', lit: [0, 1] }, { audio: 'v_i', lit: [2] }, { audio: 's_khi', lit: [0, 1, 2] },
    { audio: 't_hoi', lit: [2] }, { audio: 'w_khi', lit: [0, 1, 2] } ] },
  // --- từ mới cho màn 3–7
  { id: 'sao', word: 'sao', emoji: '⭐', tokens: [
    { audio: 'v_a', lit: [1] }, { audio: 'v_o', lit: [2] }, { audio: 'v_ao', lit: [1, 2] },
    { audio: 'c_so', lit: [0] }, { audio: 'v_ao', lit: [1, 2] }, { audio: 's_sao', lit: [0, 1, 2] } ] },
  { id: 'hoa', word: 'hoa', emoji: '🌸', tokens: [
    { audio: 'v_o', lit: [1] }, { audio: 'v_a', lit: [2] }, { audio: 'v_oa', lit: [1, 2] },
    { audio: 'c_ho', lit: [0] }, { audio: 'v_oa', lit: [1, 2] }, { audio: 's_hoa', lit: [0, 1, 2] } ] },
  { id: 'cua', word: 'cua', emoji: '🦀', tokens: [
    { audio: 'v_u', lit: [1] }, { audio: 'v_a', lit: [2] }, { audio: 'v_ua', lit: [1, 2] },
    { audio: 'c_co', lit: [0] }, { audio: 'v_ua', lit: [1, 2] }, { audio: 's_cua', lit: [0, 1, 2] } ] },
  { id: 'la', word: 'lá', emoji: '🍁', tokens: [
    { audio: 'c_lo', lit: [0] }, { audio: 'v_a', lit: [1] }, { audio: 's_la', lit: [0, 1] },
    { audio: 't_sac', lit: [1] }, { audio: 'w_la', lit: [0, 1] } ] },
  { id: 'de', word: 'dê', emoji: '🐐', tokens: [
    { audio: 'c_do', lit: [0] }, { audio: 'v_ee', lit: [1] }, { audio: 's_de', lit: [0, 1] } ] },
  { id: 'no', word: 'nơ', emoji: '🎀', tokens: [
    { audio: 'c_no', lit: [0] }, { audio: 'v_ow', lit: [1] }, { audio: 's_no', lit: [0, 1] } ] },
];

export const NUMBER_AUDIO = ['', 'n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8', 'n9', 'n10'];

export type HeroKind = 'pony' | 'human';
export type ChallengeKind = 'spell' | 'count';

// ------------------------------------------------------------------ dàn nhân vật

export type CastId =
  | 'me-yen' | 'ba-cuong' | 'ong-cuong' | 'ba-tuyet' | 'bac-hanh'
  | 'spike' | 'pinkie' | 'fluttershy' | 'mun' | 'rom';

/** pony = ngựa đất/kỳ lân/pegasus (auto-rig 4 chân), flyer = công chúa có xương sẵn (bay lơ lửng), dragon = Spike, cat = emoji. */
export type ActorKind = 'pony' | 'flyer' | 'dragon' | 'cat';

export interface CastDef {
  id: CastId;
  /** tên gọi trong nhà (hiện to) */
  name: string;
  /** vai pony (hiện nhỏ dưới tên) */
  pony: string;
  kind: ActorKind;
  model?: string;
  height: number;
  emoji: string;
  /** màu viền thẻ / nút bản đồ */
  color: string;
  /** câu khen: [audio key, chữ hiện] */
  lines: [string, string][];
  /** câu ngắn khi cả nhà lần lượt cổ vũ ở cuối */
  ball?: [string, string];
  /** màn cứu người này (nếu có) */
  level?: string;
}

export const CAST: Record<CastId, CastDef> = {
  'me-yen': {
    id: 'me-yen', name: 'Mẹ Yến', pony: 'Rarity', kind: 'pony', model: 'models/ponies/rarity.glb', height: 1.7,
    emoji: '💎', color: '#9b5de5', level: 'me',
    lines: [['fam_me_yen_1', 'Nhím giỏi quá!'], ['fam_me_yen_2', 'Mẹ thương Nhím nhất trên đời!'], ['fam_me_yen_3', 'Con gái mẹ tuyệt vời!']],
    ball: ['fam_me_yen_ball', 'Hoan hô Nhím!'],
  },
  'ba-cuong': {
    id: 'ba-cuong', name: 'Ba Cường', pony: 'Rainbow Dash', kind: 'pony', model: 'models/ponies/rainbow.glb', height: 1.7,
    emoji: '⚡', color: '#2f9df5', level: 'ba',
    lines: [['fam_ba_cuong_1', 'Nhím của ba mạnh mẽ quá!'], ['fam_ba_cuong_2', 'Ba bay vèo vèo cổ vũ Nhím!'], ['fam_ba_cuong_3', 'Ba giơ ngón tay cái cho Nhím!']],
    ball: ['fam_ba_cuong_ball', 'Nhím nhanh như gió!'],
  },
  'ong-cuong': {
    id: 'ong-cuong', name: 'Ông Cương', pony: 'Applejack', kind: 'pony', model: 'models/ponies/applejack.glb', height: 1.75,
    emoji: '🍎', color: '#e8892b', level: 'ong',
    lines: [['fam_ong_cuong_1', 'Ông vỗ tay cho Nhím nè!'], ['fam_ong_cuong_2', 'Cháu ông giỏi quá!'], ['fam_ong_cuong_3', 'Hay lắm cháu ơi!']],
    ball: ['fam_ong_cuong_ball', 'Tuyệt vời cháu ơi!'],
  },
  'ba-tuyet': {
    id: 'ba-tuyet', name: 'Bà Tuyết', pony: 'Công chúa Celestia', kind: 'flyer', model: 'models/ponies/celestia.glb', height: 2.5,
    emoji: '☀️', color: '#f2a900', level: 'ba_tuyet',
    lines: [['fam_ba_tuyet_1', 'Bà thương Nhím nhiều lắm!'], ['fam_ba_tuyet_2', 'Cháu bà ngoan quá!'], ['fam_ba_tuyet_3', 'Nhím sáng như mặt trời!']],
    ball: ['fam_ba_tuyet_ball', 'Bà thương Nhím!'],
  },
  'bac-hanh': {
    id: 'bac-hanh', name: 'Bác Hanh', pony: 'Công chúa Luna', kind: 'flyer', model: 'models/ponies/luna.glb', height: 2.3,
    emoji: '🌙', color: '#3b5bdb', level: 'final',
    lines: [['fam_bac_hanh_1', 'Bác thơm Nhím một cái!'], ['fam_bac_hanh_2', 'Nhím thông minh quá!']],
    ball: ['fam_bac_hanh_ball', 'Cảm ơn Nhím!'],
  },
  spike: {
    id: 'spike', name: 'Spike', pony: 'bạn rồng nhỏ', kind: 'dragon', model: 'models/ponies/spike.glb', height: 1.05,
    emoji: '🐲', color: '#7cb342',
    lines: [['fr_spike_1', 'Nhím giỏi quá!'], ['fr_spike_2', 'Phép của Nhím đẹp ghê!']],
  },
  pinkie: {
    id: 'pinkie', name: 'Pinkie Pie', pony: 'bạn vui vẻ', kind: 'pony', model: 'models/ponies/pinkie.glb', height: 1.6,
    emoji: '🎈', color: '#ff5fb4',
    lines: [['fr_pinkie_1', 'Hoan hô Nhím!']],
  },
  fluttershy: {
    id: 'fluttershy', name: 'Fluttershy', pony: 'bạn hiền lành', kind: 'pony', model: 'models/ponies/fluttershy.glb', height: 1.6,
    emoji: '🦋', color: '#e6b800',
    lines: [['fr_fluttershy_1', 'Nhím giỏi lắm!']],
  },
  mun: {
    id: 'mun', name: 'Mèo Mun', pony: 'mèo đen', kind: 'cat', height: 0.9, emoji: '🐈‍⬛', color: '#5a4b6e', level: 'mun',
    lines: [['fr_mun_1', 'Meo meo! Nhím giỏi!']],
  },
  rom: {
    id: 'rom', name: 'Mèo Rơm', pony: 'mèo vàng', kind: 'cat', height: 0.9, emoji: '🐈', color: '#d9a441', level: 'rom',
    lines: [['fr_rom_1', 'Meo meo! Hoan hô Nhím!']],
  },
};

/** Gợi ý của Spike khi bé đứng yên lâu. */
export const SPIKE_HINTS = ['spike_hint_1', 'spike_hint_2', 'spike_hint_3'];

// ------------------------------------------------------------------ màn chơi

export interface LevelTheme {
  grass: number;
  grassDark: number;
  /** 0 = ngày, 1 = đêm sâu */
  night: number;
  /** emoji trang trí rải trên đảo */
  deco?: string[];
  /** tỉ lệ hoa trong cây cỏ nhỏ (0..1) */
  flowers?: number;
}

export interface LevelDef {
  id: string;
  title: string;
  hero: HeroKind;
  introAudio: string;
  /** người được cứu ở màn này */
  rescue: CastId;
  rescueAudio: string;
  island: { rx: number; rz: number };          // bán trục ellipse của đảo
  start: [number, number];                     // vị trí xuất phát (x, z)
  monsters: { x: number; z: number; kind: ChallengeKind; color: number }[];
  gems: [number, number][];                    // (x, z) các viên ngọc
  bubble: [number, number];                    // bong bóng nhốt người thân
  countRange: [number, number];                // số ngọc quái giữ
  wordPool: string[];                          // id từ dùng cho màn
  theme: LevelTheme;
  /** màn cuối: đấu Nightmare Moon */
  final?: boolean;
}

export const LEVELS: LevelDef[] = [
  {
    id: 'mun', title: 'Cứu mèo Mun', hero: 'pony', introAudio: 'intro_mun', rescue: 'mun', rescueAudio: 'rescued_mun',
    island: { rx: 26, rz: 18 },
    start: [-17, 5],
    monsters: [
      { x: -5, z: -7, kind: 'spell', color: 0xb388ff },
      { x: 10, z: 8, kind: 'count', color: 0x7fd8c8 },
      { x: 19, z: -7, kind: 'spell', color: 0xffb36b },
    ],
    gems: [[-12, 0], [-9, -4], [-2, 2], [3, -3], [6, 4], [13, 0], [16, 3], [12, -10], [21, 2], [-8, 9]],
    bubble: [22, 6],
    countRange: [1, 5],
    wordPool: ['meo', 'ga', 'bo', 'cho', 'ca'],
    theme: { grass: PALETTE.grassTop, grassDark: PALETTE.grassDark, night: 0.78, flowers: 0.35 },
  },
  {
    id: 'rom', title: 'Cứu mèo Rơm', hero: 'human', introAudio: 'intro_rom', rescue: 'rom', rescueAudio: 'rescued_rom',
    island: { rx: 28, rz: 20 },
    start: [-19, -4],
    monsters: [
      { x: -8, z: 8, kind: 'spell', color: 0xff8fb1 },
      { x: 6, z: -9, kind: 'count', color: 0x8fd3ff },
      { x: 18, z: 6, kind: 'spell', color: 0xa5e887 },
    ],
    gems: [[-14, 2], [-11, 7], [-4, 4], [-1, -3], [3, -8], [9, -5], [10, 2], [14, 8], [22, -2], [0, 10], [-6, -10]],
    bubble: [23, -8],
    countRange: [3, 8],
    wordPool: ['heo', 'vit', 'tho', 'voi', 'khi', 'meo'],
    theme: { grass: 0xd4e98a, grassDark: 0xb2d46e, night: 0.74, flowers: 0.3 },
  },
  {
    id: 'me', title: 'Cứu mẹ Yến', hero: 'pony', introAudio: 'intro_me', rescue: 'me-yen', rescueAudio: 'rescued_me',
    island: { rx: 27, rz: 19 },
    start: [-18, -3],
    monsters: [
      { x: -6, z: 7, kind: 'spell', color: 0xf7a1d8 },
      { x: 7, z: -8, kind: 'count', color: 0x9be3ff },
      { x: 17, z: 5, kind: 'spell', color: 0xc9a7ff },
    ],
    gems: [[-14, 1], [-10, 5], [-3, 3], [0, -3], [4, -6], [10, -3], [12, 3], [20, 0], [-6, -9], [3, 10]],
    bubble: [22, -5],
    countRange: [2, 6],
    wordPool: ['hoa', 'no', 'la', 'ca', 'ga'],
    theme: { grass: 0xcdeaa0, grassDark: 0xa9d784, night: 0.68, flowers: 0.75, deco: ['💎', '🎀'] },
  },
  {
    id: 'ba', title: 'Cứu ba Cường', hero: 'pony', introAudio: 'intro_ba', rescue: 'ba-cuong', rescueAudio: 'rescued_ba',
    island: { rx: 28, rz: 19 },
    start: [-19, 4],
    monsters: [
      { x: -7, z: -7, kind: 'spell', color: 0x8fd3ff },
      { x: 5, z: 8, kind: 'count', color: 0xffd36b },
      { x: 16, z: -6, kind: 'spell', color: 0xff8f8f },
    ],
    gems: [[-14, 0], [-11, -5], [-3, -3], [0, 3], [3, 6], [9, 2], [11, -4], [20, -1], [-8, 9], [14, 9]],
    bubble: [22, 5],
    countRange: [3, 7],
    wordPool: ['sao', 'bo', 'cho', 'vit', 'de'],
    theme: { grass: 0xc4ebb0, grassDark: 0x9fd68e, night: 0.6, flowers: 0.35, deco: ['☁️', '⚡'] },
  },
  {
    id: 'ong', title: 'Cứu ông Cương', hero: 'pony', introAudio: 'intro_ong', rescue: 'ong-cuong', rescueAudio: 'rescued_ong',
    island: { rx: 28, rz: 20 },
    start: [-19, -5],
    monsters: [
      { x: -9, z: 6, kind: 'count', color: 0xffb36b },
      { x: 3, z: -8, kind: 'spell', color: 0xa5e887 },
      { x: 15, z: 7, kind: 'spell', color: 0xff8fb1 },
    ],
    gems: [[-15, 0], [-12, 4], [-5, 2], [-2, -4], [1, -9], [7, -4], [9, 3], [19, 2], [-4, 11], [12, -10]],
    bubble: [22, -6],
    countRange: [4, 8],
    wordPool: ['la', 'de', 'bo', 'heo', 'cua'],
    theme: { grass: 0xbfe28a, grassDark: 0x98c96a, night: 0.52, flowers: 0.3, deco: ['🍎', '🍏'] },
  },
  {
    id: 'ba_tuyet', title: 'Cứu bà Tuyết', hero: 'pony', introAudio: 'intro_ba_tuyet', rescue: 'ba-tuyet', rescueAudio: 'rescued_ba_tuyet',
    island: { rx: 29, rz: 20 },
    start: [-20, 3],
    monsters: [
      { x: -8, z: -8, kind: 'spell', color: 0xffe08a },
      { x: 4, z: 7, kind: 'count', color: 0xc9a7ff },
      { x: 17, z: -6, kind: 'spell', color: 0x9be3ff },
    ],
    gems: [[-15, 0], [-12, -5], [-4, -4], [-1, 2], [1, 9], [8, 3], [10, -3], [20, -2], [-9, 8], [13, 9]],
    bubble: [23, 4],
    countRange: [5, 9],
    wordPool: ['sao', 'hoa', 'tho', 'voi', 'khi'],
    theme: { grass: 0xd6eeb0, grassDark: 0xb3dc90, night: 0.45, flowers: 0.5, deco: ['💎', '✨'] },
  },
  {
    id: 'final', title: 'Lâu đài mặt trăng', hero: 'pony', introAudio: 'intro_final', rescue: 'bac-hanh', rescueAudio: 'luna_thanks',
    island: { rx: 22, rz: 16 },
    start: [0, 5],
    monsters: [],
    gems: [],
    bubble: [0, -7],
    countRange: [3, 9],
    wordPool: ['meo', 'sao', 'hoa', 'cua', 'tho', 'vit', 'la', 'de', 'no', 'khi'],
    theme: { grass: 0x9aa6d8, grassDark: 0x7d88c4, night: 0.92, flowers: 0.25, deco: ['🌙', '⭐'] },
    final: true,
  },
];

/** Thứ tự 5 thử thách trận cuối + ngọc Hài Hoà tương ứng (ai giữ ngọc). */
export const HARMONY: { kind: ChallengeKind; name: string; color: number; owner: CastId; audio: string }[] = [
  { kind: 'spell', name: 'Trung thực', color: 0xff9a2e, owner: 'ong-cuong', audio: 'gem_1' },
  { kind: 'count', name: 'Tốt bụng', color: 0xffe066, owner: 'fluttershy', audio: 'gem_2' },
  { kind: 'spell', name: 'Vui vẻ', color: 0xff6fc8, owner: 'pinkie', audio: 'gem_3' },
  { kind: 'count', name: 'Hào phóng', color: 0x9b6bff, owner: 'me-yen', audio: 'gem_4' },
  { kind: 'spell', name: 'Trung thành', color: 0xff4d5e, owner: 'ba-cuong', audio: 'gem_5' },
];

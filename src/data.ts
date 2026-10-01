// Dữ liệu game 2: palette, từ vựng + token đánh vần, màn chơi.

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
} as const;

export interface SpellToken { audio: string; lit: number[] }
export interface WordDef { id: string; word: string; emoji: string; tokens: SpellToken[] }

/*
 * Đánh vần theo GDPT 2018: vần 2+ chữ đánh vần vần trước (e – o – eo), rồi tiếng
 * (mờ – eo – meo), rồi thanh (huyền – mèo). Gọi phụ âm theo ÂM (mờ, gờ, bờ...).
 * Khoá audio: v_ = vần/nguyên âm, c_ = phụ âm, s_ = tiếng chưa dấu, t_ = tên dấu, w_ = từ.
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
];

export const NUMBER_AUDIO = ['', 'n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8', 'n9', 'n10'];

export type HeroKind = 'pony' | 'human';
export type ChallengeKind = 'spell' | 'count';

export interface LevelDef {
  id: string;
  title: string;
  hero: HeroKind;
  introAudio: string;
  rescue: { name: string; emoji: string; audio: string };
  island: { rx: number; rz: number };          // bán trục ellipse của đảo
  start: [number, number];                     // vị trí xuất phát (x, z)
  monsters: { x: number; z: number; kind: ChallengeKind; color: number }[];
  gems: [number, number][];                    // (x, z) các viên ngọc
  bubble: [number, number];                    // bong bóng nhốt người thân
  countRange: [number, number];                // số ngọc quái giữ
  wordPool: string[];                          // id từ dùng cho màn
}

export const LEVELS: LevelDef[] = [
  {
    id: 'mun', title: 'Cứu mèo Mun', hero: 'pony', introAudio: 'intro_mun',
    rescue: { name: 'Mun', emoji: '🐈‍⬛', audio: 'rescued_mun' },
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
  },
  {
    id: 'rom', title: 'Cứu mèo Rơm', hero: 'human', introAudio: 'intro_rom',
    rescue: { name: 'Rơm', emoji: '🐈', audio: 'rescued_rom' },
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
  },
];

export const RESCUE_ORDER = [
  { id: 'mun', emoji: '🐈‍⬛', label: 'Mun' },
  { id: 'rom', emoji: '🐈', label: 'Rơm' },
  { id: 'me', emoji: '👩', label: 'Mẹ' },
  { id: 'ba', emoji: '👨', label: 'Ba' },
  { id: 'ba_noi', emoji: '👵', label: 'Bà' },
  { id: 'ong', emoji: '👴', label: 'Ông' },
];

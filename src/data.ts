// Dữ liệu game 5: palette, dàn nhân vật (cả nhà Nhím hoá pony + bạn bè), 4 chương truyện.
// Tên tiếng Anh CHỈ để hiện trên bảng tên (`role`), giọng đọc luôn gọi tên nhà (xem src/lines.ts).

export const PALETTE = {
  sky: 0xfff1df,
  skyTop: 0x9fd8ff,
  grassTop: 0xb8e986,
  grassDark: 0x8fd16a,
  sand: 0xf5dfae,
  water: 0x8fdcf5,
  hill: 0xa9e08c,
  hillFar: 0xc9efb5,
  cloud: 0xffffff,
  leaf: 0x7fd36a,
  grassProp: 0xa4e07c,
  bark: 0xd69b6b,
  magic: 0xc084fc,
  magicPink: 0xff7ac8,
  star: 0xffd166,
  ink: 0x3b3220,
  // trời đêm của Nữ hoàng Bóng Đêm: tím oải hương, không đen (bé 5 tuổi không sợ)
  nightSky: 0x9a86e0,
  nightSkyTop: 0x3a3a96,
  nightWater: 0x5a70c0,
  nightHill: 0x6b78bf,
  nightHillFar: 0x8a8fd2,
} as const;

// ------------------------------------------------------------------ dàn nhân vật

/** 12 bạn ngựa nhỏ được cứu (mỗi quái bóng tối giữ 1 bạn). Model bản nhẹ models/friends/lod/. */
export type FriendId =
  | 'pinkie' | 'fluttershy' | 'derpy' | 'minty'
  | 'babs' | 'applemint' | 'bigmac' | 'surprise'
  | 'cadance' | 'shining' | 'sunburst' | 'rainbowswirl';

export type FamilyId = 'me-yen' | 'ba-cuong' | 'ong-cuong' | 'ba-tuyet' | 'bac-hanh';
export type CastId = FamilyId | 'spike' | 'mun' | 'rom' | FriendId;

/** pony = auto-rig 4 chân, flyer = công chúa có xương sẵn (bay lơ lửng), dragon = Spike, cat = emoji. */
export type ActorKind = 'pony' | 'flyer' | 'dragon' | 'cat';

export interface CastDef {
  id: CastId;
  /** tên gọi trong nhà (hiện to trên bảng tên) */
  name: string;
  /** vai (tên tiếng Anh, CHỈ hiện chữ nhỏ dưới tên, không bao giờ đọc) */
  role: string;
  kind: ActorKind;
  model?: string;
  height: number;
  emoji: string;
  color: string;
  friend?: boolean;
  /** model có nhãn cầu trắng trơn (rip từ Source) → vẽ mống mắt lúc tải (src/eyes.ts). Bạn ngựa nhỏ đã vẽ sẵn
   *  vào file bằng scripts/bake-friends.mjs nên không cần. */
  eyes?: { mat: string; iris: number };
}

const fr = (id: FriendId, name: string, height: number, emoji: string, color: string, eyes?: CastDef['eyes']): CastDef => ({
  id, name, role: 'bạn ngựa nhỏ', kind: 'pony', model: `models/friends/lod/${id}.glb`, height, emoji, color, friend: true, eyes,
});

export const CAST: Record<CastId, CastDef> = {
  'me-yen': { id: 'me-yen', name: 'Mẹ Yến', role: 'Rarity', kind: 'pony', model: 'models/ponies/rarity.glb', height: 1.7, emoji: '💎', color: '#9b5de5' },
  'ba-cuong': { id: 'ba-cuong', name: 'Ba Cường', role: 'Rainbow Dash', kind: 'pony', model: 'models/ponies/rainbow.glb', height: 1.7, emoji: '⚡', color: '#2f9df5' },
  'ong-cuong': { id: 'ong-cuong', name: 'Ông Cương', role: 'Applejack', kind: 'pony', model: 'models/ponies/applejack.glb', height: 1.75, emoji: '🍎', color: '#e8892b' },
  'ba-tuyet': { id: 'ba-tuyet', name: 'Bà Tuyết', role: 'Công chúa Celestia', kind: 'flyer', model: 'models/ponies/celestia.glb', height: 2.5, emoji: '☀️', color: '#f2a900' },
  'bac-hanh': { id: 'bac-hanh', name: 'Bác Hanh', role: 'Công chúa Luna', kind: 'flyer', model: 'models/ponies/luna.glb', height: 2.3, emoji: '🌙', color: '#3b5bdb' },
  spike: { id: 'spike', name: 'Spike', role: 'bạn rồng nhỏ', kind: 'dragon', model: 'models/ponies/spike.glb', height: 1.05, emoji: '🐲', color: '#7cb342' },
  mun: { id: 'mun', name: 'Mèo Mun', role: 'mèo đen', kind: 'cat', height: 0.9, emoji: '🐈‍⬛', color: '#5a4b6e' },
  rom: { id: 'rom', name: 'Mèo Rơm', role: 'mèo vàng', kind: 'cat', height: 0.9, emoji: '🐈', color: '#d9a441' },
  pinkie: fr('pinkie', 'Pinkie Pie', 1.35, '🎈', '#ff5fb4'),
  fluttershy: fr('fluttershy', 'Fluttershy', 1.35, '🦋', '#e6b800'),
  derpy: fr('derpy', 'Derpy', 1.3, '📮', '#9aa3b5'),
  minty: fr('minty', 'Minty', 1.25, '🍬', '#4cc79a'),
  babs: fr('babs', 'Babs Seed', 1.15, '🌱', '#d9663a'),
  applemint: fr('applemint', 'Bạc Hà', 1.25, '🍏', '#6dbb3c'),
  bigmac: fr('bigmac', 'Big Mac', 1.6, '🍎', '#d4373f'),
  surprise: fr('surprise', 'Surprise', 1.35, '🎁', '#e0b52c'),
  cadance: fr('cadance', 'Cadance', 1.6, '💖', '#ff8fc8'),
  shining: fr('shining', 'Shining Armor', 1.6, '🛡️', '#4a6fd1'),
  sunburst: fr('sunburst', 'Sunburst', 1.4, '🔮', '#e86a2a'),
  rainbowswirl: fr('rainbowswirl', 'Cầu Vồng', 1.3, '🌈', '#4fb3ff'),
};

/** Hàng đi theo tối đa (đi hàng đôi). */
export const MAX_PARADE = 12;

// ------------------------------------------------------------------ chương

export type MonsterKind = 'slime_jt' | 'slime' | 'slime_horn' | 'ghost' | 'goblin' | 'dragon' | 'dragon_ev' | 'wizard' | 'witch';
export type CineId =
  | 'prologue' | 'c1_intro' | 'c1_mid' | 'c2_intro' | 'c2_mid' | 'c3_intro' | 'c3_mid'
  | 'f_intro' | 'climax' | 'ending';

/** Một nhịp trong chương. Vị trí (x, z) trên đảo; đảo dài theo trục x, đi từ trái sang phải. */
export type Beat =
  | { t: 'cine'; id: CineId }
  /** săn sao chữ: bé điều khiển Twilight chạm vào sao đúng chữ. `decoys`: sao mồi (không phải đáp án) */
  | { t: 'hunt'; x: number; z: number; letters: string[]; decoys: string[]; monster: MonsterKind; friend: FriendId }
  /** cầu gãy qua suối ở x: chạm tấm ván đúng chữ */
  | { t: 'bridge'; x: number; letters: string[]; decoys: string[] }
  /** cổng khoá ở x: ổ khoá hiện chữ, chạm sao đúng */
  | { t: 'lock'; x: number; letters: string[]; monster: MonsterKind; friend: FriendId }
  /** ghép chữ bằng phép */
  | { t: 'spell'; x: number; z: number; words: string[]; monster?: MonsterKind; friend?: FriendId }
  /** cảnh cứu người nhà ở cuối chương (lồng / bong bóng), `word`: phải ghép từ này để mở */
  | { t: 'rescue'; x: number; z: number; word?: string }
  | { t: 'review' }
  | { t: 'album' };

export interface ChapterTheme {
  grass: number;
  grassDark: number;
  /** 0 = ngày, 1 = đêm sâu */
  night: number;
  /** kiểu cảnh: rừng / làng / thành phố lâu đài / trận cuối */
  scene: 'forest' | 'village' | 'castle' | 'battle';
  flowers: number;
}

export interface ChapterDef {
  n: 1 | 2 | 3 | 4;
  /** tên hiện chữ (được phép có tên tiếng Anh vì chỉ hiện, không đọc) */
  title: string;
  sub: string;
  /** người được cứu ở chương này */
  rescue: CastId[];
  island: { rx: number; rz: number };
  start: [number, number];
  theme: ChapterTheme;
  /** chữ cái chương này dạy (để bảng chữ + ôn) */
  letters: string[];
  beats: Beat[];
}

export const CHAPTERS: ChapterDef[] = [
  {
    n: 1, title: 'Rừng Everfree', sub: 'Cứu mèo Mun và mèo Rơm', rescue: ['mun', 'rom'],
    island: { rx: 38, rz: 15 }, start: [-32, 2],
    theme: { grass: 0xa8e07a, grassDark: 0x7fcc62, night: 0.32, scene: 'forest', flowers: 0.35 },
    letters: ['a', 'ă', 'â', 'e', 'ê', 'i', 'o', 'ô', 'ơ', 'u', 'ư', 'y'],
    beats: [
      { t: 'cine', id: 'c1_intro' },
      { t: 'hunt', x: -21, z: 0, letters: ['a', 'o', 'ô'], decoys: ['e'], monster: 'slime_jt', friend: 'pinkie' },
      { t: 'bridge', x: -11, letters: ['e', 'ê'], decoys: ['a'] },
      { t: 'cine', id: 'c1_mid' },
      { t: 'hunt', x: -1, z: 0, letters: ['ơ', 'u', 'ư'], decoys: ['o'], monster: 'ghost', friend: 'fluttershy' },
      { t: 'lock', x: 9, letters: ['ă', 'â'], monster: 'slime_horn', friend: 'minty' },
      { t: 'hunt', x: 19, z: 0, letters: ['i', 'y'], decoys: ['u', 'ê'], monster: 'slime', friend: 'derpy' },
      { t: 'rescue', x: 30, z: -1 },
      { t: 'review' },
      { t: 'album' },
    ],
  },
  {
    n: 2, title: 'Ponyville', sub: 'Cứu ba Cường và mẹ Yến', rescue: ['ba-cuong', 'me-yen'],
    island: { rx: 38, rz: 15 }, start: [-32, 2],
    theme: { grass: 0xb4e68a, grassDark: 0x8ed46c, night: 0.26, scene: 'village', flowers: 0.6 },
    letters: ['b', 'c', 'd', 'đ', 'h', 'l', 'm', 'n'],
    beats: [
      { t: 'cine', id: 'c2_intro' },
      { t: 'hunt', x: -21, z: 0, letters: ['c', 'd', 'đ'], decoys: ['o'], monster: 'goblin', friend: 'babs' },
      { t: 'spell', x: -11, z: 0, words: ['ca', 'đa'], monster: 'dragon', friend: 'applemint' },
      { t: 'cine', id: 'c2_mid' },
      { t: 'hunt', x: -1, z: 0, letters: ['h', 'l', 'm', 'n'], decoys: [], monster: 'dragon_ev', friend: 'bigmac' },
      { t: 'lock', x: 9, letters: ['b'], monster: 'goblin', friend: 'surprise' },
      { t: 'spell', x: 18, z: 0, words: ['ma', 'na', 'la'] },
      { t: 'rescue', x: 29, z: -1, word: 'ba' },
      { t: 'review' },
      { t: 'album' },
    ],
  },
  {
    n: 3, title: 'Canterlot', sub: 'Cứu ông Cương và bà Tuyết', rescue: ['ong-cuong', 'ba-tuyet'],
    island: { rx: 38, rz: 15 }, start: [-32, 2],
    theme: { grass: 0xbdeaa0, grassDark: 0x97d880, night: 0.3, scene: 'castle', flowers: 0.45 },
    letters: ['g', 'k', 'p', 'q', 'r', 's', 't', 'v', 'x'],
    beats: [
      { t: 'cine', id: 'c3_intro' },
      { t: 'hunt', x: -21, z: 0, letters: ['g', 'k', 'r'], decoys: ['h'], monster: 'wizard', friend: 'cadance' },
      { t: 'spell', x: -11, z: 0, words: ['cá', 'bò'], monster: 'witch', friend: 'shining' },
      { t: 'cine', id: 'c3_mid' },
      { t: 'hunt', x: -1, z: 0, letters: ['p', 'q', 's', 't'], decoys: [], monster: 'witch', friend: 'sunburst' },
      { t: 'bridge', x: 9, letters: ['v', 'x'], decoys: ['s'] },
      { t: 'spell', x: 18, z: 0, words: ['mẹ', 'vẽ', 'tô'], monster: 'wizard', friend: 'rainbowswirl' },
      { t: 'rescue', x: 29, z: -1, word: 'bà' },
      { t: 'review' },
      { t: 'album' },
    ],
  },
  {
    n: 4, title: 'Trận Canterlot', sub: 'Cứu bác Hanh', rescue: ['bac-hanh'],
    island: { rx: 26, rz: 17 }, start: [0, 5],
    theme: { grass: 0x9eaee0, grassDark: 0x8090cc, night: 0.9, scene: 'battle', flowers: 0.25 },
    letters: [],
    beats: [],
  },
];

/** Bạn ngựa nhỏ cứu được ở mỗi chương (theo thứ tự). */
export const FRIENDS_OF = (n: number): FriendId[] =>
  n > 3 ? [] : CHAPTERS[n - 1].beats.flatMap((b) => ('friend' in b && b.friend ? [b.friend] : []));
export const ALL_FRIENDS: FriendId[] = [1, 2, 3].flatMap((n) => FRIENDS_OF(n));

/** Người nhà đã được cứu khi bắt đầu chương n (các chương trước). */
export function familyBefore(n: number): CastId[] {
  return CHAPTERS.filter((c) => c.n < n).flatMap((c) => c.rescue);
}

/** 5 vòng Hài Hoà trận cuối. */
export interface HarmonyRound {
  kind: 'letters' | 'word';
  /** ghép: từ */
  word?: string;
  /** tìm chữ: số chữ phải tìm */
  count?: number;
  /** ai ra chiêu khi đúng */
  hero: 'ong-cuong' | 'friends' | 'ba-cuong' | 'me-yen' | 'ba-tuyet';
  color: number;
  name: string;
}
export const HARMONY: HarmonyRound[] = [
  { kind: 'letters', count: 2, hero: 'ong-cuong', color: 0xff9a2e, name: 'Trung thực' },
  { kind: 'letters', count: 2, hero: 'friends', color: 0xffe066, name: 'Tốt bụng' },
  { kind: 'word', word: 'ba', hero: 'ba-cuong', color: 0xff4d5e, name: 'Trung thành' },
  { kind: 'word', word: 'mẹ', hero: 'me-yen', color: 0x9b6bff, name: 'Hào phóng' },
  { kind: 'word', word: 'bà', hero: 'ba-tuyet', color: 0xff6fc8, name: 'Vui vẻ' },
];

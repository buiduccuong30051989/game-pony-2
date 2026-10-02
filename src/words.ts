// Từ game cho bé ghép bằng phép (chương 2, 3, trận cuối). Mọi từ ở đây PHẢI có đáp án trong bảng vàng
// scripts/check-spelling.mjs. File THUẦN (Node đọc được).
export interface GameWord {
  word: string;
  /** emoji hiện ra sau khi ghép xong (người nhà thì null: chính người đó xuất hiện) */
  emoji: string | null;
  /** câu nói sau khi ghép xong: [khoá audio, chữ] */
  after: [string, string];
}

export const WORDS: Record<string, GameWord> = {
  ba: { word: 'ba', emoji: null, after: ['wa_ba', 'Ba đây! Ba đây!'] },
  ca: { word: 'ca', emoji: '☕', after: ['wa_ca', 'Cái ca uống nước!'] },
  'đa': { word: 'đa', emoji: '🌳', after: ['wa_dda', 'Cây đa thật to!'] },
  ma: { word: 'ma', emoji: '👻', after: ['wa_ma', 'Bạn ma nhỏ, hiền khô à!'] },
  na: { word: 'na', emoji: '🍈', after: ['wa_na', 'Quả na ngọt lịm!'] },
  la: { word: 'la', emoji: '🎵', after: ['wa_la', 'Nốt la, la la la!'] },
  'bà': { word: 'bà', emoji: null, after: ['wa_baf', 'Bà đây! Bà đây!'] },
  'cá': { word: 'cá', emoji: '🐟', after: ['wa_cas', 'Con cá bơi tung tăng!'] },
  'bò': { word: 'bò', emoji: '🐄', after: ['wa_bof', 'Con bò kêu ò ò!'] },
  'mẹ': { word: 'mẹ', emoji: null, after: ['wa_mej', 'Mẹ đây! Mẹ thương Nhím!'] },
  'vẽ': { word: 'vẽ', emoji: '🎨', after: ['wa_vex', 'Nhím thích vẽ tranh!'] },
  'tô': { word: 'tô', emoji: '🥣', after: ['wa_too', 'Cái tô đựng canh!'] },
};
export const GAME_WORDS = Object.keys(WORDS);

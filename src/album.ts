// Album ảnh thật của Nhím: sau mỗi chương mở 1 trang (khung Equestria cầu vồng + sao + mặt người vừa cứu),
// người kể đọc chú thích. Kết game: ảnh lớn "Nhím đã cứu cả nhà!" + pháo hoa, rồi cả cuốn "Cuốn sách phiêu lưu của Nhím".
// Ảnh luôn qua canvas (src/photos.ts) → không EXIF; thiếu ảnh thì chân dung Twilight vẽ tay.
import { photoUrl, firstPhoto, extraPhotos } from './photos';
import { avatarEl, narrate, type Speaker } from './talk';
import { stopSpeech } from './audio';
import { confetti } from './ui';
import { wait } from './tween';

const $ = <T extends HTMLElement>(s: string) => document.querySelector<T>(s)!;

export interface AlbumPage {
  photo: string | null;
  title: string;
  caption: string;
  /** khoá audio người kể đọc chú thích */
  key: string;
  faces: Speaker[];
  stickers: string;
}

/** Trang album của chương n. */
export function chapterPage(n: number): AlbumPage {
  switch (n) {
    case 1: return { photo: firstPhoto('with-cats', 'nhim-2', 'nhim-1'), title: 'Rừng Everfree', caption: 'Nhím và hai bạn mèo lại ở bên nhau rồi!', key: 'al_1', faces: ['mun', 'rom'], stickers: '🐾🌲🍄⭐' };
    case 2: return { photo: firstPhoto('with-ba-me', 'nhim-2', 'nhim-1'), title: 'Ponyville', caption: 'Nhím và ba mẹ lại ở bên nhau rồi!', key: 'al_2', faces: ['ba-cuong', 'me-yen'], stickers: '🏡🌸💎⚡' };
    case 3: return { photo: firstPhoto('with-ong-ba', 'nhim-1', 'nhim-2'), title: 'Canterlot', caption: 'Nhím và ông bà lại ở bên nhau rồi!', key: 'al_3', faces: ['ong-cuong', 'ba-tuyet'], stickers: '🏰☀️🍎👑' };
    default: return { photo: firstPhoto('with-bac-hanh', 'ca-nha', 'nhim-1'), title: 'Trận Canterlot', caption: 'Nhím và bác Hanh, cả nhà sum vầy!', key: 'al_4', faces: ['bac-hanh', 'ba-tuyet'], stickers: '🌙🌈💖✨' };
  }
}

async function fill(page: AlbumPage, big = false): Promise<void> {
  const root = $('#album-page');
  root.classList.toggle('cover', big);
  $('#album-title').textContent = page.title;
  $('#album-caption').textContent = page.caption;
  const st = $('#album-stickers');
  st.innerHTML = '';
  const seg = new Intl.Segmenter('vi', { granularity: 'grapheme' });
  for (const { segment } of seg.segment(page.stickers)) {
    const sp = document.createElement('span');
    sp.textContent = segment;
    st.appendChild(sp);
  }
  const faces = $('#album-faces');
  faces.innerHTML = '';
  for (const f of page.faces) faces.appendChild(avatarEl(f, 'al-ava'));
  const img = $<HTMLImageElement>('#album-photo');
  img.src = await photoUrl(page.photo, 3 / 4, 800);
  root.classList.remove('flip'); void root.offsetWidth; root.classList.add('flip');
}

function open(): void {
  const ov = $('#album');
  ov.hidden = false;
  ov.classList.remove('hide');
}
function close(): void {
  const ov = $('#album');
  ov.classList.add('hide');
  setTimeout(() => (ov.hidden = true), 400);
  stopSpeech();
}

/** 1 trang (cuối chương): đọc chú thích, chờ bé chạm ▶ (auto: tự sang). */
export async function showAlbumPage(page: AlbumPage, auto = false): Promise<void> {
  await fill(page);
  $('#album-prev').hidden = true;
  open();
  confetti(40);
  await narrate(page.key, page.caption);
  if (auto) { await wait(600); close(); return; }
  await new Promise<void>((r) => {
    const next = $<HTMLButtonElement>('#album-next');
    const x = $<HTMLButtonElement>('#album-close');
    next.onclick = x.onclick = () => r();
  });
  close();
}

/** Cả cuốn sách phiêu lưu (kết game / nút album ở bản đồ). */
export async function showAlbumBook(done: number[], auto = false): Promise<void> {
  const pages: AlbumPage[] = [
    { photo: firstPhoto('nhim-1', 'nhim-2'), title: 'Cuốn sách phiêu lưu của Nhím', caption: 'Cuốn sách phiêu lưu của Nhím.', key: 'al_cover', faces: ['twilight', 'spike'], stickers: '📖🦄🌈⭐' },
    ...[1, 2, 3, 4].filter((n) => done.includes(n)).map(chapterPage),
  ];
  if (firstPhoto('ca-nha') && done.includes(4)) pages.push({ photo: 'ca-nha', title: 'Cả nhà', caption: 'Thêm một kỷ niệm thật đẹp của Nhím.', key: 'al_extra', faces: ['me-yen', 'ba-cuong', 'ong-cuong', 'ba-tuyet', 'bac-hanh'], stickers: '💖🏡💖' });
  for (const ex of extraPhotos()) pages.push({ photo: ex, title: 'Kỷ niệm', caption: 'Thêm một kỷ niệm thật đẹp của Nhím.', key: 'al_extra', faces: ['twilight'], stickers: '🌟💖🌟' });
  let i = 0;
  open();
  const prev = $<HTMLButtonElement>('#album-prev');
  const next = $<HTMLButtonElement>('#album-next');
  const x = $<HTMLButtonElement>('#album-close');
  await new Promise<void>((resolve) => {
    const show = async (k: number) => {
      i = Math.max(0, Math.min(pages.length - 1, k));
      prev.hidden = i === 0;
      await fill(pages[i], i === 0);
      stopSpeech();
      void narrate(pages[i].key, pages[i].caption);
      if (auto) setTimeout(() => (i < pages.length - 1 ? void show(i + 1) : resolve()), 1200);
    };
    prev.onclick = () => void show(i - 1);
    next.onclick = () => (i < pages.length - 1 ? void show(i + 1) : resolve());
    x.onclick = () => resolve();
    void show(0);
  });
  close();
}

/** Ảnh lớn "Nhím đã cứu cả nhà!" + pháo hoa DOM. */
export async function showBigPhoto(auto = false): Promise<void> {
  const ov = $('#bigphoto');
  $<HTMLImageElement>('#bigphoto-img').src = await photoUrl(firstPhoto('nhim-1', 'nhim-2'), 3 / 4, 800);
  const fam = $('#bigphoto-fam');
  fam.innerHTML = '';
  for (const id of ['me-yen', 'ba-cuong', 'ong-cuong', 'ba-tuyet', 'bac-hanh', 'mun', 'rom', 'spike'] as Speaker[]) fam.appendChild(avatarEl(id, 'bp-ava'));
  ov.hidden = false;
  ov.classList.remove('hide');
  const fw = setInterval(() => confetti(25), 700);
  confetti(80);
  await narrate('e_5');
  await new Promise<void>((r) => {
    $<HTMLButtonElement>('#bigphoto-next').onclick = () => r();
    if (auto) setTimeout(r, 800);
  });
  clearInterval(fw);
  ov.classList.add('hide');
  setTimeout(() => (ov.hidden = true), 400);
}

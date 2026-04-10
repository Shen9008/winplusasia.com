/**
 * Download stock photos for "Hot right now" cards (Unsplash License — https://unsplash.com/license).
 * Run: node scripts/fetch-game-card-images.mjs
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'images', 'webp', 'cards');

const cards = [
  {
    file: 'gates-of-olympus.webp',
    unsplashPhotoId: '1706129867447-b4f156c46641',
    note: 'Casino slot floor — unsplash.com/photos/a-casino-room-filled-with-lots-of-slot-machines-fgwlWRwRf5g',
  },
  {
    file: 'sweet-bonanza.webp',
    unsplashPhotoId: '1633158832466-be592c721217',
    note: 'Colorful candies — unsplash.com/photos/a-close-up-of-a-pile-of-colorful-candies-33taMhUiF0I',
  },
  {
    file: 'book-of-dead.webp',
    unsplashPhotoId: '1722684526355-0d196f28d9e6',
    note: 'Egypt-themed mural — unsplash.com/photos/ancient-egyptian-gods-and-figures-in-colorful-mural-c-wf-F2nPjo',
  },
  {
    file: 'lightning-roulette.webp',
    unsplashPhotoId: '1714865212807-3ae87635a38d',
    note: 'Roulette table — unsplash.com/photos/a-man-is-playing-a-game-of-roule-on-a-green-table-9F-qHniQxQc',
  },
  {
    file: 'crazy-time.webp',
    unsplashPhotoId: '1643105417496-da952aa015fa',
    note: 'Colorful screens / studio vibe — unsplash.com/photos/a-group-of-tvs-sitting-next-to-each-other-AQ7SAZOi32I',
  },
  {
    file: 'mega-wheel.webp',
    unsplashPhotoId: '1705567250740-479ea13e5449',
    note: 'Colorful circular wheel — unsplash.com/photos/a-close-up-of-a-colorful-clock-on-the-side-of-a-building-T0jB-xDSUks',
  },
  {
    file: 'baccarat-squeeze.webp',
    unsplashPhotoId: '1636583133884-fbefc7ac3fb3',
    note: 'Playing cards — unsplash.com/photos/four-of-a-kind-of-playing-cards-with-a-red-heart--kTQitsL0Is',
  },
  {
    file: 'blackjack-azure.webp',
    unsplashPhotoId: '1767215478527-c5c59ef06799',
    note: 'Casino floor — unsplash.com/photos/people-walking-through-a-busy-casino-gaming-floor-4elLKgH875w',
  },
];

function cdnUrl(photoId) {
  return `https://images.unsplash.com/photo-${photoId}?fm=jpg&w=960&h=400&fit=crop&q=85`;
}

fs.mkdirSync(outDir, { recursive: true });

for (const c of cards) {
  const url = cdnUrl(c.unsplashPhotoId);
  const res = await fetch(url);
  if (!res.ok) {
    console.error('Fetch failed', c.file, res.status, url);
    process.exit(1);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const dest = path.join(outDir, c.file);
  await sharp(buf)
    .resize(640, 220, { fit: 'cover', position: 'attention' })
    .webp({ quality: 84, effort: 5 })
    .toFile(dest);
  console.log('OK', path.relative(root, dest), '←', c.note);
}

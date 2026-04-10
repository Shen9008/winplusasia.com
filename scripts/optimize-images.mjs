/**
 * Convert images/images subfolders to optimized WebP under images/webp/
 * and write root favicon.webp from images/favicon.png
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const imagesDir = path.join(root, 'images');
const outDir = path.join(imagesDir, 'webp');

fs.mkdirSync(outDir, { recursive: true });

const tasks = [
  ['favicon.png', 'favicon.webp', { width: 128 }],
  ['logo.png', 'logo.webp', { width: 320 }],
  ['Game Icon/Slots.png', 'icon-slots.webp', { width: 480 }],
  ['Game Icon/baccarat.png', 'icon-baccarat.webp', { width: 480 }],
  ['Game Icon/football.png', 'icon-football.webp', { width: 480 }],
  ['Hero Banner/Home.jpg', 'hero-home.webp', { width: 960 }],
  ['Hero Banner/slots.jpg', 'hero-slots.webp', { width: 960 }],
  ['Hero Banner/live casino.jpg', 'hero-live-casino.webp', { width: 960 }],
  ['Hero Banner/sports.jpg', 'hero-sports.webp', { width: 960 }],
  ['Hero Banner/promos.jpg', 'hero-promos.webp', { width: 960 }],
  ['Hero Banner/help.jpg', 'hero-help.webp', { width: 960 }],
  ['Promo Banner/welcome boost.jpg', 'promo-welcome-boost.webp', { width: 900 }],
  ['Promo Banner/weekend reloads.jpg', 'promo-weekend-reloads.webp', { width: 900 }],
  ['Promo Banner/live cashback.jpg', 'promo-live-cashback.webp', { width: 900 }],
  ['Promo Banner/vip lane.jpg', 'promo-vip-lane.webp', { width: 900 }],
];

for (const [src, dest, opts] of tasks) {
  const srcPath = path.join(imagesDir, src);
  if (!fs.existsSync(srcPath)) {
    console.warn('Missing source, skip:', srcPath);
    continue;
  }
  const destPath = path.join(outDir, dest);
  await sharp(srcPath)
    .resize({ width: opts.width, withoutEnlargement: true, fit: 'inside' })
    .webp({ quality: 82, effort: 5 })
    .toFile(destPath);
  console.log('OK', dest, '←', src);
}

const favSrc = path.join(imagesDir, 'favicon.png');
if (fs.existsSync(favSrc)) {
  await sharp(favSrc)
    .resize(48, 48, { fit: 'cover' })
    .webp({ quality: 88 })
    .toFile(path.join(root, 'favicon.webp'));
  console.log('OK favicon.webp (root)');
}

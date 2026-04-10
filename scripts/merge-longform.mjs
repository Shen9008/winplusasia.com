/**
 * Insert partials/longform-<page>.html immediately before </main> (static SEO copy).
 * Idempotent: replaces existing <!-- longform:start -->...<!-- longform:end --> block.
 * Run: node scripts/merge-longform.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const pages = [
  ['index.html', 'index'],
  ['products.html', 'products'],
  ['promotions.html', 'promotions'],
  ['about-us.html', 'about'],
  ['help-center.html', 'help'],
  ['contact.html', 'contact'],
  ['privacy-policy.html', 'privacy'],
  ['terms-conditions.html', 'terms'],
  ['responsible-gaming.html', 'responsible'],
  ['editorial-policy.html', 'editorial'],
];

function insertBeforeMainClose(html, inner) {
  const block = `<!-- longform:start -->\n${inner.trim()}\n<!-- longform:end -->\n`;
  let out = html.replace(/<!-- longform:start -->[\s\S]*?<!-- longform:end -->\s*/g, '');
  const idx = out.lastIndexOf('</main>');
  if (idx === -1) throw new Error('</main> not found');
  return out.slice(0, idx) + block + out.slice(idx);
}

for (const [file, key] of pages) {
  const pagePath = path.join(root, file);
  const fragPath = path.join(root, 'partials', `longform-${key}.html`);
  if (!fs.existsSync(pagePath)) {
    console.warn('Skip missing page:', file);
    continue;
  }
  if (!fs.existsSync(fragPath)) {
    console.warn('Skip missing fragment:', fragPath);
    continue;
  }
  const inner = fs.readFileSync(fragPath, 'utf8');
  let html = fs.readFileSync(pagePath, 'utf8');
  try {
    html = insertBeforeMainClose(html, inner);
    fs.writeFileSync(pagePath, html);
    console.log('OK', file);
  } catch (e) {
    console.error('FAIL', file, e.message);
  }
}

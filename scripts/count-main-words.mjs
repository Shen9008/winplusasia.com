import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const files = [
  'index.html',
  'products.html',
  'promotions.html',
  'about-us.html',
  'help-center.html',
  'contact.html',
  'privacy-policy.html',
  'terms-conditions.html',
  'responsible-gaming.html',
  'editorial-policy.html',
];

function strip(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

for (const f of files) {
  const t = fs.readFileSync(path.join(root, f), 'utf8');
  const m = t.match(/<main[^>]*>([\s\S]*)<\/main>/i);
  const w = m ? strip(m[1]).split(/\s+/).filter(Boolean).length : 0;
  console.log(`${f}: ${w}`);
}

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const map = [
  [/href="index\.html"/g, 'href="/"'],
  [/href="\/index\.html"/g, 'href="/"'],
  [/href="products\.html/g, 'href="/products'],
  [/href="\/products\.html"/g, 'href="/products"'],
  [/href="promotions\.html/g, 'href="/promotions'],
  [/href="\/promotions\.html"/g, 'href="/promotions"'],
  [/href="about-us\.html/g, 'href="/about-us'],
  [/href="\/about-us\.html"/g, 'href="/about-us"'],
  [/href="editorial-policy\.html/g, 'href="/editorial-policy'],
  [/href="\/editorial-policy\.html"/g, 'href="/editorial-policy"'],
  [/href="privacy-policy\.html/g, 'href="/privacy-policy'],
  [/href="\/privacy-policy\.html"/g, 'href="/privacy-policy"'],
  [/href="contact\.html/g, 'href="/contact'],
  [/href="\/contact\.html"/g, 'href="/contact"'],
  [/href="help-center\.html/g, 'href="/help-center'],
  [/href="\/help-center\.html"/g, 'href="/help-center"'],
  [/href="terms-conditions\.html/g, 'href="/terms-conditions'],
  [/href="\/terms-conditions\.html"/g, 'href="/terms-conditions"'],
  [/href="responsible-gaming\.html/g, 'href="/responsible-gaming'],
  [/href="\/responsible-gaming\.html"/g, 'href="/responsible-gaming"'],
  [/href="blog\/index\.html"/g, 'href="/blog"'],
  [/href="\/blog\/index\.html"/g, 'href="/blog"'],
  [/href="\/blog\/"/g, 'href="/blog"'],
];

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '.git') continue;
      walk(p, out);
    } else if (/\.html$/.test(name)) out.push(p);
  }
  return out;
}

let changed = 0;
for (const file of walk(root)) {
  let c = fs.readFileSync(file, 'utf8');
  const orig = c;
  for (const [re, rep] of map) c = c.replace(re, rep);
  if (c !== orig) {
    fs.writeFileSync(file, c);
    changed++;
    console.log(path.relative(root, file));
  }
}
console.log(`Updated ${changed} files`);

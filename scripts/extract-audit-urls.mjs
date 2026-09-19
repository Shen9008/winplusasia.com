import fs from 'fs';

const x = fs.readFileSync(new URL('../seo-audit-report-after.xml', import.meta.url), 'utf8');
const rules = [
  'content-word-count',
  'core-canonical-to-homepage',
  'content-duplicate-near',
  'url-slug-keywords',
  'content-duplicate-h1',
  'core-title-unique',
  'content-duplicate-exact',
  'geo-content-structure',
];

for (const rule of rules) {
  const re = new RegExp(`rule="${rule}"[\\s\\S]*?<on>([^<]+)</on>`, 'g');
  const urls = [];
  let m;
  while ((m = re.exec(x))) urls.push(m[1]);
  console.log(`\n${rule} (${urls.length}):`);
  [...new Set(urls)].slice(0, 10).forEach((u) => console.log(' ', u));
}

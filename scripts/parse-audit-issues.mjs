import fs from 'fs';

const x = fs.readFileSync(new URL('../seo-audit-report-after.xml', import.meta.url), 'utf8');

const rules = [...x.matchAll(/<rule id="([^"]+)" status="(fail|warn)"[^>]*>([\s\S]*?)<\/rule>/g)];
const targets = ['content-duplicate', 'content-word', 'core-canonical', 'core-title', 'geo-content', 'url-slug', 'technical-trailing'];

for (const r of rules) {
  if (!targets.some((t) => r[1].includes(t))) continue;
  const urls = [...r[3].matchAll(/url="([^"]+)"/g)].map((m) => m[1]);
  console.log(`\n${r[1]} [${r[2]}] (${urls.length} urls)`);
  for (const u of urls.slice(0, 8)) console.log(' ', u);
  const msg = r[3].match(/message="([^"]+)"/)?.[1];
  if (msg) console.log(' ', msg.slice(0, 120));
}

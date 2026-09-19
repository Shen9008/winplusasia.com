import fs from 'fs';

for (const f of ['seo-audit-report.xml', 'seo-audit-report-after.xml']) {
  const x = fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
  const m = x.match(/score="(\d+)" grade="(\w)" pages="(\d+)"/);
  console.log(`\n${f}`);
  console.log(`Overall: ${m[1]} (${m[2]}) — ${m[3]} pages crawled`);
  console.log(`Summary: ${x.match(/<summary passed="(\d+)" warnings="(\d+)" failures="(\d+)"/)?.slice(1).join(' pass / ') ?? 'n/a'} fail`);
  for (const c of x.matchAll(/<cat id="([^"]+)" score="(\d+)"/g)) {
    console.log(`  ${c[1].padEnd(16)} ${c[2]}`);
  }
  const rules = [...x.matchAll(/<rule id="([^"]+)"[^>]*status="(fail|warn)"[^>]*(?:count="(\d+)")?/g)]
    .map((m) => ({ id: m[1], status: m[2], count: Number(m[3] || 1) }))
    .sort((a, b) => b.count - a.count);
  const fails = rules.filter((r) => r.status === 'fail').slice(0, 10);
  const warns = rules.filter((r) => r.status === 'warn').slice(0, 8);
  if (fails.length) {
    console.log('  Top failures:');
    for (const fnd of fails) console.log(`    - ${fnd.id} (${fnd.count})`);
  }
  if (warns.length) {
    console.log('  Top warnings:');
    for (const w of warns) console.log(`    - ${w.id} (${w.count})`);
  }
}

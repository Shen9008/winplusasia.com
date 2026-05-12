'use strict';

/**
 * One-off / maintenance: strip trailing slashes from blog post URLs in published
 * article HTML and fix known bad host. Keeps /blog (index) without a trailing slash.
 */

const fs = require('fs');
const path = require('path');
const { getSiteOrigin } = require('./lib/site-url.js');

const ROOT = path.resolve(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'blog');

function listArticlePaths() {
  const out = [];
  for (const e of fs.readdirSync(BLOG_DIR, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const p = path.join(BLOG_DIR, e.name, 'index.html');
    if (fs.existsSync(p)) out.push(p);
  }
  return out;
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeContent(html, origin) {
  let s = html;
  try {
    const { hostname } = new URL(origin);
    s = s.replace(/pgasiagames\.com/gi, hostname);
  } catch {
    s = s.replace(/https:\/\/pgasiagames\.com/gi, origin);
  }

  const o = escapeRe(origin);
  // .../blog/slug/ immediately before closing quote on abs URLs (canonical, JSON-LD, etc.)
  s = s.replace(new RegExp(`(${o}/blog/[a-z0-9-]+)/(?=["'])`, 'gi'), '$1');
  // Any HTTPS blog post URL trailing slash before quote (captures redirects / odd hosts too)
  s = s.replace(/\b(https?:\/\/[^"'\\s<>]+?\/blog\/[a-z0-9-]+)\/(?=["'])/gi, '$1');

  // Blog hub: ...com/blog/" -> ...com/blog"
  s = s.replace(new RegExp(`(${o})/blog/(?=["'])`, 'gi'), '$1/blog');

  // Root-relative article links in prose/nav
  s = s.replace(/href="(\/blog\/[a-z0-9-]+)\/(?=")/gi, 'href="$1"');
  s = s.replace(/href="\/blog\/"(?=>)/gi, 'href="/blog"');

  // Encoded URLs in share intents: ...%2Fblog%2Fslug%2F before & … or closing "
  s = s.replace(/(blog%2[Ff][a-z0-9-]+)%2[Ff](?=(?:%26|&(?:amp;)?|%22|"))/gi, '$1');

  return s;
}

function run() {
  const origin = getSiteOrigin();
  const paths = listArticlePaths();
  let touched = 0;
  for (const p of paths) {
    const before = fs.readFileSync(p, 'utf8');
    const after = normalizeContent(before, origin);
    if (after !== before) {
      fs.writeFileSync(p, after, 'utf8');
      touched++;
      console.log(`Updated ${path.relative(ROOT, p)}`);
    }
  }
  console.log(`Done. ${touched}/${paths.length} file(s) changed.`);
}

run();

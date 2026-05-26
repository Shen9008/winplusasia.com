'use strict';

const fs = require('fs');
const path = require('path');
const { fetchPosts, assertStrictSiteFilter } = require('./lib/fetch-posts.js');
const { normalizePost, validatePost } = require('./lib/normalize-post.js');
const { renderArticle } = require('./lib/render-article.js');
const { generateSitemap } = require('./lib/generate-sitemap.js');
const { hashContent } = require('./lib/content-hash.js');
const {
  getBrandTokenFromDomain,
  isAllowedSlug,
  pruneInvalidSlugs,
  sanitizeRelatedPosts,
} = require('./lib/slug-guard.js');

const ROOT = path.resolve(__dirname, '..');
const BLOGS_JSON_PATH = path.join(ROOT, 'assets/data/blogs.json');
const BLOG_DIR = path.join(ROOT, 'blog');

const BLOGS_JSON_FIELDS = [
  'slug', 'title', 'meta_title', 'meta_description', 'focus_keyword',
  'category', 'search_intent', 'published_date', 'reading_time',
  'excerpt', 'placeholder_gradient', 'related_posts', 'keywords',
  'featured_image',
  'cms_updated_at',
  'content_hash',
  'synced_at',
];

const { sortBlogsByLatestSyncFirst } = require('./lib/blog-sort.js');

function parseArgs(argv) {
  const all = argv.includes('--all');
  const daily = argv.includes('--daily');
  const refresh = argv.includes('--refresh');
  const force = argv.includes('--force');
  let limit = null;
  const limitIdx = argv.indexOf('--limit');
  if (limitIdx !== -1 && argv[limitIdx + 1]) {
    const n = parseInt(argv[limitIdx + 1], 10);
    if (Number.isFinite(n) && n > 0) limit = n;
  }
  return { all, daily, refresh, force, limit };
}

function toBlogsEntry(normalized, rawPost) {
  const entry = {};
  for (const k of BLOGS_JSON_FIELDS) {
    if (normalized[k] !== undefined) entry[k] = normalized[k];
  }
  entry.cms_updated_at = rawPost.updatedAt || rawPost.publishedAt || normalized.updated_date_iso || '';
  entry.content_hash = hashContent(rawPost.content);
  entry.synced_at = new Date().toISOString();
  return entry;
}

function getRelatedSlugs(blogs, currentSlug, opts = {}, limit = 3) {
  const searchIntent = (opts.searchIntent || 'informational').toLowerCase();
  const category = (opts.category || '').toLowerCase();
  const others = blogs.filter((b) => b.slug !== currentSlug);

  const sameIntent = others.filter((b) => (b.search_intent || '').toLowerCase() === searchIntent).sort(sortBlogsByLatestSyncFirst);
  const sameIntentSlugs = new Set(sameIntent.map((b) => b.slug));
  const sameCategory = others
    .filter((b) => !sameIntentSlugs.has(b.slug) && category && (b.category || '').toLowerCase() === category)
    .sort(sortBlogsByLatestSyncFirst);
  const sameCategorySlugs = new Set(sameCategory.map((b) => b.slug));
  const rest = others
    .filter((b) => !sameIntentSlugs.has(b.slug) && !sameCategorySlugs.has(b.slug))
    .sort(sortBlogsByLatestSyncFirst);

  const merged = [...sameIntent, ...sameCategory, ...rest];
  return merged.slice(0, limit).map((b) => b.slug);
}

function loadBlogsJson() {
  try {
    const raw = fs.readFileSync(BLOGS_JSON_PATH, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveBlogsJson(blogs) {
  const dir = path.dirname(BLOGS_JSON_PATH);
  fs.mkdirSync(dir, { recursive: true });
  const json = JSON.stringify(blogs, null, 2);
  fs.writeFileSync(BLOGS_JSON_PATH, json + '\n', 'utf8');
}

function postSlug(raw) {
  return raw.slug || raw.documentId || '';
}

function sortByPublishedAtAsc(posts) {
  return posts.slice().sort((a, b) => new Date(a.publishedAt || 0) - new Date(b.publishedAt || 0));
}

function isPostChanged(raw, existingEntry) {
  if (!existingEntry) return true;
  const apiUpdated = raw.updatedAt || raw.publishedAt || '';
  const storedUpdated = existingEntry.cms_updated_at || '';
  if (apiUpdated && storedUpdated && apiUpdated !== storedUpdated) return true;
  const nextHash = hashContent(raw.content);
  if (existingEntry.content_hash && existingEntry.content_hash !== nextHash) return true;
  if (!existingEntry.content_hash && nextHash) return true;
  return false;
}

function buildWorklist(strapiPosts, blogs, flags) {
  const knownBySlug = new Map(blogs.map((b) => [b.slug, b]));
  const knownSlugs = new Set(knownBySlug.keys());

  const newPosts = sortByPublishedAtAsc(
    strapiPosts.filter((p) => {
      const slug = postSlug(p);
      return slug && !knownSlugs.has(slug);
    }),
  );

  const changedPosts = strapiPosts.filter((p) => {
    const slug = postSlug(p);
    if (!slug || !knownSlugs.has(slug)) return false;
    return isPostChanged(p, knownBySlug.get(slug));
  });

  if (flags.force) {
    return sortByPublishedAtAsc(strapiPosts.filter((p) => postSlug(p)));
  }

  if (flags.daily) {
    const create = newPosts.slice(0, 1);
    return [...create, ...changedPosts];
  }

  if (flags.refresh) {
    const create = flags.all ? newPosts : newPosts.slice(0, 1);
    return [...create, ...changedPosts];
  }

  const create = flags.all ? newPosts : newPosts.slice(0, 1);
  return create;
}

function applyLimit(worklist, flags) {
  if (flags.limit == null) return worklist;
  if (flags.force || flags.daily || flags.refresh) {
    return worklist.slice(0, flags.limit);
  }
  return worklist.slice(0, flags.limit);
}

async function run() {
  const flags = parseArgs(process.argv);
  assertStrictSiteFilter();

  const siteDomain = process.env.SITE_DOMAIN || process.env.site_domain || '';
  const brandToken = getBrandTokenFromDomain(siteDomain);
  const apiUrl = process.env.STRAPI_API_URL || 'http://localhost:1337/api';

  console.log('Fetching posts from API...');
  const strapiPostsRaw = await fetchPosts({ baseUrl: apiUrl });

  const skippedOffSite = [];
  const strapiPosts = strapiPostsRaw.filter((p) => {
    const slug = postSlug(p);
    if (!slug) return false;
    if (isAllowedSlug(slug, brandToken)) return true;
    skippedOffSite.push(slug);
    return false;
  });

  if (skippedOffSite.length) {
    console.warn(`Skipped ${skippedOffSite.length} off-site slug(s): ${skippedOffSite.join(', ')}`);
  }

  let blogs = loadBlogsJson();
  const pruneResult = pruneInvalidSlugs(blogs, brandToken, BLOG_DIR);
  if (pruneResult.pruned.length) {
    console.warn(`Pruned ${pruneResult.pruned.length} invalid entr(ies) from blogs.json: ${pruneResult.pruned.join(', ')}`);
    blogs = pruneResult.blogs;
  }

  const worklist = applyLimit(buildWorklist(strapiPosts, blogs, flags), flags);

  if (worklist.length === 0) {
    const allowedSlugs = new Set(blogs.map((b) => b.slug));
    sanitizeRelatedPosts(blogs, allowedSlugs);
    blogs.sort(sortBlogsByLatestSyncFirst);
    saveBlogsJson(blogs);
    generateSitemap();
    console.log('No articles to publish or refresh.');
    return;
  }

  const modeLabel = flags.force
    ? 'force re-render'
    : flags.daily
      ? 'daily sync'
      : flags.refresh
        ? 'refresh'
        : flags.all
          ? 'bulk new'
          : 'new post';
  console.log(`Processing ${worklist.length} article(s) (${modeLabel})...`);

  for (const raw of worklist) {
    const slug = postSlug(raw);
    const related = getRelatedSlugs(blogs, slug, {
      searchIntent: raw.search_intent,
      category: raw.category,
    });

    const normalized = normalizePost(raw, { relatedPosts: related });
    validatePost(normalized);

    console.log(`  - ${normalized.title} (${slug})`);
    renderArticle(normalized, { blogs });

    const entry = toBlogsEntry(normalized, raw);
    const idx = blogs.findIndex((b) => b.slug === slug);
    if (idx === -1) {
      blogs.push(entry);
    } else {
      blogs[idx] = entry;
    }
  }

  const allowedSlugs = new Set(blogs.map((b) => b.slug));
  sanitizeRelatedPosts(blogs, allowedSlugs);

  blogs.sort(sortBlogsByLatestSyncFirst);
  saveBlogsJson(blogs);
  generateSitemap();
  console.log('Done. blogs.json and sitemap.xml updated.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

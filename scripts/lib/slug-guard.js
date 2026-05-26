'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Brand token from site domain (e.g. winplusasia.com → winplusasia).
 * @param {string} domain
 * @returns {string}
 */
function getBrandTokenFromDomain(domain) {
  const d = String(domain || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/^www\./, '');
  const host = d.split(':')[0];
  const match = host.match(/^([a-z0-9-]+)\./);
  return match ? match[1] : host.split('.')[0] || '';
}

/**
 * @param {string} slug
 * @param {string} brandToken
 * @returns {boolean}
 */
function isAllowedSlug(slug, brandToken) {
  const s = String(slug || '').trim().toLowerCase();
  const token = String(brandToken || '').trim().toLowerCase();
  if (!s) return false;
  if (!token) return true;
  return s.includes(token);
}

/**
 * Remove blogs.json entries and blog HTML for slugs that fail the brand guard.
 * @param {Array} blogs
 * @param {string} brandToken
 * @param {string} blogDir
 * @returns {{ blogs: Array, pruned: string[] }}
 */
function pruneInvalidSlugs(blogs, brandToken, blogDir) {
  const pruned = [];
  const kept = [];

  for (const entry of blogs) {
    const slug = entry?.slug;
    if (!slug || !isAllowedSlug(slug, brandToken)) {
      pruned.push(slug || '(missing slug)');
      const dir = path.join(blogDir, slug || '');
      if (slug && fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
      continue;
    }
    kept.push(entry);
  }

  return { blogs: kept, pruned };
}

/**
 * Keep related_posts references that exist in the allowed slug set.
 * @param {Array} blogs
 * @param {Set<string>} allowedSlugs
 */
function sanitizeRelatedPosts(blogs, allowedSlugs) {
  for (const entry of blogs) {
    if (!Array.isArray(entry.related_posts)) continue;
    entry.related_posts = entry.related_posts.filter((s) => allowedSlugs.has(s));
  }
}

module.exports = {
  getBrandTokenFromDomain,
  isAllowedSlug,
  pruneInvalidSlugs,
  sanitizeRelatedPosts,
};

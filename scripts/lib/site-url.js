'use strict';

require('./load-env.js');

/**
 * Public origin only, no trailing slash (e.g. https://winplusasia.com).
 */
function getSiteOrigin() {
  return String(process.env.SITE_BASE_URL || 'https://winplusasia.com')
    .trim()
    .replace(/\/$/, '');
}

/**
 * Hostname from origin for visible copy (e.g. winplusasia.com).
 */
function getSiteHostname() {
  try {
    return new URL(`${getSiteOrigin()}/`).hostname;
  } catch {
    return 'winplusasia.com';
  }
}

/**
 * Brand / OG site_name (override with SITE_BRAND).
 */
function getSiteBrand() {
  return String(process.env.SITE_BRAND || 'WinPlus Asia').trim();
}

/**
 * Normalized blog base path segment, e.g. `/blog` (no trailing slash).
 */
function normalizeBlogPath() {
  let seg = String(process.env.BLOG_BASE_PATH || '/blog').trim();
  if (!seg.startsWith('/')) seg = `/${seg}`;
  seg = seg.replace(/\/+$/, '');
  return seg || '/blog';
}

/**
 * Public blog index URL, no trailing slash (e.g. https://example.com/blog).
 */
function getBlogIndexUrl() {
  return `${getSiteOrigin()}${normalizeBlogPath()}`;
}

/**
 * Canonical post URL: `/blog/{slug}` as absolute URL — no trailing slash.
 */
function getBlogPostUrl(slug) {
  const s = String(slug || '')
    .trim()
    .replace(/^\/+|\/+$/g, '');
  const base = getBlogIndexUrl();
  return s ? `${base}/${s}` : base;
}

/**
 * Blog base URL with trailing slash (legacy helper for callers that concatenate paths).
 */
function getBlogBaseUrl() {
  return `${getBlogIndexUrl()}/`;
}

module.exports = {
  getSiteOrigin,
  getSiteHostname,
  getSiteBrand,
  getBlogPath: normalizeBlogPath,
  getBlogIndexUrl,
  getBlogPostUrl,
  getBlogBaseUrl,
};

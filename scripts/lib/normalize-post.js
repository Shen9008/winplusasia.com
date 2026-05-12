'use strict';

const INTENT_GRADIENTS = {
  navigational:
    'linear-gradient(135deg, #0a0a0a 0%, rgba(212,175,55,0.25) 50%, #141414 100%)',
  commercial:
    'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(184,150,12,0.35) 55%, #0a0a0a 100%)',
  transactional:
    'linear-gradient(135deg, #141414 0%, rgba(212,175,55,0.2) 45%, #0a0a0a 100%)',
  informational:
    'linear-gradient(135deg, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.05) 55%, #0a0a0a 100%)',
};

const INTENT_CATEGORIES = {
  navigational: 'Getting Started',
  commercial: 'Reviews',
  transactional: 'Guides',
  informational: 'Informational',
};

/** Root-relative default when Strapi has no usable image (WebP for size & LCP). */
const DEFAULT_BLOG_FEATURED_REL = '/images/webp/blog-default.webp';

const MEDIA_FIELD_KEYS = [
  'featured_image',
  'featuredImage',
  'cover_image',
  'coverImage',
  'image',
  'cover',
  'thumbnail',
  'thumbnail_image',
  'thumbnailImage',
  'hero_image',
  'social_image',
];

/**
 * Reads Strapi-origin from STRAPI_API_URL (e.g. https://cms.example/api → https://cms.example).
 */
function strapiUploadOrigin() {
  const api = process.env.STRAPI_API_URL || '';
  if (!api) return '';
  try {
    return new URL(api).origin;
  } catch {
    return '';
  }
}

/**
 * @param {*} val - string URL or Strapi/media-like object (populate `data.attributes.url`, `formats`, etc.).
 * @returns {string}
 */
function extractUrlFromMedia(val) {
  if (val == null) return '';
  if (typeof val === 'string') return val.trim();

  if (typeof val !== 'object') return '';

  const rawUrl = val.url ?? val.href;
  if (typeof rawUrl === 'string' && rawUrl.trim()) return rawUrl.trim();

  const data = val.data;
  if (data != null) {
    const entries = Array.isArray(data) ? data : [data];
    const first = entries.find(Boolean);
    if (first != null && typeof first === 'object') {
      const attrs = first.attributes ?? first;
      const u =
        attrs?.url ??
        attrs?.formats?.large?.url ??
        attrs?.formats?.medium?.url ??
        attrs?.formats?.small?.url;
      if (typeof u === 'string' && u.trim()) return u.trim();
    }
  }

  const f =
    val.formats?.large?.url || val.formats?.medium?.url || val.formats?.small?.url;
  if (typeof f === 'string' && f.trim()) return f.trim();

  return '';
}

function pickMediaField(post) {
  for (const k of MEDIA_FIELD_KEYS) {
    const v = post[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return null;
}

/**
 * URL or root-relative path for featured / OG image; falls back to blog default asset.
 * @param {object} strapiPost
 * @returns {string}
 */
function normalizeFeaturedImage(strapiPost) {
  const picked = pickMediaField(strapiPost);
  let url = extractUrlFromMedia(picked);
  url = typeof url === 'string' ? url.trim() : '';
  if (!url) return DEFAULT_BLOG_FEATURED_REL;

  if (url.startsWith('//')) url = `https:${url}`;
  if (/^https?:\/\//i.test(url)) return url;

  let path = url.replace(/\\/g, '/').trim();
  if (!path.startsWith('/')) path = `/${path}`;

  if (/^\/uploads\//i.test(path)) {
    const origin = strapiUploadOrigin();
    return origin ? `${origin}${path}` : DEFAULT_BLOG_FEATURED_REL;
  }

  return path;
}

/**
 * Normalizes a Strapi post to site schema.
 * @param {object} strapiPost - Raw Strapi post (id, title, slug, shortDescription, publishedAt, etc.)
 * @param {object} [opts] - Options
 * @param {string} [opts.searchIntent] - Override search_intent (from Strapi if available)
 * @param {string[]} [opts.relatedPosts] - Slugs for related posts (from existing blogs.json)
 * @returns {object} Normalized post for blogs.json and render
 */
function normalizePost(strapiPost, opts = {}) {
  const slug = strapiPost.slug || strapiPost.documentId || '';
  const title = strapiPost.title || 'Untitled';
  const publishedAt = strapiPost.publishedAt || strapiPost.createdAt || new Date().toISOString();
  const updatedAt = strapiPost.updatedAt || publishedAt;

  const publishedDate = formatDateISO(publishedAt);
  const searchIntent = (opts.searchIntent || strapiPost.search_intent || 'informational').toLowerCase();
  const gradient = INTENT_GRADIENTS[searchIntent] || INTENT_GRADIENTS.informational;
  const category = INTENT_CATEGORIES[searchIntent] || 'Informational';

  return {
    slug,
    title,
    meta_title: strapiPost.meta_title || title,
    meta_description: strapiPost.meta_description || strapiPost.shortDescription || '',
    focus_keyword: strapiPost.primary_keyword || strapiPost.focus_keyword || title,
    category,
    search_intent: searchIntent.charAt(0).toUpperCase() + searchIntent.slice(1),
    published_date: publishedDate,
    reading_time: formatReadingTime(strapiPost.reading_time),
    excerpt: strapiPost.shortDescription || strapiPost.excerpt || '',
    placeholder_gradient: strapiPost.placeholder_gradient || gradient,
    related_posts: opts.relatedPosts || [],
    keywords: normalizeKeywords(strapiPost.keywords),
    featured_image: normalizeFeaturedImage(strapiPost),

    content: strapiPost.content || '',
    toc_json: strapiPost.toc_json || [],
    published_date_formatted: formatDateLong(publishedAt),
    updated_date_iso: formatDateISO(updatedAt),
  };
}

function normalizeKeywords(raw) {
  if (Array.isArray(raw)) return raw.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof raw === 'string') return raw.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

function formatReadingTime(val) {
  if (val == null || val === '') return '5 min read';
  const num = typeof val === 'number' ? val : parseInt(String(val), 10);
  if (!isNaN(num)) return `${num} min read`;
  return typeof val === 'string' ? val : '5 min read';
}

function formatDateISO(d) {
  if (!d) return '';
  const date = new Date(d);
  return date.toISOString().slice(0, 10);
}

function formatDateLong(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Validates required fields. Throws if invalid.
 */
function validatePost(normalized) {
  if (!normalized.slug || !normalized.title) {
    throw new Error('Post must have slug and title');
  }
  return true;
}

module.exports = {
  normalizePost,
  validatePost,
  formatDateISO,
  formatDateLong,
  DEFAULT_BLOG_FEATURED_REL,
  normalizeFeaturedImage,
};

'use strict';

/** @param {*} iso */
function timeMs(iso) {
  if (iso == null || iso === '') return Number.NEGATIVE_INFINITY;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : Number.NEGATIVE_INFINITY;
}

/**
 * Blog index order: `published_date` desc, `cms_updated_at` desc, `synced_at` desc, slug.
 */
function sortBlogsByLatestSyncFirst(a, b) {
  const dp = timeMs(b.published_date) - timeMs(a.published_date);
  if (dp !== 0) return dp;
  const du = timeMs(b.cms_updated_at) - timeMs(a.cms_updated_at);
  if (du !== 0) return du;
  const ds = timeMs(b.synced_at) - timeMs(a.synced_at);
  if (ds !== 0) return ds;
  return String(b.slug).localeCompare(String(a.slug));
}

module.exports = { sortBlogsByLatestSyncFirst, timeMs };

'use strict';

/** @param {*} iso */
function timeMs(iso) {
  if (iso == null || iso === '') return Number.NEGATIVE_INFINITY;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : Number.NEGATIVE_INFINITY;
}

/**
 * Latest sync first (`synced_at` desc), then `published_date` desc, then slug (stable).
 */
function sortBlogsByLatestSyncFirst(a, b) {
  const ds = timeMs(b.synced_at) - timeMs(a.synced_at);
  if (ds !== 0) return ds;
  const dp = timeMs(b.published_date) - timeMs(a.published_date);
  if (dp !== 0) return dp;
  return String(b.slug).localeCompare(String(a.slug));
}

module.exports = { sortBlogsByLatestSyncFirst, timeMs };

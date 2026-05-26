'use strict';

const crypto = require('crypto');

/**
 * SHA-256 fingerprint of Strapi `content` for change detection.
 * @param {*} content
 * @returns {string}
 */
function hashContent(content) {
  const raw =
    content == null
      ? ''
      : typeof content === 'string'
        ? content
        : JSON.stringify(content);
  return crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
}

module.exports = { hashContent };

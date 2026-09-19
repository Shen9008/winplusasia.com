import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const blogs = JSON.parse(fs.readFileSync(path.join(root, 'assets/data/blogs.json'), 'utf8'));
const indexPath = path.join(root, 'blog/index.html');

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const sorted = [...blogs].sort((a, b) => String(b.published_date).localeCompare(String(a.published_date)));

const cards = sorted
  .map((post) => {
    const url = `/blog/${post.slug}`;
    const title = esc(post.title);
    const excerpt = esc(post.excerpt || post.meta_description || '');
    const date = esc(post.published_date || '');
    const read = esc(post.reading_time || '');
    return `                        <article class="blog-card">
                            <a class="blog-card__link" href="${url}">
                                <img class="blog-card__img" src="${esc(post.featured_image || '/images/webp/blog-default.webp')}" alt="" width="400" height="210" loading="lazy" decoding="async">
                                <div class="blog-card__body">
                                    <p class="blog-card__meta">${date}${read ? ` · ${read}` : ''}</p>
                                    <h3 class="blog-card__title">${title}</h3>
                                    <p class="blog-card__excerpt">${excerpt}</p>
                                </div>
                            </a>
                        </article>`;
  })
  .join('\n');

const intro = sorted
  .slice(0, 8)
  .map((p) => `<li><a href="/blog/${esc(p.slug)}">${esc(p.title)}</a></li>`)
  .join('\n                        ');

let html = fs.readFileSync(indexPath, 'utf8');

const gridStart = '                    <div id="blog-posts-grid" class="blog-posts-grid" aria-live="polite">';
const gridEnd = '                    </div>';

const staticGrid = `${gridStart}
${cards}
${gridEnd}`;

html = html.replace(/<div id="blog-posts-grid" class="blog-posts-grid" aria-live="polite">[\s\S]*?<\/div>/, staticGrid);

const introBlock = `                <div class="blog-index-intro prose">
                    <p>Browse ${sorted.length} independent WinPlus guides covering login help, bonus terms, live casino mechanics, mobile play, withdrawals, and safer gambling habits. Each article is reviewed by our editorial team before publication.</p>
                    <h2 id="blog-top-guides">Popular guides</h2>
                    <ul>
                        ${intro}
                    </ul>
                </div>`;

if (!html.includes('blog-index-intro')) {
  html = html.replace(
    '<h2 id="blog-index-h2" class="section__title blog-index__heading">Latest posts</h2>',
    `${introBlock}\n                <h2 id="blog-index-h2" class="section__title blog-index__heading">Latest posts</h2>`
  );
}

html = html.replace(/href="\.\.\/help-center\.html"/g, 'href="/help-center"');
html = html.replace(/href="\.\.\/responsible-gaming\.html"/g, 'href="/responsible-gaming"');
html = html.replace(/href="\.\.\/index\.html"/g, 'href="/"');
html = html.replace(/href="\/blog\/"/g, 'href="/blog"');

fs.writeFileSync(indexPath, html);
console.log(`Synced ${sorted.length} static blog cards into blog/index.html`);

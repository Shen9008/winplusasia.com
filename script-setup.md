# Blog / posts sync – setup guide

Steps to run the static blog generation pipeline on this repo or to replicate it on another site.

---

## WinPlus Asia (`winplusasia.com`)

This checkout already includes **`scripts/`** (sync, backfill, sitemap helpers) and **`sitemap.xml`**. Typical gaps before the blog reads end-to-end in the UI:

| Topic | In this repo |
|--------|----------------|
| **npm scripts** | `sync`, `sync:all`, `sync:doctor`, `backfill`, `backfill:force`, `audit:links`, and `deploy` are defined in root **`package.json`** (alongside **`longform:merge`**, **`pages:deploy`**, **`images:webp`**, etc.). |
| **`assets/data/`** | Not committed yet; **`content-sync`** creates **`assets/data/`** on first write when saving **`blogs.json`**. |
| **`blog/`** | Article HTML is emitted as **`blog/{slug}/index.html`** when you sync. **`blog/index.html`** (listing) is **not** in the tree yet; add it when you want a `/blog/` index (see §8). |
| **Listing script** | There is **`js/content-loader.js`**, which hydrates **`config/site-content.json`** for `[data-wp-*]` regions on marketing pages—it is **not** the Strapi **`blogs.json`** grid. Copy or implement **`js/blog-loader.js`** (or reuse another loader name) against **`blogs.json`** when you ship the listing. |
| **Styles** | **`css/style.css`** is the main stylesheet (pagination classes for a future listing should live here). **`brand.md`** documents tokens and layout conventions. |

**GitHub Actions:** **`.github/workflows/daily-sync.yml`** uses Node **22**, runs **`npm ci`**, **`npm run sync`**, **`npm run backfill`**, then **`npm run deploy`** (Wrangler → Cloudflare Pages). Configure **Secrets** (`STRAPI_API_URL`, `STRAPI_API_TOKEN`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) and **Variables** (`SITE_BASE_URL`, `BLOG_BASE_PATH`, **`STRAPI_COLLECTION`**, **`SITE_DOMAIN`**) under *Settings → Secrets and variables → Actions*. **`STRAPI_COLLECTION`** is read by the scripts as an alias for the REST collection segment (same effect as **`POSTS_COLLECTION`**; see §4).

---

## Quickstart (new project in a few minutes)

**If you cloned this repo:** install deps (**`npm install`**), add **`.env.local`** (see §4), run **`npm run sync:doctor`**, then **`npm run sync:all`** and **`npm run backfill:force`**.

**Greenfield copy:**

1. Copy **`scripts/`** (whole tree), start **`assets/data/blogs.json`** as **`[]`** (optional—the first sync can create **`assets/data/`** when it writes **`blogs.json`**), add **`blog/index.html`** + **`js/blog-loader.js`** (or your own loader) when you need a listing page, plus **`sitemap.xml`** baseline.
2. **`npm install dotenv`** (required for **`scripts/lib/load-env.js`**). This repo also uses **`sharp`**, **`wrangler`**, and **`serve`** for images and Pages deploy—see root **`package.json`**.
3. Create **`.env.local`** from the §4 variable names (there is no root **`.env.example`** in this checkout).
4. Run **`npm run sync:doctor`** — confirms env is read and prints a sample **`GET`** URL (no network call).
5. Run **`npm run sync:all`** then **`npm run backfill:force`**.
6. Tune **`article.template.html`**, **`normalize-post.js`**, or env **`POSTS_COLLECTION`** / **`POSTS_SITE_FILTER_KEY`** if your API uses different collection or filter field names.

---

## 1. Prerequisites

- Node.js 20+ (GitHub Actions uses **22** for this repo; 24 is fine locally)
- npm
- Strapi (or compatible) HTTP API exposing a **posts** collection with pagination
- Static site project (HTML/CSS/JS)

---

## 2. Copy project structure

Copy these folders and files into your project:

```
your-site/
├── scripts/
│   ├── content-sync.js          # Fetches API posts, renders articles
│   ├── sync-doctor.js           # Prints env + sample GET URL (no network)
│   ├── backfill-internal-links.js
│   ├── backfill-related-posts-block.js
│   ├── audit-internal-links.js
│   ├── lib/
│   │   ├── fetch-posts.js       # GET /{collection} + optional site filter
│   │   ├── normalize-post.js
│   │   ├── render-article.js
│   │   ├── inject-internal-links.js
│   │   └── generate-sitemap.js
│   └── templates/
│       └── article.template.html
├── blog/                         # Output dir for article pages
│   └── index.html               # Blog listing (static) — optional until you ship /blog/
├── assets/
│   └── data/
│       └── blogs.json           # Created/updated by sync (or start with [])
├── sitemap.xml                  # Existing sitemap (script appends blog URLs)
├── .env.local                   # Create locally (gitignored)
└── .env.example                 # Documented variable names (optional)
```

---

## 3. Install dependencies

Minimum for the Strapi sync CLI:

```bash
npm install dotenv --save-dev
```

Dependencies already used in **`winplusasia.com`** beyond that: **`sharp`**, **`wrangler`**, **`serve`** — see **`package.json`**.

---

## 4. Environment variables

Create **`.env.local`** in the project root. Scripts load **`.env`** first, then **`.env.local`** (overrides), via **`scripts/lib/load-env.js`**.

| Variable | Required | Purpose |
|----------|----------|---------|
| `STRAPI_API_URL` | Yes for sync | API base including `/api`, e.g. `http://host/api` or `https://api.example.com/api` |
| `STRAPI_API_TOKEN` | If API uses auth | Sent as `Authorization: Bearer …` |
| `SITE_DOMAIN` or `site_domain` | Multi-tenant setup | Value for the site filter (default key: `filters[site][domain][$eq]`). If omitted and `SKIP_POSTS_SITE_FILTER` is not set, sync runs unfiltered and logs a warning. |
| `POSTS_COLLECTION` | No | REST collection segment after `/api/` (default: `posts`). |
| `STRAPI_COLLECTION` | No | Same as **`POSTS_COLLECTION`** (used as the GitHub Actions **variable** name in this repo; **`POSTS_COLLECTION`** wins if both are set). |
| `POSTS_SITE_FILTER_KEY` | No | Full query parameter **name** for the domain filter (default: `filters[site][domain][$eq]`). Set to empty to omit the filter param only. |
| `SKIP_POSTS_SITE_FILTER` | No | If `1` / `true` / `yes`, never send a domain filter (single-tenant APIs). |

Optional for Cloudflare deploy (CLI):

```
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ACCOUNT_ID=...
```

---

## 5. API contract

**Request**

- Method: `GET`
- URL: `{STRAPI_API_URL}/{POSTS_COLLECTION}` (default **`posts`**; **`STRAPI_COLLECTION`** is an alternate env name — see §4)
- Query (pagination & sort, Strapi-style):

  - `sort=publishedAt:asc`
  - `pagination[page]`, `pagination[pageSize]` (page size 100 in code)

- Query (site scope, when domain filtering is active — see env above):

  - `{POSTS_SITE_FILTER_KEY}={SITE_DOMAIN}` (default key: `filters[site][domain][$eq]`)

**Response**

- Expected shape: Strapi v4-style JSON with `data[]`, optional `meta.pagination`, and per-item `attributes` (or flat fields). `fetch-posts.js` normalises entries to plain objects for `normalize-post.js`.

If your collection name or filter shape differs, set **`POSTS_COLLECTION`** or **`STRAPI_COLLECTION`**, and **`POSTS_SITE_FILTER_KEY`** (or run unfiltered with **`SKIP_POSTS_SITE_FILTER=1`**). Use **`npm run sync:doctor`** to verify the built URL before syncing.

---

## 6. Post fields (Strapi → site)

Your content type should expose these fields, or adapt `normalize-post.js`:

| Field | Type | Notes |
|-------|------|-------|
| `slug` | string | URL slug |
| `title` | string | Article title |
| `content` | string or rich text | HTML or blocks |
| `shortDescription` / `excerpt` | string | Summary |
| `meta_title` | string | SEO title |
| `meta_description` | string | Meta description |
| `primary_keyword` / `focus_keyword` | string | Focus keyword |
| `search_intent` | string | navigational \| commercial \| transactional \| informational |
| `reading_time` | number/string | e.g. "5 min read" |
| `publishedAt` | datetime | Publish date |
| `updatedAt` | datetime | Last updated |
| `toc_json` | array | Table of contents (optional) |
| `placeholder_gradient` | string | CSS gradient (optional) |
| `keywords` | string/array | Used for internal linking |

---

## 7. Article template

`scripts/templates/article.template.html` uses these placeholders:

| Placeholder | Description |
|-------------|-------------|
| `{{META_TITLE}}` | SEO title |
| `{{META_DESCRIPTION}}` | Meta description |
| `{{KEYWORDS}}` | Meta keywords |
| `{{SLUG}}` | URL slug |
| `{{TITLE}}` | Article title |
| `{{CATEGORY}}` | Category label |
| `{{PUBLISHED_DATE_ISO}}` | YYYY-MM-DD |
| `{{PUBLISHED_DATE_FORMATTED}}` | Long date |
| `{{UPDATED_DATE_ISO}}` | YYYY-MM-DD |
| `{{READING_TIME}}` | e.g. "5 min read" |
| `{{EXCERPT}}` | Summary text |
| `{{PLACEHOLDER_GRADIENT}}` | CSS gradient |
| `{{FOCUS_KEYWORD}}` | Focus keyword |
| `{{TOC_HTML}}` | Table of contents |
| `{{ARTICLE_BODY}}` | Main content HTML |
| `{{SHARE_URL}}` | Canonical URL |
| `{{SHARE_TITLE}}` | Encoded title |
| `{{FAQ_SCHEMA_SCRIPT}}` | FAQ JSON-LD (optional) |

Use your site’s HTML layout and styles in the template.

---

## 8. Blog listing page

`blog/index.html` should:

- Load posts from `assets/data/blogs.json`
- Use `js/blog-loader.js` (or equivalent) to render the grid
- Match the data shape: `{ slug, title, excerpt, category, published_date, ... }`

In **this repo**, **`blog/index.html`** and **`js/blog-loader.js`** are not present yet—the pipeline still produces **`blogs.json`** and **`blog/{slug}/index.html`** for when you wire the index.

### Pagination (client-side)

The grid is paginated **in the browser** by `js/blog-loader.js` after it loads `blogs.json`. This is separate from Strapi’s **`pagination[page]`** query parameters used during sync (see **API contract** above).

| Setting | Value | Where |
|--------|-------|-------|
| Posts per page | `6` | `PAGE_SIZE` in `blog-loader.js` |
| Max pager pages | `99` | `MAX_PAGE` in `blog-loader.js` |
| Max posts in the listing | `594` (`99 × 6`) | Older entries beyond this cap are **not** shown |

**Listing page markup** (inside the posts section):

- `#blog-posts-grid` — container the script fills with cards (`aria-live="polite"` is recommended).
- `#blog-pagination` — `<nav aria-label="…">` left empty; the script injects Previous / numbered links / Next and a “Page *x* of *y*” line. Hidden when there is only one page or no posts.
- `#blog-pagination-truncated` — optional `<p hidden>`; shown when `blogs.json` has **more than 594** posts, explaining that only the most recent 594 are listed.

**URL and history**

- Current page is read from the query string: **`?page=2`**. Page **1** omits `page` (canonical-style clean URL).
- Out-of-range `?page` values are clamped to `1 … totalPages` and the address bar is corrected with **`history.replaceState`**.
- Clicks on pager links use **`history.pushState`** so the grid updates without a full reload; **back/forward** is handled via **`popstate`**. The view scrolls to **`.blog-posts-wrap`** after an in-page pager click.

**Pager UI**

- Compact numbered sequence with ellipses (`…`) so long page counts do not produce a huge row of buttons.
- Requires styles for `.blog-pagination` and related classes (see **`css/style.css`**).

When copying the setup to another project, keep **`PAGE_SIZE`**, **`MAX_PAGE`**, and the three element IDs in sync between HTML and `blog-loader.js`, or adjust the constants and selectors together.

### Blog sort order (latest sync → oldest)

Keep the **same** ordering everywhere the pipeline touches post lists:

| Layer | Behaviour |
|-------|-----------|
| **`scripts/content-sync.js`** | After each sync, `blogs.json` is sorted with `sortBlogsByLatestSyncFirst`: primary key **`synced_at`** (newest first), then **`published_date`** if `synced_at` is missing, then **`slug`** for a stable tie-break. |
| **`js/blog-loader.js`** | Blog index grid uses that same rule so items are not re-ordered alphabetically when every post shares the same `published_date`. |
| **`js/blog-article.js`** | Article sidebar “recent posts” uses the same rule. |

If you copy this setup to another repo, align all three so the newest posts from the API stay consistent on the listing and in sidebars.

---

## 9. Package.json scripts

As in **`winplusasia.com`** root **`package.json`** (Strapi tooling plus site/deploy helpers):

```json
{
  "scripts": {
    "sync": "node scripts/content-sync.js",
    "sync:all": "node scripts/content-sync.js --all",
    "sync:doctor": "node scripts/sync-doctor.js",
    "backfill": "node scripts/backfill-internal-links.js",
    "backfill:force": "node scripts/backfill-internal-links.js --force",
    "audit:links": "node scripts/audit-internal-links.js",
    "deploy": "wrangler pages deploy . --project-name=winplusasia --branch=main",
    "longform:merge": "node scripts/merge-longform.mjs",
    "longform:count": "node scripts/count-main-words.mjs",
    "images:webp": "node scripts/optimize-images.mjs",
    "cf:login": "wrangler login",
    "cf:whoami": "wrangler whoami",
    "pages:create": "wrangler pages project create winplusasia --production-branch main",
    "pages:deploy": "wrangler pages deploy . --project-name=winplusasia --branch=main",
    "serve": "serve ."
  }
}
```

Adjust **`deploy`** / **`pages:deploy`** if your Cloudflare Pages project name or branch differs.

---

## 10. What gets generated

| Step | Command | Generates/updates |
|------|---------|-------------------|
| Sync | `npm run sync` | Fetches new posts from API, renders `blog/{slug}/index.html`, appends to `blogs.json`, updates `sitemap.xml` |
| Sync all | `npm run sync:all` | Same as sync, but processes every not-yet-seen post in one run |
| Doctor | `npm run sync:doctor` | Prints env-backed config and a sample `GET` URL (offline) |
| Backfill | `npm run backfill` | Adds internal links to existing articles (new articles only) |
| Backfill force | `npm run backfill:force` | Strips and re-injects internal links in all articles |
| Audit | `npm run audit:links` | Reports link count per article (read-only) |

---

## 11. Typical workflow

**First-time setup**

1. Optional: seed **`assets/data/blogs.json`** as **`[]`** — otherwise the first **`npm run sync`** creates **`assets/data/`** when writing **`blogs.json`**.
2. Ensure **`sitemap.xml`** exists with a **`</urlset>`** closing tag.
3. Configure **`.env.local`** (**`STRAPI_API_URL`**, optional token, **`SITE_DOMAIN`** or **`SKIP_POSTS_SITE_FILTER`**).
4. Run **`npm run sync:doctor`** and confirm the sample URL matches your Strapi API.
5. Align **`article.template.html`** with your layout.
6. Run **`npm run sync:all`** to fetch and render all posts for the configured site.
7. Run **`npm run backfill:force`** to inject internal links.

**Ongoing (e.g. daily via CI)**

1. **`npm run sync`** – fetch and render new posts  
2. **`npm run backfill`** – **`daily-sync`** uses this step (incremental links); use **`backfill:force`** locally when you want a full re-injection  
3. **`npm run deploy`** – Wrangler deployment from the workflow (or commit generated files and deploy elsewhere)

---

## 12. GitHub Actions

Workflow: **`.github/workflows/daily-sync.yml`**.

**Repository secrets** (Actions → Secrets)

- **`STRAPI_API_URL`**
- **`STRAPI_API_TOKEN`**
- **`CLOUDFLARE_API_TOKEN`**
- **`CLOUDFLARE_ACCOUNT_ID`**

**Repository variables** (Actions → Variables; exposed on the **`deploy`** job **`env`**)

- **`SITE_BASE_URL`**
- **`BLOG_BASE_PATH`**
- **`STRAPI_COLLECTION`** — maps to script collection (**`POSTS_COLLECTION`** overrides locally if both set).
- **`SITE_DOMAIN`** — propagate site filter parity with `.env.local` for multi-tenant APIs.

Optional: add **`POSTS_SITE_FILTER_KEY`** or **`SKIP_POSTS_SITE_FILTER`** to the workflow **`env:`** if needed.

---

## 13. blogs.json fields

Each entry in `blogs.json` should have:

- `slug`, `title`, `meta_title`, `meta_description`, `focus_keyword`
- `category`, `search_intent`, `published_date`, `reading_time`
- `excerpt`, `placeholder_gradient`, `related_posts`, `keywords`
- `synced_at` – ISO timestamp set when the post is written by `content-sync.js`; used as the primary sort key for the blog index and sidebars (see **Blog sort order** in section 8).

The `keywords` array feeds internal link injection. Add 4–8 phrases per post for best results.

---

## 14. Related docs

- Design tokens and layout: **`brand.md`**
- Main stylesheet: **`css/style.css`**

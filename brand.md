# WinPlus Asia — Brand & UI System (Aurora v2)

Single source of truth for **color**, **spacing habits**, **type**, **radius**, **buttons**, and **modular sections**. Implement changes in [`css/style.css`](css/style.css), shared partials, and existing BEM-style blocks—not ad‑hoc per page.

Visual identity: **deep violet surfaces**, **off-white type**, **violet–indigo accents** with **cyan** as secondary accent (atmosphere, rules, longform `h3` rails). The **`body.site`** layer adds fixed radial washes (violet / cyan / pink / indigo) over `--bg`; keep new chrome compatible with that shell.

---

## 1. Spacing

There are **no** `--space-*` variables in this codebase yet. Prefer **reusing existing patterns** from nearby components before inventing new `rem` values.

**Canonical layout anchors** (from `style.css`):

| Pattern | Value | Where |
|---------|--------|--------|
| Section vertical padding | `2.75rem 0` | `.section` |
| Tighter section band | `2.25rem 0` | `.section--tight` |
| Section header bottom gap | `1.75rem` | `.section-head`, `.section-head--center` |
| Container horizontal padding | `1.25rem` → `1.75rem` from `768px` | `.container` |
| Container max width | `1140px` | `.container` (narrow column: `.container--narrow` → `640px`) |
| Mobile menu padding | `1rem` | `.mobile-menu` |

**Hierarchy habit:** band padding sets outer rhythm (`.section`); inner stacks use **small stepped gaps** (`0.35rem`–`1rem`) already common in nav, cards, and grids.

---

## 2. Typography hierarchy

**Families**

- Body / UI: `var(--font)` — **Source Sans 3**, system-ui stack.
- Display / headings: `var(--font-display)` — **Outfit**, then Source Sans 3 fallback.

**Headings** (`h1`–`h3` share display family, tight tracking `-0.03em`, weight `700`, line-height `1.15`)

| Level | Implementation | Role |
|-------|----------------|------|
| `h1` | `clamp(2rem, 5.5vw, 2.85rem)` | Page / hero title |
| `h2` | `clamp(1.5rem, 3.5vw, 2rem)` | Major section title |
| `h3` | No global `font-size` in base rules—context sets size (e.g. `.prose h3`, `.section__title`) | Subsections, cards |

**Body**

- `body`: `font-size: 1rem`, `line-height: 1.6`, `color: var(--text)`.

**Section copy (legacy inner pattern)**

- `.section__desc`, `.section-head__sub`: `color: var(--muted)`; subtitle sizing ~`0.95rem`–`0.98rem`.

**Prose**

- Default `.prose`: max-width `640px`; `.prose--long`: `720px`.
- `.prose p`, `.prose li`: `color: var(--muted)`.

**Do not** introduce one-off heading scales per page; extend `style.css` in one place if a new level is needed.

---

## 3. Border radius hierarchy

Tokens live on `:root`:

| Token | Value | Typical use |
|-------|--------|-------------|
| `--radius` | `14px` | Cards (many blocks), inputs, mobile nav links, trust callouts, media tops |
| `--radius-lg` | `22px` | `.card-surface`, split panels, promo surfaces, longform editorial shell |
| `--radius-xl` | `30px` | Larger promo / hero-style surfaces where used |
| `999px` | pill | **`.btn`**, desktop `.nav__link`, jump-strip chips, some tags |
| `50%` | circle | (Use where explicitly circular—avatars / icon wells if added) |

**Buttons:** base `.btn` uses **`border-radius: 999px`** (pill), not `--radius`.

**Practical rule:** prefer **`var(--radius)` / `var(--radius-lg)` / `var(--radius-xl)`** for rectangular UI; **pill** for controls and nav. The file still contains a few **literal** radii (`8px`, `10px`, `12px`) on legacy controls—prefer aligning new work to the tokens above.

---

## 4. Button hierarchy

Structure: **base** `.btn` + **variant** + optional **size**.

| Variant | Purpose | Visual |
|---------|---------|--------|
| `.btn--primary` | Main CTA | Violet → indigo gradient, `color: var(--on-accent)`, indigo-tinted shadow |
| `.btn--gold` | Same styling as primary (legacy naming) | Same gradient—use **one** per cluster for clarity |
| `.btn--secondary` | Secondary | Transparent, `border: var(--border)`, hover → accent border + text |
| `.btn--outline-gold` | Same as secondary (legacy naming) | Same as `.btn--secondary` |
| `.btn--ghost` | Low emphasis | Transparent, muted text; hover lightens text / border |

| Modifier | Effect |
|----------|--------|
| `.btn--sm` | Smaller padding / font |
| `.btn--lg` | Larger padding / font |

**Sizing** is declared on `.btn` / modifiers (`padding`, `font-size`), not separate `--btn-*` variables.

**Hierarchy rule:** one **primary** (or **gold**) per logical group; **secondary / outline-gold / ghost** for the rest. Labels are **sentence case** in markup today (`font-weight: 600`)—keep copy short.

---

## 5. Modular sections & DRY

**CSS**

- Vertical bands: **`.section`** (`padding: 2.75rem 0`), **`.section--tight`**, **`.section--muted`** (muted violet band + faint violet borders).
- Editorial / home longform wrapper: **`.section--longform-editorial`**.
- Primary header pattern: **`.section-head`**, **`.section-head__title`**, **`.section-head__sub`**, **`.section-kicker`**; centered variant **`.section-head--center`**.
- Legacy inner titles: **`.section__head`**, **`.section__kicker`**, **`.section__title`**, **`.section__desc`**.
- Content width: **`.container`** (`max-width: 1140px`).

**HTML / partials**

- Shared chrome under **`partials/`** (e.g. `header.html`). Load via your existing partial loader; keep class names consistent across pages.

**DRY checklist**

1. Spacing: match neighboring sections or the table in §1 before adding arbitrary values.
2. Radius: prefer **`--radius*`** or pill **`999px`** for buttons/nav.
3. Buttons: always `.btn` + variant + optional size.
4. Sections: `.section` + `.container` + existing `.section-head*` / `.section__*` patterns.

---

## 6. Color roles (Aurora v2 — dark & violet / cyan)

Implement with **`:root` tokens** and shared components—not one-off hex on pages unless matching an established gradient.

| Role | Token | Notes |
|------|--------|--------|
| Page background | `--bg` | `#07060d`; `body.site::before` adds radial aurora layers |
| Elevated / layered UI | `--bg-elevated` | `#0e0c18` |
| Cards / panels | `--surface`, `--surface-2` | `#14122a`, `#1a1735` |
| Hairline borders | `--border` | `rgba(255,255,255,0.08)` |
| Accent border glow | `--border-glow` | Violet-tinted |
| Primary accent | `--accent` | `#a78bfa` — links default, kicker text, highlights |
| Hover accent | `--accent-hover` | `#c4b5fd` |
| Accent wash | `--accent-muted` | Violet fill at low alpha |
| Secondary accent | `--accent-2` | `#22d3ee` — cyan (headers, longform rails, aurora) |
| Text on gradient buttons | `--on-accent` | `#0a0614` |
| Primary text | `--text` | `#f3f1fa` |
| Muted / secondary text | `--muted` | `#9b95b8` |

**Links:** global `a` / `a:hover` use **`var(--accent)` → `var(--accent-hover)`**.

**Primary CTA:** `.btn--primary` / `.btn--gold` use **linear gradient** `#a78bfa` → `#6366f1` → `#7c3aed` (hover brightens toward `#c4b5fd` / `#818cf8` / `#8b5cf6`).

**Shadows (tokens):** `--shadow-soft`, `--shadow-card`, `--shadow-glow`.

---

## 7. Long-form & prose

There is **no** `.content-page` module. Use:

**Policy / article prose**

- **`.prose`** (optional **`.prose--long`**, **`.prose--legal`**) for readable columns inside `.container`.
- Body paragraphs and lists: **`var(--muted)`** per `.prose p` / `.prose li`.

**Home / SEO editorial band**

- Wrapper: **`.section.section--longform-editorial`** → inner **`.longform-editorial.prose.prose--long`**.
- Shell: glassy gradient panel, **`border-radius: var(--radius-lg)`**, violet border, **`::before`** top rule = **cyan → violet** gradient line (not a gold underscore).
- First **`h2`**: centered, `color: var(--text)`, clamp-sized title.
- **`h3`**: left **cyan** rail (`border-left` + accent tints), lighter heading color.

Extend patterns in **`style.css`**; avoid one-off page-only class trees.

---

## 8. Motion & technical reference

- Component **transitions** are declared locally (e.g. `a`, `.btn` use ~`0.15s ease`).
- **`.longform-editorial`** uses entrance animation **`longform-editorial-enter`**; respects **`prefers-reduced-motion`**.
- **`.longform-editorial__svg`** optional nudge animation—also reduced-motion safe.

---

*When tokens or components change, update this file in the same change so the documentation stays aligned with [`css/style.css`](css/style.css).*

# Habäne Admin Dashboard — Plan

## 0. The honest constraint (read first)

Habäne is a fully static site. Cart, wishlist, session — all `localStorage`, **per browser**.
There is no server, and checkout currently generates an order number without saving the
order anywhere. Two consequences:

1. **A static admin page can only see data from the browser it's opened in.** Real
   cross-customer analytics (actual sales by country) require a backend.
2. **A client-side password gate is cosmetic, not security.** Anyone can read the JS.
   It's fine for a demo/portfolio admin; it is not fine for real customer data.

So the plan is phased: Phase 1 is a fully working, beautiful demo admin (real value for
demos/investors and as the UI for Phase 2); Phase 2 swaps the data layer for a real backend.

## 1. Phase 0 — Data capture layer (prerequisite, small)

New `js/track.js` + edits to checkout/shop/product pages. All keys in localStorage:

| Key | What | Written by |
|-----|------|-----------|
| `habane_orders` | `{ id, items[], subtotal, discount, total, country, currency, email, ts, status }` | checkout.js on order placed |
| `habane_events` | ring buffer of `{ type: view/atc/search/checkout_start, id?, q?, country, ts }` | product/shop/components |
| `habane_news_list` | newsletter emails | home.js |
| `habane_msgs` | contact form messages | contact.js |

Also: a **seed-data generator** (`admin/seed.js`) producing ~300 realistic orders across the
12 countries/90 days so every analytics widget renders convincingly on first open.

## 2. Phase 1 — `admin.html` (single-page, tabbed, themed)

Layout: dark navy sidebar (Conthrax headings, lucide icons) + silver content area — the
existing brand inverted. PIN gate (`admin login` screen, sessionStorage) with a visible
"demo security only" note. Separate `js/admin/*.js` modules; no impact on shopper pages.

### Tabs / sections

1. **Overview (Dashboard)**
   - KPI row: Revenue (₹, normalized), Orders, AOV, Conversion %, each with 7/30-day delta.
   - Revenue-over-time line chart (30/90 days); orders-by-country bar list with flags.
   - "Needs attention" feed: unshipped orders, low stock, unanswered messages.

2. **Orders**
   - Table: id, date, customer, country (flag), items, total (original currency + ₹),
     status pill (new → packed → shipped → delivered) with inline status advance.
   - Filters: status, country, date range; CSV export.

3. **Products**
   - Catalog table from `HABANE.PRODUCTS`: thumbnail, name, category, price, was-price,
     badge, stock, wishlist count, units sold.
   - Edit drawer: price/badge/stock/featured toggles → saved as a `habane_catalog_overrides`
     layer merged over data.js at load (so the static catalog file stays the source and
     overrides are reversible). "Export data.js" button generates the updated file to paste.

4. **Promotions**
   - Promo codes CRUD (the site already supports `%` codes via `habane_promo`): code, %,
     active window, usage count, revenue attributed.
   - Free-shipping threshold editor (currently hardcoded `FREE_SHIP`).

5. **Customers**
   - Registered users (from `habane_user` pattern), newsletter list, contact messages inbox
     (read/replied flags). Country column throughout.

6. **Content**
   - Ribbon messages editor, FAQ items editor, hero copy — stored as overrides like products.

7. **Settings (country-based)**
   - Country manager on top of `COUNTRIES`: enable/disable market, FX rate override,
     COD on/off, per-country shipping fee + free-ship threshold, default landing currency.

### Analytics section (the sales-growth part)

All figures normalized to INR via `COUNTRIES.rate`; every widget filterable by country
and date range. Charts: hand-rolled SVG or Chart.js CDN (decide at build; follow the
dataviz skill when implementing).

| Widget | Question it answers | Action it drives |
|--------|--------------------|------------------|
| Revenue & AOV by country (flag bar list + map-style table) | Where is money coming from? | Where to spend marketing |
| Top products per country | What sells where? | Country-specific merchandising |
| Funnel: views → add-to-cart → checkout → purchase | Where do shoppers drop? | Fix the leakiest step |
| Abandoned carts (checkout_start w/o order, value) | How much revenue is stuck? | Recovery promos |
| Free-shipping threshold analysis (order-value histogram around ₹4,999) | Is the threshold lifting AOV? | Tune threshold per country |
| Wishlist-heat: most-wishlisted, least-bought | What do people want but not buy? | Targeted discount candidates |
| Search misses (queries with 0 results) | What do we not stock? | Catalog gaps |
| Promo performance (uses, revenue, AOV vs. no-promo) | Do codes make money? | Kill/scale codes |
| Best hour/day heat strip | When are shoppers active? | Drop/campaign timing |

## 3. Phase 2 — Real backend (decided: Supabase)

- **Supabase (free tier)**: Postgres + auth + row-level security, plain JS SDK —
  no build step needed, fits the static site. Chosen over Firebase (weak country
  aggregations) and MongoDB Atlas (no direct browser access — would require building
  and securing a custom API layer).
- **Global reach**: static pages are already on Vercel's worldwide CDN. Supabase home
  region = **Mumbai (ap-south-1)** — primary market is India; reachable worldwide over
  HTTPS (~100–300ms cross-continent, normal for ecommerce). If overseas share grows,
  add read replicas later — config change, not a rebuild.
- Tables: `orders`, `order_items`, `events`, `customers`, `promos`, `messages`, `settings`.
- Checkout/track.js write to Supabase instead of localStorage (same shapes as Phase 0 —
  that's deliberate, so Phase 1's admin UI needs only a data-adapter swap).
- Admin auth becomes real (Supabase email auth + RLS `role = admin`); PIN gate deleted.
- Optional: plug GA4/Plausible for traffic analytics rather than rebuilding page-view tracking.

## 4. Build order & estimates

| Step | Scope | Size |
|------|-------|------|
| 0 | track.js + order persistence + seed generator | small |
| 1 | admin shell: gate, sidebar, routing, theme | small-medium |
| 2 | Overview + Orders | medium |
| 3 | Analytics widgets (country filters everywhere) | medium-large |
| 4 | Products/Promos/Customers/Content/Settings | medium |
| 5 | Phase 2 backend swap | separate project |

## 5. Security notes (fullstack-guardian checklist)

- PIN gate = demo only; state it on the login screen. No real PII in seeded data.
- Escape everything rendered from storage (`H.esc`) — messages/emails are user input (XSS).
- CSV export: prefix `=`, `+`, `-`, `@` cells to block spreadsheet formula injection.
- `admin.html` must not be linked from shopper nav; still assume it will be found.
- Phase 2: all authz server-side (RLS), never trust the client role.

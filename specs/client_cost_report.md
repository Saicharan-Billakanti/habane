# HABÄNE Website — Cost, Maintenance & Scalability Report

**Prepared for:** Habäne (German-Indo venture) · **Date:** 3 July 2026
**Currencies:** EUR + INR (indicative, ≈ ₹90/€, ≈ $1 = €0.92; verify at signup — provider prices are set in USD and change)

---

## 1. Executive summary

- The website **runs at €0 / ₹0 per month today**, and a zero-fixed-cost setup can be
  maintained through launch and early growth — with the specific limitations listed in §4.
- "Zero cost" has two honest exceptions: **payment-gateway transaction fees** (a % of each
  sale — only paid when you earn) and **people time** (content changes and updates still
  need a person until the admin dashboard is built).
- Scaling is **pay-as-you-grow**: the first paid tier is roughly **€23 / ₹2,100 per month**
  (database), and only becomes necessary at meaningful traffic/sales volumes (§5).

**Full website cost at a glance**

| Stage | Cost |
|---|---|
| Today → launch | **€0 / ₹0 per month** fixed; domain renewal ~€12–15 / ₹1,100–1,400 per year |
| When sales begin | + ~2–3% of each sale (payment gateway — paid only on revenue) |
| At real growth (thresholds in §5) | + €23 / ₹2,100 per month (database tier) |

## 2. What is live today

| Item | Status |
|---|---|
| Website (10+ pages: home, shop, product, smart series, 3D showroom, about, contact, checkout, account) | Live |
| Global delivery | Served via worldwide CDN — fast in both Germany and India |
| 12-country pricing display (EUR, INR, USD, GBP, AED, SGD, …) | Live (display conversion) |
| Customer accounts | Demo (browser-local session; real login comes with backend phase) |
| Checkout | Demo (no real payment yet) |
| Admin dashboard & analytics | Planned (see roadmap, §6) |

## 3. The zero-cost stack (current + planned)

| Layer | Service (free tier) | Monthly cost | Key free-tier limits |
|---|---|---|---|
| Domain (via Namecheap) | Already purchased | ~€12–15 / ₹1,100–1,400 **per year** (renewal) | The only fixed recurring cost |
| Code hosting & versioning | GitHub Free | €0 / ₹0 | Effectively none for this project |
| Website hosting + global CDN | Cloudflare Pages Free *(moving from Vercel — §3.1)* | €0 / ₹0 | Unlimited bandwidth; commercial use permitted |
| Database, login, order storage (planned) | Supabase Free | €0 / ₹0 | 500 MB database, 50,000 monthly active users, ~5 GB egress; **project pauses after ~7 days without traffic** |
| Payments (when store goes live) | Razorpay (India) / Stripe (EU) | €0 fixed | **~2% per Indian transaction (Razorpay); ~1.5% + €0.25 per EU card (Stripe); ~3% international** |
| Transactional email (order confirmations) | Resend Free or Brevo Free | €0 / ₹0 | ~3,000 emails/mo (Resend) or 300/day (Brevo) |
| 3D/animation libraries | Public CDNs (jsDelivr/unpkg) | €0 / ₹0 | No contract/SLA — can be self-hosted anytime for free |

**Domain:** already purchased via **Namecheap** — the one existing recurring cost, renewal
≈ **€12–15 / ₹1,100–1,400 per year**. Connecting it to any host below is free (DNS records
at Namecheap, or delegate DNS to Cloudflare's free tier for faster resolution + free CDN/DDoS
protection in front).

### 3.1 Hosting: Cloudflare Pages, at €0

The site currently runs on Vercel's free "Hobby" plan, which is licensed for
non-commercial use only. For the commercial launch, hosting moves to **Cloudflare
Pages** — free, licensed for commercial use, and the only host with **no bandwidth
cap** (important: the site is image- and 3D-heavy). The migration is a minor,
one-time task. Vercel's paid plan (~€18 / ₹1,720 per month) was evaluated and is
not required — it adds nothing this site needs.

**What Cloudflare provides, all at €0:**

| Item | Cost |
|---|---|
| Hosting — unlimited bandwidth, commercial use permitted | €0 |
| SSL / HTTPS certificate | €0 |
| DNS for the Namecheap domain + global CDN + DDoS protection | €0 |
| Preview deployments and instant rollbacks | €0 |
| Weekly keep-alive job for the free database (removes the "sleep" limitation) | €0 |

There is nothing to pay Cloudflare at any stage of this site's realistic growth.
Cloudflare's paid products (Workers Paid ~€4.50/mo, Pro plan ~€23/mo) target needs
this project does not have.

## 4. "Zero-cost maintenance": what it means — and its limitations

**What the client gets at €0/month:** hosting, deployment, SSL/HTTPS, global CDN, code
hosting, database & auth (free tier), transactional email (low volume) — no subscriptions,
no server bills.

**The limitations that come with it (the honest list):**

1. **No SLA / uptime guarantee.** Free tiers offer best-effort availability and community
   support only. Real-world uptime is high, but there is no contractual guarantee and no
   priority support line.
2. **Quotas.** ~100 GB bandwidth/mo (thousands of daily visitors — ample for launch),
   500 MB database (~tens of thousands of orders), 50k monthly logins, ~3k emails/mo.
   Exceeding them requires the paid tiers in §5 — services throttle or prompt to upgrade
   rather than bill surprise overages.
3. **Database sleep.** The free Supabase project pauses after ~7 days of zero traffic.
   Mitigated with a free weekly keep-alive ping; irrelevant once the store has steady visitors.
4. **Single database region.** Data lives in Mumbai; reachable worldwide (100–300 ms
   from Europe — normal for ecommerce), but EU shoppers get slightly slower dynamic calls
   than Indian shoppers. Static pages remain CDN-fast everywhere.
5. **Zero cost ≠ zero effort.** Product/content changes, price updates and dependency
   upkeep still require developer time until the admin dashboard (roadmap Phase 1) lets
   staff self-serve. Budget person-hours, not server-euros.
6. **Transaction fees are unavoidable.** Every online store pays the gateway percentage;
   it scales with revenue, never ahead of it.
7. **GDPR note (German market).** Customer data stored with Supabase can be region-pinned
   and processed under a DPA; a privacy policy + cookie/consent banner are required before
   real EU customer data is collected. (Legal text itself is outside this report's scope.)

## 5. Scalability: when costs start, and what they are

Costs are **trigger-based** — nothing is paid until a threshold is genuinely reached.

| Stage | Trigger | What changes | Added monthly cost (approx.) |
|---|---|---|---|
| **0 — Launch (now)** | — | Zero-cost stack, demo → real checkout | **€0 / ₹0** + transaction % |
| **1 — Store live, early sales** | First real orders | Payments + email active, DB on free tier | **€0 / ₹0** fixed + ~2–3% of sales |
| **2 — Growth** | DB > 500 MB, or > 50k monthly logins, or email > ~3k/mo | Supabase Pro; email paid tier if needed | **€23 / ₹2,100** (Supabase Pro) + €0–20 / ₹0–1,800 (email) |
| **3 — High traffic** | Need for priority support, larger catalog | Larger database compute, priority support (hosting stays €0 on Cloudflare) | **€18–45 / ₹1,650–4,100** additional |
| **4 — Scale-up** | Heavy EU traffic, big catalog, uptime commitments | DB read replica near EU, dedicated compute, monitoring | indicative **€90+ / ₹8,000+** |

**Realistic expectation:** a young store typically stays at Stage 0–1 (€0 fixed) for its
first months and moves to Stage 2 (~€23/mo) only with real traction. Total fixed cost even
at Stage 3 stays under ~€90/₹8,000 per month — far below traditional hosting + agency
maintenance contracts.

## 6. Roadmap context (where the admin dashboard fits)

| Phase | Deliverable | Infra cost impact |
|---|---|---|
| 0 | Order/event capture on the site | €0 |
| 1 | Admin dashboard: orders, products, promotions, country-based sales analytics | €0 (runs on same hosting) |
| 2 | Real backend (Supabase): live accounts, real orders, real analytics | €0 on free tier → €23/mo at growth trigger |

The admin dashboard is what converts "zero-cost maintenance" into **zero-developer-dependence
maintenance** — staff manage products, prices, promos and see country-level sales without
touching code.

## 7. Assumptions & exclusions

- Domain already purchased via Namecheap; only its yearly renewal (~€12–15 / ₹1,100–1,400) recurs.
- Prices are indicative July-2026 figures set by providers in USD; confirm at signup.
- Developer/designer time, product photography, marketing and legal (GDPR texts) are out of scope.
- No paid advertising, analytics or marketing tooling is included (free options exist and can be added at €0).

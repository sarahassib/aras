# ARAS — Moroccan e-commerce platform

ARAS is a production-ready online store for Morocco: trilingual storefront (FR / AR / EN with RTL),
cash-on-delivery first (card payments through a hosted-checkout gateway), and a full English admin
dashboard.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** + **shadcn/ui** + lucide-react
- **Prisma 7** on PostgreSQL (client generated to `src/generated/prisma`)
- **better-auth** (credentials, DB sessions, roles: `ADMIN` / `CUSTOMER`)
- **next-intl** for FR/AR/EN, **zod** for validation, **react-hook-form**, **recharts**, **sonner**
- **Vitest** for tests

## Features

**Storefront** (`/[locale]`, locales `fr` `ar` `en`, default `fr`)
- Home (hero banners, category grid, featured / new / best-sellers / promos)
- Catalog with search, category & facet filters, sorting, pagination
- Product pages: gallery, variant/option picker, stock-aware add to cart, reviews, related products
- Cart with quantity control, coupon codes, live totals
- Checkout: contact → delivery (zone-based quote, free shipping ≥ 500 DH) → payment (COD / card) → order confirmation
- Order tracking by order number, customer account (profile + order history)
- Newsletter subscription, localized footer pages (delivery, returns, FAQ, terms, privacy)

**Admin** (`/admin`, English, role-protected)
- Dashboard: KPIs, 30-day sales chart, order status mix, recent orders, top products, low stock
- Orders: filters/search, status transitions with history + automatic e-mails, internal notes, resend e-mail
- Products: list, create/edit (translations, images, options/variants, stock, flags), delete
- Categories & subcategories (translations, ordering), promotions, coupons
- Banners (hero/middle/footer), delivery zones, reviews, newsletter subscribers
- Store settings: identity, contact, payment toggles, free-shipping threshold, announcements, social, SEO

**Platform**
- 37 JSON API routes under `/api` (admin, cart, catalog, checkout, newsletter, reviews, files, auth…)
- Service layer in `src/services` shared by pages, API routes and server actions
- Money as integer centimes everywhere (`src/lib/money.ts`)
- E-mail outbox (`EmailOutbox`) + background worker started from `src/instrumentation.ts`
- Rate limiting, security headers, strict zod validation

## Getting started

```bash
# 1. PostgreSQL (Docker example)
docker run -d --name aras-postgres -e POSTGRES_USER=aras -e POSTGRES_PASSWORD=aras_dev_password \
  -e POSTGRES_DB=aras -p 5432:5432 postgres:16

# 2. Environment
cp .env.example .env    # then fill DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL

# 3. Install & database
npm install             # runs `prisma generate` via postinstall
npm run db:migrate      # apply migrations
npm run db:seed         # demo catalog, settings, test accounts

# 4. Develop
npm run dev             # http://localhost:3000
```

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest suite |
| `npm run db:migrate` | Create/apply Prisma migrations |
| `npm run db:deploy` | Apply migrations (production) |
| `npm run db:seed` | Idempotent demo data |
| `npm run postinstall` | Regenerate the Prisma client |

### Seed accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@aras.ma` | `ArasAdmin1!` |
| Customer | `client@aras.ma` | `ArasClient1!` |

Demo coupons: `BIENVENUE10` (−10 %, min 300 DH), `LIVRAISON50` (−50 DH, min 400 DH),
`RAMADAN25` (−25 %, min 500 DH).

## Project structure

```
src/
├── app/
│   ├── [locale]/           # storefront: (store) pages, auth, account, order tracking
│   ├── admin/              # login + (dashboard) admin UI (English)
│   └── api/                # JSON routes (admin/*, cart, checkout, newsletter, …)
├── components/
│   ├── store/              # storefront components
│   ├── admin/              # admin components
│   └── ui/                 # shadcn/ui primitives
├── services/               # business logic shared by pages, API and actions
├── validation/             # zod schemas (common, catalog, admin)
├── lib/                    # auth, session, db, money, business-rules, errors, api
├── i18n/                   # next-intl routing/request/navigation helpers
├── messages/               # fr.json, ar.json, en.json (identical key sets)
└── generated/prisma/       # generated Prisma client (do not edit)
prisma/                     # schema.prisma, migrations/, seed.ts
tests/                      # vitest suites (money, pricing, business rules, validation)
```

## Conventions

- **Money** is always an integer number of centimes; format with `formatMAD`, parse with
  `parseAmountToMinor`. Never use floats for prices.
- **i18n**: every static `t("…")` key must exist in `src/messages/{fr,ar,en}.json` — verify with
  `node scripts/audit-messages.mjs`.
- **API**: success responses return the payload directly (`ok(data)`), errors return
  `{ error: { code, message, issues } }`.
- **Auth**: pages use `requireAdminPage` / `requireUserPage`, server actions and API routes use
  `requireAdmin()`.
- **Order lifecycle**: statuses only change through `canTransition` (`ORDER_STATUS_TRANSITIONS`);
  each change writes history and queues the matching customer e-mail.
- Run `npm run typecheck`, `npm test` and `node scripts/audit-messages.mjs` before committing.

## Tests

```bash
npm test          # money helpers, coupon/total pricing (incl. discount regression), 
                  # order transitions, free-shipping rule, validation schemas
```

Integration tests can use `TEST_DATABASE_URL` (a separate database) — see `.env.example`.

## Payment setup

Card payments are disabled by default (`cardEnabled: false`). To enable them, fill in
`PAYMENT_PROVIDER`, `PAYMENT_PROVIDER_KEY`, `PAYMENT_PROVIDER_SECRET` and `PAYMENT_CHECKOUT_URL`
for your gateway (CMI, PayZone, Wafacash PayZone, Alma…). ARAS never handles raw card data — the
checkout redirects to the provider's hosted page and `/api/payments/webhook` reconciles the result.

## License

Private — all rights reserved.

# Accu Air Cargo

Next.js 16 App Router, TypeScript, Tailwind CSS, GSAP, Prisma 6, TiDB/MySQL, JWT cookies, Payfast hosted checkout, Resend email and optional R2 product images.

## Start on Windows / PowerShell

Install Node.js 22.13 or later, then open PowerShell in this extracted folder.

```powershell
npm install -g pnpm@11.25.0
pnpm install --frozen-lockfile
```

An actual `.env` file is included, along with `.env.example`. Edit `.env` before enabling backend features. Do not commit it or share it after adding credentials.

1. Set `DATABASE_URL` to your TiDB connection string, including your application database name and TLS settings. URL-encode special characters in the username/password. Keep `sslaccept=strict`; do not disable certificate verification.
2. Keep `APP_URL=http://localhost:3000` locally. For deployment, use the exact HTTPS origin with no trailing slash.
3. Generate separate random values for `JWT_SECRET` and `CRON_SECRET` using the command below, and paste each into `.env`.

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

Use a new empty application database for the initial migration. Never reset a live database. `db:migrate` creates the tables; `db pull` only introspects existing tables. The seed imports 21 published packaging products and their variants, with zero stock and checkout disabled. It does not create sample orders or public default credentials.

Create your first administrator:

```powershell
$env:ADMIN_EMAIL="your-admin-email@example.com"
$env:ADMIN_PASSWORD="your-own-long-unique-password"
pnpm admin:create
Remove-Item Env:ADMIN_PASSWORD
pnpm dev
```

Open http://localhost:3000. Sign in at `/login`, then visit `/admin`. The administrator is verified by the setup command. Customer registration requires working email delivery and email verification.

## Configuration

- **Payfast:** supply sandbox merchant ID, merchant key and passphrase. Set `PAYFAST_MODE=sandbox` until tested. Notification URL: `APP_URL/api/payfast/notify`. Only a verified server notification marks an order paid; a browser return never does. The notification endpoint must be publicly reachable. Test merchant details, signature, amount, retries, duplicate notifications and delayed payments before switching to `live`.
- **Email:** set `RESEND_API_KEY` and a verified sender in `MAIL_FROM`. Messages are written to a database outbox. A scheduler must call `/api/jobs` with `Authorization: Bearer YOUR_CRON_SECRET` every minute. This drains the outbox, expires sessions/tokens and releases expired stock reservations. A server cron or your hosting provider's scheduler can make this request. Do not expose the secret in URLs.
- **Images:** bundled product images work immediately. New uploads require `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` and an HTTPS `R2_PUBLIC_URL` for the bucket's public image domain. Use bucket-scoped credentials. Restart/redeploy after changing the image domain. Uploads accept PNG/JPEG/WebP up to 3 MB.
- **Store:** in `/admin`, verify prices and set actual inventory. Set the packaging delivery fee, then enable checkout only after payment tests pass. Published prices are treated as final merchandise prices; confirm the company's VAT treatment before launch. Order confirmations are not tax invoices.
- **Courier rates:** create approved postal-prefix rules under Shipping rates. Money is stored in cents; weights in grams; tax/fuel in basis points (10% = 1000). Unknown routes, international shipments, dangerous goods, special instructions or overweight parcels go to manual review. The captured original public rates are in `docs/original-public-rates.json` for reconciliation, not automatically activated.

## Commands

```powershell
pnpm lint
pnpm test
pnpm typecheck
pnpm build
pnpm start
```

Stop the development server before the final production build/typecheck to avoid conflicting generated development route types. Build runs Prisma generation automatically. Use the supplied pnpm lockfile.

## Deployment

Deploy as a **Node.js Next.js application** (for example Vercel), not as a static export. Configure the `.env` values as host-side environment variables. Run `pnpm db:migrate` as a controlled release step before serving new code. Run the seed once, create the administrator, configure the scheduler and then run payment/email/storage tests against the deployed sandbox. Keep connection pools small (`connection_limit=3` is an initial setting to tune against TiDB limits). Each serverless instance has its own pool; the global client cache is process-local.

## Implemented routes

- `/`: responsive branded homepage with GSAP and reduced-motion handling.
- `/shop`, `/shop/[slug]`: catalogue, search, categories, sorting, pagination and variants.
- `/cart`, `/checkout`: persistent guest/account baskets, server totals, inventory reservations and Payfast.
- `/ship`: multi-parcel domestic/international quote requests and approved automatic rate rules.
- `/track`: stored waybill status and event history.
- `/account`: orders, quotes, saved addresses/packages and profile.
- `/login`, `/register`, `/forgot`, `/reset`, `/verify`: authentication and recovery.
- `/orders/[id]`: owned order details, print/save confirmation and return requests.
- `/admin`: products/variants, stock, orders, quotes, customers, enquiries, returns, promotions, rates, settings and audit log.
- `/contact`, `/services`, `/faq`, `/policies`: company information and existing policy links.

## Important handover boundaries

This is a new implementation, not an export of the private WordPress backend. Public pages, 21 product pages, variants, images and publicly exposed calculator configuration were inspected. No private database, carrier credentials, merchant dashboard or admin source was accessed. Existing users, orders and waybills are not migrated.

Carrier events are entered by administrators; there is no verified external carrier API integration. Refunds are reviewed in the app and completed in the provider dashboard; marking a return outcome does not refund money or restore inventory. Full tax invoicing, automatic gateway refunds, address autocomplete and exact parity with the original region/distance classification require further implementation or business/API specifications. Legal documents link to the existing published policies and should be reviewed before switching domains.

Credentials alone do not establish production readiness: run integration and concurrency tests against TiDB, complete Payfast sandbox tests, confirm rates/stock/tax, test email/storage and perform the business acceptance journey. The supplied tests exercise isolated money, signature, validation, origin and shipping calculations; they do not substitute for those live checks.

## Security and recovery

JWTs live in HttpOnly cookies and are checked against revocable database sessions on every authenticated request. Sessions last eight hours; there is no silently renewable long-lived refresh token. Logout/password reset revokes sessions. Admin and ownership permissions are enforced server-side. Mutations require the configured Origin. Auth attempts are limited through the database; add host-level bot/abuse protection before public launch.

Keep secrets outside Git. Back up TiDB before migrations and test restoration separately. Do not edit an already-applied migration. Preserve historical orders; product removal archives the catalogue entry. Late payments after released reservations are flagged for manual review instead of silently overselling.

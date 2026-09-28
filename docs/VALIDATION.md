# Validation and activation status

28 September 2026

- Final Next.js 16.3.4 production build: PASS, including TypeScript compilation.
- ESLint on application, API, shared libraries, setup scripts and tests: PASS.
- Automated tests: 10 PASS. Money and rounding, invalid totals, exact decimal parsing, Payfast form encoding/signature ordering, origin protection, absent-credential gating, forged/duplicate notification fields, notification amount mismatch, product validation, shipping volumetric weight and postal matching.
- Browser inspection: desktop homepage, catalogue filtering, product variant change; mobile navigation and 390px/768px responsive views. These are representative checks, not a complete accessibility certification or full device matrix.
- TiDB migrations/CRUD, database concurrency, Payfast server verification, Resend delivery and R2 upload: NOT externally verified because credentials were unavailable.
- Existing customer/order/shipment migration: not performed.
- Public deployment: not performed. Delivered as a Node.js Next.js source ZIP at the user's request.

The application does not simulate successful payments, tracking events or form submissions when its database is unavailable. Do not call it production-ready until the integration and business-acceptance gates in README.md pass.

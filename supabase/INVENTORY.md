# FireLink backend inventory — living blueprint

**Last updated:** 2026-10-07 · mirrors the app as it stands today.

`README.md` explains how to run this bundle. **This file is the index of what the backend contains:**
every table, every backend function, every storage bucket, and the rule for keeping it current.

The app is the source of truth; this folder is the mirror. Anything that exists in `base44/entities`,
`base44/functions` or app storage must appear below — and anything below must still exist in the app.

## Keeping this current (do this with every new feature)

| When you add… | Record it in |
| --- | --- |
| A new entity | a new `migrations/000N_<table>.sql` (table + indexes + RLS + `updated_date` trigger + foreign keys) **and** a row in Tables below |
| A new or changed field | a new `000N_alter_<table>.sql` migration — never edit `0001`–`000N` once shipped — and update the table's notes |
| A new backend function | a row in Functions below (purpose, who calls it, secret needed, how to port) and `functions/<kebab-name>/index.ts` if it gets ported to an edge function |
| A new upload / file type | a row in Buckets below, plus policies in the storage migration that touches |
| A new scheduled job | a row in Scheduled jobs below |

Numbers to keep honest at the top of this file: **34 tables · 9 backend functions · 2 buckets.**

## Tables — 34 (one per app entity; the built-in `User` becomes `profiles`)

| Entity | Table | Who can read | Who can write | Defined in |
| --- | --- | --- | --- | --- |
| Advertisement | `advertisement` | public rows (`status = active`) · owner · vendor · admin | owner · vendor · admin | `0002` |
| AMCPlan | `amc_plan` | public rows (`status = active`) · owner · vendor · admin | owner · vendor · admin | `0002` |
| AppNotification | `app_notification` | the recipient (`user_id`) · admin | recipient · admin | `0002` |
| Asset | `asset` | organization · owner · admin | owner · organization · admin | `0002` |
| AuditLog | `audit_log` | admin | append by any signed-in user; edit/delete admin only | `0002` |
| CAPA | `capa` | organization · owner · admin | owner · organization · admin | `0002` |
| Category | `category` | any signed-in user (no read rule on the entity) | admin | `0002` |
| Certificate | `certificate` | organization · owner · admin | owner · organization · admin | `0002` |
| Document | `document` | organization · owner · admin | owner · organization · admin | `0002` |
| EngineeringProject | `engineering_project` | owner · admin | owner · admin | `0006` |
| FeatureFlag | `feature_flag` | any signed-in user (no read rule on the entity) | admin | `0002` |
| FireAuditRequest | `fire_audit_request` | owner · vendor · organization · admin | owner · organization · admin | `0002` |
| JobVacancy | `job_vacancy` | public rows (`status = approved`) · owner · vendor · admin | owner · vendor · admin | `0002` |
| NOC | `noc` | organization · owner · admin | owner · organization · admin | `0002` |
| Offer | `offer` | public rows (`status = active`) · owner · vendor · admin | owner · vendor · admin | `0002` |
| Order | `order` | customer (own orders) · organization · owner · vendor · admin | customer · owner · organization · vendor staff · admin | `0002` |
| Organization | `organization` | any signed-in user (`read: null` on the entity) | owner · admin | `0002` |
| Product | `product` | public rows (`approval_status = approved`) · owner · vendor · admin | owner · vendor staff · admin | `0002` |
| Quotation | `quotation` | organization · owner · admin | owner · organization · admin | `0002` |
| RevenueStream | `revenue_stream` | any signed-in user (`read: {}` on the entity) | admin | `0002` |
| Review | `review` | public rows (`status = approved`) · author · admin | author · admin | `0002` |
| RFQ | `rfq` | customer · organization · owner · admin | owner · organization · admin | `0002` |
| Service | `service` | public rows (`approval_status = approved`) · owner · vendor · admin | owner · vendor staff · admin | `0002` |
| ServiceRequest | `service_request` | owner · vendor · organization · admin | owner · organization · admin | `0002` |
| Settlement | `settlement` | owner · vendor · admin | vendor admin / finance sub-role · owner · admin | `0002` |
| Site | `site` | organization · owner · admin | owner · organization · admin | `0002` |
| SupportTicket | `support_ticket` | requester · organization · admin | requester · admin | `0002` |
| Technician | `technician` | owner · vendor · admin | owner · admin | `0002` |
| Vendor | `vendor` | public rows (`approval_status = approved`) · owner · admin | owner · admin | `0002` |
| VendorDocument | `vendor_document` | owner · vendor · admin | owner · admin | `0002` |
| VendorPlan | `vendor_plan` | any signed-in user (`read: {}` on the entity) | admin | `0002` |
| VendorStaff | `vendor_staff` | owner · the staff member themself · admin | owner · admin | `0002` |
| VendorWallet | `vendor_wallet` | vendor · owner · admin | vendor · owner · admin | `0002` |
| Warehouse | `warehouse` | owner · vendor · admin | owner · organization · admin | `0002` |
| User | `profiles` | platform-managed (only admins list users) | signup trigger + the user themself | `0001` |

Vendor write access is what the Base44 rules allow; the finer sub-role split (`VENDOR_ADMIN`,
`PRODUCT_MANAGER`, `ORDER_MANAGER`, `FINANCE_USER`, …) is enforced inside the same policies — see
`0003_rls_policies.sql` for the exact per-operation rules, table by table.

## Backend functions — 9

| Function | What it does | Called by | Secret needed | On Supabase |
| --- | --- | --- | --- | --- |
| `ai_assistant` | Catalog-aware chat assistant for customers and engineers (Hindi / Hinglish / English). | `AiAssistantChat` component | platform LLM access | edge function + LLM API key |
| `compliance_expiry_check` | Daily scan of certificates and NOCs expiring in 60 / 30 / 7 days → email + in-app notification, de-duplicated by title. | scheduled | mail provider | `pg_cron` job + edge function |
| `generate_product_image` | One studio-style product photo for a listing; bounded inputs, returns only the URL. | vendor Products screen | image model key | ✅ ported — `functions/generate-product-image/index.ts` |
| `get_vendor_document_url` | Signed URL for a private vendor document. | vendor Documents screen | — | not needed — client-side `createSignedUrl` |
| `order_notification` | Order lifecycle mails (confirmed / packed / shipped / delivered); recipients resolved server-side from the record. | order screens | mail provider | edge function on order update |
| `rfq_notify_vendors` | Emails approved vendors about a new RFQ — category matches first, capped at 50. | customer RFQs | mail provider | edge function |
| `submit_contact_message` | Public (no-login) contact form → support ticket queue; input validated and length-capped. | Contact page | — | edge function, invokable anonymously |
| `sync_vendor_staff` | Mirrors a team member's `staff_role` onto their user record so RLS can enforce sub-roles. | vendor Team screen | — | SQL trigger on `vendor_staff` |
| `verify_qr` | Public verification for certificates, assets and fire NOCs — accepts a QR code, certificate number or NOC number; exact match only, safe fields only, 20 attempts/min/IP. | `/verify` and `/verify/:qrCode` pages | — | edge function with the service role |

## Storage buckets — 2

| Bucket | Visibility | Used for | App upload call |
| --- | --- | --- | --- |
| `media` | public | product & service images, vendor logos, generated product photos, advertisement creatives | `UploadPublicFile` |
| `documents` | private | vendor verification documents, certificates, NOCs, purchase orders, signatures | `UploadPrivateFile` |

Path rule: the first folder must be the uploader's user id — `media/<user_id>/<file>` and
`documents/<user_id>/<file>`. A private file is shared as a signed link
(`createSignedUrl`) instead of a public URL. The app also ships static files in `public/`
(user guide PDF, `sitemap.xml`, `robots.txt`, `llms.txt`, `manifest.json`) — those deploy with the
frontend, not into storage.

## Scheduled jobs

| Job | Schedule | What it runs |
| --- | --- | --- |
| Compliance expiry check | daily | `compliance_expiry_check` (60 / 30 / 7-day thresholds) |

## SQL helpers and triggers (from `0001`)

| Helper | Purpose |
| --- | --- |
| `is_admin()` | `admin` / `platform_admin` / `super_admin` check used by every admin branch |
| `current_role_name()` | the signed-in user's role |
| `current_vendor_id()` | vendor the user belongs to (was `user.data.vendor_id`) |
| `current_organization_id()` | organization the user belongs to |
| `current_user_data(field)` | any extra user field that used to live in `user.data` |
| `set_updated_date()` | `before update` trigger on every table |
| `handle_new_user()` | creates the `profiles` row on signup |

## Not in here

The data rows themselves, and the React client. This folder is the database side only.
# Supabase bundle

Everything the database needs, generated from the app's 35 entities (`User` becomes `profiles`, so
34 tables): tables, RLS policies, storage buckets, helper functions and the backend functions. Run
the files in order and you have the whole backend on Supabase. `INVENTORY.md` is the live index of
what the backend contains — tables, functions and buckets — and is kept up to date as features are added.

## What is in here

| File | Contents |
| --- | --- |
| `migrations/0001_extensions_and_helpers.sql` | pgcrypto, the `profiles` table (replaces the user record), new-user trigger, `updated_date` trigger, RLS helper functions |
| `migrations/0002_tables.sql` | 33 tables — one per entity — with enums, defaults, indexes |
| `migrations/0003_rls_policies.sql` | 132 policies — read / create / update / delete for every table, translated 1:1 from the Base44 rules |
| `migrations/0004_storage_buckets.sql` | `media` (public) and `documents` (private) buckets + storage policies |
| `migrations/0005_foreign_keys.sql` | 76 foreign keys between the tables |
| `migrations/0006_engineering_project.sql` | `engineering_project` — the engineering suite table added after the base bundle (table, indexes, RLS, FK, `updated_date` trigger) |
| `functions/generate-product-image/index.ts` | Deno edge function, same contract as the old `generate_product_image` |
| `INVENTORY.md` | **Live index:** every table, backend function and storage bucket, plus the rule for keeping this bundle current |

## How to run it

**A — Supabase CLI (recommended)**

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

**B — SQL Editor**
Dashboard → SQL Editor → paste each file in order (`0001` → `0006`) and press Run.

**C — psql**

```bash
for f in supabase/migrations/*.sql; do psql "$DATABASE_URL" -f "$f"; done
```

Nothing else to create by hand — the buckets, triggers and helper functions come from the scripts.

## After running — dashboard setup

1. Authentication → Providers: enable **Email** and **Google** (same providers as before).
2. Authentication → URL configuration: add your app URL (and `/reset-password`).
3. Storage: nothing to do — `media` and `documents` are created by `0004`.
4. Only if you deploy the image function: `supabase secrets set OPENAI_API_KEY=…` and
   `supabase functions deploy generate-product-image`.

## Users and roles

- `profiles` replaces the Base44 user record: `id`, `email`, `full_name`, `role`, `vendor_id`,
  `organization_id` and `data jsonb` for any extra user fields that used to live in `user.data`.
- A row is created automatically on signup (trigger on `auth.users`).
- Role values stay the same as in the app: `customer`, `vendor`, `vendor_admin`, `technician`,
  `engineer`, `organization_admin`, `admin`, `platform_admin`, `super_admin`.
- `public.is_admin()` covers `admin`, `platform_admin`, `super_admin`.
- Linking a user to a vendor = set `profiles.vendor_id` (was `user.data.vendor_id`).

## Storage — path rule

Policies require the **first folder in the path to be the user id**:

- public upload → `media/<user_id>/<file>`
- private upload → `documents/<user_id>/<file>`
- signed link for a private file → `supabase.storage.from('documents').createSignedUrl(path, 300)`

That one line replaces the old `get_vendor_document_url` function — signed URLs are built into storage.

## Function mapping

| Old Base44 function | On Supabase |
| --- | --- |
| `generate_product_image` | `functions/generate-product-image/index.ts` (edge function, same input `{ product_name, image_url? }` → `{ url }`) |
| `get_vendor_document_url` | not needed — `createSignedUrl` on the client |
| SQL helpers from `0001` | `is_admin()`, `current_role_name()`, `current_vendor_id()`, `current_organization_id()`, `current_user_data(field)`, `set_updated_date()`, `handle_new_user()` |
| the other eight backend functions | not ported yet — `INVENTORY.md` lists all nine with what each one does, the secret it needs and how to port it (`ai_assistant`, `compliance_expiry_check`, `get_vendor_document_url`, `order_notification`, `rfq_notify_vendors`, `submit_contact_message`, `sync_vendor_staff`, `verify_qr`) |

## Field mapping

- Built-ins: `id` uuid, `created_date` / `updated_date` timestamptz, `created_by_id` uuid.
- `enum` → text + CHECK constraint · array of text → `text[]` · nested object → `jsonb` ·
  number → `numeric` · date → `date`.
- Table names are the entity name in singular snake_case: `AMCPlan` → `amc_plan`, `RFQ` → `rfq`,
  `NOC` → `noc`, `CAPA` → `capa`, `VendorWallet` → `vendor_wallet`, `SupportTicket` → `support_ticket`.

## Who can read what

- **No login needed (public rows only):** `product`, `service`, `vendor`, `advertisement`, `offer`,
  `amc_plan`, `job_vacancy`, `review`, `rfq`, `category`, `feature_flag`. Visitors only ever see the
  rows that match the public condition (approved / active), exactly like Base44.
- **Signed-in users only:** the other 22 tables — orders, RFQs replies, assets, certificates,
  documents, wallet, settlements, staff, organization, audit log, revenue, notifications, etc.
- **Open to any signed-in user** because the Base44 entity had no rule for that operation:
  `category` read, `feature_flag` read (both also readable without login for the storefront) and
  `organization` read. Tighten them in `0003_rls_policies.sql` if you want them locked down.
- The QR verification page reads certificates; when you port the `verify_qr` function, run it with
  the service role so it can read a certificate for an anonymous visitor.

## Not included

The rows themselves (data copy) and the React client swap — this folder is the database side only.
Ask if you want the data export/import script next.
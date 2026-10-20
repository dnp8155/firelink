-- 0002_tables.sql
-- One table per Base44 entity (34 entities). Built-in columns: id, created_date, updated_date, created_by_id.
-- Enums become CHECK constraints; string arrays become text[]; nested objects become jsonb.

create table if not exists public."advertisement" (
  "id" uuid primary key default gen_random_uuid(),
  "title" text not null,
  "vendor_id" uuid,
  "vendor_name" text,
  "image_url" text not null,
  "target_url" text,
  "placement" text default 'banner' check ("placement" is null or "placement" in ('home', 'category', 'product_detail', 'sidebar', 'banner')) not null,
  "start_date" date,
  "end_date" date,
  "budget" numeric default 0,
  "impressions" numeric default 0,
  "clicks" numeric default 0,
  "status" text default 'pending' check ("status" is null or "status" in ('pending', 'approved', 'rejected', 'active', 'inactive')),
  "created_date" timestamptz not null default now(),
  "updated_date" timestamptz not null default now(),
  "created_by_id" uuid default auth.uid()
);

create table if not exists public."amc_plan" (
  "id" uuid primary key default gen_random_uuid(),
  "name" text not null,
  "vendor_id" uuid not null,
  "vendor_name" text,
  "description" text,
  "plan_type" text default 'standard' check ("plan_type" is null or "plan_type" in ('basic', 'standard', 'premium', 'custom')),
  "duration_months" numeric default 12,
  "price" numeric not null,
  "mrp" numeric,
  "coverage" text[] default '{}'::text[],
  "features" text[] default '{}'::text[],
  "terms" text,
  "visit_count" numeric default 4,
  "status" text default 'active' check ("status" is null or "status" in ('draft', 'active', 'inactive')),
  "featured" boolean default false,
  "created_date" timestamptz not null default now(),
  "updated_date" timestamptz not null default now(),
  "created_by_id" uuid default auth.uid()
);

create table if not exists public."app_notification" (
  "id" uuid primary key default gen_random_uuid(),
  "user_id" uuid not null,
  "title" text not null,
  "message" text not null,
  "type" text default 'system' check ("type" is null or "type" in ('order', 'rfq', 'quote', 'certificate', 'service', 'inspection', 'noc', 'capa', 'payment', 'ticket', 'system')),
  "link" text,
  "read" boolean default false,
  "created_date" timestamptz not null default now(),
  "updated_date" timestamptz not null default now(),
  "created_by_id" uuid default auth.uid()
);

create table if not exists public."asset" (
  "id" uuid primary key default gen_random_uuid(),
  "asset_code" text not null,
  "qr_code" text,
  "name" text not null,
  "category" text,
  "brand" text,
  "model" text,
  "serial_number" text,
  "organization_id" uuid not null,
  "organization_name" text,
  "site_id" uuid,
  "site_name" text,
  "building" text,
  "floor" text,
  "zone" text,
  "location_detail" text,
  "install_date" date,
  "last_inspection_date" date,
  "next_inspection_date" date,
  "status" text default 'active' check ("status" is null or "status" in ('active', 'inactive', 'under_maintenance', 'decommissioned')),
  "condition" text default 'good' check ("condition" is null or "condition" in ('good', 'needs_attention', 'faulty', 'expired')),
  "owner_id" uuid,
  "created_date" timestamptz not null default now(),
  "updated_date" timestamptz not null default now(),
  "created_by_id" uuid default auth.uid()
);

create table if not exists public."audit_log" (
  "id" uuid primary key default gen_random_uuid(),
  "user_name" text not null,
  "user_id" uuid,
  "action" text not null,
  "module" text not null,
  "entity_id" text,
  "before_value" text,
  "after_value" text,
  "ip_address" text,
  "device" text,
  "created_date" timestamptz not null default now(),
  "updated_date" timestamptz not null default now(),
  "created_by_id" uuid default auth.uid()
);

create table if not exists public."capa" (
  "id" uuid primary key default gen_random_uuid(),
  "capa_number" text not null,
  "finding" text not null,
  "asset_id" uuid,
  "asset_name" text,
  "organization_id" uuid not null,
  "site_name" text,
  "severity" text default 'medium' check ("severity" is null or "severity" in ('low', 'medium', 'high', 'critical')),
  "responsible_person" text,
  "target_date" date,
  "corrective_action" text,
  "preventive_action" text,
  "evidence_url" text,
  "status" text default 'open' check ("status" is null or "status" in ('open', 'assigned', 'in_progress', 'awaiting_verification', 'closed')),
  "created_date" timestamptz not null default now(),
  "updated_date" timestamptz not null default now(),
  "created_by_id" uuid default auth.uid()
);

create table if not exists public."category" (
  "id" uuid primary key default gen_random_uuid(),
  "name" text not null,
  "slug" text,
  "type" text default 'product' check ("type" is null or "type" in ('product', 'service')) not null,
  "parent_id" uuid,
  "icon" text,
  "description" text,
  "display_order" numeric default 0,
  "is_active" boolean default true,
  "created_date" timestamptz not null default now(),
  "updated_date" timestamptz not null default now(),
  "created_by_id" uuid default auth.uid()
);

create table if not exists public."certificate" (
  "id" uuid primary key default gen_random_uuid(),
  "certificate_number" text not null,
  "title" text not null,
  "type" text,
  "asset_id" uuid,
  "asset_name" text,
  "organization_id" uuid not null,
  "organization_name" text,
  "issued_by" text,
  "issue_date" date,
  "expiry_date" date,
  "file_url" text,
  "status" text default 'valid' check ("status" is null or "status" in ('valid', 'expiring_soon', 'expired', 'renewal_in_progress')),
  "qr_code" text,
  "created_date" timestamptz not null default now(),
  "updated_date" timestamptz not null default now(),
  "created_by_id" uuid default auth.uid()
);

create table if not exists public."document" (
  "id" uuid primary key default gen_random_uuid(),
  "name" text not null,
  "type" text default 'other' check ("type" is null or "type" in ('certificate', 'manual', 'datasheet', 'drawing', 'purchase_order', 'invoice', 'inspection_report', 'maintenance_report', 'fire_noc', 'engineering_report', 'other')) not null,
  "organization_id" uuid,
  "organization_name" text,
  "file_url" text,
  "version" numeric default 1,
  "uploaded_by" text,
  "created_date" timestamptz not null default now(),
  "updated_date" timestamptz not null default now(),
  "created_by_id" uuid default auth.uid()
);

create table if not exists public."feature_flag" (
  "id" uuid primary key default gen_random_uuid(),
  "key" text not null,
  "name" text not null,
  "description" text,
  "category" text default 'General',
  "enabled" boolean default true,
  "created_date" timestamptz not null default now(),
  "updated_date" timestamptz not null default now(),
  "created_by_id" uuid default auth.uid()
);

create table if not exists public."fire_audit_request" (
  "id" uuid primary key default gen_random_uuid(),
  "request_number" text not null,
  "customer_id" uuid not null,
  "customer_name" text,
  "organization_id" uuid,
  "site_name" text,
  "address" text,
  "city" text,
  "preferred_date" date,
  "audit_type" text default 'fire_safety' check ("audit_type" is null or "audit_type" in ('fire_safety', 'electrical_safety', 'building_safety', 'compliance', 'comprehensive')) not null,
  "description" text,
  "assigned_vendor_id" text,
  "assigned_vendor_name" text,
  "scheduled_date" date,
  "report_url" text,
  "status" text default 'open' check ("status" is null or "status" in ('open', 'assigned', 'scheduled', 'completed', 'cancelled')),
  "notes" text,
  "created_date" timestamptz not null default now(),
  "updated_date" timestamptz not null default now(),
  "created_by_id" uuid default auth.uid()
);

create table if not exists public."job_vacancy" (
  "id" uuid primary key default gen_random_uuid(),
  "title" text not null,
  "vendor_id" uuid not null,
  "vendor_name" text,
  "description" text,
  "role" text not null,
  "location" text,
  "job_type" text default 'full_time' check ("job_type" is null or "job_type" in ('full_time', 'part_time', 'contract', 'internship')),
  "experience_years" numeric default 0,
  "salary_min" numeric,
  "salary_max" numeric,
  "skills" text[] default '{}'::text[],
  "openings" numeric default 1,
  "contact_email" text,
  "status" text default 'pending' check ("status" is null or "status" in ('draft', 'pending', 'approved', 'rejected', 'closed')),
  "created_date" timestamptz not null default now(),
  "updated_date" timestamptz not null default now(),
  "created_by_id" uuid default auth.uid()
);

create table if not exists public."noc" (
  "id" uuid primary key default gen_random_uuid(),
  "noc_number" text not null,
  "organization_id" uuid not null,
  "organization_name" text,
  "site_name" text,
  "authority" text not null,
  "issue_date" date,
  "expiry_date" date,
  "document_url" text,
  "status" text default 'valid' check ("status" is null or "status" in ('valid', 'expiring_soon', 'expired', 'renewal_in_progress')),
  "created_date" timestamptz not null default now(),
  "updated_date" timestamptz not null default now(),
  "created_by_id" uuid default auth.uid()
);

create table if not exists public."offer" (
  "id" uuid primary key default gen_random_uuid(),
  "title" text not null,
  "vendor_id" uuid not null,
  "vendor_name" text,
  "code" text,
  "description" text,
  "discount_type" text default 'percentage' check ("discount_type" is null or "discount_type" in ('percentage', 'flat')) not null,
  "discount_value" numeric not null,
  "max_discount" numeric,
  "min_order_value" numeric default 0,
  "start_date" date,
  "end_date" date,
  "applicable_products" text[] default '{}'::text[],
  "usage_limit" numeric default 0,
  "used_count" numeric default 0,
  "status" text default 'active' check ("status" is null or "status" in ('draft', 'active', 'expired', 'disabled')),
  "created_date" timestamptz not null default now(),
  "updated_date" timestamptz not null default now(),
  "created_by_id" uuid default auth.uid()
);

create table if not exists public."order" (
  "id" uuid primary key default gen_random_uuid(),
  "order_number" text not null,
  "customer_id" uuid not null,
  "customer_name" text,
  "organization_id" uuid,
  "vendor_id" uuid,
  "vendor_name" text,
  "items" jsonb,
  "subtotal" numeric,
  "tax" numeric,
  "shipping" numeric default 0,
  "total" numeric not null,
  "status" text default 'pending' check ("status" is null or "status" in ('pending', 'accepted', 'packed', 'dispatched', 'delivered', 'cancelled', 'returned', 'refunded')),
  "payment_status" text default 'pending' check ("payment_status" is null or "payment_status" in ('pending', 'paid', 'refunded', 'failed')),
  "payment_method" text,
  "shipping_address" text,
  "courier" text,
  "tracking_number" text,
  "return_reason" text,
  "invoice_url" text,
  "notes" text,
  "created_date" timestamptz not null default now(),
  "updated_date" timestamptz not null default now(),
  "created_by_id" uuid default auth.uid()
);

create table if not exists public."organization" (
  "id" uuid primary key default gen_random_uuid(),
  "name" text not null,
  "industry" text,
  "contact_person" text,
  "email" text,
  "phone" text,
  "gst_number" text,
  "address" text,
  "city" text,
  "owner_id" uuid,
  "plan" text default 'business' check ("plan" is null or "plan" in ('starter', 'business', 'enterprise')),
  "compliance_score" numeric default 0,
  "created_date" timestamptz not null default now(),
  "updated_date" timestamptz not null default now(),
  "created_by_id" uuid default auth.uid()
);

create table if not exists public."product" (
  "id" uuid primary key default gen_random_uuid(),
  "name" text not null,
  "sku" text,
  "category" text not null,
  "subcategory" text,
  "brand" text,
  "manufacturer" text,
  "model" text,
  "vendor_id" uuid,
  "vendor_name" text,
  "description" text,
  "price" numeric not null,
  "b2b_price" numeric,
  "b2c_price" numeric,
  "mrp" numeric,
  "moq" numeric default 1,
  "stock" numeric default 0,
  "unit" text default 'piece',
  "image_url" text,
  "datasheet_url" text,
  "youtube_url" text,
  "certifications" text[] default '{}'::text[],
  "rating" numeric default 0,
  "reviews_count" numeric default 0,
  "location" text,
  "fire_class" text,
  "extinguishing_agent" text,
  "capacity" text,
  "operating_pressure" text,
  "discharge_range" text,
  "discharge_time" text,
  "temperature_range" text,
  "warranty_months" numeric default 0,
  "shelf_life" text,
  "country_of_origin" text default 'India',
  "hsn_code" text,
  "installation_type" text,
  "application_area" text,
  "applicable_standards" text,
  "dimensions" text,
  "weight_kg" numeric default 0,
  "material" text,
  "rechargeable" boolean default false,
  "approval_status" text default 'pending' check ("approval_status" is null or "approval_status" in ('draft', 'pending', 'approved', 'rejected', 'disabled')),
  "featured" boolean default false,
  "created_date" timestamptz not null default now(),
  "updated_date" timestamptz not null default now(),
  "created_by_id" uuid default auth.uid()
);

create table if not exists public."quotation" (
  "id" uuid primary key default gen_random_uuid(),
  "rfq_id" uuid not null,
  "rfq_number" text,
  "organization_id" uuid,
  "vendor_id" uuid not null,
  "vendor_name" text,
  "line_items" jsonb,
  "subtotal" numeric,
  "tax" numeric,
  "total" numeric not null,
  "delivery_days" numeric,
  "validity_days" numeric default 30,
  "notes" text,
  "status" text default 'submitted' check ("status" is null or "status" in ('submitted', 'revised', 'accepted', 'rejected', 'expired')),
  "version" numeric default 1,
  "revision_of" text,
  "revision_notes" text,
  "created_date" timestamptz not null default now(),
  "updated_date" timestamptz not null default now(),
  "created_by_id" uuid default auth.uid()
);

create table if not exists public."revenue_stream" (
  "id" uuid primary key default gen_random_uuid(),
  "key" text not null,
  "name" text not null,
  "category" text default 'fee' check ("category" is null or "category" in ('commission', 'fee', 'subscription', 'advertising', 'lead', 'service')) not null,
  "model_type" text default 'flat' check ("model_type" is null or "model_type" in ('percentage', 'flat', 'subscription', 'referral')),
  "rate" numeric default 0,
  "fee" numeric default 0,
  "applies_to" text,
  "description" text,
  "active" boolean default true,
  "display_order" numeric default 0,
  "created_date" timestamptz not null default now(),
  "updated_date" timestamptz not null default now(),
  "created_by_id" uuid default auth.uid()
);

create table if not exists public."review" (
  "id" uuid primary key default gen_random_uuid(),
  "entity_type" text default 'product' check ("entity_type" is null or "entity_type" in ('product', 'service', 'vendor', 'amc')) not null,
  "entity_id" text not null,
  "entity_name" text,
  "user_id" uuid not null,
  "user_name" text,
  "rating" numeric default 5 not null,
  "title" text,
  "comment" text,
  "images" text[] default '{}'::text[],
  "status" text default 'approved' check ("status" is null or "status" in ('pending', 'approved', 'rejected')),
  "helpful_count" numeric default 0,
  "created_date" timestamptz not null default now(),
  "updated_date" timestamptz not null default now(),
  "created_by_id" uuid default auth.uid()
);

create table if not exists public."rfq" (
  "id" uuid primary key default gen_random_uuid(),
  "rfq_number" text not null,
  "customer_id" uuid not null,
  "customer_name" text,
  "organization_id" uuid,
  "organization_name" text,
  "title" text not null,
  "description" text,
  "category" text,
  "items" jsonb,
  "delivery_location" text,
  "expected_delivery_date" date,
  "status" text default 'open' check ("status" is null or "status" in ('open', 'quoted', 'awarded', 'closed', 'cancelled')),
  "invited_vendors" text[] default '{}'::text[],
  "awarded_vendor_id" text,
  "po_number" text,
  "created_date" timestamptz not null default now(),
  "updated_date" timestamptz not null default now(),
  "created_by_id" uuid default auth.uid()
);

create table if not exists public."service" (
  "id" uuid primary key default gen_random_uuid(),
  "name" text not null,
  "slug" text,
  "vendor_id" uuid,
  "vendor_name" text,
  "category" text not null,
  "service_type" text,
  "description" text,
  "price" numeric not null,
  "mrp" numeric,
  "duration_hours" numeric default 1,
  "image_url" text,
  "service_location" text,
  "approval_status" text default 'pending' check ("approval_status" is null or "approval_status" in ('draft', 'pending', 'approved', 'rejected', 'disabled')),
  "featured" boolean default false,
  "rating" numeric default 0,
  "reviews_count" numeric default 0,
  "created_date" timestamptz not null default now(),
  "updated_date" timestamptz not null default now(),
  "created_by_id" uuid default auth.uid()
);

create table if not exists public."service_request" (
  "id" uuid primary key default gen_random_uuid(),
  "request_number" text not null,
  "customer_id" uuid not null,
  "customer_name" text,
  "organization_id" uuid,
  "asset_id" uuid,
  "asset_name" text,
  "site_name" text,
  "service_type" text not null,
  "priority" text default 'medium' check ("priority" is null or "priority" in ('low', 'medium', 'high', 'critical')),
  "description" text,
  "scheduled_date" date,
  "assigned_technician_id" text,
  "assigned_technician_name" text,
  "vendor_id" uuid,
  "status" text default 'open' check ("status" is null or "status" in ('open', 'assigned', 'in_progress', 'completed', 'cancelled')),
  "completion_notes" text,
  "created_date" timestamptz not null default now(),
  "updated_date" timestamptz not null default now(),
  "created_by_id" uuid default auth.uid()
);

create table if not exists public."settlement" (
  "id" uuid primary key default gen_random_uuid(),
  "vendor_id" uuid not null,
  "vendor_name" text,
  "period" text,
  "order_ids" text[] default '{}'::text[],
  "order_count" numeric default 0,
  "gross" numeric not null,
  "commission_rate" numeric default 0.05,
  "commission" numeric default 0,
  "net_payable" numeric not null,
  "status" text default 'pending' check ("status" is null or "status" in ('pending', 'approved', 'paid')),
  "notes" text,
  "created_date" timestamptz not null default now(),
  "updated_date" timestamptz not null default now(),
  "created_by_id" uuid default auth.uid()
);

create table if not exists public."site" (
  "id" uuid primary key default gen_random_uuid(),
  "name" text not null,
  "organization_id" uuid not null,
  "organization_name" text,
  "address" text,
  "city" text,
  "state" text,
  "buildings" text[] default '{}'::text[],
  "floors" numeric default 1,
  "created_date" timestamptz not null default now(),
  "updated_date" timestamptz not null default now(),
  "created_by_id" uuid default auth.uid()
);

create table if not exists public."support_ticket" (
  "id" uuid primary key default gen_random_uuid(),
  "ticket_number" text not null,
  "subject" text not null,
  "category" text check ("category" is null or "category" in ('order', 'payment', 'product', 'rfq', 'asset', 'certificate', 'compliance', 'service', 'technical')) not null,
  "priority" text default 'medium' check ("priority" is null or "priority" in ('low', 'medium', 'high', 'urgent')),
  "description" text,
  "user_id" uuid not null,
  "user_name" text,
  "organization_id" uuid,
  "assigned_to" text,
  "status" text default 'open' check ("status" is null or "status" in ('open', 'assigned', 'in_progress', 'waiting_for_customer', 'resolved', 'closed')),
  "created_date" timestamptz not null default now(),
  "updated_date" timestamptz not null default now(),
  "created_by_id" uuid default auth.uid()
);

create table if not exists public."technician" (
  "id" uuid primary key default gen_random_uuid(),
  "vendor_id" uuid not null,
  "vendor_name" text,
  "name" text not null,
  "email" text,
  "phone" text,
  "city" text,
  "skills" text[] default '{}'::text[],
  "certifications" text[] default '{}'::text[],
  "jobs_completed" numeric default 0,
  "status" text default 'active' check ("status" is null or "status" in ('active', 'inactive')),
  "created_date" timestamptz not null default now(),
  "updated_date" timestamptz not null default now(),
  "created_by_id" uuid default auth.uid()
);

create table if not exists public."vendor" (
  "id" uuid primary key default gen_random_uuid(),
  "company_name" text not null,
  "trade_name" text,
  "business_type" text default 'manufacturer' check ("business_type" is null or "business_type" in ('manufacturer', 'distributor', 'reseller', 'service_provider', 'system_integrator')),
  "business_category" text default 'B2B' check ("business_category" is null or "business_category" in ('B2B', 'B2C')),
  "vendor_type" text default 'Sales' check ("vendor_type" is null or "vendor_type" in ('Sales', 'Sales & Service', 'Service')),
  "registration_number" text,
  "gst_number" text,
  "pan_number" text,
  "msme_number" text,
  "udyam_number" text,
  "year_established" numeric,
  "website" text,
  "contact_person" text not null,
  "email" text,
  "phone" text,
  "address" text,
  "city" text,
  "state" text,
  "pincode" text,
  "categories" text[] default '{}'::text[],
  "brands" text[] default '{}'::text[],
  "services_offered" text[] default '{}'::text[],
  "industries_served" text[] default '{}'::text[],
  "service_locations" text[] default '{}'::text[],
  "delivery_locations" text[] default '{}'::text[],
  "employees_count" numeric default 0,
  "bank_name" text,
  "account_holder" text,
  "account_number" text,
  "ifsc_code" text,
  "bank_proof_url" text,
  "digital_signature_url" text,
  "auth_signature_url" text,
  "manufacturer_auth_url" text,
  "description" text,
  "logo_url" text,
  "approval_status" text default 'submitted' check ("approval_status" is null or "approval_status" in ('draft', 'submitted', 'documents_required', 'under_review', 'approved', 'rejected', 'suspended')),
  "rejection_reason" text,
  "admin_remarks" text,
  "rating" numeric default 0,
  "revenue" numeric default 0,
  "owner_id" uuid,
  "profile_completion" numeric default 0,
  "subscription_tier" text default 'free' check ("subscription_tier" is null or "subscription_tier" in ('free', 'silver', 'gold')),
  "subscription_expires" date,
  "created_date" timestamptz not null default now(),
  "updated_date" timestamptz not null default now(),
  "created_by_id" uuid default auth.uid()
);

create table if not exists public."vendor_document" (
  "id" uuid primary key default gen_random_uuid(),
  "vendor_id" uuid not null,
  "doc_type" text check ("doc_type" is null or "doc_type" in ('gst_certificate', 'pan', 'company_registration', 'address_proof', 'bank_proof', 'signatory_id', 'msme_certificate', 'manufacturer_authorization', 'iso_certificate', 'product_certification', 'fire_safety_certification', 'contract', 'invoice', 'report', 'other')) not null,
  "name" text,
  "file_url" text,
  "status" text default 'uploaded' check ("status" is null or "status" in ('uploaded', 'under_review', 'approved', 'rejected', 'replacement_required', 'expired')),
  "expiry_date" date,
  "remarks" text,
  "version" numeric default 1,
  "created_date" timestamptz not null default now(),
  "updated_date" timestamptz not null default now(),
  "created_by_id" uuid default auth.uid()
);

create table if not exists public."vendor_plan" (
  "id" uuid primary key default gen_random_uuid(),
  "tier" text default 'free' check ("tier" is null or "tier" in ('free', 'silver', 'gold')) not null,
  "name" text not null,
  "price" numeric default 0 not null,
  "duration_months" numeric default 12,
  "product_limit" numeric default 20,
  "service_limit" numeric default 5,
  "features" text[] default '{}'::text[],
  "search_priority" numeric default 0,
  "highlight_color" text default 'slate',
  "popular" boolean default false,
  "active" boolean default true,
  "display_order" numeric default 0,
  "created_date" timestamptz not null default now(),
  "updated_date" timestamptz not null default now(),
  "created_by_id" uuid default auth.uid()
);

create table if not exists public."vendor_staff" (
  "id" uuid primary key default gen_random_uuid(),
  "vendor_id" uuid not null,
  "vendor_name" text,
  "email" text not null,
  "full_name" text,
  "staff_role" text default 'VIEW_ONLY' check ("staff_role" is null or "staff_role" in ('VENDOR_ADMIN', 'SALES_MANAGER', 'PRODUCT_MANAGER', 'INVENTORY_MANAGER', 'ORDER_MANAGER', 'SERVICE_MANAGER', 'FINANCE_USER', 'VIEW_ONLY')) not null,
  "status" text default 'active' check ("status" is null or "status" in ('active', 'inactive')),
  "created_date" timestamptz not null default now(),
  "updated_date" timestamptz not null default now(),
  "created_by_id" uuid default auth.uid()
);

create table if not exists public."vendor_wallet" (
  "id" uuid primary key default gen_random_uuid(),
  "vendor_id" uuid not null,
  "vendor_name" text,
  "balance" numeric default 0,
  "currency" text default 'INR',
  "transactions" jsonb default '[]'::jsonb,
  "created_date" timestamptz not null default now(),
  "updated_date" timestamptz not null default now(),
  "created_by_id" uuid default auth.uid()
);

create table if not exists public."warehouse" (
  "id" uuid primary key default gen_random_uuid(),
  "vendor_id" uuid not null,
  "name" text not null,
  "address" text,
  "city" text,
  "state" text,
  "pincode" text,
  "contact_person" text,
  "phone" text,
  "operating_hours" text,
  "active" boolean default true,
  "created_date" timestamptz not null default now(),
  "updated_date" timestamptz not null default now(),
  "created_by_id" uuid default auth.uid()
);

-- indexes
create index if not exists "advertisement_created_by_id_idx" on public."advertisement" ("created_by_id");
create index if not exists "advertisement_vendor_id_idx" on public."advertisement" ("vendor_id");
create index if not exists "advertisement_status_idx" on public."advertisement" ("status");
create index if not exists "advertisement_created_date_idx" on public."advertisement" ("created_date" desc);
create index if not exists "amc_plan_created_by_id_idx" on public."amc_plan" ("created_by_id");
create index if not exists "amc_plan_vendor_id_idx" on public."amc_plan" ("vendor_id");
create index if not exists "amc_plan_status_idx" on public."amc_plan" ("status");
create index if not exists "amc_plan_created_date_idx" on public."amc_plan" ("created_date" desc);
create index if not exists "app_notification_created_by_id_idx" on public."app_notification" ("created_by_id");
create index if not exists "app_notification_user_id_idx" on public."app_notification" ("user_id");
create index if not exists "app_notification_created_date_idx" on public."app_notification" ("created_date" desc);
create index if not exists "asset_created_by_id_idx" on public."asset" ("created_by_id");
create index if not exists "asset_category_idx" on public."asset" ("category");
create index if not exists "asset_organization_id_idx" on public."asset" ("organization_id");
create index if not exists "asset_site_id_idx" on public."asset" ("site_id");
create index if not exists "asset_status_idx" on public."asset" ("status");
create index if not exists "asset_owner_id_idx" on public."asset" ("owner_id");
create index if not exists "asset_created_date_idx" on public."asset" ("created_date" desc);
create index if not exists "audit_log_created_by_id_idx" on public."audit_log" ("created_by_id");
create index if not exists "audit_log_user_id_idx" on public."audit_log" ("user_id");
create index if not exists "audit_log_created_date_idx" on public."audit_log" ("created_date" desc);
create index if not exists "capa_created_by_id_idx" on public."capa" ("created_by_id");
create index if not exists "capa_asset_id_idx" on public."capa" ("asset_id");
create index if not exists "capa_organization_id_idx" on public."capa" ("organization_id");
create index if not exists "capa_status_idx" on public."capa" ("status");
create index if not exists "capa_created_date_idx" on public."capa" ("created_date" desc);
create index if not exists "category_created_by_id_idx" on public."category" ("created_by_id");
create index if not exists "category_parent_id_idx" on public."category" ("parent_id");
create index if not exists "category_is_active_idx" on public."category" ("is_active");
create index if not exists "category_created_date_idx" on public."category" ("created_date" desc);
create index if not exists "certificate_created_by_id_idx" on public."certificate" ("created_by_id");
create index if not exists "certificate_asset_id_idx" on public."certificate" ("asset_id");
create index if not exists "certificate_organization_id_idx" on public."certificate" ("organization_id");
create index if not exists "certificate_status_idx" on public."certificate" ("status");
create index if not exists "certificate_created_date_idx" on public."certificate" ("created_date" desc);
create index if not exists "document_created_by_id_idx" on public."document" ("created_by_id");
create index if not exists "document_organization_id_idx" on public."document" ("organization_id");
create index if not exists "document_created_date_idx" on public."document" ("created_date" desc);
create index if not exists "feature_flag_created_by_id_idx" on public."feature_flag" ("created_by_id");
create index if not exists "feature_flag_category_idx" on public."feature_flag" ("category");
create index if not exists "feature_flag_enabled_idx" on public."feature_flag" ("enabled");
create index if not exists "feature_flag_created_date_idx" on public."feature_flag" ("created_date" desc);
create index if not exists "fire_audit_request_created_by_id_idx" on public."fire_audit_request" ("created_by_id");
create index if not exists "fire_audit_request_customer_id_idx" on public."fire_audit_request" ("customer_id");
create index if not exists "fire_audit_request_organization_id_idx" on public."fire_audit_request" ("organization_id");
create index if not exists "fire_audit_request_status_idx" on public."fire_audit_request" ("status");
create index if not exists "fire_audit_request_created_date_idx" on public."fire_audit_request" ("created_date" desc);
create index if not exists "job_vacancy_created_by_id_idx" on public."job_vacancy" ("created_by_id");
create index if not exists "job_vacancy_vendor_id_idx" on public."job_vacancy" ("vendor_id");
create index if not exists "job_vacancy_role_idx" on public."job_vacancy" ("role");
create index if not exists "job_vacancy_status_idx" on public."job_vacancy" ("status");
create index if not exists "job_vacancy_created_date_idx" on public."job_vacancy" ("created_date" desc);
create index if not exists "noc_created_by_id_idx" on public."noc" ("created_by_id");
create index if not exists "noc_organization_id_idx" on public."noc" ("organization_id");
create index if not exists "noc_status_idx" on public."noc" ("status");
create index if not exists "noc_created_date_idx" on public."noc" ("created_date" desc);
create index if not exists "offer_created_by_id_idx" on public."offer" ("created_by_id");
create index if not exists "offer_vendor_id_idx" on public."offer" ("vendor_id");
create index if not exists "offer_status_idx" on public."offer" ("status");
create index if not exists "offer_created_date_idx" on public."offer" ("created_date" desc);
create index if not exists "order_created_by_id_idx" on public."order" ("created_by_id");
create index if not exists "order_customer_id_idx" on public."order" ("customer_id");
create index if not exists "order_organization_id_idx" on public."order" ("organization_id");
create index if not exists "order_vendor_id_idx" on public."order" ("vendor_id");
create index if not exists "order_status_idx" on public."order" ("status");
create index if not exists "order_created_date_idx" on public."order" ("created_date" desc);
create index if not exists "organization_created_by_id_idx" on public."organization" ("created_by_id");
create index if not exists "organization_owner_id_idx" on public."organization" ("owner_id");
create index if not exists "organization_created_date_idx" on public."organization" ("created_date" desc);
create index if not exists "product_created_by_id_idx" on public."product" ("created_by_id");
create index if not exists "product_category_idx" on public."product" ("category");
create index if not exists "product_vendor_id_idx" on public."product" ("vendor_id");
create index if not exists "product_approval_status_idx" on public."product" ("approval_status");
create index if not exists "product_created_date_idx" on public."product" ("created_date" desc);
create index if not exists "quotation_created_by_id_idx" on public."quotation" ("created_by_id");
create index if not exists "quotation_rfq_id_idx" on public."quotation" ("rfq_id");
create index if not exists "quotation_organization_id_idx" on public."quotation" ("organization_id");
create index if not exists "quotation_vendor_id_idx" on public."quotation" ("vendor_id");
create index if not exists "quotation_status_idx" on public."quotation" ("status");
create index if not exists "quotation_created_date_idx" on public."quotation" ("created_date" desc);
create index if not exists "revenue_stream_created_by_id_idx" on public."revenue_stream" ("created_by_id");
create index if not exists "revenue_stream_category_idx" on public."revenue_stream" ("category");
create index if not exists "revenue_stream_active_idx" on public."revenue_stream" ("active");
create index if not exists "revenue_stream_created_date_idx" on public."revenue_stream" ("created_date" desc);
create index if not exists "review_created_by_id_idx" on public."review" ("created_by_id");
create index if not exists "review_user_id_idx" on public."review" ("user_id");
create index if not exists "review_status_idx" on public."review" ("status");
create index if not exists "review_created_date_idx" on public."review" ("created_date" desc);
create index if not exists "rfq_created_by_id_idx" on public."rfq" ("created_by_id");
create index if not exists "rfq_customer_id_idx" on public."rfq" ("customer_id");
create index if not exists "rfq_organization_id_idx" on public."rfq" ("organization_id");
create index if not exists "rfq_category_idx" on public."rfq" ("category");
create index if not exists "rfq_status_idx" on public."rfq" ("status");
create index if not exists "rfq_created_date_idx" on public."rfq" ("created_date" desc);
create index if not exists "service_created_by_id_idx" on public."service" ("created_by_id");
create index if not exists "service_vendor_id_idx" on public."service" ("vendor_id");
create index if not exists "service_category_idx" on public."service" ("category");
create index if not exists "service_approval_status_idx" on public."service" ("approval_status");
create index if not exists "service_created_date_idx" on public."service" ("created_date" desc);
create index if not exists "service_request_created_by_id_idx" on public."service_request" ("created_by_id");
create index if not exists "service_request_customer_id_idx" on public."service_request" ("customer_id");
create index if not exists "service_request_organization_id_idx" on public."service_request" ("organization_id");
create index if not exists "service_request_asset_id_idx" on public."service_request" ("asset_id");
create index if not exists "service_request_vendor_id_idx" on public."service_request" ("vendor_id");
create index if not exists "service_request_status_idx" on public."service_request" ("status");
create index if not exists "service_request_created_date_idx" on public."service_request" ("created_date" desc);
create index if not exists "settlement_created_by_id_idx" on public."settlement" ("created_by_id");
create index if not exists "settlement_vendor_id_idx" on public."settlement" ("vendor_id");
create index if not exists "settlement_status_idx" on public."settlement" ("status");
create index if not exists "settlement_created_date_idx" on public."settlement" ("created_date" desc);
create index if not exists "site_created_by_id_idx" on public."site" ("created_by_id");
create index if not exists "site_organization_id_idx" on public."site" ("organization_id");
create index if not exists "site_created_date_idx" on public."site" ("created_date" desc);
create index if not exists "support_ticket_created_by_id_idx" on public."support_ticket" ("created_by_id");
create index if not exists "support_ticket_category_idx" on public."support_ticket" ("category");
create index if not exists "support_ticket_user_id_idx" on public."support_ticket" ("user_id");
create index if not exists "support_ticket_organization_id_idx" on public."support_ticket" ("organization_id");
create index if not exists "support_ticket_status_idx" on public."support_ticket" ("status");
create index if not exists "support_ticket_created_date_idx" on public."support_ticket" ("created_date" desc);
create index if not exists "technician_created_by_id_idx" on public."technician" ("created_by_id");
create index if not exists "technician_vendor_id_idx" on public."technician" ("vendor_id");
create index if not exists "technician_status_idx" on public."technician" ("status");
create index if not exists "technician_created_date_idx" on public."technician" ("created_date" desc);
create index if not exists "vendor_created_by_id_idx" on public."vendor" ("created_by_id");
create index if not exists "vendor_approval_status_idx" on public."vendor" ("approval_status");
create index if not exists "vendor_owner_id_idx" on public."vendor" ("owner_id");
create index if not exists "vendor_created_date_idx" on public."vendor" ("created_date" desc);
create index if not exists "vendor_document_created_by_id_idx" on public."vendor_document" ("created_by_id");
create index if not exists "vendor_document_vendor_id_idx" on public."vendor_document" ("vendor_id");
create index if not exists "vendor_document_doc_type_idx" on public."vendor_document" ("doc_type");
create index if not exists "vendor_document_status_idx" on public."vendor_document" ("status");
create index if not exists "vendor_document_created_date_idx" on public."vendor_document" ("created_date" desc);
create index if not exists "vendor_plan_created_by_id_idx" on public."vendor_plan" ("created_by_id");
create index if not exists "vendor_plan_active_idx" on public."vendor_plan" ("active");
create index if not exists "vendor_plan_created_date_idx" on public."vendor_plan" ("created_date" desc);
create index if not exists "vendor_staff_created_by_id_idx" on public."vendor_staff" ("created_by_id");
create index if not exists "vendor_staff_vendor_id_idx" on public."vendor_staff" ("vendor_id");
create index if not exists "vendor_staff_status_idx" on public."vendor_staff" ("status");
create index if not exists "vendor_staff_created_date_idx" on public."vendor_staff" ("created_date" desc);
create index if not exists "vendor_wallet_created_by_id_idx" on public."vendor_wallet" ("created_by_id");
create index if not exists "vendor_wallet_vendor_id_idx" on public."vendor_wallet" ("vendor_id");
create index if not exists "vendor_wallet_created_date_idx" on public."vendor_wallet" ("created_date" desc);
create index if not exists "warehouse_created_by_id_idx" on public."warehouse" ("created_by_id");
create index if not exists "warehouse_vendor_id_idx" on public."warehouse" ("vendor_id");
create index if not exists "warehouse_active_idx" on public."warehouse" ("active");
create index if not exists "warehouse_created_date_idx" on public."warehouse" ("created_date" desc);

-- updated_date triggers
drop trigger if exists "advertisement_set_updated_date" on public."advertisement";
create trigger "advertisement_set_updated_date" before update on public."advertisement" for each row execute function public.set_updated_date();
drop trigger if exists "amc_plan_set_updated_date" on public."amc_plan";
create trigger "amc_plan_set_updated_date" before update on public."amc_plan" for each row execute function public.set_updated_date();
drop trigger if exists "app_notification_set_updated_date" on public."app_notification";
create trigger "app_notification_set_updated_date" before update on public."app_notification" for each row execute function public.set_updated_date();
drop trigger if exists "asset_set_updated_date" on public."asset";
create trigger "asset_set_updated_date" before update on public."asset" for each row execute function public.set_updated_date();
drop trigger if exists "audit_log_set_updated_date" on public."audit_log";
create trigger "audit_log_set_updated_date" before update on public."audit_log" for each row execute function public.set_updated_date();
drop trigger if exists "capa_set_updated_date" on public."capa";
create trigger "capa_set_updated_date" before update on public."capa" for each row execute function public.set_updated_date();
drop trigger if exists "category_set_updated_date" on public."category";
create trigger "category_set_updated_date" before update on public."category" for each row execute function public.set_updated_date();
drop trigger if exists "certificate_set_updated_date" on public."certificate";
create trigger "certificate_set_updated_date" before update on public."certificate" for each row execute function public.set_updated_date();
drop trigger if exists "document_set_updated_date" on public."document";
create trigger "document_set_updated_date" before update on public."document" for each row execute function public.set_updated_date();
drop trigger if exists "feature_flag_set_updated_date" on public."feature_flag";
create trigger "feature_flag_set_updated_date" before update on public."feature_flag" for each row execute function public.set_updated_date();
drop trigger if exists "fire_audit_request_set_updated_date" on public."fire_audit_request";
create trigger "fire_audit_request_set_updated_date" before update on public."fire_audit_request" for each row execute function public.set_updated_date();
drop trigger if exists "job_vacancy_set_updated_date" on public."job_vacancy";
create trigger "job_vacancy_set_updated_date" before update on public."job_vacancy" for each row execute function public.set_updated_date();
drop trigger if exists "noc_set_updated_date" on public."noc";
create trigger "noc_set_updated_date" before update on public."noc" for each row execute function public.set_updated_date();
drop trigger if exists "offer_set_updated_date" on public."offer";
create trigger "offer_set_updated_date" before update on public."offer" for each row execute function public.set_updated_date();
drop trigger if exists "order_set_updated_date" on public."order";
create trigger "order_set_updated_date" before update on public."order" for each row execute function public.set_updated_date();
drop trigger if exists "organization_set_updated_date" on public."organization";
create trigger "organization_set_updated_date" before update on public."organization" for each row execute function public.set_updated_date();
drop trigger if exists "product_set_updated_date" on public."product";
create trigger "product_set_updated_date" before update on public."product" for each row execute function public.set_updated_date();
drop trigger if exists "quotation_set_updated_date" on public."quotation";
create trigger "quotation_set_updated_date" before update on public."quotation" for each row execute function public.set_updated_date();
drop trigger if exists "revenue_stream_set_updated_date" on public."revenue_stream";
create trigger "revenue_stream_set_updated_date" before update on public."revenue_stream" for each row execute function public.set_updated_date();
drop trigger if exists "review_set_updated_date" on public."review";
create trigger "review_set_updated_date" before update on public."review" for each row execute function public.set_updated_date();
drop trigger if exists "rfq_set_updated_date" on public."rfq";
create trigger "rfq_set_updated_date" before update on public."rfq" for each row execute function public.set_updated_date();
drop trigger if exists "service_set_updated_date" on public."service";
create trigger "service_set_updated_date" before update on public."service" for each row execute function public.set_updated_date();
drop trigger if exists "service_request_set_updated_date" on public."service_request";
create trigger "service_request_set_updated_date" before update on public."service_request" for each row execute function public.set_updated_date();
drop trigger if exists "settlement_set_updated_date" on public."settlement";
create trigger "settlement_set_updated_date" before update on public."settlement" for each row execute function public.set_updated_date();
drop trigger if exists "site_set_updated_date" on public."site";
create trigger "site_set_updated_date" before update on public."site" for each row execute function public.set_updated_date();
drop trigger if exists "support_ticket_set_updated_date" on public."support_ticket";
create trigger "support_ticket_set_updated_date" before update on public."support_ticket" for each row execute function public.set_updated_date();
drop trigger if exists "technician_set_updated_date" on public."technician";
create trigger "technician_set_updated_date" before update on public."technician" for each row execute function public.set_updated_date();
drop trigger if exists "vendor_set_updated_date" on public."vendor";
create trigger "vendor_set_updated_date" before update on public."vendor" for each row execute function public.set_updated_date();
drop trigger if exists "vendor_document_set_updated_date" on public."vendor_document";
create trigger "vendor_document_set_updated_date" before update on public."vendor_document" for each row execute function public.set_updated_date();
drop trigger if exists "vendor_plan_set_updated_date" on public."vendor_plan";
create trigger "vendor_plan_set_updated_date" before update on public."vendor_plan" for each row execute function public.set_updated_date();
drop trigger if exists "vendor_staff_set_updated_date" on public."vendor_staff";
create trigger "vendor_staff_set_updated_date" before update on public."vendor_staff" for each row execute function public.set_updated_date();
drop trigger if exists "vendor_wallet_set_updated_date" on public."vendor_wallet";
create trigger "vendor_wallet_set_updated_date" before update on public."vendor_wallet" for each row execute function public.set_updated_date();
drop trigger if exists "warehouse_set_updated_date" on public."warehouse";
create trigger "warehouse_set_updated_date" before update on public."warehouse" for each row execute function public.set_updated_date();

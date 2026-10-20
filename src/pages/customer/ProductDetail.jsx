import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useCart } from "@/lib/CartContext";
import { Image } from "@/components/ui/image";
import { SectionCard } from "@/components/ui-bits";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { formatINR } from "@/hooks/useList";
import { ShoppingCart, Heart, GitCompare, FileText, Star, Shield, Truck, Award, ArrowLeft, Minus, Plus, BadgeCheck, FileCheck2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useAuthGate } from "@/hooks/useAuthGate";
import { useConsumePendingAction } from "@/hooks/useConsumePendingAction";
import AuthRequiredModal from "@/components/AuthRequiredModal";
import Reviews from "@/components/Reviews";
import Seo from "@/components/Seo";
import { productKeywords } from "@/lib/seoPages";
import { productSchema, breadcrumbSchema, graph } from "@/lib/schema";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const { toast } = useToast();
  const { authed, open, setOpen, message, gate } = useAuthGate();
  useConsumePendingAction(authed);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [wished, setWished] = useState(false);

  useEffect(() => {
    (async () => {
      try { setProduct(await base44.entities.Product.get(id)); }
      catch {} finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />;
  if (!product) return <SectionCard><div className="p-10 text-center text-slate-500">Product not found.</div></SectionCard>;

  const off = product.mrp && product.mrp > product.price ? Math.round((1 - product.price / product.mrp) * 100) : 0;
  const inStock = product.stock > 0;

  const addToCart = () => gate({
    action: "add_to_cart",
    payload: { ...product, qty },
    message: "Sign in to add products to your cart.",
    run: () => { add(product, qty); toast({ title: "Added to cart", description: `${qty} × ${product.name}` }); },
  });
  const buyNow = () => gate({
    action: "buy_now",
    payload: { ...product, qty },
    message: "Sign in to complete your purchase.",
    run: () => { add(product, qty); navigate("/cart"); },
  });

  return (
    <div>
      <Seo
        title={`${product.name} — Buy Online in India | FireLink`}
        description={`${product.name}${product.brand ? ` by ${product.brand}` : ""} — buy online in India with GST invoice, warranty and PAN-India delivery from FireLink's verified vendors.`}
        keywords={productKeywords(product)}
        path={`/products/${id}`}
        image={product.image_url}
        type="product"
        jsonLd={graph(
          productSchema(product, `/products/${id}`),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Products", path: "/products" },
            { name: product.name, path: `/products/${id}` },
          ])
        )}
      />
      <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900"><ArrowLeft className="h-3.5 w-3.5" /> Back to products</button>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="relative aspect-square bg-slate-50">
            {product.image_url ? <Image src={product.image_url} fittingType="fill" alt={`${product.name}${product.brand ? ` by ${product.brand}` : ""} — ${product.category || "fire safety"} available in India`} className="h-full w-full" /> : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-300"><ShoppingCart className="h-16 w-16" /></div>
            )}
            {off > 0 && <span className="absolute left-3 top-3 rounded-md bg-emerald-600 px-2 py-1 text-xs font-bold text-white shadow">{off}% OFF</span>}
            {product.featured && <span className="absolute right-3 top-3 rounded-md bg-slate-900/85 px-2 py-1 text-xs font-semibold text-white shadow">★ Featured</span>}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-rose-600">{product.category}</span>
            {product.featured && <StatusBadge status="featured" tone="rose" />}
          </div>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">{product.name}</h1>
          <p className="mt-1 text-sm text-slate-500">{product.brand} · by {product.vendor_name}</p>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700">
              {product.rating || "New"} <Star className="h-3.5 w-3.5 fill-emerald-600 text-emerald-600" />
            </span>
            {product.reviews_count ? <span className="text-slate-400">{product.reviews_count} ratings</span> : <span className="text-slate-400">No ratings yet</span>}
          </div>

          <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="flex items-end gap-3">
              <span className="text-3xl font-bold text-slate-900">{formatINR(product.price)}</span>
              {product.mrp && product.mrp > product.price && <span className="pb-1 text-sm text-slate-400 line-through">{formatINR(product.mrp)}</span>}
              <span className="pb-1 text-xs text-slate-500">/{product.unit || "piece"}</span>
            </div>
            {off > 0 && <p className="mt-1 text-xs font-semibold text-emerald-600">You save {formatINR(product.mrp - product.price)} ({off}%)</p>}
            <p className="mt-1.5 text-xs text-slate-500">
              Inclusive of all taxes · MOQ: {product.moq || 1}
              <span className={cn("ml-2 inline-flex items-center gap-1 font-semibold", inStock ? "text-emerald-600" : "text-rose-600")}>
                {inStock ? <><BadgeCheck className="h-3.5 w-3.5" /> In stock ({product.stock})</> : "Out of stock"}
              </span>
            </p>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-slate-200">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 text-slate-500 hover:bg-slate-50"><Minus className="h-4 w-4" /></button>
              <span className="w-10 text-center text-sm font-medium">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="px-3 py-2 text-slate-500 hover:bg-slate-50"><Plus className="h-4 w-4" /></button>
            </div>
            <button onClick={addToCart} disabled={!inStock} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50">
              <ShoppingCart className="h-4 w-4" /> Add to Cart
            </button>
            <button onClick={() => gate({ action: "wishlist", payload: { id: product.id }, message: "Sign in to save products to your wishlist.", run: () => setWished(!wished) })} className="rounded-lg border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50"><Heart className={cn("h-4 w-4", wished && "fill-rose-500 text-rose-500")} /></button>
          </div>
          <button onClick={buyNow} disabled={!inStock} className="mt-2.5 w-full rounded-lg bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:bg-slate-300">Buy Now</button>

          <div className="mt-2.5 flex gap-2">
            <button onClick={() => gate({ action: "request_quote", message: "Create a free account to request a quote.", run: () => navigate("/rfqs") })} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><FileText className="h-4 w-4" /> Request Quote</button>
            <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><GitCompare className="h-4 w-4" /> Compare</button>
          </div>

          <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3">
            <p className="flex items-center gap-2 text-xs font-medium text-emerald-800"><Truck className="h-4 w-4" /> Free delivery in 2–4 days on orders above ₹5,000</p>
            <p className="mt-1 flex items-center gap-2 text-xs font-medium text-emerald-800"><FileCheck2 className="h-4 w-4" /> GST invoice available · Warranty as per manufacturer</p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
            <Trust icon={Shield} label="Verified Vendor" />
            <Trust icon={Award} label={product.certifications?.[0] || "Certified"} />
            <Trust icon={Truck} label="Fast Dispatch" />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <SectionCard title="Description" className="lg:col-span-2">
          <div className="p-5 text-sm leading-relaxed text-slate-600">{product.description || "No description available for this product."}</div>
        </SectionCard>
        <SectionCard title="Specifications">
          <div className="divide-y divide-slate-50 p-1 text-sm">
            <Spec label="SKU" value={product.sku} />
            <Spec label="Brand" value={product.brand} />
            <Spec label="Manufacturer" value={product.manufacturer} />
            <Spec label="Category" value={product.category} />
            <Spec label="Certifications" value={(product.certifications || []).join(", ") || "—"} />
            <Spec label="Vendor" value={product.vendor_name} />
          </div>
        </SectionCard>
      </div>

      {(product.b2b_price || product.b2c_price) && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {product.b2b_price && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-600">B2B Bulk Price</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{formatINR(product.b2b_price)}</p>
              <p className="text-xs text-slate-500">For bulk orders · MOQ: {product.moq || 1}</p>
            </div>
          )}
          {product.b2c_price && (
            <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-violet-600">B2C Retail Price</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{formatINR(product.b2c_price)}</p>
              <p className="text-xs text-slate-500">For retail customers</p>
            </div>
          )}
        </div>
      )}

      <Reviews entityType="product" entityId={product.id} entityName={product.name} />

      <AuthRequiredModal open={open} onClose={() => setOpen(false)} message={message} />
    </div>
  );
}

const Trust = ({ icon: Icon, label }) => (
  <div className="flex flex-col items-center gap-1.5 rounded-xl bg-slate-50 p-3 text-center">
    <Icon className="h-4 w-4 text-rose-600" />
    <span className="text-[11px] font-medium text-slate-600">{label}</span>
  </div>
);
const Spec = ({ label, value }) => (
  <div className="flex items-center justify-between px-4 py-2.5">
    <span className="text-xs text-slate-500">{label}</span>
    <span className="text-sm font-medium text-slate-800">{value || "—"}</span>
  </div>
);
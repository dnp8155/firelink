import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useList } from "@/hooks/useList";
import { useCart } from "@/lib/state/CartContext";
import { useAuthGate } from "@/hooks/useAuthGate";
import { useConsumePendingAction } from "@/hooks/useConsumePendingAction";
import AuthRequiredModal from "@/components/AuthRequiredModal";
import ProductCard from "@/components/marketplace/ProductCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ArrowRight } from "lucide-react";

export default function FeaturedProducts() {
  const { data: products, loading } = useList("Product", { approval_status: "approved" }, "-created_date", 200);
  const { add } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { authed, open, setOpen, message, gate } = useAuthGate();
  useConsumePendingAction(authed);
  const [wishlist, setWishlist] = useState(() => { try { return JSON.parse(localStorage.getItem("fsc_wishlist")) || []; } catch { return []; } });

  const featured = useMemo(
    () =>
      [...products]
        .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || (b.rating || 0) - (a.rating || 0))
        .slice(0, 8),
    [products]
  );

  const toggleWish = (p) =>
    gate({
      action: "wishlist",
      payload: { id: p.id },
      message: "Sign in to save products to your wishlist.",
      run: () =>
        setWishlist((prev) => {
          const next = prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id];
          localStorage.setItem("fsc_wishlist", JSON.stringify(next));
          return next;
        }),
    });

  const addToCart = (p) =>
    gate({
      action: "add_to_cart",
      payload: p,
      message: "Sign in to add products to your cart.",
      run: () => { add(p); toast({ title: "Added to cart", description: p.name }); },
    });

  const requestQuote = (p) =>
    gate({
      action: "request_quote",
      payload: p,
      message: "Create a free account to request a quote.",
      run: () => navigate("/rfqs"),
    });

  return (
    <section id="featured" className="mx-auto max-w-7xl px-3 py-16 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Featured</p>
          <h2 className="font-display mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Featured Fire & Safety Products
          </h2>
          <p className="mt-2 text-sm text-slate-500">Certified equipment from India's verified fire safety vendors.</p>
        </div>
        <Button asChild variant="outline" className="font-medium">
          <Link to="/products">View All Products <ArrowRight className="h-4 w-4" /></Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-xl bg-white" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard
              key={p.id}
              p={p}
              wished={wishlist.includes(p.id)}
              onWish={toggleWish}
              onAdd={addToCart}
              onQuote={requestQuote}
            />
          ))}
        </div>
      )}

      <AuthRequiredModal open={open} onClose={() => setOpen(false)} message={message} />
    </section>
  );
}
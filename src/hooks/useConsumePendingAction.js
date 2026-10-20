import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/lib/state/CartContext";
import { useToast } from "@/components/ui/use-toast";
import { getPendingAction, clearPendingAction } from "@/lib/pendingAction";

/**
 * After login, completes the action the visitor started before signing in
 * (e.g. Add to Cart picked up from the product they were viewing).
 */
export function useConsumePendingAction(authed) {
  const { add } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authed) return;
    const act = getPendingAction();
    if (!act) return;
    clearPendingAction();

    if (act.type === "add_to_cart") {
      add(act.payload, act.payload?.qty || 1);
      toast({ title: "Added to cart", description: `${act.payload?.qty || 1} × ${act.payload?.name || "Product"}` });
    } else if (act.type === "buy_now") {
      add(act.payload, act.payload?.qty || 1);
      navigate("/cart");
    } else if (act.type === "request_quote") {
      navigate("/rfqs");
    } else if (act.type === "book_service") {
      navigate("/maintenance");
    } else if (act.type === "wishlist") {
      try {
        const list = JSON.parse(localStorage.getItem("fsc_wishlist")) || [];
        if (act.payload?.id && !list.includes(act.payload.id)) list.push(act.payload.id);
        localStorage.setItem("fsc_wishlist", JSON.stringify(list));
        toast({ title: "Saved to wishlist" });
      } catch {}
    }
  }, [authed]);
}
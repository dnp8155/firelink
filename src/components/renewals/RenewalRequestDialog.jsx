import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { orgIdentity } from "@/lib/orgScope";
import { logAudit } from "@/lib/auditLog";
import {
  earliestExpiry,
  renewalRfqDescription,
  renewalRfqItems,
  renewalRfqTitle,
} from "@/lib/renewals";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Send } from "lucide-react";

const FALLBACK_CATEGORIES = [
  "Fire Safety Services",
  "Fire Extinguisher Refilling",
  "Fire NOC & Audit",
  "AMC — Fire Safety",
  "Fire Alarm Maintenance",
];

// Raises a vendor quotation request (RFQ) for one or more expiring compliance records.
export default function RenewalRequestDialog({ open, onOpenChange, items = [], onDone }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const org = orgIdentity(user);
  const [busy, setBusy] = useState(false);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [form, setForm] = useState({ title: "", category: FALLBACK_CATEGORIES[0], expected_delivery_date: "" });
  const itemsKey = items.map((i) => i.id).join("|");

  useEffect(() => {
    if (!open) return;
    setForm({
      title: renewalRfqTitle(items),
      category: categories[0],
      expected_delivery_date: earliestExpiry(items),
    });
  }, [open, itemsKey]);

  useEffect(() => {
    (async () => {
      try {
        const cats = await base44.entities.Category.filter({ is_active: true }, "display_order", 100);
        const names = (cats || []).map((c) => c.name).filter(Boolean);
        if (names.length) setCategories(names);
      } catch (e) {
        // category list is best-effort — the fallback list is used
      }
    })();
  }, []);

  const submit = async () => {
    if (!items.length || busy) return;
    setBusy(true);
    try {
      const created = await base44.entities.RFQ.create({
        rfq_number: "RNW-" + Date.now().toString().slice(-8),
        customer_id: user?.id,
        customer_name: user?.full_name || user?.email || "Customer",
        organization_id: org.organization_id || null,
        organization_name: org.organization_name || "",
        title: form.title || renewalRfqTitle(items),
        category: form.category,
        description: renewalRfqDescription(items, org),
        delivery_location: org.organization_name || "Customer site",
        expected_delivery_date: form.expected_delivery_date || "",
        status: "open",
        items: renewalRfqItems(items),
      });
      logAudit({ action: "renewal_requested", module: "Renewals", entityId: created.id, after: form.title }).catch(() => {});
      onOpenChange(false);
      onDone?.();
      toast({ title: "Renewal request raised", description: "Notifying fire safety vendors…" });
      base44.functions
        .invoke("rfq_notify_vendors", { rfq_id: created.id })
        .then((res) => {
          const n = res?.data?.vendors_notified ?? 0;
          toast({ title: `${n} vendor(s) notified`, description: "Their quotations will appear under RFQs." });
        })
        .catch(() => {});
    } catch (e) {
      toast({ title: "Could not raise renewal", description: e?.response?.data?.error || e?.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Request renewal</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-600">{items.length} record(s) in this request</p>
            <ul className="mt-1.5 space-y-1">
              {items.map((i) => (
                <li key={i.id} className="text-xs text-slate-500">
                  • {i.label} — {i.reference} {i.expiry_date ? `(expires ${i.expiry_date})` : ""}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>

          <div>
            <Label>Category</Label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <Label>Required by</Label>
            <Input
              type="date"
              value={form.expected_delivery_date}
              onChange={(e) => setForm({ ...form, expected_delivery_date: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={submit} disabled={busy}>
            <Send className="h-4 w-4" /> {busy ? "Raising…" : "Send to vendors"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
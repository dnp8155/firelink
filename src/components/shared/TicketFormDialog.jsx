import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import SelectField from "@/components/shared/SelectField";
import { useToast } from "@/components/ui/use-toast";
import { nextNumber, orgIdentity } from "@/lib/orgScope";

const CATEGORY = [
  { value: "order", label: "Order" },
  { value: "payment", label: "Payment" },
  { value: "product", label: "Product" },
  { value: "rfq", label: "RFQ / Quotation" },
  { value: "asset", label: "Asset" },
  { value: "certificate", label: "Certificate" },
  { value: "compliance", label: "Compliance" },
  { value: "service", label: "Service" },
  { value: "technical", label: "Technical" },
];
const PRIORITY = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const EMPTY = { subject: "", category: "order", priority: "medium", description: "" };

export default function TicketFormDialog({ open, onOpenChange, user, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(EMPTY);
  }, [open]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.subject?.trim() || !form.description?.trim()) {
      toast({ title: "Subject and description are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const org = orgIdentity(user);
      await base44.entities.SupportTicket.create({
        ticket_number: nextNumber("TKT"),
        subject: form.subject.trim(),
        category: form.category,
        priority: form.priority,
        description: form.description.trim(),
        user_id: user?.id || "",
        user_name: user?.full_name || user?.email || "",
        organization_id: org.organization_id,
        status: "open",
      });
      toast({ title: "Support ticket raised" });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast({ title: "Could not raise ticket", description: err?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Raise a support ticket</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Subject</Label>
            <Input value={form.subject} onChange={(e) => set("subject", e.target.value)} placeholder="Invoice not received for order ORD-123" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label="Category" value={form.category} onChange={(v) => set("category", v)} options={CATEGORY} />
            <SelectField label="Priority" value={form.priority} onChange={(v) => set("priority", v)} options={PRIORITY} />
          </div>
          <div className="space-y-1.5">
            <Label>Describe the issue</Label>
            <Textarea rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Submitting…" : "Submit ticket"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useList } from "@/hooks/useList";
import { PageHeader, SectionCard, KpiCard } from "@/components/ui-bits";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import RecordTable from "@/components/shared/RecordTable";
import TicketFormDialog from "@/components/shared/TicketFormDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LifeBuoy, Plus, Clock, CheckCircle2, Eye } from "lucide-react";

export default function Support() {
  const { user } = useAuth();
  const { data, loading, reload } = useList("SupportTicket", { user_id: user?.id }, "-created_date", 200);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);

  const openCount = data.filter((t) => ["open", "assigned", "in_progress", "waiting_for_customer"].includes(t.status)).length;
  const resolved = data.filter((t) => ["resolved", "closed"].includes(t.status)).length;

  return (
    <div>
      <PageHeader
        title="Support"
        subtitle="Raise a ticket and track replies from the platform team."
        icon={LifeBuoy}
        actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New ticket</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Open tickets" value={openCount} icon={Clock} tone={openCount > 0 ? "amber" : "slate"} sub="Being worked on" />
        <KpiCard label="Resolved" value={resolved} icon={CheckCircle2} tone="green" sub="Closed tickets" />
        <KpiCard label="Total" value={data.length} icon={LifeBuoy} tone="slate" sub="All tickets" />
      </div>

      <div className="mt-5">
        <SectionCard title="My tickets">
          <RecordTable
            loading={loading}
            rows={data}
            empty={{
              icon: LifeBuoy,
              title: "No tickets yet",
              description: "Raise a ticket for order, payment, compliance or technical issues.",
              action: <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New ticket</Button>,
            }}
            columns={[
              { key: "ticket_number", label: "Ticket", render: (r) => (
                <div>
                  <p className="font-medium text-slate-900">{r.ticket_number}</p>
                  <p className="text-xs text-slate-500">{String(r.category || "").replace(/_/g, " ")}</p>
                </div>
              ) },
              { key: "subject", label: "Subject", render: (r) => <span className="line-clamp-2 max-w-sm">{r.subject}</span> },
              { key: "priority", label: "Priority", render: (r) => <StatusBadge status={r.priority} tone={r.priority === "urgent" || r.priority === "high" ? "red" : r.priority === "medium" ? "amber" : "gray"} /> },
              { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} tone={statusTone(r.status)} /> },
              { key: "created_date", label: "Raised", render: (r) => (r.created_date ? new Date(r.created_date).toLocaleDateString("en-IN") : "—") },
              { key: "actions", label: "", headClassName: "px-4 py-3 text-right", cellClassName: "px-4 py-3 text-right", render: (r) => (
                <Button size="sm" variant="ghost" onClick={() => setDetail(r)}><Eye className="h-3.5 w-3.5" /> View</Button>
              ) },
            ]}
          />
        </SectionCard>
      </div>

      <TicketFormDialog open={open} onOpenChange={setOpen} user={user} onSaved={reload} />

      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detail?.subject}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={detail.status} tone={statusTone(detail.status)} />
                <StatusBadge status={detail.priority} tone={detail.priority === "urgent" || detail.priority === "high" ? "red" : "amber"} />
                <span className="text-xs text-slate-500">{detail.ticket_number}</span>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Category</p>
                <p className="text-slate-800">{String(detail.category || "").replace(/_/g, " ")}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Description</p>
                <p className="whitespace-pre-wrap text-slate-700">{detail.description || "—"}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Assigned to</p>
                  <p className="text-slate-800">{detail.assigned_to || "Not assigned yet"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Raised on</p>
                  <p className="text-slate-800">{detail.created_date ? new Date(detail.created_date).toLocaleString("en-IN") : "—"}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { Loader2, FileText, ExternalLink } from "lucide-react";

export default function ApprovalDialog({
  open,
  onClose,
  title,
  subtitle,
  status,
  hero,
  details = [],
  documents,
  remarks,
  onRemarksChange,
  remarksLabel = "Note for the vendor (optional)",
  documentsTitle = "Documents",
  actions = [],
  busy,
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="min-w-0">
              <DialogTitle className="truncate text-lg">{title}</DialogTitle>
              {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
            </div>
            {status && <StatusBadge status={status} tone={statusTone(status)} />}
          </div>
        </DialogHeader>

        {hero}

        {details.length > 0 && (
          <div className="grid grid-cols-1 gap-x-6 gap-y-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-2">
            {details.map((d) => (
              <div key={d.label} className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{d.label}</p>
                <p className="truncate text-sm text-slate-800">{d.value || "—"}</p>
              </div>
            ))}
          </div>
        )}

        {documents && (
          <div className="overflow-hidden rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
              <FileText className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-800">{documentsTitle}</p>
            </div>
            {documents.loading ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">Loading documents…</p>
            ) : documents.items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">Nothing added here yet.</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {documents.items.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm capitalize text-slate-800">{String(d.type || "").replace(/_/g, " ")}</p>
                      <p className="text-xs capitalize text-slate-500">{String(d.status || "uploaded").replace(/_/g, " ")}</p>
                    </div>
                    {d.onView && (
                      <button onClick={d.onView} className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline">
                        View <ExternalLink className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {onRemarksChange && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-slate-500">{remarksLabel}</p>
            <Textarea value={remarks} onChange={(e) => onRemarksChange(e.target.value)} rows={3} placeholder="Type a short note…" />
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={onClose} disabled={!!busy}>Close</Button>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {actions.map((a) => (
              <Button key={a.label} variant={a.variant || "default"} onClick={a.onClick} disabled={!!busy}>
                {a.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : a.icon}
                {a.label}
              </Button>
            ))}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
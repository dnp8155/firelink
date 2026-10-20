import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { PageHeader, SectionCard, KpiCard } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Bell, BellRing, Check, CheckCheck, Loader2, ExternalLink } from "lucide-react";

const TYPE_TONE = {
  order: "bg-blue-50 text-blue-700",
  rfq: "bg-violet-50 text-violet-700",
  quote: "bg-violet-50 text-violet-700",
  certificate: "bg-emerald-50 text-emerald-700",
  service: "bg-amber-50 text-amber-700",
  inspection: "bg-amber-50 text-amber-700",
  noc: "bg-orange-50 text-orange-700",
  capa: "bg-rose-50 text-rose-700",
  payment: "bg-teal-50 text-teal-700",
  ticket: "bg-slate-100 text-slate-700",
  system: "bg-slate-100 text-slate-700",
};

const timeAgo = (iso) => {
  if (!iso) return "";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
};

export default function Notifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState("all");
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    const [list, count] = await Promise.all([
      base44.entities.AppNotification.filter({ user_id: user.id, ...(tab === "unread" ? { read: false } : {}) }, "-created_date", 100),
      base44.entities.AppNotification.count({ user_id: user.id, read: false }),
    ]);
    setItems(list || []);
    setUnread(count || 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id, tab]);

  const markRead = async (row) => {
    if (row.read) return;
    try {
      await base44.entities.AppNotification.update(row.id, { read: true });
      load();
    } catch (err) {
      toast({ title: "Could not update notification", description: err?.message, variant: "destructive" });
    }
  };

  const markAllRead = async () => {
    if (!user?.id) return;
    try {
      await base44.entities.AppNotification.updateMany({ user_id: user.id, read: false }, { $set: { read: true } });
      toast({ title: "All notifications marked as read" });
      load();
    } catch (err) {
      toast({ title: "Could not update notifications", description: err?.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Order, RFQ, compliance and service updates for your account."
        icon={Bell}
        actions={<Button variant="outline" disabled={unread === 0} onClick={markAllRead}><CheckCheck className="h-4 w-4" /> Mark all read</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <KpiCard label="Unread" value={unread} icon={BellRing} tone={unread > 0 ? "rose" : "slate"} sub="Waiting for you" />
        <KpiCard label="Showing" value={items.length} icon={Bell} tone="slate" sub={tab === "all" ? "All notifications" : "Unread only"} />
      </div>

      <div className="mt-5">
        <SectionCard
          title="Inbox"
          actions={
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
              {[{ key: "all", label: "All" }, { key: "unread", label: "Unread" }].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`rounded-md px-3 py-1 text-xs font-medium ${tab === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          }
        >
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : items.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-slate-500">
              {tab === "unread" ? "You're all caught up." : "No notifications yet."}
            </p>
          ) : (
            <div className="divide-y divide-slate-50">
              {items.map((n) => (
                <div key={n.id} className={`flex items-start gap-3 px-5 py-4 ${n.read ? "" : "bg-rose-50/40"}`}>
                  <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TYPE_TONE[n.type] || TYPE_TONE.system}`}>
                    <Bell className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">{n.title}</p>
                    <p className="mt-0.5 text-sm text-slate-600">{n.message}</p>
                    <p className="mt-1 text-xs text-slate-400">{String(n.type || "system").replace(/_/g, " ")} · {timeAgo(n.created_date)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {n.link && (
                      <Button size="sm" variant="ghost" asChild>
                        <Link to={n.link} onClick={() => markRead(n)}><ExternalLink className="h-3.5 w-3.5" /> Open</Link>
                      </Button>
                    )}
                    {!n.read && (
                      <Button size="sm" variant="ghost" onClick={() => markRead(n)}><Check className="h-3.5 w-3.5" /> Read</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
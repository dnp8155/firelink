import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import PendingChangeRow from "@/components/technician/PendingChangeRow";
import { useToast } from "@/components/ui/use-toast";
import { useOfflineSync } from "@/lib/offline/useOfflineSync";
import { RefreshCw, WifiOff, CloudUpload, CheckCircle2 } from "lucide-react";

const timeLabel = (iso) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

export default function OfflineSyncPanel() {
  const { online, pending, pendingCount, syncing, lastSync, syncNow } = useOfflineSync();
  const { toast } = useToast();

  const runSync = async () => {
    const result = await syncNow();
    if (result.failed) {
      toast({
        title: "Some changes could not be synced",
        description: "They stay on this device and will retry.",
        variant: "destructive",
      });
    } else if (result.synced) {
      toast({ title: `${result.synced} change${result.synced > 1 ? "s" : ""} synced`, description: "The office copy is up to date." });
    }
  };

  const Icon = online ? (pendingCount ? CloudUpload : CheckCircle2) : WifiOff;
  const tone = !online
    ? "border-slate-300 bg-slate-100"
    : pendingCount
      ? "border-amber-200 bg-amber-50"
      : "border-emerald-200 bg-emerald-50";
  const title = !online
    ? "Offline mode — work keeps going"
    : pendingCount
      ? `${pendingCount} change${pendingCount > 1 ? "s" : ""} waiting to sync`
      : "Field data synced";
  const subtitle = !online
    ? "Inspections and job updates are saved on this device and upload automatically once you have signal."
    : pendingCount
      ? "Saved on this device. They upload as soon as the connection is stable."
      : lastSync
        ? `Last synced at ${timeLabel(lastSync)}.`
        : "Everything you have logged is on the server.";

  return (
    <div className={cn("mb-5 rounded-2xl border p-4", tone)}>
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-slate-700">
          <Icon className={cn("h-5 w-5", !online && "text-slate-500")} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <p className="text-xs text-slate-600">{subtitle}</p>
        </div>
        {pendingCount > 0 && (
          <Button size="sm" variant="outline" disabled={syncing || !online} onClick={runSync}>
            <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} />
            {syncing ? "Syncing…" : "Sync now"}
          </Button>
        )}
      </div>

      {pendingCount > 0 && (
        <div className="mt-3 divide-y divide-white/70 overflow-hidden rounded-xl border border-white/70 bg-white/70">
          {pending.map((item) => (
            <PendingChangeRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
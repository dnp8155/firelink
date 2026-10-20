import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { logAudit } from "@/lib/auditLog";
import {
  dequeue, isOfflineError, readLastSync, readQueue, subscribeQueue, writeLastSync,
} from "@/lib/offline/queue";

const applyItem = async (item) => {
  if (item.kind === "job_status") {
    await base44.entities.ServiceRequest.update(item.entity_id, item.payload);
  } else {
    await base44.entities.Asset.update(item.entity_id, item.payload);
  }
  if (item.audit) await logAudit(item.audit);
};

// Connection state + the device queue, shared by the field screens.
export function useOfflineSync() {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [pending, setPending] = useState(() => readQueue());
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(() => readLastSync());

  useEffect(() => subscribeQueue(setPending), []);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const syncNow = useCallback(async () => {
    const items = readQueue();
    if (!items.length) return { synced: 0, failed: 0 };
    setSyncing(true);
    let synced = 0;
    let failed = 0;
    for (const item of items) {
      try {
        await applyItem(item);
        dequeue(item.id);
        synced += 1;
      } catch (error) {
        failed += 1;
        if (isOfflineError(error)) break; // still no connection — keep the rest queued
      }
    }
    if (synced) {
      const iso = new Date().toISOString();
      writeLastSync(iso);
      setLastSync(iso);
      window.dispatchEvent(new CustomEvent("firelink:field-synced", { detail: { synced } }));
    }
    setSyncing(false);
    return { synced, failed };
  }, []);

  // Flush automatically when the device comes back online, and on first mount
  // if a previous visit in the field left changes waiting.
  useEffect(() => {
    if (online && readQueue().length) syncNow();
  }, [online, syncNow]);

  return { online, pending, pendingCount: pending.length, syncing, lastSync, syncNow };
}
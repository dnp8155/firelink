import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Star, Plus, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Reviews({ entityType, entityId, entityName }) {
  const { toast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ rating: 5, title: "", comment: "" });

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Review.filter({ entity_type: entityType, entity_id: entityId, status: "approved" }, "-created_date", 50);
      setReviews(data || []);
    } catch (e) { setReviews([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [entityId]);

  const submit = async () => {
    if (!form.comment.trim()) { toast({ title: "Please write a review", variant: "destructive" }); return; }
    setBusy(true);
    try {
      const user = await base44.auth.me();
      await base44.entities.Review.create({
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName || "",
        user_id: user.id,
        user_name: user.full_name || user.email,
        rating: form.rating,
        title: form.title,
        comment: form.comment,
        status: "approved",
      });
      toast({ title: "Review posted!" });
      setOpen(false); setForm({ rating: 5, title: "", comment: "" }); load();
    } catch (e) { toast({ title: "Failed to post review", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const avg = reviews.length ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : null;

  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-slate-800">Reviews</h3>
          {avg && <div className="flex items-center gap-1.5"><div className="flex">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={cn("h-3.5 w-3.5", n <= Math.round(avg) ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-200")} />)}</div><span className="text-xs text-slate-500">{avg} ({reviews.length})</span></div>}
        </div>
        <Button size="sm" variant="outline" onClick={() => setOpen(!open)}><Plus className="h-3.5 w-3.5" /> Write Review</Button>
      </div>

      {open && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="space-y-3">
            <div><Label>Rating</Label><div className="flex gap-1 mt-1">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setForm({ ...form, rating: n })}><Star className={cn("h-6 w-6 transition", n <= form.rating ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-300 hover:text-amber-300")} /></button>)}</div></div>
            <div><Label>Title (optional)</Label><input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Summary of your experience" /></div>
            <div><Label>Review</Label><Textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} rows={3} placeholder="Share your experience…" /></div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit} disabled={busy} className="bg-rose-600 hover:bg-rose-700">{busy ? "Posting…" : "Post Review"}</Button></div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{[0, 1].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : reviews.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">No reviews yet. Be the first to review!</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-xs font-semibold text-rose-600">{(r.user_name || "?").charAt(0).toUpperCase()}</div>
                  <div><p className="text-sm font-medium text-slate-800">{r.user_name || "Anonymous"}</p>{r.created_date && <p className="text-[11px] text-slate-400">{new Date(r.created_date).toLocaleDateString()}</p>}</div>
                </div>
                <div className="flex">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={cn("h-3.5 w-3.5", n <= (r.rating || 0) ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-200")} />)}</div>
              </div>
              {r.title && <p className="mt-2 text-sm font-semibold text-slate-700">{r.title}</p>}
              <p className="mt-1 text-sm text-slate-600">{r.comment}</p>
              <button
                onClick={async () => {
                  try {
                    await base44.entities.Review.update(r.id, { helpful_count: (r.helpful_count || 0) + 1 });
                    setReviews((prev) => prev.map((x) => x.id === r.id ? { ...x, helpful_count: (x.helpful_count || 0) + 1 } : x));
                  } catch {}
                }}
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-400 transition hover:text-slate-600"
              >
                <ThumbsUp className="h-3 w-3" /> Helpful {r.helpful_count ? `(${r.helpful_count})` : ""}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useList, formatINR } from "@/hooks/useList";
import { PageHeader, SectionCard, EmptyState, KpiCard } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { Briefcase, Search, MapPin, Users, Send, CheckCircle2 } from "lucide-react";

export default function JobApply() {
  const { toast } = useToast();
  const jobs = useList("JobVacancy", { status: "approved" }, "-created_date", 200);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(null);
  const [applied, setApplied] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", cover_letter: "", resume_url: "" });

  const filtered = jobs.data.filter((j) =>
    !q || (j.title || "").toLowerCase().includes(q.toLowerCase()) || (j.role || "").toLowerCase().includes(q.toLowerCase()) || (j.location || "").toLowerCase().includes(q.toLowerCase())
  );

  const apply = async () => {
    if (!form.name.trim() || !form.email.trim()) { toast({ title: "Name and email are required", variant: "destructive" }); return; }
    setBusy(true);
    try {
      await base44.entities.SupportTicket.create({
        ticket_number: `JOB-${Date.now().toString().slice(-8)}`,
        subject: `Job Application: ${selected.title}`,
        category: "technical",
        priority: "low",
        description: `Job: ${selected.title}\nRole: ${selected.role}\nVendor: ${selected.vendor_name}\n\nApplicant: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone}\nResume: ${form.resume_url}\n\nCover Letter:\n${form.cover_letter}`,
        user_id: (await base44.auth.me()).id,
        user_name: form.name,
        status: "open",
      });
      toast({ title: "Application submitted!", description: "The vendor will review your application." });
      setApplied(true);
    } catch (e) { toast({ title: "Application failed", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const openApply = (j) => { setSelected(j); setForm({ name: "", email: "", phone: "", cover_letter: "", resume_url: "" }); setApplied(false); setOpen(true); };

  return (
    <div>
      <PageHeader title="Job Openings" subtitle="Browse and apply for fire safety job vacancies." icon={Briefcase} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard label="Open Positions" value={jobs.loading ? "…" : jobs.data.length} icon={Briefcase} tone="rose" />
        <KpiCard label="Total Openings" value={jobs.data.reduce((s, j) => s + (j.openings || 0), 0)} icon={Users} tone="green" />
        <KpiCard label="Locations" value={new Set(jobs.data.map((j) => j.location).filter(Boolean)).size} icon={MapPin} tone="blue" />
      </div>

      <div className="mb-4"><div className="relative max-w-md"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search jobs, roles, locations…" className="pl-9" /></div></div>

      {jobs.loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200/60" />)}</div>
      ) : filtered.length === 0 ? (
        <SectionCard><EmptyState icon={Briefcase} title="No job openings found" description="Try a different search or check back later." /></SectionCard>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((j) => (
            <SectionCard key={j.id}>
              <div className="p-5">
                <p className="text-sm font-semibold text-slate-900">{j.title}</p>
                <p className="text-xs text-slate-500">{j.vendor_name} · {j.role}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 capitalize">{j.job_type?.replace("_", " ")}</span>
                  <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5"><MapPin className="h-3 w-3" />{j.location || "Remote"}</span>
                  <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5"><Users className="h-3 w-3" />{j.openings}</span>
                  {j.experience_years > 0 && <span className="rounded-full bg-slate-100 px-2 py-0.5">{j.experience_years} yrs</span>}
                </div>
                {j.salary_min > 0 && <p className="mt-1 text-xs text-slate-600">{formatINR(j.salary_min)} – {formatINR(j.salary_max)}</p>}
                {j.skills?.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{j.skills.slice(0, 4).map((s, i) => <span key={i} className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-600">{s}</span>)}</div>}
                {j.description && <p className="mt-2 text-xs text-slate-500 line-clamp-2">{j.description}</p>}
                <Button onClick={() => openApply(j)} className="mt-3 w-full bg-rose-600 hover:bg-rose-700"><Send className="h-4 w-4" /> Apply Now</Button>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{applied ? "Application Submitted" : "Apply for Job"}</DialogTitle></DialogHeader>
          {applied ? (
            <div className="flex flex-col items-center py-6 text-center"><CheckCircle2 className="mb-3 h-12 w-12 text-emerald-500" /><p className="text-sm font-semibold text-slate-900">Your application has been submitted!</p><p className="mt-1 text-xs text-slate-500">The vendor will contact you at your provided email.</p></div>
          ) : (
            <>
              {selected && <div className="mb-3 rounded-lg bg-slate-50 p-3"><p className="text-sm font-semibold text-slate-900">{selected.title}</p><p className="text-xs text-slate-500">{selected.vendor_name} · {selected.role}</p></div>}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3"><div><Label>Full Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div><div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div></div>
                <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label>Resume URL (optional)</Label><Input value={form.resume_url} onChange={(e) => setForm({ ...form, resume_url: e.target.value })} placeholder="https://…" /></div>
                <div><Label>Cover Letter</Label><Textarea value={form.cover_letter} onChange={(e) => setForm({ ...form, cover_letter: e.target.value })} rows={3} placeholder="Tell the employer why you're a good fit" /></div>
              </div>
            </>
          )}
          <DialogFooter>{applied ? <Button onClick={() => setOpen(false)} className="bg-rose-600 hover:bg-rose-700">Close</Button> : <><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={apply} disabled={busy} className="bg-rose-600 hover:bg-rose-700">{busy ? "Submitting…" : "Submit Application"}</Button></>}</DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
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
import { Briefcase, Plus, Pencil, Trash2, MapPin, Users, Clock } from "lucide-react";

const JOB_ROLES = ["Fireman", "Fire Fighter", "Fire Serviceman", "Fire Officer", "Safety Officer", "Helper", "Cashier", "Fire Manager", "Fire Supervisor", "Fire Engineer", "Driver", "Others"];

export default function JobVacancies() {
  const { toast } = useToast();
  const jobs = useList("JobVacancy", {}, "-created_date", 200);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ title: "", role: "", description: "", location: "", job_type: "full_time", experience_years: 0, salary_min: 0, salary_max: 0, skills: "", openings: 1, contact_email: "" });

  const openCreate = () => { setEditId(null); setForm({ title: "", role: "", description: "", location: "", job_type: "full_time", experience_years: 0, salary_min: 0, salary_max: 0, skills: "", openings: 1, contact_email: "" }); setOpen(true); };
  const openEdit = (j) => { setEditId(j.id); setForm({ title: j.title, role: j.role, description: j.description || "", location: j.location || "", job_type: j.job_type, experience_years: j.experience_years || 0, salary_min: j.salary_min || 0, salary_max: j.salary_max || 0, skills: (j.skills || []).join(", "), openings: j.openings || 1, contact_email: j.contact_email || "" }); setOpen(true); };

  const save = async () => {
    if (!form.title.trim() || !form.role.trim()) { toast({ title: "Title and role are required", variant: "destructive" }); return; }
    setBusy(true);
    try {
      const user = await base44.auth.me();
      const payload = { ...form, skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean), vendor_id: user.data?.vendor_id || user.id, vendor_name: user.data?.vendor_name || user.full_name || "—", status: "pending", contact_email: form.contact_email || user.email };
      if (editId) { await base44.entities.JobVacancy.update(editId, payload); toast({ title: "Job updated" }); }
      else { await base44.entities.JobVacancy.create(payload); toast({ title: "Job posted", description: "Pending admin approval." }); }
      setOpen(false); jobs.reload();
    } catch (e) { toast({ title: "Save failed", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const remove = async (j) => { if (!window.confirm(`Delete "${j.title}"?`)) return; try { await base44.entities.JobVacancy.delete(j.id); jobs.reload(); } catch (e) { toast({ title: "Delete failed", description: e.message, variant: "destructive" }); } };

  return (
    <div>
      <PageHeader title="Job Vacancies" subtitle="Post job openings and track applications." icon={Briefcase}
        actions={<Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Post Job</Button>} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard label="Total Jobs" value={jobs.loading ? "…" : jobs.data.length} icon={Briefcase} tone="green" />
        <KpiCard label="Approved" value={jobs.data.filter((j) => j.status === "approved").length} icon={Briefcase} tone="blue" />
        <KpiCard label="Pending" value={jobs.data.filter((j) => j.status === "pending").length} icon={Clock} tone="amber" />
      </div>

      {jobs.loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200/60" />)}</div>
      ) : jobs.data.length === 0 ? (
        <SectionCard><EmptyState icon={Briefcase} title="No job vacancies yet" description="Post your first job opening." action={<Button onClick={openCreate} className="bg-emerald-600"><Plus className="h-4 w-4" /> Post Job</Button>} /></SectionCard>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {jobs.data.map((j) => (
            <SectionCard key={j.id}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{j.title}</p>
                    <p className="text-xs text-slate-500">{j.role}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 capitalize">{j.job_type?.replace("_", " ")}</span>
                      <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5"><MapPin className="h-3 w-3" />{j.location || "Remote"}</span>
                      <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5"><Users className="h-3 w-3" />{j.openings} opening(s)</span>
                      {j.experience_years > 0 && <span className="rounded-full bg-slate-100 px-2 py-0.5">{j.experience_years} yrs</span>}
                    </div>
                    {j.salary_min > 0 && <p className="mt-1 text-xs text-slate-600">{formatINR(j.salary_min)} – {formatINR(j.salary_max)}</p>}
                    {j.skills?.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{j.skills.slice(0, 4).map((s, i) => <span key={i} className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-600">{s}</span>)}</div>}
                  </div>
                  <StatusBadge status={j.status} tone={statusTone(j.status)} />
                </div>
                <div className="mt-3 flex justify-end gap-2"><button onClick={() => openEdit(j)} className="text-slate-400 hover:text-blue-600"><Pencil className="h-4 w-4" /></button><button onClick={() => remove(j)} className="text-slate-300 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button></div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Job" : "Post Job Vacancy"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Job Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Fire Safety Technician" /></div>
            <div><Label>Role</Label><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="">Select role…</option>{JOB_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>Job Type</Label><select value={form.job_type} onChange={(e) => setForm({ ...form, job_type: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="full_time">Full Time</option><option value="part_time">Part Time</option><option value="contract">Contract</option><option value="internship">Internship</option></select></div><div><Label>Openings</Label><Input type="number" value={form.openings} onChange={(e) => setForm({ ...form, openings: Number(e.target.value) })} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Mumbai" /></div><div><Label>Experience (years)</Label><Input type="number" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: Number(e.target.value) })} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>Salary Min (₹)</Label><Input type="number" value={form.salary_min} onChange={(e) => setForm({ ...form, salary_min: Number(e.target.value) })} /></div><div><Label>Salary Max (₹)</Label><Input type="number" value={form.salary_max} onChange={(e) => setForm({ ...form, salary_max: Number(e.target.value) })} /></div></div>
            <div><Label>Skills (comma-separated)</Label><Input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="Fire safety, First aid, Electrical" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save} disabled={busy} className="bg-emerald-600 hover:bg-emerald-700">{editId ? "Update" : "Post"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Seo from "@/components/Seo";
import JsonLd from "@/components/JsonLd";
import { keywordList } from "@/lib/seoPages";
import { webPageSchema, graph } from "@/lib/schema";
import { CheckCircle2, Clock, LifeBuoy, Loader2, Send, Store } from "lucide-react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EMPTY = { name: "", email: "", subject: "", message: "" };

const CHANNELS = [
  {
    icon: LifeBuoy,
    title: "Existing customers",
    text: "Already using FireLink? Track orders, assets and requests from your dashboard.",
    to: "/support",
    cta: "Open support portal",
  },
  {
    icon: Store,
    title: "Vendors & suppliers",
    text: "Sell certified fire safety products and services to customers across India.",
    to: "/vendor/register",
    cta: "Become a vendor",
  },
];

export default function Contact() {
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(null);
  const [error, setError] = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      setError("Please fill in every field so we can route your enquiry.");
      return;
    }
    if (!EMAIL_RE.test(form.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    setSending(true);
    try {
      const res = await base44.functions.invoke("submit_contact_message", {
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      if (res?.data?.error) throw new Error(res.data.error);
      setSent(res?.data?.ticket_number || "received");
      setForm(EMPTY);
    } catch (err) {
      setError(err?.message || "We couldn't send your message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-background">
      <Seo
        title="Contact FireLink — Talk to Our Fire Safety Team"
        description="Contact FireLink for product and service enquiries, compliance questions or vendor partnerships. Send us a message and we reply within one working day."
        keywords={keywordList("contact FireLink", "fire safety enquiry India", "fire safety support India")}
        path="/contact"
      />
      <JsonLd
        data={graph(
          webPageSchema({
            type: "ContactPage",
            name: "Contact FireLink — Talk to Our Fire Safety Team",
            description:
              "Contact FireLink for product and service enquiries, compliance questions or vendor partnerships — enquiries are answered within one working day.",
            path: "/contact",
          })
        )}
      />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
            Contact
          </span>
          <h1 className="font-display mt-4 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">
            Talk to the FireLink team
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
            Questions about a product, a service, compliance or partnering with us? Send a message and our
            team will get back to you — usually within one working day.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-display text-lg font-bold text-slate-900">Send us a message</h2>

            {sent ? (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">Thanks — your enquiry is with us.</p>
                    <p className="mt-1 text-sm text-emerald-800">
                      We've logged it as <span className="font-semibold">{sent}</span> and will reply to your
                      email within one working day.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setSent(null)}
                    >
                      Send another message
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="contact-name">Your name</Label>
                    <Input id="contact-name" value={form.name} onChange={set("name")} placeholder="Full name" maxLength={120} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contact-email">Email</Label>
                    <Input id="contact-email" type="email" value={form.email} onChange={set("email")} placeholder="you@company.com" maxLength={200} />
                  </div>
                </div>
                <div className="mt-4 space-y-1.5">
                  <Label htmlFor="contact-subject">Subject</Label>
                  <Input id="contact-subject" value={form.subject} onChange={set("subject")} placeholder="How can we help?" maxLength={160} />
                </div>
                <div className="mt-4 space-y-1.5">
                  <Label htmlFor="contact-message">Message</Label>
                  <Textarea
                    id="contact-message"
                    value={form.message}
                    onChange={set("message")}
                    placeholder="Tell us about your site, product requirement or question…"
                    rows={6}
                    maxLength={4000}
                  />
                </div>

                {error && (
                  <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
                )}

                <Button type="submit" disabled={sending} className="mt-5 font-semibold">
                  {sending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                  ) : (
                    <><Send className="h-4 w-4" /> Send enquiry</>
                  )}
                </Button>
                <p className="mt-3 text-xs text-slate-500">
                  Your message opens a ticket in our support queue, so nothing gets lost.
                </p>
              </>
            )}
          </form>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-slate-900">Response time</h2>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Website enquiries are answered within one working day, Monday to Saturday. Urgent site
                issues raised by existing customers are picked up through the support portal.
              </p>
            </div>

            {CHANNELS.map((c) => (
              <div key={c.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <c.icon className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold text-slate-900">{c.title}</h2>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{c.text}</p>
                <Link to={c.to} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                  {c.cta} <Send className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </div>
  );
}
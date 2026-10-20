import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui-bits";
import { Send, Sparkles, Bot, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const SUGGESTED = {
  customer: [
    "Which fire extinguisher is best for a server room?",
    "How often do extinguishers need refilling in India?",
    "Help me pick sprinklers for a small warehouse",
  ],
  engineer: [
    "Size a hydrant pump for a 15m-rise building",
    "Explain NBC 2016 fire load classification",
    "Minimum extinguisher count for a 500 m² office?",
  ],
};

export default function AiAssistantChat({ mode = "customer" }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: mode === "engineer"
      ? "Namaste! I'm your engineering co-pilot. Ask me about fire load, hydrant/sprinkler sizing, NBC 2016 compliance or BOQs."
      : "Namaste! I'm SafeGuard Assistant. Ask me about choosing fire safety products, compliance basics or how ordering works here." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const send = async (text) => {
    const message = (text ?? input).trim();
    if (!message || busy) return;
    const next = [...messages, { role: "user", content: message }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await base44.functions.invoke("ai_assistant", {
        message,
        mode,
        history: next.slice(1, -1).map((m) => ({ role: m.role, content: m.content })),
      });
      setMessages((prev) => [...prev, { role: "assistant", content: res.data?.reply || "Sorry, I couldn't respond. Please try again." }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Something went wrong. Please try again in a moment." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SectionCard>
      <div ref={scrollRef} className="max-h-[52vh] min-h-[280px] space-y-4 overflow-y-auto p-5">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex gap-2.5", m.role === "user" && "flex-row-reverse")}>
            <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", m.role === "assistant" ? "bg-rose-50 text-rose-600" : "bg-slate-800 text-white")}>
              {m.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </div>
            <div className={cn("max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed", m.role === "assistant" ? "bg-slate-50 text-slate-800" : "bg-rose-600 text-white")}>
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-600"><Bot className="h-4 w-4" /></div>
            <div className="flex items-center gap-1.5 rounded-2xl bg-slate-50 px-4 py-3">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
            </div>
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 px-5 pb-4">
          {SUGGESTED[mode].map((s) => (
            <button key={s} onClick={() => send(s)} className="flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100">
              <Sparkles className="h-3 w-3" /> {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="flex items-center gap-2 border-t border-slate-100 p-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === "engineer" ? "Ask an engineering question…" : "Ask about products, compliance…"}
          className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-rose-300"
        />
        <Button type="submit" size="icon" disabled={busy || !input.trim()}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </SectionCard>
  );
}
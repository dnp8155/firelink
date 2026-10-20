import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { ROLE_NAV } from "@/lib/roles";
import { useRole } from "@/lib/state/RoleContext";
import { SEARCH_SOURCES } from "@/lib/globalSearch";
import {
  Command, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import SearchResultItem from "@/components/search/SearchResultItem";
import { Search, Loader2 } from "lucide-react";

const MIN_CHARS = 2;

// One search box for the whole platform: jump to any page the role can use, or
// find a record across the entities that role works with. Opens with ⌘K / Ctrl-K
// or "/" anywhere, and from the header button.
export default function GlobalSearch({ className }) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const { activeRole } = useRole();
  const navigate = useNavigate();
  const nav = ROLE_NAV[activeRole] || [];

  useEffect(() => {
    const onKeyDown = (event) => {
      const { target } = event;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      } else if (event.key === "/" && !typing) {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const query = term.trim();

  useEffect(() => {
    if (!open || query.length < MIN_CHARS) {
      setGroups([]);
      setLoading(false);
      return undefined;
    }
    const sources = SEARCH_SOURCES[activeRole] || [];
    let alive = true;
    setLoading(true);
    const timer = setTimeout(async () => {
      const found = await Promise.all(
        sources.map(async (source) => {
          try {
            const page = await base44.entities[source.entity].filter(source.query(query), source.options);
            const items = (page?.items || []).map((record) => ({
              id: `${source.entity}-${record.id}`,
              icon: source.icon,
              image: source.image ? source.image(record) : "",
              title: source.title(record),
              subtitle: source.subtitle ? source.subtitle(record) : "",
              path: source.path(record),
            }));
            return { group: source.group, items };
          } catch {
            return { group: source.group, items: [] };
          }
        })
      );
      if (!alive) return;
      setGroups(found.filter((group) => group.items.length > 0));
      setLoading(false);
    }, 250);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [open, query, activeRole]);

  const pageMatches = (
    query
      ? nav.filter((item) => `${item.label} ${item.path}`.toLowerCase().includes(query.toLowerCase()))
      : nav
  ).slice(0, 6);
  const total = pageMatches.length + groups.reduce((sum, group) => sum + group.items.length, 0);

  const go = (path) => {
    setOpen(false);
    setTerm("");
    navigate(path);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Search"
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 transition hover:border-slate-300 hover:bg-white",
          className
        )}
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="ml-auto hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 lg:inline">⌘K</kbd>
      </button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setTerm("");
        }}
      >
        <DialogContent className="top-[12%] max-h-[80vh] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl">
          <DialogTitle className="sr-only">Search FireLink</DialogTitle>
          <Command shouldFilter={false}>
            <CommandInput value={term} onValueChange={setTerm} placeholder="Search products, orders, assets, pages…" />
            <CommandList className="max-h-[60vh]">
              {pageMatches.length > 0 && (
                <CommandGroup heading="Go to">
                  {pageMatches.map((item) => (
                    <CommandItem key={item.path} value={item.path} onSelect={() => go(item.path)}>
                      <span className="truncate">{item.label}</span>
                      <CommandShortcut>{item.path}</CommandShortcut>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {groups.map((group) => (
                <CommandGroup key={group.group} heading={group.group}>
                  {group.items.map((item) => (
                    <SearchResultItem key={item.id} item={item} onSelect={() => go(item.path)} />
                  ))}
                </CommandGroup>
              ))}

              {loading && groups.length === 0 && (
                <div className="flex items-center justify-center gap-2 px-3 py-5 text-xs text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching…
                </div>
              )}

              {!loading && query.length >= MIN_CHARS && total === 0 && (
                <div className="px-3 py-6 text-center text-sm text-slate-500">No matches for “{query}”.</div>
              )}

              {!loading && query.length < MIN_CHARS && (
                <p className="px-3 py-3 text-center text-[11px] text-slate-400">
                  Pages you can open, and your records — type {MIN_CHARS}+ characters to search data
                </p>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
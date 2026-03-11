import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollText, ChevronDown, ChevronUp, Sparkles, Bug, Wrench, Rocket } from "lucide-react";

interface ChangelogChange {
  id: string;
  entry_id: string;
  kind: string;
  text: string;
  sort_order: number;
}

interface ChangelogEntry {
  id: string;
  version: string;
  date: string;
  type: string;
  sort_order: number;
  created_at: string;
  changes: ChangelogChange[];
}

const kindConfig: Record<string, { icon: typeof Sparkles; label: string; color: string }> = {
  feat: { icon: Sparkles, label: "New", color: "text-green-400 bg-green-400/10" },
  fix: { icon: Bug, label: "Fix", color: "text-red-400 bg-red-400/10" },
  improve: { icon: Wrench, label: "Improved", color: "text-blue-400 bg-blue-400/10" },
  misc: { icon: Rocket, label: "Misc", color: "text-muted-foreground bg-muted" },
};

const parseVersion = (raw: string) =>
  raw
    .replace(/^v/i, "")
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);

const compareVersionDesc = (a: string, b: string) => {
  const av = parseVersion(a);
  const bv = parseVersion(b);
  const maxLen = Math.max(av.length, bv.length);

  for (let i = 0; i < maxLen; i += 1) {
    const left = av[i] ?? 0;
    const right = bv[i] ?? 0;
    if (left !== right) return right - left;
  }
  return 0;
};

const formatVersion = (version: string) => (version.toLowerCase().startsWith("v") ? version : `v${version}`);

const Changelog = () => {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const [entriesResponse, changesResponse] = await Promise.all([
        supabase.from("changelog_entries" as any).select("*"),
        supabase.from("changelog_changes" as any).select("*").order("sort_order", { ascending: true }),
      ]);

      if (!mounted) return;

      const entriesData = ((entriesResponse as { data: unknown[] | null }).data || []) as unknown as ChangelogEntry[];
      const changesData = ((changesResponse as { data: unknown[] | null }).data || []) as unknown as ChangelogChange[];

      const mapped = entriesData
        .map((entry) => ({
          ...entry,
          changes: changesData
            .filter((change) => change.entry_id === entry.id)
            .sort((a, b) => a.sort_order - b.sort_order),
        }))
        .sort((a, b) => {
          const byVersion = compareVersionDesc(a.version, b.version);
          if (byVersion !== 0) return byVersion;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

      setEntries(mapped);
      setExpanded((prev) => {
        if (prev.length > 0) return prev;
        return mapped.slice(0, 2).map((entry) => entry.id);
      });
      setLoading(false);
    };

    load();
    const refreshInterval = window.setInterval(load, 12000);

    return () => {
      mounted = false;
      window.clearInterval(refreshInterval);
    };
  }, []);

  const toggle = (entryId: string) =>
    setExpanded((prev) => (prev.includes(entryId) ? prev.filter((id) => id !== entryId) : [...prev, entryId]));

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="p-3 border-b border-border">
        <h2 className="text-base font-display font-semibold text-foreground flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-primary" /> Changelog
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">Newest updates are listed first</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {entries.map((entry) => {
          const isOpen = expanded.includes(entry.id);
          return (
            <div
              key={entry.id}
              className={`rounded-lg border transition-all ${
                entry.type === "upcoming" ? "border-primary/30 bg-primary/5" : "border-border bg-card"
              }`}
            >
              <button onClick={() => toggle(entry.id)} className="w-full flex items-center justify-between p-3 text-left">
                <div className="flex items-center gap-2">
                  {entry.type === "upcoming" && (
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded gradient-warm-bg text-primary-foreground">
                      Soon
                    </span>
                  )}
                  <span className="text-sm font-semibold text-foreground">{formatVersion(entry.version)}</span>
                  <span className="text-xs text-muted-foreground">{entry.date}</span>
                </div>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {isOpen && (
                <div className="px-3 pb-3 space-y-1.5">
                  {entry.changes.map((change) => {
                    const cfg = kindConfig[change.kind] || kindConfig.misc;
                    return (
                      <div key={change.id} className="flex items-start gap-2 text-xs">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-medium shrink-0 ${cfg.color}`}>
                          <cfg.icon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                        <span className="text-foreground/80 pt-0.5">{change.text}</span>
                      </div>
                    );
                  })}
                  {entry.changes.length === 0 && <p className="text-xs text-muted-foreground italic">No changes listed yet.</p>}
                </div>
              )}
            </div>
          );
        })}

        {entries.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <ScrollText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No changelog entries yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Changelog;

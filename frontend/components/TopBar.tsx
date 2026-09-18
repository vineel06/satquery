// frontend/components/TopBar.tsx
"use client";
import { MapPin, Calendar, Moon, Sun, Search, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/lib/theme";
import { autocomplete, type Suggestion } from "@/lib/geocode";

export function TopBar({
  location,
  date,
  onLocationChange,
  onPreviewLocation,
  onDateChange,
}: {
  location: string;
  date: string;
  onLocationChange: (loc: string) => void;
  onPreviewLocation?: (lng: number, lat: number) => void;
  onDateChange: (d: string) => void;
}) {
  const { theme, toggle } = useTheme();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);

    if (query.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      const results = await autocomplete(query);
      setSuggestions(results);
      setHighlightIdx(0);
      setOpen(results.length > 0);
      setLoading(false);
    }, 200);

    previewTimerRef.current = setTimeout(async () => {
      if (query.trim().length >= 3 && onPreviewLocation) {
        const results = await autocomplete(query);
        const top = results[0];
        if (top) onPreviewLocation(top.lng, top.lat);
      }
    }, 700);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function pick(s: Suggestion) {
    setQuery("");
    setSuggestions([]);
    setOpen(false);
    onLocationChange(s.name);
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0) pick(suggestions[highlightIdx]);
      else if (query.trim()) {
        onLocationChange(query);
        setQuery("");
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <header
      className="glass relative z-30 flex items-center gap-3 px-4 py-2.5"
      style={{ borderRadius: 0, borderBottom: "1px solid var(--glass-border)" }}
    >
      <div ref={containerRef} className="relative flex-1 max-w-lg">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10"
          style={{ color: "var(--text-3)" }}
        />
        <input
          suppressHydrationWarning
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="Search any place worldwide..."
          className="w-full rounded-lg bg-black/25 py-2 pl-9 pr-10 text-[13px] outline-none placeholder:text-[var(--text-3)] transition-all focus:ring-2 focus:ring-cyan-400/40"
          style={{ border: "1px solid var(--glass-border)", color: "var(--text-1)" }}
        />
        {loading && (
          <Loader2
            size={13}
            className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin"
            style={{ color: "var(--accent-cyan)" }}
          />
        )}

        {open && suggestions.length > 0 && (
          <div
            className="glass glass-md absolute left-0 right-0 top-full mt-1.5 max-h-72 overflow-y-auto p-1 z-50"
            style={{ boxShadow: "0 12px 48px rgba(0,0,0,0.7)" }}
          >
            {suggestions.map((s, i) => (
              <button
                key={`${s.lat}-${s.lng}-${i}`}
                suppressHydrationWarning
                onClick={() => pick(s)}
                onMouseEnter={() => setHighlightIdx(i)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] transition-colors"
                style={{
                  background:
                    i === highlightIdx ? "rgba(34,211,238,0.15)" : "transparent",
                  color: "var(--text-1)",
                }}
              >
                <MapPin size={12} style={{ color: "var(--accent-cyan)" }} />
                <span className="font-medium">{s.name}</span>
                <span style={{ color: "var(--text-3)" }}>
                  {s.admin1 ? `${s.admin1}, ` : ""}
                  {s.country}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        className="hidden items-center gap-1.5 rounded-lg px-3 py-2 md:flex"
        style={{ border: "1px solid var(--glass-border)" }}
      >
        <MapPin size={13} style={{ color: "var(--accent-cyan)" }} />
        <span className="text-[12px] mono" style={{ color: "var(--text-1)" }}>
          {location || "—"}
        </span>
      </div>

      <div
        className="hidden items-center gap-1.5 rounded-lg px-3 py-2 md:flex"
        style={{ border: "1px solid var(--glass-border)" }}
      >
        <Calendar size={13} style={{ color: "var(--accent-cyan)" }} />
        <input
          suppressHydrationWarning
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="bg-transparent text-[12px] outline-none"
          style={{ color: "var(--text-1)", colorScheme: theme }}
        />
      </div>

      <button
        suppressHydrationWarning
        onClick={toggle}
        className="rounded-lg p-2 transition-all hover:bg-white/10 hover:shadow-[0_0_16px_rgba(34,211,238,0.4)]"
        style={{ border: "1px solid var(--glass-border)", color: "var(--text-2)" }}
        title="Toggle theme"
      >
        {theme === "dark" ? <Moon size={15} /> : <Sun size={15} />}
      </button>
    </header>
  );
}
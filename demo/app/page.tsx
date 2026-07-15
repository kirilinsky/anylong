"use client";

import { useEffect, useState } from "react";
import { anylong, anylongParts, type AnylongPart } from "anylong";
import { Logo } from "@/logo/logo";

type Style = "long" | "short" | "narrow" | "digital";

const LOCALES = ["en", "ru", "ja", "ar", "hi", "pt-BR", "sr-Latn-RS"];

const STYLE_HINTS: Record<Style, string> = {
  long: "spelled out — 2 hours, 30 minutes",
  short: "abbreviated — 2 hr, 30 min",
  narrow: "as tight as the locale allows — 2h 30m",
  digital: "clock-like — 2:30:00",
};

const PRESETS = [
  "2h 30m",
  "PT2H30M",
  "90s",
  "1d 4h 20s",
  "2 hours 30 minutes",
  "9000000",
  "P3W",
  "1:30",
];

function q(value: string) {
  return JSON.stringify(value);
}

function useTypewriter(text: string | null) {
  const [state, setState] = useState({ displayed: "", source: text });

  useEffect(() => {
    if (!text) return;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setState({ displayed: text.slice(0, i), source: text });
      if (i >= text.length) clearInterval(id);
    }, 28);
    return () => clearInterval(id);
  }, [text]);

  if (!text || state.source !== text) return "";
  return state.displayed;
}

export default function Home() {
  const [input, setInput] = useState("2h 30m");
  const [style, setStyle] = useState<Style>("short");
  const [locale, setLocale] = useState("en");

  const trimmed = input.trim();
  const isNumeric = /^\d+$/.test(trimmed);
  const value: string | number = isNumeric ? Number(trimmed) : trimmed;

  let result: string | null = null;
  let parts: AnylongPart[] | null = null;
  let error: string | null = null;
  try {
    result = anylong(value, { style, locale });
    parts = anylongParts(value, { style, locale });
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const typed = useTypewriter(result);
  const done = typed === result && !!result;

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0a0a] px-4 pb-28 pt-20 sm:py-20">
      <div
        className="pointer-events-none fixed inset-0 z-10 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />

      <div className="relative z-20 flex w-full max-w-3xl flex-col items-center gap-8">
        <h1 className="sr-only">
          anylong - tiny Intl duration formatter for any locale
        </h1>
        <Logo className="h-auto w-36 opacity-90" />

        <div className="relative w-fit max-w-full rounded-xl border border-white/[0.07] bg-black/30 px-4 py-3.5 font-mono">
          <div className="flex min-h-9 flex-wrap items-center justify-center gap-x-1 gap-y-1.5 text-sm sm:flex-nowrap sm:justify-start sm:text-base">
            <span className="shrink-0 text-amber-400">anylong</span>
            <span className="shrink-0 text-white/30">(</span>
            <span className="flex h-8 min-w-0 shrink items-center rounded-md border border-transparent px-1.5 text-sky-300 transition-colors focus-within:border-white/10 focus-within:bg-white/[0.05] hover:border-white/10 hover:bg-white/[0.05]">
              {!isNumeric && <span className="select-none">&quot;</span>}
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                spellCheck={false}
                aria-label="duration input"
                style={{ width: `${Math.max(input.length, 4)}ch` }}
                className="min-w-0 bg-transparent font-mono text-sky-300 outline-none"
              />
              {!isNumeric && <span className="select-none">&quot;</span>}
            </span>
            <span className="shrink-0 text-white/30">, {"{"}</span>
            <span className="shrink-0 text-white/55">style:</span>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as Style)}
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath fill='none' stroke='%23c4b5fd' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' d='M1.5 1.5l4.5 4.5 4.5-4.5'/%3E%3C/svg%3E\")",
                backgroundPosition: "right 0.5rem center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "0.6rem",
              }}
              className="h-8 shrink-0 cursor-pointer appearance-none rounded-md border border-violet-300/30 bg-violet-300/[0.06] pl-2 pr-6 font-mono text-violet-300 outline-none transition-colors hover:border-violet-300/60 hover:bg-violet-300/[0.12]"
            >
              <option value="long">&quot;long&quot;</option>
              <option value="short">&quot;short&quot;</option>
              <option value="narrow">&quot;narrow&quot;</option>
              <option value="digital">&quot;digital&quot;</option>
            </select>
            <span className="shrink-0 text-white/30">,</span>
            <span className="shrink-0 text-white/55">locale:</span>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              style={{ width: `calc(${locale.length + 2}ch + 0.75rem)` }}
              className="h-8 shrink-0 cursor-pointer appearance-none rounded-md border border-transparent bg-transparent px-1.5 font-mono text-emerald-300 outline-none hover:border-white/10 hover:bg-white/[0.05]"
            >
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  &quot;{l}&quot;
                </option>
              ))}
            </select>
            <span className="shrink-0 text-white/30">{"})"}</span>
          </div>

          <p className="mt-2 text-center font-sans text-xs italic text-white/35">
            {STYLE_HINTS[style]}
          </p>
        </div>

        <div className="flex max-w-full flex-wrap items-center justify-center gap-1.5 px-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setInput(p)}
              className={`rounded-md border px-2 py-1 font-mono text-[11px] transition-colors ${
                p === trimmed
                  ? "border-white/20 bg-white/[0.08] text-white/70"
                  : "border-white/[0.07] bg-white/[0.02] text-white/35 hover:border-white/15 hover:text-white/60"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex min-h-28 w-full flex-col items-center justify-center gap-3">
          <div className="text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/25">
              output
            </p>
            <p className="mt-1 text-sm italic text-white/35">
              what your users see
            </p>
          </div>

          <div className="relative flex min-h-10 w-full min-w-0 items-center justify-center sm:min-h-12">
            {result ? (
              <>
                {/* invisible sizer: full result reserves height so typing/reset never shifts layout */}
                <p
                  aria-hidden
                  className="invisible w-full break-words text-center text-4xl tracking-tight sm:text-5xl"
                  style={{ fontFamily: "'Georgia', serif" }}
                >
                  {result}
                  <span className="ml-[2px] inline-block h-[1.2em] w-[2px] align-middle" />
                </p>
                <p
                  className="absolute inset-x-0 top-0 w-full break-words text-center text-4xl tracking-tight text-white/90 sm:text-5xl"
                  style={{ fontFamily: "'Georgia', serif" }}
                >
                  {typed}
                  <span
                    className="ml-[2px] inline-block h-[1.2em] w-[2px] align-middle bg-white/60"
                    style={{
                      animation: done ? "blink 1s step-end infinite" : "none",
                      opacity: done ? undefined : 1,
                    }}
                  />
                  <style>{`@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`}</style>
                </p>
              </>
            ) : error ? (
              <p className="max-w-xl px-4 text-center font-mono text-xs leading-relaxed text-rose-300/70">
                {error}
              </p>
            ) : (
              <p className="font-serif text-sm italic text-white/15">result</p>
            )}
          </div>

          {error && (
            <p className="font-sans text-[11px] italic text-white/25">
              refusing to guess is a feature
            </p>
          )}

          {parts && (
            <div
              className={`flex max-w-full flex-wrap items-center justify-center gap-x-1.5 gap-y-1 px-2 font-mono text-[11px] transition-opacity duration-200 ${done ? "opacity-100" : "opacity-0"}`}
            >
              <span className="text-white/25">anylongParts →</span>
              {parts.map((p, i) => (
                <span
                  key={i}
                  className="inline-flex items-baseline gap-1 rounded-md border border-white/[0.07] bg-white/[0.03] px-1.5 py-0.5"
                >
                  <span className="text-white/65">
                    {q(p.value)}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-white/25">
                    {p.type}
                    {p.unit ? ` · ${p.unit}` : ""}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/[0.05] bg-[#0a0a0a]/80 backdrop-blur-sm">
        <div className="mx-auto flex min-h-14 max-w-3xl flex-col items-center justify-center gap-1 px-6 py-2 sm:min-h-12 sm:flex-row sm:justify-between sm:py-0">
          <p className="text-center font-mono text-[11px] text-white/30">
            Intl is powerful. anylong makes it usable.
          </p>

          <div className="flex items-center">
            {[
              ["github", "https://github.com/kirilinsky/anylong"],
              ["npm", "https://www.npmjs.com/package/anylong"],
              ["anyfamily", "https://anyfamily.site"],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 text-xs uppercase tracking-widest text-white/25 transition-colors hover:text-white/60 sm:py-3"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}

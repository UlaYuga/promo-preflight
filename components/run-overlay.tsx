"use client";

import { CHECK_DEFS } from "@/lib/demo-data";
import { useI18n } from "@/lib/i18n";

export function RunOverlay({ step }: Readonly<{ step: number }>) {
  const { language } = useI18n();
  const isDone = step >= CHECK_DEFS.length;

  return (
    <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-center justify-center">
      <div className="w-[480px] bg-page hairline border rounded-sm p-7 shadow-2xl shadow-black/60">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
            Preflight · running
          </p>
          <p className="font-mono text-[11px] text-muted">
            {step}/{CHECK_DEFS.length}
          </p>
        </div>
        <p className="display mt-4 text-[42px] leading-[1] tracking-tightest">
          {isDone ? (
            "Done"
          ) : (
            <>
              Checking
              <br />
              <span className="text-accent">bundle</span>
            </>
          )}
        </p>
        <div className="relative mt-7 h-px w-full bg-overlay overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-accent transition-all glow"
            style={{ width: `${(step / CHECK_DEFS.length) * 100}%` }}
          />
        </div>
        <ul className="mt-6 space-y-2.5">
          {CHECK_DEFS.map((c, i) => {
            const state = i < step ? "done" : i === step ? "running" : "queued";
            return (
              <li key={c.id} className="flex items-center gap-3 text-[12.5px]">
                <span className="w-3">
                  {state === "done" && (
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-pass">
                      <path d="m20 6-11 11-5-5" />
                    </svg>
                  )}
                  {state === "running" && (
                    <span className="block h-1.5 w-1.5 rounded-full bg-accent [animation:pulseDot_1.6s_ease-in-out_infinite]" />
                  )}
                  {state === "queued" && (
                    <span className="block h-1.5 w-1.5 rounded-full bg-mute" />
                  )}
                </span>
                <span
                  className={`tracking-tighter2 ${
                    state === "running"
                      ? "text-foreground"
                      : state === "done"
                        ? "text-subtle"
                        : "text-muted"
                  }`}
                >
                  {language === "ru" ? c.nameRu : c.nameEn}
                </span>
                <span className="ml-auto font-mono text-[10px] text-muted">
                  {c.route}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

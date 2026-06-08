"use client";

export function BackgroundWave() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-background"
      aria-hidden="true"
    >
      <div
        className="motion-decorative absolute inset-0 opacity-80"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.028), transparent 26%), linear-gradient(90deg, rgba(197,255,61,0.03), transparent 32%, rgba(95,109,205,0.025) 100%)"
        }}
      />
      <div
        className="motion-decorative absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "72px 72px"
        }}
      />
    </div>
  );
}

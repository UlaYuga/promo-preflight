"use client";

export function BackgroundWave() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Editorial portrait silhouette — blurred right side */}
      <div
        className="motion-decorative absolute right-[-8%] top-[-5%] h-[120%] w-[55%] animate-[fog-drift_28s_ease-in-out_infinite] blur-[90px]"
        style={{
          background:
            "radial-gradient(ellipse 70% 90% at 55% 45%, rgba(180,170,160,0.14), transparent 70%), radial-gradient(ellipse 50% 65% at 40% 35%, rgba(160,150,140,0.09), transparent 65%), radial-gradient(circle at 50% 50%, rgba(200,195,185,0.06), transparent 50%)"
        }}
      />

      {/* Warm charcoal haze — bottom left */}
      <div
        className="motion-decorative absolute left-[-5%] bottom-[-10%] h-[90%] w-[40%] animate-[fog-drift_32s_ease-in-out_infinite_4s] blur-[80px]"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 50% 60%, rgba(60,60,65,0.10), transparent 70%)"
        }}
      />

      {/* Green wave #1 — upper left */ }
      <div
        className="motion-decorative absolute left-[10%] top-[-20%] h-[70%] w-[55%] animate-[glow-pulse_8s_ease-in-out_infinite] blur-[90px]"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(197,255,61,0.16), transparent 70%)"
        }}
      />

      {/* Green wave #2 — mid right */}
      <div
        className="motion-decorative absolute right-[-5%] top-[25%] h-[55%] w-[45%] animate-[glow-pulse_10s_ease-in-out_infinite_3s] blur-[80px]"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(197,255,61,0.12), transparent 70%)"
        }}
      />

      {/* Accent blue — depth contrast */}
      <div
        className="motion-decorative absolute left-[35%] top-[5%] h-[45%] w-[35%] animate-[fog-drift_22s_ease-in-out_infinite_1.5s] blur-[70px]"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(95,109,205,0.08), transparent 70%)"
        }}
      />

      {/* Bottom atmosphere */}
      <div
        className="motion-decorative absolute bottom-0 left-0 h-[30%] w-full animate-[glow-pulse_12s_ease-in-out_infinite_2s] blur-[50px]"
        style={{
          background:
            "linear-gradient(to top, rgba(197,255,61,0.08), transparent 75%)"
        }}
      />
    </div>
  );
}

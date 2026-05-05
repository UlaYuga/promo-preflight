"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { loadTourSample } from "@/lib/tour/sample";
import { readTourState, startTour, type TourState } from "@/lib/tour/storage";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

const desktopMediaQuery = "(min-width: 520px)";

export function RestartTourButton() {
  const router = useRouter();
  const { t, language } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [tourState, setTourState] = useState<TourState>(() => readTourState());

  useEffect(() => {
    const media = window.matchMedia(desktopMediaQuery);
    const update = () => {
      setMounted(true);
      setIsDesktop(media.matches);
      setTourState(readTourState());
    };

    update();
    media.addEventListener("change", update);
    window.addEventListener("storage", update);

    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  if (!mounted || (tourState.status === "idle" && !tourState.startedAt)) {
    return null;
  }

  function handleRestart() {
    loadTourSample({ clearDemoData: true, language });
    startTour(0);
    router.push("/");
  }

  return (
    <button
      type="button"
      disabled={!isDesktop}
      onClick={handleRestart}
      className={cn(
        "inline-flex items-center gap-2 rounded-sm border px-2.5 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.18em] transition",
        isDesktop
          ? "border-[#26262e] bg-[#0d0d0f] text-[#9a9aa1] hover:border-[#c5ff3d]/50 hover:text-[#c5ff3d]"
          : "cursor-not-allowed border-[#1d1d23] bg-[#070708] text-[#5a5a62]"
      )}
    >
      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
      {isDesktop ? t("tour.restartTour") : t("tour.mobileDisabledShort")}
    </button>
  );
}

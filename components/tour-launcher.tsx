"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MonitorPlay, PlayCircle } from "lucide-react";
import { loadTourSample } from "@/lib/tour/sample";
import { getTourStepRoute } from "@/lib/tour/steps";
import {
  PROMO_PREFLIGHT_TOUR_EVENT,
  readTourState,
  startTour,
  type TourState,
  type TourStatus
} from "@/lib/tour/storage";

import { useI18n } from "@/lib/i18n";

const defaultTourState: TourState = {
  version: 1,
  status: "idle" as TourStatus,
  stepIndex: 0,
  sampleLoaded: false
};

const desktopMediaQuery = "(min-width: 520px)";

export function TourLauncher() {
  const router = useRouter();
  const { t, language } = useI18n();
  const [isDesktop, setIsDesktop] = useState(true);
  const [tourState, setTourState] = useState<TourState>(defaultTourState);

  useEffect(() => {
    const media = window.matchMedia(desktopMediaQuery);
    const updateDesktop = () => setIsDesktop(media.matches);
    const updateTourState = () => setTourState(readTourState());

    updateDesktop();
    updateTourState();
    media.addEventListener("change", updateDesktop);
    window.addEventListener(PROMO_PREFLIGHT_TOUR_EVENT, updateTourState);

    return () => {
      media.removeEventListener("change", updateDesktop);
      window.removeEventListener(PROMO_PREFLIGHT_TOUR_EVENT, updateTourState);
    };
  }, []);

  function handleStartTour() {
    loadTourSample({ clearDemoData: true, language });
    const nextState = startTour(0);
    router.push(getTourStepRoute(nextState.stepIndex, nextState));
  }

  function handleContinueTour() {
    const current = startTour(Math.max(tourState.stepIndex, 0));
    router.push(getTourStepRoute(current.stepIndex, current));
  }

  if (!isDesktop) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex min-h-[3.25rem] cursor-not-allowed items-center justify-center gap-3 rounded-md border border-[#ffffff08] bg-[#0d0d0f]/50 px-7 py-3 text-base font-medium text-[#5a5a62]"
      >
        <MonitorPlay className="h-[22px] w-[22px] text-[#9a9aa1]/40" aria-hidden="true" />
        {t("tour.mobileDisabled")}
      </button>
    );
  }

  const canContinue = tourState.status === "active" && tourState.stepIndex > 0;

  return (
    <>
      <button
        type="button"
        data-tour="take-tour"
        onClick={canContinue ? handleContinueTour : handleStartTour}
        className="inline-flex min-h-[3.25rem] items-center justify-center gap-3 rounded-md border border-[#c5ff3d]/30 bg-[#c5ff3d] px-7 py-3 text-base font-semibold text-[#070708] shadow-[0_0_0_1px_rgba(197,255,61,0.12),0_0_40px_rgba(197,255,61,0.18),0_4px_16px_rgba(0,0,0,0.25)] transition-all duration-300 hover:brightness-[1.04] hover:shadow-[0_0_0_1px_rgba(197,255,61,0.18),0_0_56px_rgba(197,255,61,0.24),0_4px_20px_rgba(0,0,0,0.3)]"
      >
        <PlayCircle className="h-[22px] w-[22px]" aria-hidden="true" />
        {canContinue
          ? t("tour.continueFromStep", {
              step: String(tourState.stepIndex + 1)
            })
          : t("tour.takeTour")}
      </button>
    </>
  );
}

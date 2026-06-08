"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import type { Driver, DriveStep } from "driver.js";
import {
  clearTourSampleData,
  loadTourSample,
  seedTourVersionHistory
} from "@/lib/tour/sample";
import {
  getTourStepRoute,
  productTourSteps
} from "@/lib/tour/steps";
import {
  markTourCompleted,
  markTourSkipped,
  PROMO_PREFLIGHT_TOUR_EVENT,
  readTourState,
  updateTourState,
  writeTourState,
  type TourState
} from "@/lib/tour/storage";
import { useI18n } from "@/lib/i18n";

const desktopMediaQuery = "(min-width: 520px)";

export function TourProvider() {
  const pathname = usePathname();
  const router = useRouter();
  const { get, t, language } = useI18n();
  const driverRef = useRef<Driver | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(desktopMediaQuery);
    const update = () => setIsDesktop(media.matches);

    update();
    media.addEventListener("change", update);

    return () => media.removeEventListener("change", update);
  }, []);

  const destroyDriver = useCallback(() => {
    if (!driverRef.current) {
      return;
    }

    driverRef.current.destroy();
    driverRef.current = null;
  }, []);

  const navigateForStep = useCallback(
    (stepIndex: number, state: TourState) => {
      const route = getTourStepRoute(stepIndex, state);
      const routePath = route.split("?")[0];
      const routeSearch = route.includes("?") ? "?" + route.split("?")[1] : "";

      if (routePath && routePath !== pathname) {
        destroyDriver();
        router.push(route);
        return true;
      }

      // Same base path but different query params — navigate to apply them
      if (routeSearch && routeSearch !== window.location.search) {
        destroyDriver();
        router.push(route);
        // Trigger startDriver after React re-renders with new params
        window.setTimeout(() => {
          window.dispatchEvent(new Event(PROMO_PREFLIGHT_TOUR_EVENT));
        }, 200);
        return true;
      }

      return false;
    },
    [destroyDriver, pathname, router]
  );

  const skipTour = useCallback(() => {
    destroyDriver();
    clearTourSampleData();
    markTourSkipped();
  }, [destroyDriver]);

  const completeTour = useCallback(() => {
    destroyDriver();
    clearTourSampleData();
    markTourCompleted();
    router.push("/app/intake");
  }, [destroyDriver, router]);

  const advanceFromStep = useCallback(
    (activeIndex: number, driver: Driver) => {
      if (activeIndex === productTourSteps.length - 1) {
        completeTour();
        return;
      }

      let nextState = readTourState();

      if (activeIndex === 0) {
        loadTourSample({ language });
        nextState = {
          ...nextState,
          sampleLoaded: true
        };
      }

      const nextIndex = activeIndex + 1;

      // The Campaigns / version-diff steps need a saved campaign with
      // version history to exist before the step renders, otherwise the
      // tour target never mounts and the tour stalls. Seed it once when
      // advancing into the first campaigns step and reuse that campaign id.
      if (productTourSteps[nextIndex]?.route.startsWith("/app/campaigns")) {
        const campaignId = seedTourVersionHistory(nextState.campaignId);
        nextState = {
          ...nextState,
          campaignId
        };
      }

      nextState = writeTourState(
        {
          ...nextState,
          status: "active",
          stepIndex: nextIndex
        },
        { silent: true }
      );

      if (navigateForStep(nextIndex, nextState)) {
        return;
      }

      driver.moveNext();
    },
    [completeTour, language, navigateForStep]
  );

  const goBackFromStep = useCallback(
    (activeIndex: number, driver: Driver) => {
      const previousIndex = Math.max(activeIndex - 1, 0);
      const nextState = writeTourState({
        ...readTourState(),
        status: "active",
        stepIndex: previousIndex
      });

      if (navigateForStep(previousIndex, nextState)) {
        return;
      }

      driver.movePrevious();
    },
    [navigateForStep]
  );

  const startDriver = useCallback(async () => {
    const state = readTourState();

    if (state.status !== "active" || !isDesktop) {
      destroyDriver();
      return;
    }

    if (pathname === "/" && state.stepIndex > 0) {
      destroyDriver();
      return;
    }

    if (navigateForStep(state.stepIndex, state)) {
      return;
    }

    const activeStep = productTourSteps[state.stepIndex];
    if (!activeStep) {
      return;
    }

    const target = activeStep.selector
      ? document.querySelector(activeStep.selector)
      : document.body;

    if (activeStep.selector && !target) {
      let attempts = 0;
      const maxAttempts = 8;
      const retry = () => {
        attempts++;
        if (document.querySelector(activeStep.selector!)) {
          window.dispatchEvent(new Event(PROMO_PREFLIGHT_TOUR_EVENT));
          return;
        }
        if (attempts < maxAttempts) {
          window.setTimeout(retry, 150 * attempts);
        }
      };
      window.setTimeout(retry, 100);
      return;
    }

    destroyDriver();

    const { driver } = await import("driver.js");
    const localizedSteps =
      get<Array<{ title: string; description: string }>>("tour.steps") ?? [];
    const steps: DriveStep[] = productTourSteps.map((step, index) => ({
      element: step.selector,
      popover: {
        title: localizedSteps[index]?.title ?? step.title,
        description: localizedSteps[index]?.description ?? step.description,
        side: step.side,
        align: step.align
      }
    }));

    const instance = driver({
      steps,
      animate: false,
      allowClose: true,
      allowKeyboardControl: true,
      disableActiveInteraction: false,
      overlayColor: "#070708",
      overlayOpacity: 0,
      popoverClass: "promo-preflight-tour-popover",
      showButtons: ["previous", "next", "close"],
      showProgress: true,
      stagePadding: 6,
      stageRadius: 2,
      nextBtnText: t("tour.next"),
      prevBtnText: t("tour.back"),
      doneBtnText: t("tour.done"),
      progressText: "{{current}} / {{total}}",
      onHighlighted: (_element, _step, options) => {
        const stepIndex = options.driver.getActiveIndex() ?? 0;
        updateTourState(
          (current) => ({
            ...current,
            status: "active",
            stepIndex
          }),
          { silent: true }
        );
      },
      onNextClick: (_element, _step, options) => {
        advanceFromStep(options.driver.getActiveIndex() ?? 0, options.driver);
      },
      onPrevClick: (_element, _step, options) => {
        goBackFromStep(options.driver.getActiveIndex() ?? 0, options.driver);
      },
      onCloseClick: skipTour,
      onPopoverRender: (popover, options) => {
        const stepIndex = options.driver.getActiveIndex() ?? 0;
        popover.wrapper.setAttribute("data-tour-label", t("tour.eyebrow"));
        popover.progress.textContent = `${stepIndex + 1} / ${productTourSteps.length}`;
        popover.closeButton.textContent = t("tour.skip");
        popover.closeButton.setAttribute("aria-label", t("tour.skip"));
      }
    });

    driverRef.current = instance;
    instance.drive(state.stepIndex);
  }, [
    advanceFromStep,
    destroyDriver,
    goBackFromStep,
    get,
    isDesktop,
    navigateForStep,
    pathname,
    skipTour,
    t
  ]);

  useEffect(() => {
    const timer = window.setTimeout(startDriver, 80);
    window.addEventListener(PROMO_PREFLIGHT_TOUR_EVENT, startDriver);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(PROMO_PREFLIGHT_TOUR_EVENT, startDriver);
      destroyDriver();
    };
  }, [destroyDriver, pathname, startDriver]);

  return (
    <>
      <TourStyles />
      <SpotlightOverlay />
    </>
  );
}

function SpotlightOverlay() {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    let rafId: number;
    let active = false;

    function track() {
      if (!active) return;
      const el = document.querySelector<HTMLElement>(".driver-active-element");
      setRect(el ? el.getBoundingClientRect() : null);
      rafId = requestAnimationFrame(track);
    }

    const mo = new MutationObserver(() => {
      if (document.body.classList.contains("driver-active")) {
        if (!active) { active = true; track(); }
      } else {
        active = false;
        cancelAnimationFrame(rafId);
        setRect(null);
      }
    });

    mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    if (document.body.classList.contains("driver-active")) {
      active = true;
      track();
    }

    return () => {
      mo.disconnect();
      active = false;
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (!rect) return null;

  const pad = 14;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const rx = rect.width / 2 + pad;
  const ry = rect.height / 2 + pad;
  const soft = Math.max(70, Math.max(rx, ry) * 0.55);
  const totalRx = rx + soft;
  const totalRy = ry + soft;
  const innerPct = Math.round((rx / totalRx) * 100);
  const midPct = Math.round(((rx + soft * 0.55) / totalRx) * 100);

  const mask = `radial-gradient(ellipse ${totalRx}px ${totalRy}px at ${cx}px ${cy}px, transparent 0%, transparent ${innerPct}%, rgba(0,0,0,0.35) ${midPct}%, black 100%)`;

  return createPortal(
    <>
      <div
        style={{
          position: "fixed", inset: 0,
          zIndex: 9998,
          background: "rgba(4,4,6,0.62)",
          maskImage: mask,
          WebkitMaskImage: mask,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed", inset: 0,
          zIndex: 9999,
          backdropFilter: "blur(9px)",
          WebkitBackdropFilter: "blur(9px)",
          maskImage: mask,
          WebkitMaskImage: mask,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          left: rect.left - pad,
          top: rect.top - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
          zIndex: 10002,
          borderRadius: 6,
          boxShadow: [
            "0 0 0 1px rgba(197,255,61,0.22)",
            "0 0 22px rgba(197,255,61,0.14)",
            "0 0 60px rgba(197,255,61,0.07)",
            "0 0 120px rgba(197,255,61,0.04)",
          ].join(", "),
          pointerEvents: "none",
        }}
      />
    </>,
    document.body
  );
}

function TourStyles() {
  return (
    <style>{`
      .driver-active .driver-overlay,
      .driver-active * {
        pointer-events: none;
      }

      .driver-overlay {
        opacity: 0 !important;
      }

      .driver-active .driver-active-element,
      .driver-active .driver-active-element *,
      .driver-popover,
      .driver-popover *,
      .driver-popover button,
      .driver-popover a {
        pointer-events: auto !important;
      }

      .driver-popover {
        all: unset;
        box-sizing: border-box;
        position: fixed;
        z-index: 1000000000;
        min-width: 300px;
        max-width: 370px;
        border: 1px solid #26262e;
        border-radius: 2px;
        background: #0d0d0f;
        color: #ededee;
        box-shadow:
          0 0 0 1px rgb(197 255 61 / 0.16),
          0 28px 90px rgb(0 0 0 / 0.58),
          0 0 44px rgb(197 255 61 / 0.08);
        padding: 18px;
      }

      .driver-popover * {
        box-sizing: border-box;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .driver-popover::before {
        content: attr(data-tour-label);
        display: block;
        margin-bottom: 14px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.22em;
        line-height: 1.2;
        text-transform: uppercase;
        color: #5a5a62;
      }

      .driver-popover-title {
        display: block;
        padding-right: 92px;
        font-size: 20px;
        font-weight: 600;
        letter-spacing: 0;
        line-height: 1.12;
        color: #ededee;
      }

      .driver-popover-description {
        margin-top: 10px;
        font-size: 13px;
        line-height: 1.58;
        color: #9a9aa1;
      }

      .driver-popover-close-btn {
        all: unset;
        position: absolute;
        top: 12px;
        right: 12px;
        cursor: pointer;
        border: 1px solid #26262e;
        border-radius: 2px;
        padding: 5px 7px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.16em;
        line-height: 1;
        text-transform: uppercase;
        color: #9a9aa1;
        background: #070708;
      }

      .driver-popover-close-btn:hover,
      .driver-popover-close-btn:focus {
        border-color: rgb(197 255 61 / 0.55);
        color: #c5ff3d;
      }

      .driver-popover-footer {
        margin-top: 18px;
        padding-top: 14px;
        border-top: 1px solid #1d1d23;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
      }

      .driver-popover-progress-text {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.18em;
        color: #c5ff3d;
      }

      html[lang="ru"] .driver-popover::before,
      html[lang="ru"] .driver-popover-close-btn,
      html[lang="ru"] .driver-popover-progress-text {
        letter-spacing: 0.08em;
      }

      .driver-popover-navigation-btns {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }

      .driver-popover-footer button {
        all: unset;
        cursor: pointer;
        border-radius: 2px;
        border: 1px solid #26262e;
        background: #15151a;
        color: #ededee;
        padding: 8px 10px;
        font-size: 12px;
        font-weight: 650;
        line-height: 1;
      }

      .driver-popover-footer button:hover,
      .driver-popover-footer button:focus {
        border-color: rgb(197 255 61 / 0.5);
        color: #c5ff3d;
      }

      .driver-popover-footer .driver-popover-next-btn {
        border-color: rgb(197 255 61 / 0.72);
        background: #c5ff3d;
        color: #070708;
        box-shadow: 0 0 24px rgb(197 255 61 / 0.14);
      }

      .driver-popover-footer .driver-popover-next-btn:hover,
      .driver-popover-footer .driver-popover-next-btn:focus {
        color: #070708;
        filter: brightness(0.96);
      }

      .driver-popover-footer .driver-popover-btn-disabled {
        cursor: not-allowed;
        opacity: 0.45;
      }

      .driver-popover-arrow {
        display: none;
      }
    `}</style>
  );
}

export const PROMO_PREFLIGHT_TOUR_KEY = "promo-preflight:tour";
export const PROMO_PREFLIGHT_TOUR_EVENT = "promo-preflight:tour-state";

export type TourStatus = "idle" | "active" | "skipped" | "completed";

export type TourState = {
  version: 1;
  status: TourStatus;
  stepIndex: number;
  sampleLoaded: boolean;
  campaignId?: string;
  startedAt?: string;
  updatedAt?: string;
  completedAt?: string;
  skippedAt?: string;
};

const defaultTourState: TourState = {
  version: 1,
  status: "idle",
  stepIndex: 0,
  sampleLoaded: false
};

function storage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

export function readTourState(): TourState {
  const localStorage = storage();

  if (!localStorage) {
    return defaultTourState;
  }

  try {
    const raw = localStorage.getItem(PROMO_PREFLIGHT_TOUR_KEY);
    if (!raw) {
      return defaultTourState;
    }

    const parsed = JSON.parse(raw) as Partial<TourState> | null;
    if (!parsed || parsed.version !== 1) {
      return defaultTourState;
    }

    return {
      ...defaultTourState,
      ...parsed,
      stepIndex:
        typeof parsed.stepIndex === "number" && parsed.stepIndex >= 0
          ? parsed.stepIndex
          : 0,
      sampleLoaded: Boolean(parsed.sampleLoaded)
    };
  } catch {
    return defaultTourState;
  }
}

export function writeTourState(
  nextState: TourState,
  opts?: { silent?: boolean }
): TourState {
  const state = {
    ...nextState,
    updatedAt: new Date().toISOString()
  };
  // Safari private mode exposes window.localStorage but throws on setItem.
  // Tour state is best-effort UX, not durable data — swallow like
  // readTourState() does, so a blocked store can never crash tour start.
  try {
    storage()?.setItem(PROMO_PREFLIGHT_TOUR_KEY, JSON.stringify(state));
  } catch {
    // ignore — tour continues in-memory for this session
  }
  if (!opts?.silent) {
    notifyTourStateChanged();
  }
  return state;
}

export function updateTourState(
  updater: (current: TourState) => TourState,
  opts?: { silent?: boolean }
): TourState {
  return writeTourState(updater(readTourState()), opts);
}

export function startTour(stepIndex = 0): TourState {
  const now = new Date().toISOString();

  return writeTourState({
    ...readTourState(),
    version: 1,
    status: "active",
    stepIndex,
    sampleLoaded: stepIndex > 0,
    startedAt: now,
    skippedAt: undefined,
    completedAt: undefined
  });
}

export function markTourSkipped(): TourState {
  return writeTourState({
    ...readTourState(),
    status: "skipped",
    skippedAt: new Date().toISOString()
  });
}

export function markTourCompleted(): TourState {
  return writeTourState({
    ...readTourState(),
    status: "completed",
    stepIndex: 0,
    sampleLoaded: false,
    completedAt: new Date().toISOString()
  });
}

export function notifyTourStateChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(PROMO_PREFLIGHT_TOUR_EVENT));
}

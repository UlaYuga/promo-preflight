import type { Alignment, Side } from "driver.js";
import { seedTourVersionHistory } from "@/lib/tour/sample";
import type { TourState } from "@/lib/tour/storage";

export type ProductTourStep = {
  selector?: string;
  route: string;
  title: string;
  description: string;
  side?: Side;
  align?: Alignment;
};

export const productTourSteps: ProductTourStep[] = [
  {
    selector: '[data-tour="welcome-overview"]',
    route: "/",
    title: "Start on the landing screen",
    description:
      "Open the internal Promo Preflight workspace, then launch the guided demo from a synthetic sample case.",
    side: "bottom",
    align: "start"
  },
  {
    selector: '[data-tour="intake-sample"]',
    route: "/app/intake?examples=1",
    title: "Load a sample case",
    description:
      "Screen 02 / Campaign bundle opens with sample cases so the walkthrough starts from a realistic synthetic CRM review scenario.",
    side: "bottom",
    align: "start"
  },
  {
    selector: '[data-tour="run-preflight"]',
    route: "/app/intake",
    title: "Run the check",
    description:
      "From Screen 02, run 8 offline checks across the bundle and move straight into the Risk Report.",
    side: "left",
    align: "center"
  },
  {
    selector: '[data-tour="risk-summary"]',
    route: "/app/risk-report",
    title: "Review the Risk Report",
    description:
      "Screen 03 / Risk Report ranks blockers, warnings, and clean checks so the next operational decision is obvious.",
    side: "bottom",
    align: "start"
  },
  {
    selector: '[data-tour="save-run"]',
    route: "/app/risk-report",
    title: "Save the review run",
    description:
      "Save the current report as an internal review run before moving into Campaigns, version history, and handoff.",
    side: "left",
    align: "center"
  },
  {
    selector: '[data-tour="campaign-versioning"]',
    route: "/app/campaigns",
    title: "Open Campaigns",
    description:
      "Screen 01 / Campaigns shows saved runs, latest readiness state, and the path into version history for the same campaign.",
    side: "bottom",
    align: "start"
  },
  {
    selector: '[data-tour="version-diff"]',
    route: "/app/campaigns/:campaignId/versions/2",
    title: "Compare versions",
    description:
      "Version detail and diff highlight what was fixed, reopened, or newly introduced between saved review runs.",
    side: "bottom",
    align: "start"
  },
  {
    selector: '[data-tour="handoff-summary"]',
    route: "/app/handoff",
    title: "Prepare the handoff update",
    description:
      "Screen 04 / Handoff turns the saved report into a Slack-ready internal Promo/CRM Ops update for launch owners.",
    side: "bottom",
    align: "start"
  },
  {
    selector: '[data-tour="system-status"]',
    route: "/app/status",
    title: "Inspect System Status",
    description:
      "Screen 08 / System Status exposes health, run telemetry, audit events, reliability guarantees, and source links.",
    side: "bottom",
    align: "start"
  },
  {
    selector: '[data-tour="api-contract"]',
    route: "/app/api",
    title: "Open the API contract",
    description:
      "Screen 09 / API Contract shows REST endpoints, idempotency semantics, and a curl path for integration.",
    side: "bottom",
    align: "start"
  },
  {
    selector: '[data-tour="evidence"]',
    route: "/app/evidence",
    title: "Read the evidence file",
    description:
      "Screen 10 / Evidence ties the UI, API, reliability fixes, CI, docs, and reviewer path into one technical narrative.",
    side: "bottom",
    align: "start"
  }
];

export function getTourStepRoute(index: number, state: TourState): string {
  let nextState = state;
  const step = productTourSteps[index];
  const route = step?.route ?? "/";

  if (route.includes(":campaignId")) {
    const campaignId =
      nextState.campaignId ??
      (typeof window !== "undefined" ? seedTourVersionHistory() : undefined);

    if (campaignId && campaignId !== nextState.campaignId) {
      nextState = {
        ...nextState,
        campaignId
      };
    }

    return route.replace(":campaignId", campaignId ?? "");
  }

  return route;
}

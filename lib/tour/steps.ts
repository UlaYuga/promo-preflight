import type { Alignment, Side } from "driver.js";
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
    selector: '[data-tour="workspace-overview"]',
    route: "/app/campaigns",
    title: "Start with active campaigns",
    description:
      "The workspace lists every saved campaign run with its status, open issues, and the owner responsible for the next step.",
    side: "bottom",
    align: "start"
  },
  {
    selector: '[data-tour="intake-sample"]',
    route: "/app/intake",
    title: "Load a campaign bundle",
    description:
      "All campaign facts in one place: metadata, offer math, terms, channel assets, links, and launch owners.",
    side: "right",
    align: "start"
  },
  {
    selector: '[data-tour="run-preflight"]',
    route: "/app/intake",
    title: "Run the preflight check",
    description:
      "One click runs eight checks across the campaign and maps every finding against the rule set before launch.",
    side: "left",
    align: "center"
  },
  {
    selector: '[data-tour="risk-summary"]',
    route: "/app/risk-report",
    title: "Review what blocks launch",
    description:
      "The Risk Report ranks issues by severity so the team sees blockers, warnings, and clean checks at a glance.",
    side: "bottom",
    align: "start"
  },
  {
    selector: '[data-tour="issue-detail"]',
    route: "/app/risk-report",
    title: "Turn findings into action",
    description:
      "Each issue shows the affected field, evidence, suggested fix, and the owner who should resolve it.",
    side: "left",
    align: "start"
  },
  {
    selector: '[data-tour="readiness-board"]',
    route: "/app/readiness",
    title: "Check launch readiness",
    description:
      "The readiness board collects blockers and owner sign-offs into one go/no-go decision before handoff.",
    side: "bottom",
    align: "start"
  },
  {
    selector: '[data-tour="rules-table"]',
    route: "/app/rules",
    title: "Keep the process repeatable",
    description:
      "Twenty-three rules backed by eight checks make the workflow auditable: see what was checked, who owns it, and what changed between runs.",
    side: "bottom",
    align: "start"
  }
];

export function getTourStepRoute(index: number, state: TourState): string {
  const route = productTourSteps[index]?.route ?? "/";

  if (route.includes(":campaignId")) {
    return route.replace(":campaignId", state.campaignId ?? "");
  }

  return route;
}

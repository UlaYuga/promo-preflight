import {
  CampaignBundleSchema,
  CheckResultSchema,
  RiskReportSchema,
  type CampaignBundleInput,
  type CheckResult,
  type RiskReport
} from "../../schemas/index";
import { CHECK_DEFINITIONS, type CheckId } from "./definitions";
import { CHECK_MODULE_BY_ID } from "./modules/index";
import { countResults, createReportId, getOverallStatus } from "./result";
import type { CheckContext } from "./types";

const DEFAULT_OFFLINE_GENERATED_AT = "2026-05-03T00:00:00.000Z";

export type CheckRunnerMode = "mock" | "offline";

export type CheckRunnerInput = {
  bundle: CampaignBundleInput;
  mode?: CheckRunnerMode;
  generatedAt?: string;
  language?: string;
};

export type CheckRunnerOutput = RiskReport;

export function runChecks(input: CheckRunnerInput): CheckRunnerOutput {
  const bundle = CampaignBundleSchema.parse(input.bundle);
  const mode = input.mode ?? "offline";

  if (mode !== "mock" && mode !== "offline") {
    throw new Error("Only offline/mock check runner modes are available.");
  }

  const context: CheckContext = {
    bundle,
    generatedAt: input.generatedAt ?? DEFAULT_OFFLINE_GENERATED_AT,
    language: input.language
  };
  const resultByCheckId = new Map<CheckId, CheckResult>();

  for (const definition of CHECK_DEFINITIONS.filter(
    (check) => check.id !== "launch_ownership"
  )) {
    const result = runCheck(definition.id, {
      ...context
    });
    resultByCheckId.set(definition.id, CheckResultSchema.parse(result));
  }

  const priorResults = CHECK_DEFINITIONS.map((definition) =>
    resultByCheckId.get(definition.id)
  ).filter((result): result is CheckResult => Boolean(result));
  resultByCheckId.set(
    "launch_ownership",
    CheckResultSchema.parse(
      runCheck("launch_ownership", {
        ...context,
        priorResults
      })
    )
  );

  const checkResults = CHECK_DEFINITIONS.map((definition) => {
    const result = resultByCheckId.get(definition.id);
    if (!result) {
      throw new Error(`Check did not produce a result: ${definition.id}`);
    }

    return result;
  });

  const counts = countResults(checkResults);
  const report = {
    reportId: createReportId(bundle),
    campaignName: bundle.metadata.campaignName,
    overallStatus: getOverallStatus(counts),
    generatedAt: context.generatedAt,
    counts,
    checkResults
  };

  return RiskReportSchema.parse(report);
}

export function runCheck(checkId: CheckId, context: CheckContext) {
  return CheckResultSchema.parse(CHECK_MODULE_BY_ID[checkId].run(context));
}

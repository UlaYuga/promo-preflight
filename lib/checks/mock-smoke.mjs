import {
  CampaignBundleSchema,
  CheckResultSchema,
  RiskReportSchema
} from "../../schemas/index.ts";
import { sampleCampaignBundle } from "../../schemas/fixtures.ts";
import { CHECK_IDS } from "./definitions.ts";
import { runChecks } from "./runner.ts";

delete process.env.ANTHROPIC_API_KEY;

const bundle = CampaignBundleSchema.parse(sampleCampaignBundle);
const report = runChecks({ bundle, mode: "mock" });
const validatedReport = RiskReportSchema.parse(report);

for (const result of validatedReport.checkResults) {
  CheckResultSchema.parse(result);
}

if (validatedReport.checkResults.length !== CHECK_IDS.length) {
  throw new Error(
    `Expected ${CHECK_IDS.length} check results, got ${validatedReport.checkResults.length}.`
  );
}

const resultIds = new Set(validatedReport.checkResults.map((result) => result.checkId));
const missingCheckIds = CHECK_IDS.filter((checkId) => !resultIds.has(checkId));

if (missingCheckIds.length > 0) {
  throw new Error(`Missing check IDs: ${missingCheckIds.join(", ")}.`);
}

const nonMockResults = validatedReport.checkResults.filter(
  (result) => result.modelUsed !== "offline-deterministic:v1"
);

if (nonMockResults.length > 0) {
  throw new Error("Mock smoke check found a non-offline model marker.");
}

if (process.env.ANTHROPIC_API_KEY) {
  throw new Error("Mock smoke check must not require ANTHROPIC_API_KEY.");
}

console.log(
  `Mock checks passed: ${validatedReport.checkResults.length} results, ${validatedReport.overallStatus} overall.`
);

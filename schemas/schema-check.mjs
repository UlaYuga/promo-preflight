import {
  CampaignBundleSchema,
  CheckResultSchema,
  ExportPayloadSchema
} from "./index.ts";
import {
  invalidCampaignBundleCases,
  invalidCheckResultCases,
  sampleCampaignBundle,
  sampleCheckResult
} from "./fixtures.ts";

const expectations = [
  {
    name: "valid sample campaign bundle",
    result: CampaignBundleSchema.safeParse(sampleCampaignBundle),
    shouldPass: true
  },
  {
    name: "valid sample check result",
    result: CheckResultSchema.safeParse(sampleCheckResult),
    shouldPass: true
  },
  {
    name: "valid markdown export payload",
    result: ExportPayloadSchema.safeParse({
      format: "markdown",
      report: {
        reportId: "report-schema-smoke",
        campaignName: "Schema smoke campaign",
        overallStatus: "FAIL",
        generatedAt: "2026-05-03T00:00:00.000Z",
        counts: {
          pass: 0,
          warn: 0,
          fail: 1,
          notApplicable: 0,
          criticalBlockers: 0
        },
        checkResults: [sampleCheckResult]
      }
    }),
    shouldPass: true
  },
  {
    name: "valid slack export payload",
    result: ExportPayloadSchema.safeParse({
      format: "slack",
      report: {
        reportId: "report-schema-smoke",
        campaignName: "Schema smoke campaign",
        overallStatus: "FAIL",
        generatedAt: "2026-05-03T00:00:00.000Z",
        counts: {
          pass: 0,
          warn: 0,
          fail: 1,
          notApplicable: 0,
          criticalBlockers: 0
        },
        checkResults: [sampleCheckResult]
      }
    }),
    shouldPass: true
  },
  {
    name: "invalid campaign bundle promo type",
    result: CampaignBundleSchema.safeParse(
      invalidCampaignBundleCases.invalidPromoType
    ),
    shouldPass: false
  },
  {
    name: "invalid campaign bundle missing termsText",
    result: CampaignBundleSchema.safeParse(
      invalidCampaignBundleCases.missingRequiredTerms
    ),
    shouldPass: false
  },
  {
    name: "invalid check result confidence",
    result: CheckResultSchema.safeParse(
      invalidCheckResultCases.confidenceOutOfRange
    ),
    shouldPass: false
  },
  {
    name: "invalid export payload jira format",
    result: ExportPayloadSchema.safeParse({
      format: "jira",
      report: {
        reportId: "report-schema-smoke",
        campaignName: "Schema smoke campaign",
        overallStatus: "FAIL",
        generatedAt: "2026-05-03T00:00:00.000Z",
        counts: {
          pass: 0,
          warn: 0,
          fail: 1,
          notApplicable: 0,
          criticalBlockers: 0
        },
        checkResults: [sampleCheckResult]
      }
    }),
    shouldPass: false
  }
];

const failures = expectations.filter(({ result, shouldPass }) => {
  return result.success !== shouldPass;
});

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`Schema smoke check failed: ${failure.name}`);
    if (!failure.result.success) {
      console.error(failure.result.error.issues);
    }
  }

  process.exit(1);
}

console.log("Schema smoke check passed.");

import { describe, expect, it } from "vitest";
import {
  BriefExtractionResponseSchema,
  CampaignExtractionCandidateSchema
} from "../../schemas/brief-extraction";
import {
  SAMPLE_BRIEF,
  buildBriefExtractionPrompt,
  createMockBriefExtraction
} from "./brief-extraction";
import { CampaignBundleSchema } from "../../schemas";
import { runChecks } from "../checks/runner";

describe("brief extraction contract", () => {
  it("allows a candidate to stay incomplete until a person confirms missing fields", () => {
    const candidate = CampaignExtractionCandidateSchema.parse({
      metadata: { geo: "BR", locale: "pt-BR", currency: "BRL" },
      offer: { minDeposit: 50 },
      assets: [],
      links: [],
      owners: []
    });

    expect(candidate.metadata.geo).toBe("BR");
    expect(candidate.metadata.campaignName).toBeUndefined();
    expect(candidate.termsText).toBeUndefined();
  });

  it("maps the synthetic sample to reviewable candidate fields without deciding a verdict", () => {
    const response = BriefExtractionResponseSchema.parse(
      createMockBriefExtraction(SAMPLE_BRIEF)
    );

    expect(response.mode).toBe("mock");
    expect(response.candidate.metadata.geo).toBe("BR");
    expect(response.candidate.metadata.locale).toBe("pt-BR");
    expect(response.candidate.paymentMethods).toEqual(["Pix", "USDT"]);
    expect(response.extracted.some((field) => field.path === "offer.maxBonus")).toBe(true);
    expect(response.needsConfirmation).toContainEqual(
      expect.objectContaining({ path: "owners.legal.status" })
    );
    expect(response.notProvided).toContainEqual(
      expect.objectContaining({ path: "metadata.launchDate" })
    );
    expect(response).not.toHaveProperty("verdict");
  });

  it("hands the confirmed sample candidate to deterministic checks for the verdict", () => {
    const extraction = createMockBriefExtraction(SAMPLE_BRIEF);
    const bundle = CampaignBundleSchema.parse(extraction.candidate);
    const report = runChecks({
      bundle,
      mode: "offline",
      generatedAt: "2026-05-27T00:00:00.000Z",
      language: "en"
    });

    expect(report.overallStatus).toBe("FAIL");
    expect(
      report.checkResults.find((check) => check.checkId === "jurisdictional_risk_signals")
        ?.status
    ).toBe("FAIL");
  });

  it("does not fabricate free-form model output while mock AI is enabled", () => {
    expect(() => createMockBriefExtraction("Launch something tomorrow.")).toThrow(
      /sample brief/i
    );
    expect(() =>
      createMockBriefExtraction(SAMPLE_BRIEF.replace("R$500", "R$700"))
    ).toThrow(/sample brief/i);
  });

  it("instructs live extraction to leave missing facts unfilled", () => {
    const prompt = buildBriefExtractionPrompt("A partial campaign note.");

    expect(prompt).toContain("Do not invent missing facts");
    expect(prompt).toContain("candidate");
    expect(prompt).toContain("A partial campaign note.");
  });
});

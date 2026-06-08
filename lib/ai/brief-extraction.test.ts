import { describe, expect, it } from "vitest";
import {
  BRIEF_EXTRACTION_SAMPLE,
  BriefExtractionResultSchema,
  ExtractionCandidateSchema
} from "../../schemas/brief-extraction";
import { extractBrief } from "./brief-extraction";

function restoreEnv(name: "USE_MOCK_AI" | "ANTHROPIC_API_KEY", previous: string | undefined) {
  if (previous === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = previous;
  }
}

describe("brief extraction contract", () => {
  it("allows a candidate to stay incomplete until a person confirms missing fields", () => {
    const candidate = ExtractionCandidateSchema.parse({
      geo: "BR",
      locale: "pt-BR",
      currency: "BRL",
      offer: { minDeposit: 50 },
      links: [],
      owners: []
    });

    expect(candidate.geo).toBe("BR");
    expect(candidate.campaignName).toBeUndefined();
    expect(candidate.termsText).toBeUndefined();
  });

  it("maps the synthetic sample to reviewable candidate fields without deciding a verdict", async () => {
    const previous = process.env.USE_MOCK_AI;
    process.env.USE_MOCK_AI = "true";

    try {
      const outcome = await extractBrief({ rawBrief: BRIEF_EXTRACTION_SAMPLE });
      expect(outcome.ok).toBe(true);
      if (!outcome.ok) throw new Error(outcome.message);

      const response = BriefExtractionResultSchema.parse(outcome.result);

      expect(outcome.modelUsed).toBe("mock");
      expect(response.candidate.geo).toBe("Brazil SPA/MF");
      expect(response.candidate.locale).toBe("pt-BR");
      expect(response.candidate.paymentMethods).toEqual([
        "pix",
        "visa",
        "mastercard",
        "usdt_trc20"
      ]);
      expect(response.fields.some((field) => field.fieldPath === "offer.maxBet")).toBe(true);
      expect(response.needsConfirmation.some((item) => item.includes("launchDate"))).toBe(true);
      expect(response.notProvided.some((item) => item.includes("eligibleGames"))).toBe(true);
      expect(response).not.toHaveProperty("verdict");
    } finally {
      restoreEnv("USE_MOCK_AI", previous);
    }
  });

  it("does not fabricate free-form model output while mock AI is enabled", async () => {
    const previous = process.env.USE_MOCK_AI;
    process.env.USE_MOCK_AI = "true";

    try {
      const custom = await extractBrief({
        rawBrief: "Launch something tomorrow with a 100 percent match bonus."
      });
      const alteredSample = await extractBrief({
        rawBrief: BRIEF_EXTRACTION_SAMPLE.replace("R$500", "R$700")
      });

      expect(custom).toEqual(
        expect.objectContaining({ ok: false, code: "mock_unavailable" })
      );
      expect(alteredSample).toEqual(
        expect.objectContaining({ ok: false, code: "mock_unavailable" })
      );
    } finally {
      restoreEnv("USE_MOCK_AI", previous);
    }
  });

  it("fails closed when live extraction is requested without model credentials", async () => {
    const previousMock = process.env.USE_MOCK_AI;
    const previousKey = process.env.ANTHROPIC_API_KEY;
    process.env.USE_MOCK_AI = "false";
    delete process.env.ANTHROPIC_API_KEY;

    try {
      const outcome = await extractBrief({
        rawBrief: "A partial campaign note with no explicit launch date."
      });

      expect(outcome).toEqual(
        expect.objectContaining({ ok: false, code: "provider_unavailable" })
      );
    } finally {
      restoreEnv("USE_MOCK_AI", previousMock);
      restoreEnv("ANTHROPIC_API_KEY", previousKey);
    }
  });
});

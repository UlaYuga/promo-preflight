import {
  BriefExtractionPayloadSchema,
  BriefExtractionResponseSchema,
  type BriefExtractionResponse
} from "../../schemas/brief-extraction";
import { createClaudeProvider } from "./claude";
import { generateJsonWithRepair } from "./json-repair";
import type { AiTextProvider } from "./types";
import { SAMPLE_BRIEF } from "./brief-extraction-sample";
export { SAMPLE_BRIEF } from "./brief-extraction-sample";

export class MockBriefUnavailableError extends Error {
  constructor() {
    super("Mock AI supports the supplied sample brief only. Load the sample brief or configure live AI extraction.");
    this.name = "MockBriefUnavailableError";
  }
}

export function createMockBriefExtraction(rawBrief: string): BriefExtractionResponse {
  if (rawBrief.trim() !== SAMPLE_BRIEF.trim()) {
    throw new MockBriefUnavailableError();
  }

  return BriefExtractionResponseSchema.parse({
    mode: "mock",
    candidate: {
      metadata: {
        campaignName: "Friday BR Welcome",
        promoType: "welcome",
        geo: "BR",
        locale: "pt-BR",
        currency: "BRL",
        channelsIncluded: ["email"]
      },
      offer: {
        minDeposit: 50,
        bonusPercentage: 100,
        maxBonus: 500,
        wageringRequirement: "35x bonus",
        maxBet: 5
      },
      assets: [
        {
          channel: "email",
          fieldName: "subject",
          text: "Seu bonus de sexta: 100% ate R$500"
        },
        {
          channel: "email",
          fieldName: "body",
          text: "Deposito minimo R$50. Ganhe ate R$500 risk-free. Resgate nesta sexta."
        }
      ],
      links: [
        {
          label: "CTA",
          url: "https://example.com/br-welcome?utm_source=email&utm_medium=crm&utm_campaign=friday_br_welcome",
          expectedDomain: "example.com",
          requiresUtm: true
        }
      ],
      owners: [
        { role: "crm", name: "Ana", status: "approved" },
        { role: "legal", name: "Legal review queue", status: "pending" }
      ],
      termsText:
        "New users only. Available in BR. 18+. 35x wagering on bonus funds. Maximum bet R$5 during bonus play.",
      targetJurisdiction: ["BR"],
      paymentMethods: ["Pix", "USDT"]
    },
    extracted: [
      {
        path: "metadata.geo",
        label: "Market / jurisdiction",
        value: "BR",
        evidence: "Market: Brazil (BR).",
        confidence: "high"
      },
      {
        path: "metadata.locale",
        label: "Locale and currency",
        value: "pt-BR / BRL",
        evidence: "Locale: pt-BR. Currency: BRL.",
        confidence: "high"
      },
      {
        path: "offer.maxBonus",
        label: "Offer mechanics",
        value: "100% up to R$500; min deposit R$50",
        evidence: "deposit R$50 and receive 100% up to R$500",
        confidence: "high"
      },
      {
        path: "assets.email.body",
        label: "Email copy",
        value: "Email body captured",
        evidence: "Ganhe ate R$500 risk-free.",
        confidence: "high"
      },
      {
        path: "paymentMethods",
        label: "Payment methods",
        value: "Pix, USDT",
        evidence: "Payment methods: Pix and USDT.",
        confidence: "high"
      }
    ],
    needsConfirmation: [
      {
        path: "owners.legal.status",
        label: "Legal approval",
        reason: "The brief says legal review is pending; an approver must confirm status."
      }
    ],
    notProvided: [
      {
        path: "metadata.launchDate",
        label: "Launch date",
        reason: "No calendar date is supplied in the brief."
      },
      {
        path: "offer.maxCashout",
        label: "Maximum cashout",
        reason: "No maximum cashout term is supplied in the brief."
      }
    ]
  });
}

export function buildBriefExtractionPrompt(rawBrief: string) {
  return `Extract candidate CampaignBundle fields from the synthetic campaign brief below.

Return a single JSON object with:
- candidate: partial metadata, offer, assets, links, owners, termsText, targetJurisdiction and paymentMethods
- extracted: field rows with path, label, value, short evidence snippet and confidence (high, medium or low)
- needsConfirmation: values mentioned but requiring a human decision
- notProvided: important run fields absent from the brief

Do not invent missing facts. Do not produce a verdict. Do not give legal advice.
Leave absent candidate fields out and list them in notProvided when material.
Keep evidence snippets under 280 characters.

Raw brief:
${rawBrief}`;
}

export async function extractBriefWithClaude(
  rawBrief: string,
  provider: AiTextProvider = createClaudeProvider()
) {
  const result = await generateJsonWithRepair({
    provider,
    schema: BriefExtractionPayloadSchema,
    route: "fast",
    systemPrompt:
      "You structure synthetic promotional campaign briefs for human review. Return valid JSON only. AI extracts candidate fields; versioned rules determine any later verdict.",
    userPrompt: buildBriefExtractionPrompt(rawBrief),
    maxTokens: 4000
  });

  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    data: BriefExtractionResponseSchema.parse({
      ...result.data,
      mode: "live",
      modelUsed: result.modelUsed
    })
  } as const;
}

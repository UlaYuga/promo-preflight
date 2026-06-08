import { getEnv } from "@/lib/env";
import {
  createClaudeProvider,
  generateJsonWithRepair,
} from "@/lib/ai";
import {
  BRIEF_EXTRACTION_SAMPLE,
  BriefExtractionResultSchema,
  type BriefExtractionResult,
} from "@/schemas/brief-extraction";

// ---------------------------------------------------------------------------
// Mock extraction — only for the supplied sample brief text.
// Arbitrary text in mock mode returns an honest "unavailable" marker.
// ---------------------------------------------------------------------------

function isSampleBrief(text: string): boolean {
  const normalized = text.replaceAll("\n", " ").replace(/\s+/g, " ").trim();
  const sampleNormalized = BRIEF_EXTRACTION_SAMPLE.replaceAll("\n", " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalized === sampleNormalized;
}

function buildMockResult(): BriefExtractionResult {
  return {
    candidate: {
      campaignName: "BR Welcome Q2 2026",
      operatorLabel: "Acme Casino",
      promoType: "welcome",
      geo: "Brazil SPA/MF",
      locale: "pt-BR",
      currency: "BRL",
      launchDate: undefined,
      channelsIncluded: ["email", "sms", "landing"],
      targetJurisdiction: ["BR"],
      offer: {
        minDeposit: 50,
        bonusAmount: 500,
        bonusPercentage: 100,
        maxBonus: 500,
        wageringRequirement: "35x bonus",
        maxBet: 5,
      },
      termsText:
        "100% welcome bonus up to R$500. Minimum deposit R$50. 35x wagering requirement. " +
        "Max bet R$5. Valid 30 days. 18+. Gamble responsibly.",
      channelCopy: {
        email_subject: {
          text: "Acme Casino — Get up to R$500 Welcome Bonus",
          fieldName: "Email subject",
        },
        email_body: {
          text: "Welcome to Acme Casino! Deposit R$50 and get up to R$500 in welcome bonus. 18+. T&Cs apply.",
          fieldName: "Email body",
        },
        sms_copy: {
          text: "Acme Casino: 100% bonus up to R$500. Min deposit R$50. T&Cs apply. 18+",
          fieldName: "SMS copy",
        },
      },
      links: [
        {
          label: "CTA",
          url: "https://acme.casino/br/welcome?utm_source=email_welcome&utm_medium=email&utm_campaign=welcome_br_q2",
          requiresUtm: false,
        },
      ],
      owners: [
        { role: "crm", name: "ana.silva", status: "pending" },
        { role: "marketing", name: "pedro.costa", status: "pending" },
        { role: "compliance", name: "", status: "pending" },
      ],
      paymentMethods: ["pix", "visa", "mastercard", "usdt_trc20"],
    },
    fields: [
      {
        fieldPath: "campaignName",
        label: "Campaign name",
        value: "BR Welcome Q2 2026",
        confidence: "high",
        sourceSnippet: "BR welcome offer for Q2 2026",
      },
      {
        fieldPath: "operatorLabel",
        label: "Operator",
        value: "Acme Casino",
        confidence: "high",
        sourceSnippet: "Operator: Acme Casino",
      },
      {
        fieldPath: "promoType",
        label: "Promo type",
        value: "welcome",
        confidence: "high",
        sourceSnippet: "BR welcome offer for Q2 2026",
      },
      {
        fieldPath: "geo",
        label: "GEO",
        value: "Brazil SPA/MF",
        confidence: "high",
        sourceSnippet: "GEO: BR",
      },
      {
        fieldPath: "locale",
        label: "Locale",
        value: "pt-BR",
        confidence: "high",
        sourceSnippet: "Locale: pt-BR",
      },
      {
        fieldPath: "currency",
        label: "Currency",
        value: "BRL",
        confidence: "high",
        sourceSnippet: "Currency: BRL",
      },
      {
        fieldPath: "offer.minDeposit",
        label: "Min deposit",
        value: "50",
        confidence: "high",
        sourceSnippet: "Deposit min R$50",
      },
      {
        fieldPath: "offer.bonusAmount",
        label: "Bonus amount",
        value: "500",
        confidence: "high",
        sourceSnippet: "bonus up to R$500",
      },
      {
        fieldPath: "offer.bonusPercentage",
        label: "Bonus percentage",
        value: "100",
        confidence: "high",
        sourceSnippet: "100% bonus up to R$500",
      },
      {
        fieldPath: "offer.wageringRequirement",
        label: "Wagering requirement",
        value: "35x bonus",
        confidence: "high",
        sourceSnippet: "35x wagering",
      },
      {
        fieldPath: "offer.maxBet",
        label: "Max bet",
        value: "5",
        confidence: "medium",
        sourceSnippet: "Max bet R$5",
      },
      {
        fieldPath: "termsText",
        label: "T&C text",
        value: "100% welcome bonus up to R$500…",
        confidence: "high",
        sourceSnippet: "T&C: 100% welcome bonus up to R$500",
      },
      {
        fieldPath: "channelCopy.email_subject",
        label: "Email subject",
        value: "Acme Casino — Get up to R$500 Welcome Bonus",
        confidence: "high",
        sourceSnippet: "Email subject: Acme Casino — Get up to R$500 Welcome Bonus",
      },
      {
        fieldPath: "channelCopy.email_body",
        label: "Email body",
        value: "Welcome to Acme Casino!…",
        confidence: "high",
        sourceSnippet: "Email body: Welcome to Acme Casino!",
      },
      {
        fieldPath: "channelCopy.sms_copy",
        label: "SMS copy",
        value: "Acme Casino: 100% bonus up to R$500…",
        confidence: "high",
        sourceSnippet: "SMS copy: Acme Casino: 100% bonus",
      },
      {
        fieldPath: "links.0.url",
        label: "Landing CTA URL",
        value: "https://acme.casino/br/welcome?…",
        confidence: "high",
        sourceSnippet: "Landing CTA URL: https://acme.casino/br/welcome",
      },
      {
        fieldPath: "paymentMethods",
        label: "Payment methods",
        value: "pix, visa, mastercard, usdt_trc20",
        confidence: "high",
        sourceSnippet: "Payment methods: Pix, Visa, Mastercard, USDT-TRC20",
      },
      {
        fieldPath: "owners.crm",
        label: "CRM owner",
        value: "ana.silva",
        confidence: "high",
        sourceSnippet: "CRM owner: ana.silva",
      },
    ],
    needsConfirmation: [
      "campaignName — inferred from 'BR welcome offer for Q2 2026'",
      "launchDate — not specified",
      "owners.compliance — empty name, status pending",
      "offer.maxBet — extracted from T&C, confirm value",
    ],
    notProvided: [
      "launchDate — no explicit date in brief",
      "eligibleGames — not mentioned",
      "contribution rules — not mentioned",
      "cooldown period — not mentioned",
    ],
    providerNote:
      "Synthetic mock extraction from the supplied sample brief. " +
      "Fields with medium/low confidence and needsConfirmation items " +
      "should be reviewed before running deterministic checks.",
  };
}

// ---------------------------------------------------------------------------
// Live AI extraction prompt
// ---------------------------------------------------------------------------

const EXTRACTION_SYSTEM_PROMPT = `You are an AI assistant that extracts structured campaign fields from free-text promo briefs for iGaming campaigns.

Return valid JSON only. Never return markdown.
Do not invent missing facts. If a field is not present in the brief, omit it.
Do not output legal advice. Do not position the tool as gambling product, casino service, or player-facing tool.

The output must match this Zod schema:
{
  candidate: {
    campaignName?: string,
    operatorLabel?: string,
    promoType?: string,         // welcome | reload | freebet | cashback | tournament | loyalty | reactivation
    geo?: string,
    locale?: string,
    currency?: string,          // ISO 4217
    launchDate?: string,        // ISO 8601 date
    channelsIncluded?: string[],
    targetJurisdiction?: string[],
    offer?: {
      minDeposit?: number,
      bonusAmount?: number,
      bonusPercentage?: number,
      maxBonus?: number,
      wageringRequirement?: string,
      maxCashout?: number,
      maxBet?: number,
      eligibleGames?: string,
      contribution?: string,
      cooldown?: string,
      eligibilityRules?: string
    },
    termsText?: string,
    channelCopy?: Record<string, { text: string, fieldName?: string }>,
    links?: Array<{ label?: string, url: string, requiresUtm?: boolean }>,
    owners?: Array<{ role: string, name?: string, status?: string }>,
    paymentMethods?: string[]
  },
  fields: Array<{
    fieldPath: string,
    label: string,
    value: string,
    confidence: "high" | "medium" | "low",
    sourceSnippet: string   // max 280 chars, from the brief
  }>,
  needsConfirmation: string[],
  notProvided: string[],
  providerNote?: string
}

Extract every field you can find in the brief. For each extracted field, include a short source snippet from the original text. Mark confidence: high for explicit values, medium for strong implication, low for weak implication. List any fields that need human confirmation and any that are not mentioned.`;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type ExtractionInput = {
  rawBrief: string;
};

export type ExtractionSuccess = {
  ok: true;
  result: BriefExtractionResult;
  modelUsed: string;
};

export type ExtractionFailure = {
  ok: false;
  code: "mock_unavailable" | "provider_unavailable" | "provider_error";
  message: string;
};

export type ExtractionOutcome = ExtractionSuccess | ExtractionFailure;

/**
 * Extracts campaign fields from a free-text brief.
 *
 * In mock mode (USE_MOCK_AI=true), only the supplied sample brief returns a
 * result; all other text returns an honest "mock_unavailable" error.
 *
 * In live mode, sends the brief to the configured Claude provider and validates
 * the response against the extraction Zod schema.
 */
export async function extractBrief(
  input: ExtractionInput,
): Promise<ExtractionOutcome> {
  const env = getEnv();

  if (env.USE_MOCK_AI) {
    if (isSampleBrief(input.rawBrief)) {
      return {
        ok: true,
        result: buildMockResult(),
        modelUsed: "mock",
      };
    }

    return {
      ok: false,
      code: "mock_unavailable",
      message:
        "Mock mode only supports the supplied sample brief. " +
        "Configure ANTHROPIC_API_KEY and set USE_MOCK_AI=false for free-form extraction.",
    };
  }

  const provider = createClaudeProvider();
  const genResult = await generateJsonWithRepair({
    provider,
    schema: BriefExtractionResultSchema,
    route: "core",
    systemPrompt: EXTRACTION_SYSTEM_PROMPT,
    userPrompt: `Extract campaign fields from this promo brief:\n\n${input.rawBrief}`,
    maxTokens: 4000,
  });

  if (!genResult.ok) {
    if ("code" in genResult.error && genResult.error.code === "missing_api_key") {
      return {
        ok: false,
        code: "provider_unavailable",
        message: "ANTHROPIC_API_KEY is not configured.",
      };
    }
    return {
      ok: false,
      code: "provider_error",
      message:
        "validationError" in genResult.error
          ? genResult.error.validationError
          : genResult.error.message,
    };
  }

  return {
    ok: true,
    result: genResult.data,
    modelUsed: genResult.modelUsed,
  };
}

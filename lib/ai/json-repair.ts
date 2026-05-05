import type { ZodType } from "zod";
import {
  CheckResultSchema,
  type CheckResult,
  type CheckResultInput
} from "../../schemas/index";
import { buildJsonRepairPrompt, GLOBAL_JSON_CONTRACT_PROMPT } from "./prompts";
import type {
  AiModelRoute,
  AiProviderError,
  AiTextProvider
} from "./types";

type ParseAndValidateSuccess<T> = {
  ok: true;
  data: T;
};

type ParseAndValidateFailure = {
  ok: false;
  validationError: string;
};

type JsonWithRepairSuccess<T> = {
  ok: true;
  data: T;
  modelUsed: string;
  repairAttempted: boolean;
};

type JsonWithRepairFailure = {
  ok: false;
  error: AiProviderError | ParseAndValidateFailure;
  modelUsed?: string;
  repairAttempted: boolean;
};

export type JsonWithRepairResult<T> =
  | JsonWithRepairSuccess<T>
  | JsonWithRepairFailure;

export type GenerateJsonWithRepairInput<T> = {
  provider: AiTextProvider;
  schema: ZodType<T>;
  route: AiModelRoute;
  systemPrompt: string;
  userPrompt: string;
  repairRoute?: AiModelRoute;
  maxTokens?: number;
};

export async function generateJsonWithRepair<T>(
  input: GenerateJsonWithRepairInput<T>
): Promise<JsonWithRepairResult<T>> {
  const first = await input.provider.generate({
    route: input.route,
    systemPrompt: input.systemPrompt,
    userPrompt: input.userPrompt,
    maxTokens: input.maxTokens
  });

  if (!first.ok) {
    return {
      ok: false,
      error: first,
      repairAttempted: false
    };
  }

  const firstValidation = parseAndValidate(first.text, input.schema);
  if (firstValidation.ok) {
    return {
      ok: true,
      data: firstValidation.data,
      modelUsed: first.modelUsed,
      repairAttempted: false
    };
  }

  const repair = await input.provider.generate({
    route: input.repairRoute ?? input.route,
    systemPrompt: GLOBAL_JSON_CONTRACT_PROMPT,
    userPrompt: buildJsonRepairPrompt({
      validationError: firstValidation.validationError,
      badJson: first.text
    }),
    maxTokens: input.maxTokens
  });

  if (!repair.ok) {
    return {
      ok: false,
      error: repair,
      modelUsed: first.modelUsed,
      repairAttempted: true
    };
  }

  const repairedValidation = parseAndValidate(repair.text, input.schema);
  if (repairedValidation.ok) {
    return {
      ok: true,
      data: repairedValidation.data,
      modelUsed: repair.modelUsed,
      repairAttempted: true
    };
  }

  return {
    ok: false,
    error: repairedValidation,
    modelUsed: repair.modelUsed,
    repairAttempted: true
  };
}

export type GenerateCheckResultWithRepairInput = Omit<
  GenerateJsonWithRepairInput<CheckResult>,
  "schema"
> & {
  checkId: string;
  publicName: string;
};

export async function generateCheckResultWithRepair(
  input: GenerateCheckResultWithRepairInput
) {
  const result = await generateJsonWithRepair({
    ...input,
    schema: CheckResultSchema
  });

  if (result.ok) {
    return {
      ok: true,
      result: result.data,
      repairAttempted: result.repairAttempted
    } as const;
  }

  if (result.repairAttempted) {
    return {
      ok: true,
      result: buildParsingErrorCheckResult({
        checkId: input.checkId,
        publicName: input.publicName,
        modelUsed: result.modelUsed
      }),
      repairAttempted: true
    } as const;
  }

  return {
    ok: false,
    error: result.error
  } as const;
}

export function buildParsingErrorCheckResult(input: {
  checkId: string;
  publicName: string;
  modelUsed?: string;
}) {
  const fallback = {
    checkId: input.checkId,
    publicName: input.publicName,
    status: "WARN",
    severity: "LOW",
    summary: "AI output could not be parsed after one repair attempt.",
    issues: [],
    suggestedFixCount: 0,
    confidence: 0,
    modelUsed: input.modelUsed,
    parsingError: "Model JSON failed validation after repair."
  } satisfies CheckResultInput;

  return CheckResultSchema.parse(fallback);
}

function parseAndValidate<T>(
  text: string,
  schema: ZodType<T>
): ParseAndValidateSuccess<T> | ParseAndValidateFailure {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text.trim());
  } catch {
    return {
      ok: false,
      validationError: "JSON parse failed: response was not valid JSON."
    };
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      validationError: summarizeZodError(result.error)
    };
  }

  return {
    ok: true,
    data: result.data
  };
}

function summarizeZodError(error: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  const issueSummary = error.issues
    .slice(0, 4)
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "root";
      return `${path}: ${issue.message}`;
    })
    .join("; ");

  return issueSummary || "Zod validation failed.";
}

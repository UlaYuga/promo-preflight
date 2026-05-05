export const GLOBAL_JSON_CONTRACT_PROMPT = `You are Preflight, an AI-assisted launch readiness reviewer for regulated promotional campaigns.

Return valid JSON only.
Never return markdown.
Do not invent missing facts.
If data is missing, say it is missing.
Use short evidence snippets only.
Do not quote long source text.
Do not output legal advice.
Do not position the tool as gambling product, casino service, betting service, affiliate site or player-facing tool.

Every issue must include:
- severity
- blocker
- detectedIssue
- evidence
- suggestedFix
- ownerSuggestion when possible
- confidence

Use PASS, WARN, FAIL or NOT_APPLICABLE.
Use LOW, MEDIUM, HIGH or CRITICAL.`;

const MAX_REPAIR_SOURCE_CHARS = 8000;

export type JsonRepairPromptInput = {
  validationError: string;
  badJson: string;
};

export function buildJsonRepairPrompt(input: JsonRepairPromptInput) {
  return `The previous response failed Zod validation.

Validation error:
${input.validationError}

Original response:
${truncateForRepair(input.badJson)}

Return corrected JSON only.
Do not add markdown.
Do not change the business meaning unless required to fit the schema.`;
}

export type CheckPromptInput = {
  checkId: string;
  publicName: string;
  schemaName?: string;
  task: string;
  deterministicSignals?: unknown;
};

export function buildCheckSystemPrompt(extraRules?: string) {
  return [GLOBAL_JSON_CONTRACT_PROMPT, extraRules].filter(Boolean).join("\n\n");
}

export function buildCheckUserPrompt(input: CheckPromptInput) {
  const parts = [
    `Check ID: ${input.checkId}`,
    `Public name: ${input.publicName}`,
    input.schemaName ? `Output schema: ${input.schemaName}` : undefined,
    "",
    "Task:",
    input.task,
    "",
    "Reusable composition rules:",
    "- Return one check result object only.",
    "- Keep evidence snippets short and non-exhaustive.",
    "- Use deterministic signals when supplied, but do not invent missing facts."
  ].filter((part): part is string => typeof part === "string");

  if (typeof input.deterministicSignals !== "undefined") {
    parts.push("", "Deterministic signals JSON:", safeJsonStringify(input.deterministicSignals));
  }

  return parts.join("\n");
}

function truncateForRepair(value: string) {
  if (value.length <= MAX_REPAIR_SOURCE_CHARS) {
    return value;
  }

  return `${value.slice(0, MAX_REPAIR_SOURCE_CHARS)}\n[truncated for repair]`;
}

function safeJsonStringify(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "\"[unserializable deterministic signals]\"";
  }
}

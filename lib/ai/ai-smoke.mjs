import {
  CheckResultSchema,
  CheckStatusSchema
} from "../../schemas/index.ts";
import { createClaudeProvider } from "./claude.ts";
import { generateCheckResultWithRepair } from "./json-repair.ts";
import { buildCheckSystemPrompt, buildCheckUserPrompt } from "./prompts.ts";

const originalApiKey = process.env.ANTHROPIC_API_KEY;
const originalCoreModel = process.env.ANTHROPIC_MODEL_CORE;

try {
  await runMissingApiKeySmoke();
  await runMissingModelSmoke();
  await runSuccessfulRepairSmoke();
  await runFailedRepairFallbackSmoke();

  console.log(
    "AI smoke checks passed: missing key, missing model, repair success, repair fallback."
  );
} finally {
  restoreEnv("ANTHROPIC_API_KEY", originalApiKey);
  restoreEnv("ANTHROPIC_MODEL_CORE", originalCoreModel);
}

async function runMissingApiKeySmoke() {
  delete process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_MODEL_CORE = "smoke-core-model";

  const provider = createClaudeProvider();
  const result = await provider.generate({
    route: "core",
    systemPrompt: "Return JSON only.",
    userPrompt: "{\"ping\":true}"
  });

  if (result.ok) {
    throw new Error("Expected missing API key to return a typed provider error.");
  }

  if (result.code !== "missing_api_key") {
    throw new Error(`Expected missing_api_key, got ${result.code}.`);
  }

  if (
    result.message.includes("smoke-core-model") ||
    result.message.includes("sk-") ||
    result.message.includes("stack")
  ) {
    throw new Error("Missing key error exposed secret-like or stack-like output.");
  }
}

async function runMissingModelSmoke() {
  process.env.ANTHROPIC_API_KEY = "smoke-api-key";
  delete process.env.ANTHROPIC_MODEL_CORE;

  const provider = createClaudeProvider();
  const result = await provider.generate({
    route: "core",
    systemPrompt: "Return JSON only.",
    userPrompt: "{\"ping\":true}"
  });

  if (result.ok) {
    throw new Error("Expected missing model to return a typed provider error.");
  }

  if (result.code !== "missing_model") {
    throw new Error(`Expected missing_model, got ${result.code}.`);
  }

  if (result.message.includes("smoke-api-key") || result.message.includes("stack")) {
    throw new Error("Missing model error exposed secret-like or stack-like output.");
  }
}

async function runSuccessfulRepairSmoke() {
  const provider = createFakeProvider([
    "not-json",
    JSON.stringify({
      checkId: "channel_consistency",
      publicName: "Channel consistency",
      status: "PASS",
      summary: "Repaired JSON validates.",
      issues: [],
      suggestedFixCount: 0,
      confidence: 0.88,
      modelUsed: "fake-repair-model"
    })
  ]);

  const result = await generateCheckResultWithRepair({
    provider,
    route: "core",
    checkId: "channel_consistency",
    publicName: "Channel consistency",
    systemPrompt: buildCheckSystemPrompt(),
    userPrompt: buildCheckUserPrompt({
      checkId: "channel_consistency",
      publicName: "Channel consistency",
      schemaName: "CheckResultSchema",
      task: "Smoke test repair flow."
    })
  });

  if (!result.ok) {
    throw new Error("Expected successful repair flow.");
  }

  CheckResultSchema.parse(result.result);

  if (!result.repairAttempted) {
    throw new Error("Expected one repair attempt for invalid first response.");
  }

  if (provider.calls.length !== 2) {
    throw new Error(`Expected exactly 2 provider calls, got ${provider.calls.length}.`);
  }

  if (!provider.calls[1]?.userPrompt.includes("The previous response failed Zod validation.")) {
    throw new Error("Repair call did not use the repair prompt.");
  }
}

async function runFailedRepairFallbackSmoke() {
  const provider = createFakeProvider(["not-json", "{\"status\":\"WARN\""]);

  const result = await generateCheckResultWithRepair({
    provider,
    route: "core",
    checkId: "terms_robustness",
    publicName: "Terms robustness",
    systemPrompt: buildCheckSystemPrompt(),
    userPrompt: buildCheckUserPrompt({
      checkId: "terms_robustness",
      publicName: "Terms robustness",
      schemaName: "CheckResultSchema",
      task: "Smoke test failed repair fallback."
    })
  });

  if (!result.ok) {
    throw new Error("Expected failed repair to return a fallback CheckResult.");
  }

  const fallback = CheckResultSchema.parse(result.result);

  if (fallback.status !== CheckStatusSchema.enum.WARN) {
    throw new Error(`Expected WARN fallback, got ${fallback.status}.`);
  }

  if (!fallback.parsingError) {
    throw new Error("Expected fallback parsingError.");
  }

  if (!result.repairAttempted) {
    throw new Error("Expected repair attempt before fallback.");
  }

  if (provider.calls.length !== 2) {
    throw new Error(`Expected exactly 2 provider calls, got ${provider.calls.length}.`);
  }
}

function createFakeProvider(responses) {
  return {
    calls: [],
    async generate(request) {
      this.calls.push(request);
      const response = responses[this.calls.length - 1] ?? responses.at(-1);

      return {
        ok: true,
        text: response,
        modelUsed: `fake-model-${this.calls.length}`
      };
    }
  };
}

function restoreEnv(key, value) {
  if (typeof value === "undefined") {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}

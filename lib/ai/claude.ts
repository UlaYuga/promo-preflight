import Anthropic from "@anthropic-ai/sdk";
import { getEnv } from "../env";
import type {
  AiModelRoute,
  AiProviderError,
  AiProviderRequest,
  AiProviderResult,
  AiTextProvider
} from "./types";

type ClaudeProviderOptions = {
  client?: Anthropic;
};

const MODEL_ENV_BY_ROUTE = {
  core: "ANTHROPIC_MODEL_CORE",
  fast: "ANTHROPIC_MODEL_FAST",
  audit: "ANTHROPIC_MODEL_AUDIT"
} as const satisfies Record<AiModelRoute, keyof ReturnType<typeof getEnv>>;

export function resolveClaudeModel(route: AiModelRoute) {
  const env = getEnv();
  const modelEnvName = MODEL_ENV_BY_ROUTE[route];
  const model = trimOptional(env[modelEnvName]);

  if (!model) {
    return {
      ok: false,
      code: "missing_model",
      message: `Missing required model environment variable for ${route} route.`,
      route
    } satisfies AiProviderError;
  }

  return { ok: true, model, modelEnvName } as const;
}

export function createClaudeProvider(
  options: ClaudeProviderOptions = {}
): AiTextProvider {
  return {
    async generate(request: AiProviderRequest): Promise<AiProviderResult> {
      const env = getEnv();
      const apiKey = trimOptional(env.ANTHROPIC_API_KEY);

      if (!apiKey) {
        return {
          ok: false,
          code: "missing_api_key",
          message: "ANTHROPIC_API_KEY is not configured.",
          route: request.route
        };
      }

      const resolvedModel = resolveClaudeModel(request.route);
      if (!resolvedModel.ok) {
        return resolvedModel;
      }

      try {
        const client = options.client ?? new Anthropic({ apiKey });
        const message = await client.messages.create({
          model: resolvedModel.model,
          max_tokens: request.maxTokens ?? 2000,
          temperature: request.temperature ?? 0,
          system: request.systemPrompt,
          messages: [{ role: "user", content: request.userPrompt }]
        });

        return {
          ok: true,
          text: message.content
            .filter((block) => block.type === "text")
            .map((block) => block.text)
            .join(""),
          modelUsed: resolvedModel.model
        };
      } catch {
        return {
          ok: false,
          code: "provider_error",
          message: "Claude provider request failed.",
          route: request.route
        };
      }
    }
  };
}

function trimOptional(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

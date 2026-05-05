export type AiModelRoute = "core" | "fast" | "audit";

export type AiProviderRequest = {
  route: AiModelRoute;
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
};

export type AiProviderErrorCode =
  | "missing_api_key"
  | "missing_model"
  | "provider_error";

export type AiProviderError = {
  ok: false;
  code: AiProviderErrorCode;
  message: string;
  route: AiModelRoute;
};

export type AiProviderSuccess = {
  ok: true;
  text: string;
  modelUsed: string;
};

export type AiProviderResult = AiProviderSuccess | AiProviderError;

export type AiTextProvider = {
  generate(request: AiProviderRequest): Promise<AiProviderResult>;
};

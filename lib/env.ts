import { z } from "zod";

const booleanEnv = (defaultValue: "true" | "false") =>
  z
    .enum(["true", "false"])
    .default(defaultValue)
    .transform((value) => value === "true");

const positiveIntEnv = (defaultValue: number) =>
  z.coerce.number().int().positive().default(defaultValue);

const envSchema = z.object({
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL_CORE: z.string().optional(),
  ANTHROPIC_MODEL_FAST: z.string().optional(),
  ANTHROPIC_MODEL_AUDIT: z.string().optional(),
  PREFLIGHT_API_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  // Public origin used to build absolute links in outbound notifications
  // (e.g. Telegram run alerts). Unset → callers fall back to localhost,
  // which is correct for local dev but wrong in production.
  PUBLIC_APP_URL: z.string().optional(),
  USE_MOCK_AI: booleanEnv("true"),
  MAX_INPUT_CHARS: positiveIntEnv(50000),
  RATE_LIMIT_WINDOW_SECONDS: positiveIntEnv(60),
  RATE_LIMIT_MAX_REQUESTS: positiveIntEnv(20),
  STORE_RAW_INPUT: booleanEnv("false"),
  RAW_INPUT_TTL_HOURS: positiveIntEnv(24),
  NEXT_PUBLIC_APP_ENV: z.string().default("local")
});

export function getEnv() {
  return envSchema.parse(process.env);
}

import { NextRequest } from "next/server";
import { BriefExtractionRequestSchema } from "../../../schemas/brief-extraction";
import {
  MockBriefUnavailableError,
  createMockBriefExtraction,
  extractBriefWithClaude
} from "../../../lib/ai/brief-extraction";
import { getEnv } from "../../../lib/env";
import { checkInputSize } from "../../../lib/input-limit";

export const runtime = "nodejs";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store"
};

export async function POST(req: NextRequest): Promise<Response> {
  let rawBody: unknown;
  try {
    rawBody = (await req.json()) as unknown;
  } catch {
    return errorResponse("Request body must be valid JSON.", 400);
  }

  const parsed = BriefExtractionRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return errorResponse("Paste a brief of at least 20 characters before extraction.", 400);
  }

  const env = getEnv();
  const inputSize = checkInputSize(parsed.data.rawBrief, env.MAX_INPUT_CHARS);
  if (!inputSize.ok) {
    return errorResponse(inputSize.message, 413);
  }

  if (env.USE_MOCK_AI) {
    try {
      return Response.json(createMockBriefExtraction(parsed.data.rawBrief), {
        status: 200,
        headers: NO_STORE_HEADERS
      });
    } catch (error) {
      if (error instanceof MockBriefUnavailableError) {
        return errorResponse(error.message, 422, "mock_sample_only");
      }
      throw error;
    }
  }

  const extraction = await extractBriefWithClaude(parsed.data.rawBrief);
  if (!extraction.ok) {
    return errorResponse(
      "AI extraction is unavailable. Check server model configuration and retry.",
      503
    );
  }

  return Response.json(extraction.data, {
    status: 200,
    headers: NO_STORE_HEADERS
  });
}

function errorResponse(error: string, status: number, code?: string) {
  return Response.json(
    { error, ...(code ? { code } : {}) },
    {
      status,
      headers: NO_STORE_HEADERS
    }
  );
}

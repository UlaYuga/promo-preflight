import { NextRequest } from "next/server";
import { z } from "zod";
import {
  BriefExtractionRequestSchema,
  type BriefExtractionResult,
} from "@/schemas/brief-extraction";
import { extractBrief } from "@/lib/ai/brief-extraction";

// ---------------------------------------------------------------------------
// POST /api/brief-extraction
//
// Browser-demo helper route — NOT part of the persisted /api/v1/* contract.
// Accepts free-text campaign brief, returns Zod-validated extraction.
// Raw brief text is never stored. Response has Cache-Control: no-store.
// ---------------------------------------------------------------------------

const MAX_INPUT_CHARS = 20000;

export async function POST(request: NextRequest) {
  // --- Parse & validate body ---
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "BAD_REQUEST", message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsed = BriefExtractionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error: "BAD_REQUEST",
        message: formatZodIssues(parsed.error),
      },
      { status: 400 },
    );
  }

  const { rawBrief } = parsed.data;

  if (rawBrief.length > MAX_INPUT_CHARS) {
    return Response.json(
      {
        error: "PAYLOAD_TOO_LARGE",
        message: `Brief text exceeds ${MAX_INPUT_CHARS} characters.`,
      },
      { status: 413 },
    );
  }

  // --- Extract ---
  const outcome = await extractBrief({ rawBrief });

  if (!outcome.ok) {
    const status =
      outcome.code === "mock_unavailable" ? 422 : 503;

    return Response.json(
      {
        error: outcome.code.toUpperCase(),
        message: outcome.message,
      },
      {
        status,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  const body_response: BriefExtractionResult & { modelUsed: string } = {
    ...outcome.result,
    modelUsed: outcome.modelUsed,
  };

  return Response.json(body_response, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}

function formatZodIssues(error: z.ZodError): string {
  return error.issues
    .map((i) => `${i.path.join(".")}: ${i.message}`)
    .join("; ");
}

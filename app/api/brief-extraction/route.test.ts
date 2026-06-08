import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import {
  BRIEF_EXTRACTION_SAMPLE,
  BriefExtractionResultSchema
} from "../../../schemas/brief-extraction";
import { POST } from "./route";

function post(rawBrief: string) {
  return new NextRequest("http://localhost/api/brief-extraction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rawBrief })
  });
}

function rawPost(body: string) {
  return new NextRequest("http://localhost/api/brief-extraction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body
  });
}

function restoreEnv(name: "USE_MOCK_AI", previous: string | undefined) {
  if (previous === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = previous;
  }
}

describe("POST /api/brief-extraction", () => {
  it("rejects malformed JSON before extraction", async () => {
    const response = await POST(rawPost("{not-json"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "BAD_REQUEST",
      message: "Request body must be valid JSON."
    });
  });

  it("returns a no-store candidate review for the synthetic mock brief", async () => {
    const previous = process.env.USE_MOCK_AI;
    process.env.USE_MOCK_AI = "true";

    try {
      const response = await POST(post(BRIEF_EXTRACTION_SAMPLE));
      expect(response.status).toBe(200);
      expect(response.headers.get("Cache-Control")).toBe("no-store");

      const rawPayload = await response.json();
      const payload = BriefExtractionResultSchema.parse(rawPayload);
      expect(rawPayload.modelUsed).toBe("mock");
      expect(payload.candidate.campaignName).toBe("BR Welcome Q2 2026");
    } finally {
      restoreEnv("USE_MOCK_AI", previous);
    }
  });

  it("rejects an oversized raw brief before extraction", async () => {
    const response = await POST(post("A".repeat(20001)));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({ error: "BAD_REQUEST" })
    );
  });

  it("explains that arbitrary extraction is unavailable in mock mode", async () => {
    const previous = process.env.USE_MOCK_AI;
    process.env.USE_MOCK_AI = "true";

    try {
      const response = await POST(post("A custom free-form brief long enough to submit."));
      expect(response.status).toBe(422);
      await expect(response.json()).resolves.toEqual(
        expect.objectContaining({
          error: "MOCK_UNAVAILABLE",
          message: expect.stringMatching(/sample brief/i)
        })
      );
    } finally {
      restoreEnv("USE_MOCK_AI", previous);
    }
  });
});

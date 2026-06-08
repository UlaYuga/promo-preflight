import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { BriefExtractionResponseSchema } from "../../../schemas/brief-extraction";
import { SAMPLE_BRIEF } from "../../../lib/ai/brief-extraction";
import { POST } from "./route";

function post(rawBrief: string) {
  return new NextRequest("http://localhost/api/brief-extraction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rawBrief })
  });
}

function restoreEnv(name: "USE_MOCK_AI" | "MAX_INPUT_CHARS", previous: string | undefined) {
  if (previous === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = previous;
  }
}

describe("POST /api/brief-extraction", () => {
  it("returns a no-store candidate review for the synthetic mock brief", async () => {
    const previous = process.env.USE_MOCK_AI;
    process.env.USE_MOCK_AI = "true";

    try {
      const response = await POST(post(SAMPLE_BRIEF));
      expect(response.status).toBe(200);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      const payload = BriefExtractionResponseSchema.parse(await response.json());
      expect(payload.mode).toBe("mock");
      expect(payload.candidate.metadata.campaignName).toBe("Friday BR Welcome");
    } finally {
      restoreEnv("USE_MOCK_AI", previous);
    }
  });

  it("rejects an oversized raw brief before extraction", async () => {
    const previous = process.env.MAX_INPUT_CHARS;
    process.env.MAX_INPUT_CHARS = "20";

    try {
      const response = await POST(post("A".repeat(30)));
      expect(response.status).toBe(413);
    } finally {
      restoreEnv("MAX_INPUT_CHARS", previous);
    }
  });

  it("explains that arbitrary extraction is unavailable in mock mode", async () => {
    const previous = process.env.USE_MOCK_AI;
    process.env.USE_MOCK_AI = "true";

    try {
      const response = await POST(post("A custom free-form brief long enough to submit."));
      expect(response.status).toBe(422);
      await expect(response.json()).resolves.toEqual(
        expect.objectContaining({ error: expect.stringMatching(/sample brief/i) })
      );
    } finally {
      restoreEnv("USE_MOCK_AI", previous);
    }
  });
});

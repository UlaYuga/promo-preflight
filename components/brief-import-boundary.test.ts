import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

function readLocale(language: "en" | "ru") {
  return JSON.parse(readSource(`locales/${language}.json`)) as {
    intake: { briefImport: Record<string, string> };
  };
}

describe("AI brief import UI boundary", () => {
  it("uses the browser-demo extraction endpoint and keeps deterministic verdict copy explicit", () => {
    const panel = readSource("components/brief-import-panel.tsx");
    const intake = readSource("components/intake-form.tsx");
    const report = readSource("components/risk-report.tsx");

    expect(panel).toContain('fetch("/api/brief-extraction"');
    expect(panel).not.toContain("/api/v1/");
    expect(panel).toContain("BriefExtractionResponseSchema");
    expect(intake).toContain("BriefImportPanel");
    expect(intake).toContain("handleConfirmExtraction");
    expect(report).toContain("const [hydrated, setHydrated]");
    expect(report).toContain("if (!hydrated)");
    expect(report).toContain('t("common.loading")');
  });

  it.each(["en", "ru"] as const)("provides %s human-review and rule-engine copy", (language) => {
    const copy = readLocale(language).intake.briefImport;
    const all = JSON.stringify(copy);

    expect(copy.confirmAndRun).toEqual(expect.any(String));
    expect(all).toContain(language === "en" ? "Versioned rules" : "Версионированные правила");
    expect(all).toContain(language === "en" ? "confirm" : "подтверд");
    expect(all).toContain(language === "en" ? "Legal approval" : "Юридическое согласование");
    expect(all).toContain(
      language === "en"
        ? "No calendar date is supplied"
        : "В брифе не указана календарная дата"
    );
  });
});

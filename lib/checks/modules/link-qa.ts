import type { CheckModule, IssueDraft } from "../types";
import { analyzeUrlShape, createSourceExcerpt } from "../helpers";
import { buildCheckResult } from "../result";
import { loc } from "../i18n";

export const linkQaCheck: CheckModule = {
  id: "link_qa",
  run(context) {
    const { links } = context.bundle;
    const lang = context.language;
    const linkShapes = links.map(analyzeUrlShape);
    const issues: IssueDraft[] = [];

    if (links.length === 0) {
      return buildCheckResult("link_qa", issues, {
        notApplicable: true,
        notApplicableSummary: loc(
          "No links were supplied for deterministic Link QA.",
          "Ссылки не переданы — проверка не выполнялась.",
          lang
        ),
        passSummary: loc(
          "Links are valid and tracked.",
          "Ссылки корректны и содержат utm-метки.",
          lang
        ),
        issueSummary: loc(
          "Link QA found deterministic URL or tracking issues.",
          "Обнаружены проблемы с URL или utm-метками.",
          lang
        ),
        deterministicSignals: { linkCount: 0 },
        confidence: 0.88
      });
    }

    for (const shape of linkShapes) {
      if (!shape.isValid) {
        issues.push({
          severity: "HIGH",
          blocker: true,
          detectedIssue: loc(
            "A campaign link is not a valid http or https URL.",
            "Ссылка кампании не является корректным http или https URL.",
            lang
          ),
          evidence: [
            {
              field: `links.${shape.label}`,
              snippet: createSourceExcerpt(shape.input, { maxLength: 100 })
            }
          ],
          suggestedFix: loc(
            "Replace the malformed or unsupported URL with a valid http or https URL.",
            "Замените некорректный URL на действительный http или https адрес.",
            lang
          ),
          ownerSuggestion: "crm",
          confidence: 0.97
        });
        continue;
      }

      if (shape.matchesExpectedDomain === false) {
        issues.push({
          severity: "MEDIUM",
          blocker: false,
          detectedIssue: loc(
            "A link does not match its expected destination domain.",
            "Ссылка не совпадает с ожидаемым доменом назначения.",
            lang
          ),
          evidence: [
            {
              field: `links.${shape.label}`,
              snippet: `${shape.hostname} expected ${shape.expectedDomain}`
            }
          ],
          suggestedFix: loc(
            "Align the destination domain or document why this link intentionally differs.",
            "Согласуйте домен назначения или задокументируйте причину намеренного отличия.",
            lang
          ),
          ownerSuggestion: "analytics",
          confidence: 0.92
        });
      }

      if (shape.missingUtmParams.length > 0) {
        issues.push({
          severity: "LOW",
          blocker: false,
          detectedIssue: loc(
            "A tracked link is missing required UTM parameters.",
            "В отслеживаемой ссылке отсутствуют обязательные UTM-параметры.",
            lang
          ),
          evidence: [
            {
              field: `links.${shape.label}`,
              snippet: `Missing: ${shape.missingUtmParams.join(", ")}`
            }
          ],
          suggestedFix: loc(
            "Add utm_source, utm_medium, and utm_campaign to tracked links before launch.",
            "Добавьте utm_source, utm_medium и utm_campaign ко всем отслеживаемым ссылкам перед запуском.",
            lang
          ),
          ownerSuggestion: "analytics",
          confidence: 0.94
        });
      }
    }

    const validHosts = Array.from(
      new Set(
        linkShapes
          .map((shape) => shape.hostname)
          .filter((hostname): hostname is string => Boolean(hostname))
      )
    );
    if (
      validHosts.length > 1 &&
      linkShapes.every((shape) => !shape.expectedDomain)
    ) {
      issues.push({
        severity: "MEDIUM",
        blocker: false,
        detectedIssue: loc(
          "Links point to multiple domains without expected-domain annotations.",
          "Ссылки ведут на несколько доменов без аннотаций ожидаемого домена.",
          lang
        ),
        evidence: [
          {
            field: "links",
            snippet: validHosts.slice(0, 4).join(", ")
          }
        ],
        suggestedFix: loc(
          "Add expectedDomain metadata or align destinations to the approved launch domain.",
          "Добавьте метаданные ожидаемого домена или приведите ссылки к утверждённому домену запуска.",
          lang
        ),
        ownerSuggestion: "analytics",
        confidence: 0.78
      });
    }

    return buildCheckResult("link_qa", issues, {
      passSummary: loc(
        "Links are valid, domain checks pass, and required UTM signals exist.",
        "Ссылки корректны, домены проверены, utm-параметры присутствуют.",
        lang
      ),
      issueSummary: loc(
        "Link QA found deterministic URL, domain, or tracking issues.",
        "Обнаружены проблемы с URL, доменами или utm-метками.",
        lang
      ),
      deterministicSignals: {
        links: linkShapes.map((shape) => ({
          label: shape.label,
          isValid: shape.isValid,
          scheme: shape.scheme,
          hostname: shape.hostname,
          expectedDomain: shape.expectedDomain,
          matchesExpectedDomain: shape.matchesExpectedDomain,
          requiresUtm: shape.requiresUtm,
          missingUtmParams: shape.missingUtmParams,
          error: shape.error,
          inputExcerpt: createSourceExcerpt(shape.input, { maxLength: 120 })
        }))
      }
    });
  }
};

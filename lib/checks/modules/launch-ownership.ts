import type { OwnerRole } from "../../../schemas/index";
import type { CheckModule, IssueDraft } from "../types";
import { buildCheckResult } from "../result";
import { loc } from "../i18n";

const REQUIRED_ROLES: OwnerRole[] = [
  "product",
  "crm",
  "legal",
  "risk",
  "localization",
  "analytics"
];
const BLOCKING_ROLES: OwnerRole[] = ["product", "legal", "risk"];

export const launchOwnershipCheck: CheckModule = {
  id: "launch_ownership",
  run(context) {
    const { owners } = context.bundle;
    const lang = context.language;
    const presentRoles = new Set(owners.map((owner) => owner.role));
    const missingRoles = REQUIRED_ROLES.filter((role) => !presentRoles.has(role));
    const missingBlockingRoles = missingRoles.filter((role) =>
      BLOCKING_ROLES.includes(role)
    );
    const pendingRoles = owners
      .filter((owner) => owner.status === "pending")
      .map((owner) => owner.role);
    const blockedRoles = owners
      .filter((owner) => owner.status === "blocked")
      .map((owner) => owner.role);
    const rolesWithoutDueDates = owners
      .filter((owner) => owner.status === "pending" && !owner.dueDate)
      .map((owner) => owner.role);
    const priorFailedChecks = context.priorResults
      ?.filter((result) => result.status === "FAIL")
      .map((result) => result.checkId) ?? [];
    const issues: IssueDraft[] = [];

    if (missingBlockingRoles.length > 0) {
      issues.push({
        severity: "HIGH",
        blocker: true,
        detectedIssue: loc(
          "Required launch owner roles are missing for Product, Legal, or Risk coverage.",
          "Не назначены обязательные роли: Продукт, Юридический или Risk.",
          lang
        ),
        evidence: [
          {
            field: "owners",
            snippet: `Missing: ${missingBlockingRoles.join(", ")}`
          },
          {
            field: "failedChecks",
            snippet:
              priorFailedChecks.length > 0
                ? priorFailedChecks.join(", ")
                : "No prior FAIL results supplied"
          }
        ],
        suggestedFix: loc(
          "Assign Product, Legal, and Risk owners before using the report for launch readiness.",
          "Назначьте ответственных по ролям Продукт, Юридический и Risk перед использованием отчёта.",
          lang
        ),
        ownerSuggestion: "product",
        confidence: 0.93
      });
    }

    const missingOperationalRoles = missingRoles.filter(
      (role) => !BLOCKING_ROLES.includes(role)
    );
    if (missingOperationalRoles.length > 0) {
      issues.push({
        severity: "MEDIUM",
        blocker: false,
        detectedIssue: loc(
          "Operational owner coverage is incomplete for launch handoff.",
          "Операционные роли назначены не полностью для передачи в запуск.",
          lang
        ),
        evidence: [
          {
            field: "owners",
            snippet: `Missing: ${missingOperationalRoles.join(", ")}`
          }
        ],
        suggestedFix: loc(
          "Assign missing CRM, Localization, or Analytics owners where those workstreams are in scope.",
          "Назначьте ответственных CRM, Локализация или Аналитика там, где эти направления задействованы.",
          lang
        ),
        ownerSuggestion: "product",
        confidence: 0.88
      });
    }

    if (blockedRoles.length > 0) {
      issues.push({
        severity: "HIGH",
        blocker: true,
        detectedIssue: loc(
          "One or more assigned owners are marked blocked.",
          "Один или несколько назначенных ответственных отмечены как заблокированные.",
          lang
        ),
        evidence: [
          {
            field: "owners.status",
            snippet: `Blocked: ${blockedRoles.join(", ")}`
          }
        ],
        suggestedFix: loc(
          "Resolve blocked owner statuses or document accepted risk before launch readiness.",
          "Устраните блокировки ответственных или зафиксируйте принятый риск перед проверкой готовности.",
          lang
        ),
        ownerSuggestion: "product",
        confidence: 0.91
      });
    } else if (pendingRoles.length > 0) {
      issues.push({
        severity: "LOW",
        blocker: false,
        detectedIssue: loc(
          "Some owner sign-offs are still pending and need launch tracking.",
          "Часть подтверждений ответственных ещё ожидает и требует отслеживания до запуска.",
          lang
        ),
        evidence: [
          {
            field: "owners.status",
            snippet: `Pending: ${pendingRoles.join(", ")}`
          }
        ],
        suggestedFix: loc(
          "Confirm each pending owner has a clear review due date and approval path.",
          "Убедитесь, что у каждого ожидающего ответственного есть срок и путь согласования.",
          lang
        ),
        ownerSuggestion: "product",
        confidence: 0.83
      });
    }

    if (rolesWithoutDueDates.length > 0) {
      issues.push({
        severity: "LOW",
        blocker: false,
        detectedIssue: loc(
          "Pending owner rows do not include due dates for launch follow-up.",
          "У ожидающих ответственных не указаны сроки для отслеживания до запуска.",
          lang
        ),
        evidence: [
          {
            field: "owners.dueDate",
            snippet: `Missing due dates: ${rolesWithoutDueDates.join(", ")}`
          }
        ],
        suggestedFix: loc(
          "Add due dates for pending owner sign-offs.",
          "Добавьте сроки для ожидающих подтверждений ответственных.",
          lang
        ),
        ownerSuggestion: "product",
        confidence: 0.81
      });
    }

    return buildCheckResult("launch_ownership", issues, {
      passSummary: loc(
        "Owner coverage and sign-off fields are complete.",
        "Все роли назначены, статусы подтверждения заполнены.",
        lang
      ),
      issueSummary: loc(
        "Launch ownership has missing or unresolved owner coverage.",
        "Обнаружены незаполненные или нерешённые назначения ролей.",
        lang
      ),
      deterministicSignals: {
        presentRoles: Array.from(presentRoles),
        missingRoles,
        pendingRoles,
        blockedRoles,
        rolesWithoutDueDates,
        priorFailedChecks
      }
    });
  }
};

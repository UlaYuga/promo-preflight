# Schemas

Zod schemas define the product contracts for Promo Preflight. Runtime validation is used at boundaries so fixtures, YAML artifacts, saved browser data, exports, and generated reports stay aligned with the TypeScript types.

## Files

- `index.ts` - campaign bundle, check result, risk report, readiness, owner, dependency, and export payload schemas.
- `rules.ts` - `rules/rules.yaml` artifact schema, including the 8 base checks and 15 domain rules.
- `owners.ts` - workspace owner override and owner-resolution schemas.
- `versioning.ts` - local campaign, version, extracted facts, blocker, and version diff schemas.
- `fixtures.ts` - default synthetic campaign bundle used by fallback reports.
- `worked-examples.ts` - EX01-EX11 synthetic campaign bundles used by examples and regression checks.
- `schema-check.mjs` - smoke test for the main schema contracts.

## Validation

```bash
npm run schema:check
npm run rules:check
npm run owners:check
npm run checks:run
npm run versioning:check
```

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

function readLocale(language: 'en' | 'ru'): Record<string, unknown> {
  return JSON.parse(readSource(`locales/${language}.json`)) as Record<string, unknown>;
}

function valueAt(object: Record<string, unknown>, ...path: string[]): unknown {
  let value: unknown = object;
  for (const key of path) {
    if (!value || typeof value !== 'object') {
      return undefined;
    }
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}

describe('client UI protected API boundary', () => {
  it('does not anonymously fetch or link to protected telemetry and audit endpoints', () => {
    const statusSource = readSource('components/system-status.tsx');
    const evidenceSource = readSource('components/evidence-page.tsx');

    expect(statusSource).not.toContain('fetch("/api/v1/stats"');
    expect(statusSource).not.toContain('fetch(AUDIT_JSON_URL');
    expect(statusSource).not.toContain('AUDIT_JSON_URL');
    expect(statusSource).not.toContain('href="/api/v1/audit');
    expect(statusSource).not.toContain('href="/api/v1/stats');
    expect(statusSource).toContain('fetch("/api/health"');
    expect(statusSource).toContain('fetch("/api/ready"');
    expect(statusSource).not.toContain('process.env.PREFLIGHT_API_KEY');
    expect(evidenceSource).toContain('["180", "evidence.summary.tests"]');
    expect(evidenceSource).not.toContain('["164", "evidence.summary.tests"]');
  });

  it('documents bearer auth in the copied curl without anonymous audit navigation', () => {
    const contractSource = readSource('components/api-contract-page.tsx');

    expect(contractSource).toContain('-H "Authorization: Bearer $PREFLIGHT_API_KEY"');
    expect(contractSource).not.toContain('href="/api/v1/audit');
    expect(contractSource).not.toContain('href="/api/v1/stats');
    expect(contractSource).not.toContain('process.env.PREFLIGHT_API_KEY');
  });

  it.each(['en', 'ru'] as const)(
    'provides %s copy describing protected v1 endpoints and public probes',
    (language) => {
      const dictionary = readLocale(language);

      expect(valueAt(dictionary, 'apiContract', 'auth', 'protected')).toEqual(
        expect.any(String)
      );
      expect(valueAt(dictionary, 'apiContract', 'auth', 'public')).toEqual(
        expect.any(String)
      );
      expect(valueAt(dictionary, 'systemStatus', 'metrics', 'protected')).toEqual(
        expect.any(String)
      );
      expect(valueAt(dictionary, 'systemStatus', 'feed', 'protected')).toEqual(
        expect.any(String)
      );
      expect(JSON.stringify(dictionary)).not.toContain('164');
      expect(JSON.stringify(dictionary)).toContain(
        language === 'en' ? '180 tests' : '180 тестов'
      );
      expect(JSON.stringify(dictionary)).toContain(
        language === 'en' ? '27 files' : '27 файлах'
      );
    }
  );
});

describe('accessibility presentation guarantees', () => {
  it('caps Russian display and label tracking through centralized language-aware CSS', () => {
    const styles = readSource('app/globals.css');
    const tourSource = readSource('components/tour-provider.tsx');

    expect(styles).toContain('html[lang="ru"] .display');
    expect(styles).toContain('html[lang="ru"] .tracking-tight,');
    expect(styles).toContain('html[lang="ru"] .tracking-tightest');
    expect(styles).toContain('html[lang="ru"] .tracking-tighter2');
    expect(styles).toContain('html[lang="ru"] .font-mono.uppercase');
    expect(styles).toMatch(
      /html\[lang="ru"\] \.display[\s\S]*?letter-spacing: -0\.01em;/
    );
    expect(styles).toMatch(
      /html\[lang="ru"\] \.font-mono\.uppercase[\s\S]*?letter-spacing: 0\.08em;/
    );
    expect(tourSource).toContain('html[lang="ru"] .driver-popover::before');
  });

  it('stops decorative and incidental motion when reduced motion is requested', () => {
    const styles = readSource('app/globals.css');
    const backgroundSource = readSource('components/background-wave.tsx');
    const welcomeSource = readSource('components/welcome-screen.tsx');

    expect(styles).toContain('@media (prefers-reduced-motion: reduce)');
    expect(styles).toMatch(/\.motion-decorative[\s\S]*?animation: none !important;/);
    expect(styles).toContain('transition-duration: 0.001ms !important;');
    expect(backgroundSource).toContain('motion-decorative');
    expect(welcomeSource).toContain('motion-decorative');
  });
});

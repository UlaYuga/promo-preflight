import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('locale selection surface', () => {
  it('uses the header toggle without retaining an unreachable gate', () => {
    const providerSource = readSource('lib/i18n/index.tsx');
    const validatorSource = readSource('lib/i18n/check.mjs');

    expect(providerSource).toContain('export function LanguageToggle');
    expect(providerSource).not.toContain('languageSelected');
    expect(providerSource).not.toContain('LanguageGate');
    expect(validatorSource).not.toContain('"languageGate"');
  });
});

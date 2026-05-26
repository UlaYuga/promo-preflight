import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

function readPalette(language: 'en' | 'ru'): {
  placeholder: string;
  actions: Record<string, string>;
  footer: { stats: string };
} {
  const dictionary = JSON.parse(readSource(`locales/${language}.json`)) as {
    palette: {
      placeholder: string;
      actions: Record<string, string>;
      footer: { stats: string };
    };
  };
  return dictionary.palette;
}

describe('command palette supported behavior', () => {
  it('does not advertise commands that have no implementation', () => {
    const source = readSource('components/command-palette.tsx');
    const en = readPalette('en');
    const ru = readPalette('ru');

    expect(source).toContain('palette.actions.openIntake');
    expect(source).not.toContain('palette.actions.run');
    expect(source).not.toContain('palette.actions.save');
    expect(source).not.toContain('palette.actions.exportMd');
    expect(source).not.toContain('palette.actions.exportSlack');
    expect(source).not.toContain('WORKED_EXAMPLES');
    expect(en.actions).toEqual({ openIntake: 'Open campaign bundle' });
    expect(ru.actions).toEqual({ openIntake: 'Открыть пакет кампании' });
    expect(en.placeholder).toBe('Search or jump');
    expect(ru.placeholder).toBe('Найти или перейти');
    expect(en.footer.stats).toContain('207 tests');
    expect(ru.footer.stats).toContain('207 тестов');
  });

  it('uses the defined footer translations', () => {
    const source = readSource('components/command-palette.tsx');

    expect(source).toContain('palette.footer.move');
    expect(source).toContain('palette.footer.open');
    expect(source).toContain('palette.footer.stats');
    expect(source).not.toContain('t("palette.move"');
    expect(source).not.toContain('t("palette.open"');
    expect(source).not.toContain('t("palette.stats"');
  });

  it('uses localized check labels', () => {
    const source = readSource('components/command-palette.tsx');

    expect(source).toContain('language === "ru" ? c.nameRu : c.nameEn');
  });
});

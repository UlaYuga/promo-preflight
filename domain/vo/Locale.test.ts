import { describe, expect, it } from 'vitest';
import { BadRequestException } from '../exception/PreflightException';
import { locale } from './Locale';

describe('locale', () => {
  it('accepts en', () => {
    expect(locale('en')).toBe('en');
  });

  it('accepts ru', () => {
    expect(locale('ru')).toBe('ru');
  });

  it('accepts supported regional locale codes', () => {
    expect(locale('en-US')).toBe('en-US');
  });

  it('trims whitespace before validation', () => {
    expect(locale('  ru-RU  ')).toBe('ru-RU');
  });

  it('throws for unsupported locale', () => {
    expect(() => locale('jp')).toThrow(BadRequestException);
  });

  it('throws for empty string', () => {
    expect(() => locale('')).toThrow(BadRequestException);
  });

  it('is case-sensitive with current behavior', () => {
    expect(() => locale('EN')).toThrow(BadRequestException);
  });
});

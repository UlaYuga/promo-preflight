import { BadRequestException } from '../exception/PreflightException';

const ALLOWED_LOCALES = [
  'en', 'en-GB', 'en-US', 'en-CA', 'en-AU',
  'ru', 'ru-RU',
  'de', 'de-DE', 'de-AT',
  'es', 'es-ES', 'es-MX', 'es-AR', 'es-CO',
  'pt', 'pt-BR', 'pt-PT',
  'fr', 'fr-FR',
  'it', 'it-IT',
  'pl', 'pl-PL',
  'tr', 'tr-TR',
  'ko', 'ko-KR',
  'hi', 'hi-IN',
  'ms', 'ms-MY',
  'yo', 'ha', 'ig',
  'zh', 'zh-CN', 'zh-TW',
] as const;

export type LocaleCode = (typeof ALLOWED_LOCALES)[number];
export type Locale = string & { readonly __brand: 'Locale' };

export function locale(raw: string): Locale {
  const normalized = raw.trim();
  if (!(ALLOWED_LOCALES as readonly string[]).includes(normalized)) {
    throw new BadRequestException(
      `Unsupported locale "${normalized}". Allowed: ${ALLOWED_LOCALES.join(', ')}`
    );
  }
  return normalized as Locale;
}

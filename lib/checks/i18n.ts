export function loc(en: string, ru: string, language?: string): string {
  return language === "ru" ? ru : en;
}

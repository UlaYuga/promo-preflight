"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import en from "@/locales/en.json";
import ru from "@/locales/ru.json";

export const LANGUAGE_STORAGE_KEY = "promo-preflight:language";
export const languages = ["en", "ru"] as const;

export type Language = (typeof languages)[number];
type Dictionary = typeof en;
type Primitive = string | number | boolean | null;
type LeafPaths<T, Prefix extends string = ""> = T extends Primitive
  ? Prefix
  : T extends Array<infer Item>
    ? LeafPaths<Item, `${Prefix}.${number}`>
    : {
        [K in keyof T & string]: LeafPaths<
          T[K],
          Prefix extends "" ? K : `${Prefix}.${K}`
        >;
      }[keyof T & string];

export type TranslationKey = LeafPaths<Dictionary>;

type I18nContextValue = {
  language: Language;
  languageSelected: boolean;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
  get: <T = unknown>(key: string) => T | undefined;
};

const dictionaries: Record<Language, Dictionary> = { en, ru };
const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [language, setLanguageState] = useState<Language>("en");
  const [languageSelected, setLanguageSelected] = useState(true);

  useEffect(() => {
    window.setTimeout(() => {
      const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (isLanguage(stored)) {
        setLanguageState(stored);
        setLanguageSelected(true);
        document.documentElement.lang = stored;
      }
    }, 0);
  }, []);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    setLanguageSelected(true);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    document.documentElement.lang = nextLanguage;
  }, []);

  const get = useCallback(
    <T = unknown,>(key: string): T | undefined => {
      const localized = getByPath(dictionaries[language], key);
      const fallback = getByPath(dictionaries.en, key);
      return (localized ?? fallback) as T | undefined;
    },
    [language]
  );

  const t = useCallback(
    (key: TranslationKey, values?: Record<string, string | number>) => {
      const value = get<string>(key);
      return interpolate(typeof value === "string" ? value : key, values);
    },
    [get]
  );

  const value = useMemo(
    () => ({ language, languageSelected, setLanguage, t, get }),
    [get, language, languageSelected, setLanguage, t]
  );

  return (
    <I18nContext.Provider value={value}>
      {children}
      <LanguageGate />
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return value;
}

export function LanguageToggle({ className }: { className?: string }) {
  const { language, setLanguage, t } = useI18n();

  return (
    <div
      className={["inline-flex items-center gap-px overflow-hidden rounded-sm border border-edge bg-char text-xs font-semibold text-dim", className].filter(Boolean).join(" ")}
      aria-label={t("languageToggle.label")}
    >
      {languages.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setLanguage(item)}
          aria-pressed={language === item}
          className={
            language === item
              ? "bg-accent px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-ink font-semibold"
              : "px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-dim transition hover:bg-graph hover:text-text"
          }
        >
          {t(`languageToggle.${item}` as TranslationKey)}
        </button>
      ))}
    </div>
  );
}

function LanguageGate() {
  const { languageSelected, setLanguage, t } = useI18n();

  if (languageSelected) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1000000001] flex items-center justify-center bg-[#070708]/95 px-4 backdrop-blur-sm">
      <section className="w-full max-w-[440px] overflow-hidden rounded-sm border border-[#1d1d23] bg-[#0d0d0f] text-center shadow-2xl shadow-black/60">
        <div className="px-8 pb-8 pt-10">
          <div className="mb-6 inline-flex items-center gap-2">
            <span className="block h-2 w-2 rounded-full bg-[#c5ff3d] shadow-[0_0_28px_rgba(197,255,61,0.32)]" />
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#5a5a62]">
              Promo Preflight
            </span>
          </div>
          <h2 className="text-[32px] font-medium leading-tight tracking-tight text-[#ededee]">
            {t("languageGate.title")}
          </h2>
        <p className="mt-3 text-[13.5px] leading-[1.55] text-[#9a9aa1]">
          {t("languageGate.subtitle")}
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setLanguage("en")}
            className="rounded-sm border border-[#1d1d23] px-4 py-4 text-left transition hover:border-[#c5ff3d]/60 hover:bg-[#15151a]/60"
          >
            <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.22em] text-[#5a5a62]">
              EN
            </span>
            <span className="text-[18px] font-medium tracking-tight text-[#ededee]">
              {t("languageGate.english")}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setLanguage("ru")}
            className="rounded-sm border border-[#1d1d23] px-4 py-4 text-left transition hover:border-[#c5ff3d]/60 hover:bg-[#15151a]/60"
          >
            <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.22em] text-[#5a5a62]">
              RU
            </span>
            <span className="text-[18px] font-medium tracking-tight text-[#ededee]">
              {t("languageGate.russian")}
            </span>
          </button>
        </div>
        <p className="mt-5 text-[11px] text-[#5a5a62]">{t("languageGate.note")}</p>
        </div>
      </section>
    </div>
  );
}

function isLanguage(value: string | null): value is Language {
  return value === "en" || value === "ru";
}

function getByPath(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (Array.isArray(current)) {
      const index = Number(segment);
      return Number.isInteger(index) ? current[index] : undefined;
    }
    if (current && typeof current === "object" && segment in current) {
      return (current as Record<string, unknown>)[segment];
    }
    return undefined;
  }, source);
}

function interpolate(value: string, values?: Record<string, string | number>) {
  if (!values) {
    return value;
  }

  return value.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) =>
    values[key] === undefined ? match : String(values[key])
  );
}

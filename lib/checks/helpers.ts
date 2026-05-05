import type { LinkAsset, PromoAsset } from "../../schemas/index";

export type SourceExcerptOptions = {
  maxLength?: number;
  query?: string;
};

export type UrlShape = {
  label: string;
  input: string;
  isValid: boolean;
  scheme?: string;
  hostname?: string;
  expectedDomain?: string;
  matchesExpectedDomain?: boolean;
  requiresUtm: boolean;
  missingUtmParams: string[];
  error?: string;
};

export type NumericSignals = {
  numbers: number[];
  currencyAmounts: Array<{
    amount: number;
    currency?: string;
    raw: string;
  }>;
  percentages: number[];
  multipliers: number[];
};

const REQUIRED_UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign"];
const CURRENCY_SYMBOLS = {
  "€": "EUR",
  "$": "USD",
  "£": "GBP",
  "R$": "BRL"
} as const;

export function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function getCharacterCount(value: string) {
  return Array.from(value).length;
}

export function createSourceExcerpt(
  source: string,
  options: SourceExcerptOptions = {}
) {
  const maxLength = options.maxLength ?? 120;
  const normalized = normalizeWhitespace(source);

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const query = options.query ? normalizeWhitespace(options.query) : "";
  const queryIndex = query
    ? normalized.toLowerCase().indexOf(query.toLowerCase())
    : -1;

  if (queryIndex < 0) {
    return `${normalized.slice(0, maxLength - 1).trim()}…`;
  }

  const halfWindow = Math.floor(maxLength / 2);
  const start = Math.max(0, queryIndex - halfWindow);
  const end = Math.min(normalized.length, start + maxLength);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < normalized.length ? "…" : "";

  return `${prefix}${normalized.slice(start, end).trim()}${suffix}`;
}

export function createKeywordExcerpt(
  source: string,
  keywords: ReadonlyArray<string | RegExp>,
  maxLength = 120
) {
  const normalized = normalizeWhitespace(source);
  const matchedKeyword = keywords.find((keyword) => {
    if (typeof keyword === "string") {
      return normalized.toLowerCase().includes(keyword.toLowerCase());
    }

    return keyword.test(normalized);
  });

  if (!matchedKeyword) {
    return createSourceExcerpt(normalized, { maxLength });
  }

  return createSourceExcerpt(normalized, {
    maxLength,
    query: typeof matchedKeyword === "string" ? matchedKeyword : undefined
  });
}

export function includesAny(source: string, keywords: ReadonlyArray<string | RegExp>) {
  return keywords.some((keyword) => {
    if (typeof keyword === "string") {
      return source.toLowerCase().includes(keyword.toLowerCase());
    }

    return keyword.test(source);
  });
}

export function analyzeUrlShape(link: LinkAsset): UrlShape {
  try {
    const url = new URL(link.url);
    const scheme = url.protocol.replace(":", "");
    const isHttp = scheme === "http" || scheme === "https";
    const missingUtmParams = link.requiresUtm
      ? REQUIRED_UTM_PARAMS.filter((param) => !url.searchParams.get(param))
      : [];
    const expectedDomain = link.expectedDomain?.toLowerCase();
    const hostname = url.hostname.toLowerCase();
    const matchesExpectedDomain = expectedDomain
      ? hostname === expectedDomain || hostname.endsWith(`.${expectedDomain}`)
      : undefined;

    return {
      label: link.label,
      input: link.url,
      isValid: isHttp,
      scheme,
      hostname,
      expectedDomain,
      matchesExpectedDomain,
      requiresUtm: link.requiresUtm,
      missingUtmParams,
      error: isHttp ? undefined : "Only http and https URLs are allowed."
    };
  } catch {
    return {
      label: link.label,
      input: link.url,
      isValid: false,
      expectedDomain: link.expectedDomain,
      requiresUtm: link.requiresUtm,
      missingUtmParams: link.requiresUtm ? REQUIRED_UTM_PARAMS : [],
      error: "URL could not be parsed."
    };
  }
}

export function extractNumericSignals(text: string): NumericSignals {
  const normalized = normalizeWhitespace(text);
  const numberMatches = normalized.matchAll(/(?<![\w.])-?\d+(?:[.,]\d+)?/g);
  const percentageMatches = normalized.matchAll(
    /(?<![\w.])-?\d+(?:[.,]\d+)?\s*%/g
  );
  const multiplierMatches = normalized.matchAll(
    /(?<![\w.])-?\d+(?:[.,]\d+)?\s*x\b/gi
  );
  const currencyMatches = normalized.matchAll(
    /(?:\b([A-Z]{3})\s*)?(\d+(?:[.,]\d+)?)(?:\s*([A-Z]{3}))?/g
  );
  const symbolCurrencyMatches = normalized.matchAll(
    /(R\$|€|\$|£)\s*(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*(R\$|€|\$|£)/g
  );

  return {
    numbers: Array.from(numberMatches, ([raw]) => parseLooseNumber(raw)),
    currencyAmounts: [
      ...Array.from(currencyMatches, ([raw, prefix, amount, suffix]) => ({
        amount: parseLooseNumber(amount),
        currency: prefix ?? suffix,
        raw
      })).filter((signal) => Boolean(signal.currency)),
      ...Array.from(
        symbolCurrencyMatches,
        ([raw, prefixSymbol, prefixAmount, suffixAmount, suffixSymbol]) => {
          const symbol = (prefixSymbol ?? suffixSymbol) as
            | keyof typeof CURRENCY_SYMBOLS
            | undefined;
          const amount = prefixAmount ?? suffixAmount;

          return {
            amount: parseLooseNumber(amount),
            currency: symbol ? CURRENCY_SYMBOLS[symbol] : undefined,
            raw
          };
        }
      ).filter((signal) => Boolean(signal.currency))
    ],
    percentages: Array.from(percentageMatches, ([raw]) =>
      parseLooseNumber(raw.replace("%", ""))
    ),
    multipliers: Array.from(multiplierMatches, ([raw]) =>
      parseLooseNumber(raw.replace(/x/gi, ""))
    )
  };
}

export function getAssetField(asset: PromoAsset) {
  return `${asset.channel}.${asset.fieldName}`;
}

export function extractDateLikeSignals(text: string) {
  const normalized = normalizeWhitespace(text);
  const numericDates = Array.from(
    normalized.matchAll(/\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/g),
    ([raw]) => raw
  );
  const namedDates = Array.from(
    normalized.matchAll(
      /\b\d{1,2}\s+(?:Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|Sept|September|Oct|October|Nov|November|Dec|December)\b/gi
    ),
    ([raw]) => raw
  );

  return [...numericDates, ...namedDates];
}

function parseLooseNumber(value: string) {
  return Number(value.replace(",", ".").replace(/[^\d.-]/g, ""));
}

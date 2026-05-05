import type { OwnerRole, PromoAsset } from "../../../schemas/index";
import {
  createKeywordExcerpt,
  createSourceExcerpt,
  getAssetField,
  includesAny,
  normalizeWhitespace
} from "../helpers";

export function combinedSource(termsText: string, assets: PromoAsset[]) {
  return [termsText, ...assets.map((asset) => asset.text)].join(" ");
}

export function evidenceFromAsset(
  asset: PromoAsset,
  keywords: Array<string | RegExp>,
  maxLength = 100
) {
  return {
    field: getAssetField(asset),
    snippet: createKeywordExcerpt(asset.text, keywords, maxLength)
  };
}

export function firstAssetMatching(
  assets: PromoAsset[],
  keywords: Array<string | RegExp>
) {
  return assets.find((asset) => includesAny(asset.text, keywords));
}

export function shortValue(value: string | number) {
  return createSourceExcerpt(String(value), { maxLength: 100 });
}

export function containsText(value: string | undefined) {
  return Boolean(value && normalizeWhitespace(value).length > 0);
}

export function issueOwnerForRole(role: OwnerRole) {
  return role;
}

import type { PromoAsset } from "../../../schemas/index";
import {
  includesAny,
} from "../helpers";

export function combinedSource(termsText: string, assets: PromoAsset[]) {
  return [termsText, ...assets.map((asset) => asset.text)].join(" ");
}

export function firstAssetMatching(
  assets: PromoAsset[],
  keywords: Array<string | RegExp>
) {
  return assets.find((asset) => includesAny(asset.text, keywords));
}

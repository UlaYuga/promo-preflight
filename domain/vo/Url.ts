import { BadRequestException } from '../exception/PreflightException';

export type Url = string & { readonly __brand: 'Url' };

export function url(raw: string): Url {
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new BadRequestException(`URL must use http or https: ${raw}`);
    }
    return raw as Url;
  } catch (e) {
    if (e instanceof BadRequestException) throw e;
    throw new BadRequestException(`Invalid URL: ${raw}`);
  }
}

import { InvalidAmountException } from '../exception/PreflightException';

export type Amount = number & { readonly __brand: 'Amount' };

export function amount(n: number): Amount {
  if (!Number.isFinite(n) || n < 0) {
    throw new InvalidAmountException(`Invalid amount: ${n}`);
  }
  return n as Amount;
}

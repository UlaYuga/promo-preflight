import { describe, expect, it } from 'vitest';
import { InvalidAmountException } from '../exception/PreflightException';
import { amount } from './Amount';

describe('amount', () => {
  it('accepts 0', () => {
    expect(amount(0)).toBe(0);
  });

  it('accepts positive integers', () => {
    expect(amount(100)).toBe(100);
  });

  it('accepts positive decimals', () => {
    expect(amount(42.5)).toBe(42.5);
  });

  it('accepts -0 as a valid amount', () => {
    expect(() => amount(-0)).not.toThrow();
    expect(amount(-0) === 0).toBe(true);
  });

  it('throws for negative numbers', () => {
    expect(() => amount(-1)).toThrow(InvalidAmountException);
  });

  it('throws for NaN', () => {
    expect(() => amount(Number.NaN)).toThrow(InvalidAmountException);
  });

  it('throws for Infinity', () => {
    expect(() => amount(Number.POSITIVE_INFINITY)).toThrow(InvalidAmountException);
  });

  it('throws for -Infinity', () => {
    expect(() => amount(Number.NEGATIVE_INFINITY)).toThrow(InvalidAmountException);
  });
});

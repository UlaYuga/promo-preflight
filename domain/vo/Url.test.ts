import { describe, expect, it } from 'vitest';
import { BadRequestException } from '../exception/PreflightException';
import { url } from './Url';

describe('url', () => {
  it('accepts https URLs', () => {
    expect(url('https://example.com')).toBe('https://example.com');
  });

  it('accepts http URLs', () => {
    expect(url('http://example.com')).toBe('http://example.com');
  });

  it('accepts URLs with path, query, and hash', () => {
    expect(url('https://example.com/path?q=1#h')).toBe('https://example.com/path?q=1#h');
  });

  it('accepts localhost URLs over http', () => {
    expect(url('http://localhost:3000/health')).toBe('http://localhost:3000/health');
  });

  it('throws for non-URL strings', () => {
    expect(() => url('not-a-url')).toThrow(BadRequestException);
  });

  it('throws for javascript protocol', () => {
    expect(() => url('javascript:alert(1)')).toThrow(BadRequestException);
  });

  it('throws for mailto protocol', () => {
    expect(() => url('mailto:x@y.z')).toThrow(BadRequestException);
  });

  it('throws for ftp protocol', () => {
    expect(() => url('ftp://example.com')).toThrow(BadRequestException);
  });

  it('throws for empty string', () => {
    expect(() => url('')).toThrow(BadRequestException);
  });
});

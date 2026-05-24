import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '@domain': resolve(__dirname, './domain'),
      '@app': resolve(__dirname, './application'),
      '@infra': resolve(__dirname, './infrastructure'),
      '@api': resolve(__dirname, './api'),
    },
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: [
      '**/node_modules/**',
      '.next/**',
      '.claude/**',
      '.codex/**',
      '.opencode/**',
    ],
  },
});

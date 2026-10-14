// @ts-check
import { defineConfig } from 'eslint/config';
import eslintPluginAstro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: ['dist/', '.astro/', 'node_modules/', 'public/admin/vendor/', 'test-results/', 'playwright-report/'],
  },
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    // The dashboard bootstrap is plain browser JavaScript (no build step).
    files: ['public/admin/**/*.js'],
    languageOptions: {
      sourceType: 'script',
      globals: { window: 'readonly', document: 'readonly', fetch: 'readonly', console: 'readonly' },
    },
  },
);

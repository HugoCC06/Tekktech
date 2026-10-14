/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

// getViteConfig lets unit tests import modules that use Astro's virtual modules
// (e.g. src/content.config.ts imports `astro:content`).
export default getViteConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});

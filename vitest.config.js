import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use 'node' environment for unit/property tests on pure JS functions.
    // Switch to 'jsdom' (requires installing jsdom) when DOM testing is needed.
    environment: 'node',
    globals: true,
  },
});

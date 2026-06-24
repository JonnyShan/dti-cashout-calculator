import { defineConfig } from 'vitest/config';

// Pure-logic tests (src/lib/*.test.ts) — no React/Tailwind plugins needed,
// which also avoids the dual-Vite type clash between vite and vitest's bundled
// copy. Vitest prefers this file over vite.config.ts when both are present.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});

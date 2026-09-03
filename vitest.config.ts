import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Solo los tests del código fuente; nunca los compilados en dist/.
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
  },
});

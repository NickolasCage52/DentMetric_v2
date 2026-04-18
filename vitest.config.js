import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: [
      'src/**/*.spec.js',
      'src/**/*.test.js',
      'tests/**/*.spec.js',
      'tests/**/*.test.js',
      'tests/**/*.spec.ts',
      'tests/**/*.test.ts',
    ],
  },
});

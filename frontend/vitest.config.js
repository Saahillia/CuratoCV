/**
 * Developer context for frontend/vitest.config.js.
 * Purpose: explain the responsibility of vitest.config in its current module boundary.
 * Why here: keep the concern with its canonical owner and avoid duplicating behavior in callers.
 */
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitest.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  },
})

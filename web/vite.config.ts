/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The React SPA. Question banks are synced into public/data before dev and build
// (see scripts/sync-data.mjs), so the app fetches them as static assets exactly
// as it will in production behind CloudFront.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});

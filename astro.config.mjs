import { defineConfig } from 'astro/config';

// https://astro.build/config — PLAN.md §2/§8
export default defineConfig({
  site: 'https://buct.one',
  output: 'static',
  build: { inlineStylesheets: 'auto' },
  server: { port: 4321, host: true },
});

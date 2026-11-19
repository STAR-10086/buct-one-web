import { defineConfig } from 'astro/config';

// https://astro.build/config — PLAN.md §2/§8
export default defineConfig({
  site: 'https://www.buctone.cc.cd',
  output: 'static',
  build: { inlineStylesheets: 'auto' },
  server: { port: 4321, host: true },
});

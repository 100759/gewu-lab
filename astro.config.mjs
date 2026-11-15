// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://gewu.edgeone.app',
  output: 'static',
  build: {
    inlineStylesheets: 'auto'
  },
  vite: {
    build: {
      // 课件是静态资源，不参与打包
      assetsInlineLimit: 4096
    }
  }
});

import { defineConfig } from 'vite';

export default defineConfig({
  base: '/html-presen-template/',
  server: {
    open: true,
  },
  build: {
    target: 'es2022',
  },
});

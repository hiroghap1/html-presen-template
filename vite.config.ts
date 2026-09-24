import { defineConfig } from 'vite';

// ビルドごとに変わる ID。デッキ内の画像 URL や sw.js の登録 URL に付与し、
// 配信のたびにブラウザ / Service Worker のキャッシュを確実に更新させる。
const buildId = Date.now().toString(36);

export default defineConfig({
  base: '/html-presen-template/',
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
  },
  server: {
    open: true,
  },
  build: {
    target: 'es2022',
  },
});

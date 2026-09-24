// Service Worker for offline support
//
// 方針:
//   - index.html / decks / themes など可変ファイル: network-first
//       常にサーバーへ更新確認（cache: 'no-cache'）し、成功したらキャッシュを更新。
//       オフライン時のみキャッシュから返す。→ 更新が反映されない問題を起こさない。
//   - assets/（ハッシュ付きバンドル）: cache-first（内容が変わればファイル名も変わる）
//   - 他オリジン・Range リクエスト（動画）・GET 以外: 介入しない
//
// 登録 URL の ?v=<ビルドID> をキャッシュ名に使い、配信ごとに古いキャッシュを全削除する。

const BASE = new URL(self.registration.scope).pathname; // 例: '/html-presen-template/'
const VERSION = new URL(self.location.href).searchParams.get('v') || 'dev';
const CACHE_NAME = `slide-presenter-${VERSION}`;

const PRECACHE = [BASE, `${BASE}favicon.svg`];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        PRECACHE.map((url) =>
          fetch(url, { cache: 'no-cache', credentials: 'same-origin' })
            .then((res) => { if (res.ok) return cache.put(url, res); })
            .catch(() => {}),
        ),
      ),
    ),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (request.headers.has('range')) return; // 動画などの部分取得はそのまま通す

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(BASE)) return;

  const rel = url.pathname.slice(BASE.length);
  if (rel.startsWith('assets/')) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(networkFirst(request));
  }
});

// キャッシュキーはクエリを除いた URL（?v=ビルドID や ?deck=... で件数が増えないように）
function cacheKey(request) {
  const url = new URL(request.url);
  url.search = '';
  url.hash = '';
  return url.href;
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const key = cacheKey(request);
  const isNavigation = request.mode === 'navigate';
  try {
    const response = await fetch(request.url, {
      cache: 'no-cache',
      credentials: 'same-origin',
      // ナビゲーションはリダイレクトを追わない（追った応答を返すとブラウザに拒否される）
      redirect: isNavigation ? 'manual' : 'follow',
    });
    if (response.ok && response.status === 200 && response.type === 'basic') {
      cache.put(key, response.clone()).catch(() => {});
    }
    return response;
  } catch (err) {
    const cached = await cache.match(key, { ignoreSearch: true });
    if (cached) return cached;
    if (isNavigation) {
      const shell = await cache.match(BASE);
      if (shell) return shell;
    }
    throw err;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.status === 200 && response.type === 'basic') {
    cache.put(request, response.clone()).catch(() => {});
  }
  return response;
}

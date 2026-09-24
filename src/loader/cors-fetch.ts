/**
 * Fetch with CORS proxy fallback.
 * 1. Try direct fetch
 * 2. If CORS error, retry through proxy
 */

const PROXY_URL_KEY = 'slide-cors-proxy';
const DEFAULT_PROXY = 'https://slide-cors-proxy.frosty-shape-ec3a.workers.dev/?url=';

function getProxyUrl(): string {
  return localStorage.getItem(PROXY_URL_KEY) || DEFAULT_PROXY;
}

function isCrossOrigin(url: string): boolean {
  try {
    const parsed = new URL(url, location.href);
    return parsed.origin !== location.origin;
  } catch {
    return false;
  }
}

export async function corsFetch(url: string): Promise<Response> {
  // Same-origin or relative paths: always direct.
  // cache: 'no-cache' — 常にサーバーへ更新確認する（未変更なら 304 で軽い）。
  // GitHub Pages などは max-age=600 を返すため、これがないと更新後も
  // 最大 10 分間は古いデッキが表示される。
  if (!isCrossOrigin(url)) {
    return fetch(url, { cache: 'no-cache' });
  }

  // Cross-origin: try direct first
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    return res;
  } catch {
    // Network/CORS error: retry through proxy
    const proxy = getProxyUrl();
    const proxiedUrl = `${proxy}${encodeURIComponent(url)}`;
    const res = await fetch(proxiedUrl);
    if (!res.ok) {
      throw new Error(`Failed to load via proxy: ${url} (${res.status})`);
    }
    return res;
  }
}

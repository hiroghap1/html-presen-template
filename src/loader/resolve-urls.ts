/**
 * Resolve relative asset URLs inside a parsed deck document against the deck's
 * own URL. This lets authors write `![](image.png)` next to the deck file and
 * have it load correctly regardless of where the app itself is served from.
 *
 * Absolute URLs (scheme, protocol-relative, absolute path, data/blob, fragment)
 * are left untouched.
 */

function isAbsolute(url: string): boolean {
  if (!url) return true;
  if (url.startsWith('#')) return true;
  if (url.startsWith('/')) return true;
  if (url.startsWith('data:') || url.startsWith('blob:')) return true;
  return /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(url) || /^[a-z][a-z0-9+.-]*:/i.test(url);
}

function resolve(src: string, base: string): string {
  if (isAbsolute(src)) return src;
  try {
    return new URL(src, base).href;
  } catch {
    return src;
  }
}

function rewriteSrcSet(srcset: string, base: string): string {
  return srcset
    .split(',')
    .map((part) => {
      const trimmed = part.trim();
      if (!trimmed) return '';
      const [url, ...rest] = trimmed.split(/\s+/);
      return [resolve(url, base), ...rest].join(' ');
    })
    .filter(Boolean)
    .join(', ');
}

function rewriteStyleUrls(style: string, base: string): string {
  return style.replace(
    /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi,
    (_m, quote, url) => `url(${quote}${resolve(url, base)}${quote})`,
  );
}

export function rewriteRelativeUrls(root: ParentNode, baseUrl: string): void {
  root.querySelectorAll('img[src], source[src], video[src], audio[src], video[poster]').forEach((el) => {
    const attrs = ['src', 'poster'];
    for (const attr of attrs) {
      const v = el.getAttribute(attr);
      if (v) el.setAttribute(attr, resolve(v, baseUrl));
    }
  });

  root.querySelectorAll('img[srcset], source[srcset]').forEach((el) => {
    const v = el.getAttribute('srcset');
    if (v) el.setAttribute('srcset', rewriteSrcSet(v, baseUrl));
  });

  root.querySelectorAll<HTMLElement>('[style*="url("]').forEach((el) => {
    const v = el.getAttribute('style');
    if (v) el.setAttribute('style', rewriteStyleUrls(v, baseUrl));
  });
}

export function rewriteCssUrls(css: string, baseUrl: string): string {
  return rewriteStyleUrls(css, baseUrl);
}

import type { Deck, Slide } from '../types';
import { countFragments } from '../engine/fragment';
import { corsFetch } from './cors-fetch';
import { rewriteRelativeUrls, rewriteCssUrls } from './resolve-urls';

export async function loadHtmlDeck(path: string): Promise<Deck> {
  const res = await corsFetch(path);
  if (!res.ok) throw new Error(`Failed to load deck: ${path} (${res.status})`);
  const html = await res.text();
  const baseUrl = new URL(path, location.href).href;
  return parseHtmlText(html, baseUrl);
}

export function parseHtmlText(html: string, baseUrl?: string): Deck {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  if (baseUrl) rewriteRelativeUrls(doc, baseUrl);

  const root = doc.querySelector('[data-slide-deck]');
  if (!root) {
    throw new Error('No element with [data-slide-deck] found in HTML deck');
  }

  const sections = root.querySelectorAll(':scope > section');
  const slides: Slide[] = [];

  sections.forEach((section) => {
    slides.push({
      html: section.outerHTML,
      fragmentCount: countFragments(section),
    });
  });

  const styleEls = doc.querySelectorAll('style');
  let css = '';
  styleEls.forEach((s) => (css += s.textContent ?? ''));
  if (baseUrl) css = rewriteCssUrls(css, baseUrl);

  const titleEl = doc.querySelector('title');

  return { slides, css, title: titleEl?.textContent ?? undefined };
}

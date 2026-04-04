import type { Deck, Slide } from '../types';
import { countFragments } from '../engine/fragment';

export async function loadHtmlDeck(path: string): Promise<Deck> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load deck: ${path} (${res.status})`);
  const html = await res.text();

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

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

  const titleEl = doc.querySelector('title');

  return { slides, css, title: titleEl?.textContent ?? undefined };
}

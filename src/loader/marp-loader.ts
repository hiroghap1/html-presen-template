import Marp from '@marp-team/marp-core';
import type { Deck, Slide } from '../types';
import { countFragments, autoAssignFragments } from '../engine/fragment';
import { corsFetch } from './cors-fetch';
import { rewriteRelativeUrls, rewriteCssUrls } from './resolve-urls';

export async function loadMarpDeck(path: string): Promise<Deck> {
  const res = await corsFetch(path);
  if (!res.ok) throw new Error(`Failed to load deck: ${path} (${res.status})`);
  const markdown = await res.text();
  const baseUrl = new URL(path, location.href).href;
  return parseMarpText(markdown, baseUrl);
}

export function parseMarpText(markdown: string, baseUrl?: string): Deck {
  const marp = new Marp({
    script: false,
    html: true,
  });

  const { html, css, comments } = marp.render(markdown);

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  if (baseUrl) rewriteRelativeUrls(doc, baseUrl);
  const resolvedCss = baseUrl ? rewriteCssUrls(css, baseUrl) : css;
  const slides: Slide[] = [];

  // Marp の scoped CSS は「div.marpit > svg > foreignObject > section」前提のため、
  // section 単体ではなく各スライド用の svg を丸ごと包んで保持する。
  const marpit = doc.querySelector('div.marpit');
  const marpitSvgs = marpit?.querySelectorAll(':scope > svg[data-marpit-svg]');

  if (marpitSvgs && marpitSvgs.length > 0) {
    marpitSvgs.forEach((svg, i) => {
      const section = svg.querySelector('section');
      if (!section) return;
      autoAssignFragments(section);
      slides.push({
        html: `<div class="marpit">${svg.outerHTML}</div>`,
        notes: comments[i]?.join('\n'),
        fragmentCount: countFragments(section),
      });
    });
  }

  if (slides.length === 0) {
    doc.querySelectorAll('section').forEach((section, i) => {
      autoAssignFragments(section);
      slides.push({
        html: section.outerHTML,
        notes: comments[i]?.join('\n'),
        fragmentCount: countFragments(section),
      });
    });
  }

  return {
    slides,
    css: resolvedCss,
    title: extractTitle(markdown),
    slideWidthPx: 1280,
  };
}

function extractTitle(md: string): string | undefined {
  const match = md.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim();
}

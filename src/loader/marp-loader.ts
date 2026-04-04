import Marp from '@marp-team/marp-core';
import type { Deck, Slide } from '../types';
import { countFragments, autoAssignFragments } from '../engine/fragment';
import { corsFetch } from './cors-fetch';

export async function loadMarpDeck(path: string): Promise<Deck> {
  const res = await corsFetch(path);
  if (!res.ok) throw new Error(`Failed to load deck: ${path} (${res.status})`);
  const markdown = await res.text();
  return parseMarpText(markdown);
}

export function parseMarpText(markdown: string): Deck {
  const marp = new Marp({
    script: false,
    html: true,
  });

  const { html, css, comments } = marp.render(markdown);

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const sections = doc.querySelectorAll('section');

  const slides: Slide[] = [];
  sections.forEach((section, i) => {
    autoAssignFragments(section);
    slides.push({
      html: section.outerHTML,
      notes: comments[i]?.join('\n'),
      fragmentCount: countFragments(section),
    });
  });

  return { slides, css, title: extractTitle(markdown) };
}

function extractTitle(md: string): string | undefined {
  const match = md.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim();
}

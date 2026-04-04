import type { Deck, DeckFormat } from '../types';
import { loadMarpDeck } from './marp-loader';
import { loadHtmlDeck } from './html-loader';

export function detectFormat(path: string): DeckFormat {
  if (path.endsWith('.md') || path.endsWith('.markdown')) return 'marp';
  return 'html';
}

export async function loadDeck(path: string): Promise<Deck> {
  const format = detectFormat(path);
  switch (format) {
    case 'marp':
      return loadMarpDeck(path);
    case 'html':
      return loadHtmlDeck(path);
  }
}

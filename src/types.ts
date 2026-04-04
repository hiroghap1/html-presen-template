export interface Slide {
  html: string;
  css?: string;
  notes?: string;
  fragmentCount: number;
}

export interface Deck {
  slides: Slide[];
  css: string;
  title?: string;
}

export type DeckFormat = 'marp' | 'html';
export type ThemeMode = 'light' | 'dark';

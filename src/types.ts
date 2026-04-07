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
  /** Marp 16:9 スライドの論理幅（px）。HTML デッキは未設定時 960 相当で扱う */
  slideWidthPx?: number;
}

export type DeckFormat = 'marp' | 'html';
export type ThemeMode = 'light' | 'dark';

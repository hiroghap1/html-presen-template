import type { Deck } from '../types';

export type SlideEvent = 'slidechange' | 'fragmentchange';

type Listener = () => void;

export class SlideEngine {
  private deck: Deck;
  private _currentIndex = 0;
  private _currentFragment = 0;
  private listeners = new Map<SlideEvent, Set<Listener>>();

  constructor(deck: Deck) {
    this.deck = deck;
  }

  get slideCount(): number {
    return this.deck.slides.length;
  }

  get currentIndex(): number {
    return this._currentIndex;
  }

  get currentFragment(): number {
    return this._currentFragment;
  }

  get currentSlide() {
    return this.deck.slides[this._currentIndex];
  }

  get deckCss(): string {
    return this.deck.css;
  }

  get deckTitle(): string | undefined {
    return this.deck.title;
  }

  next(): void {
    const slide = this.currentSlide;
    if (this._currentFragment < slide.fragmentCount) {
      this._currentFragment++;
      this.emit('fragmentchange');
    } else if (this._currentIndex < this.slideCount - 1) {
      this._currentIndex++;
      this._currentFragment = 0;
      this.emit('slidechange');
    }
  }

  prev(): void {
    if (this._currentFragment > 0) {
      this._currentFragment--;
      this.emit('fragmentchange');
    } else if (this._currentIndex > 0) {
      this._currentIndex--;
      const prevSlide = this.deck.slides[this._currentIndex];
      this._currentFragment = prevSlide.fragmentCount;
      this.emit('slidechange');
    }
  }

  goTo(index: number): void {
    if (index < 0 || index >= this.slideCount) return;
    this._currentIndex = index;
    this._currentFragment = 0;
    this.emit('slidechange');
  }

  on(event: SlideEvent, listener: Listener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: SlideEvent, listener: Listener): void {
    this.listeners.get(event)?.delete(listener);
  }

  private emit(event: SlideEvent): void {
    this.listeners.get(event)?.forEach((fn) => fn());
  }

  initKeyboard(): void {
    document.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
          e.preventDefault();
          this.next();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          this.prev();
          break;
        case 'Home':
          e.preventDefault();
          this.goTo(0);
          break;
        case 'End':
          e.preventDefault();
          this.goTo(this.slideCount - 1);
          break;
        case 'f':
        case 'F':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            this.toggleFullscreen();
          }
          break;
      }
    });
  }

  initClickNavigation(viewport: HTMLElement): void {
    viewport.addEventListener('click', (e) => {
      const rect = viewport.getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (x < rect.width / 3) {
        this.prev();
      } else {
        this.next();
      }
    });
  }

  private toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }
}

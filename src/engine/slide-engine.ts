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

  get slides() {
    return this.deck.slides;
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

  goTo(index: number, updateHash = true): void {
    if (index < 0 || index >= this.slideCount) return;
    this._currentIndex = index;
    this._currentFragment = 0;
    if (updateHash) this.syncHash();
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
    if (event === 'slidechange') this.syncHash();
    this.listeners.get(event)?.forEach((fn) => fn());
  }

  /** Write current page number to location.hash (1-based) */
  private syncHash(): void {
    const page = this._currentIndex + 1;
    history.replaceState(null, '', `#${page}`);
  }

  /** Read initial page from hash, and listen for hash changes */
  initHash(): void {
    const initial = this.parseHash();
    if (initial !== null) {
      this.goTo(initial, false);
    }

    window.addEventListener('hashchange', () => {
      const idx = this.parseHash();
      if (idx !== null && idx !== this._currentIndex) {
        this._currentIndex = idx;
        this._currentFragment = 0;
        this.emit('slidechange');
      }
    });
  }

  private parseHash(): number | null {
    const hash = location.hash.replace('#', '');
    const n = parseInt(hash, 10);
    if (isNaN(n) || n < 1 || n > this.slideCount) return null;
    return n - 1;
  }

  /** When true, keyboard and click navigation are suppressed */
  private _navigationLocked = false;

  get navigationLocked(): boolean {
    return this._navigationLocked;
  }

  set navigationLocked(locked: boolean) {
    this._navigationLocked = locked;
  }

  initKeyboard(): void {
    document.addEventListener('keydown', (e) => {
      if (this._navigationLocked) return;
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
      if (this._navigationLocked) return;
      const rect = viewport.getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (x < rect.width / 3) {
        this.prev();
      } else {
        this.next();
      }
    });
  }

  initSwipeNavigation(viewport: HTMLElement): void {
    let startX = 0;
    let startY = 0;
    let tracking = false;

    viewport.addEventListener('touchstart', (e) => {
      if (this._navigationLocked) return;
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      tracking = true;
    }, { passive: true });

    viewport.addEventListener('touchend', (e) => {
      if (!tracking) return;
      tracking = false;
      if (this._navigationLocked) return;
      if (e.changedTouches.length === 0) return;

      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      const MIN_DISTANCE = 50;

      // Only trigger if horizontal swipe is dominant
      if (Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) < Math.abs(dy)) return;

      if (dx < 0) {
        this.next();
      } else {
        this.prev();
      }
    }, { passive: true });
  }

  private toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }
}

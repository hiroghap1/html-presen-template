const STORAGE_KEY = 'slide-font-scale';
const BASE_REM = 1.5;
const STEP = 0.1;
const MIN_SCALE = 0.5;
const MAX_SCALE = 2.5;

export class FontSize {
  private scale: number;
  private styleEl: HTMLStyleElement;

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    this.scale = saved ? parseFloat(saved) : 1.0;

    this.styleEl = document.createElement('style');
    document.head.appendChild(this.styleEl);
    this.apply();
  }

  get label(): string {
    return `${Math.round(this.scale * 100)}%`;
  }

  increase(): string {
    this.scale = Math.min(MAX_SCALE, +(this.scale + STEP).toFixed(2));
    this.save();
    this.apply();
    return this.label;
  }

  decrease(): string {
    this.scale = Math.max(MIN_SCALE, +(this.scale - STEP).toFixed(2));
    this.save();
    this.apply();
    return this.label;
  }

  reset(): string {
    this.scale = 1.0;
    this.save();
    this.apply();
    return this.label;
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, String(this.scale));
  }

  private apply(): void {
    const size = (BASE_REM * this.scale).toFixed(3);
    this.styleEl.textContent = `
      .slide-content > section {
        font-size: ${size}rem !important;
      }
      .slide-content > section h1 {
        font-size: ${(2.5 * this.scale).toFixed(3)}rem !important;
      }
      .slide-content > section h2 {
        font-size: ${(2.0 * this.scale).toFixed(3)}rem !important;
      }
      .slide-content > section h3 {
        font-size: ${(1.75 * this.scale).toFixed(3)}rem !important;
      }
      .slide-content > .marpit section {
        font-size: ${size}rem !important;
      }
      .slide-content > .marpit section :is(h1, marp-h1) {
        font-size: ${(2.5 * this.scale).toFixed(3)}rem !important;
      }
      .slide-content > .marpit section :is(h2, marp-h2) {
        font-size: ${(2.0 * this.scale).toFixed(3)}rem !important;
      }
      .slide-content > .marpit section :is(h3, marp-h3) {
        font-size: ${(1.75 * this.scale).toFixed(3)}rem !important;
      }
    `;
  }
}

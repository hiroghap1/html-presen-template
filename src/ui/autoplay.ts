import { SlideEngine } from '../engine/slide-engine';

export class Autoplay {
  private engine: SlideEngine;
  private _active = false;
  private _repeat = false;
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private slideIntervalMs: number;
  private fragmentIntervalMs: number;
  private indicatorEl: HTMLElement;
  private onChangeCallback: (() => void) | null = null;

  constructor(engine: SlideEngine, slideIntervalMs = 10_000, fragmentIntervalMs = 3_000) {
    this.engine = engine;
    this.slideIntervalMs = slideIntervalMs;
    this.fragmentIntervalMs = fragmentIntervalMs;

    this.indicatorEl = document.createElement('div');
    this.indicatorEl.className = 'autoplay-indicator';
    this.indicatorEl.textContent = 'Auto';
    document.body.appendChild(this.indicatorEl);
  }

  get active(): boolean {
    return this._active;
  }

  get repeat(): boolean {
    return this._repeat;
  }

  get slideInterval(): number {
    return this.slideIntervalMs / 1000;
  }

  get fragmentInterval(): number {
    return this.fragmentIntervalMs / 1000;
  }

  setRepeat(value: boolean): void {
    this._repeat = value;
    this.updateIndicator();
  }

  toggleRepeat(): void {
    this._repeat = !this._repeat;
    this.updateIndicator();
  }

  setSlideInterval(seconds: number): void {
    this.slideIntervalMs = seconds * 1000;
  }

  setFragmentInterval(seconds: number): void {
    this.fragmentIntervalMs = seconds * 1000;
  }

  /** Register a callback to update toolbar buttons when state changes */
  onChange(cb: () => void): void {
    this.onChangeCallback = cb;
  }

  toggle(): void {
    this._active ? this.stop() : this.start();
  }

  start(): void {
    if (this._active) return;
    this._active = true;
    this.updateIndicator();
    this.indicatorEl.classList.add('visible');
    this.scheduleNext();
    this.onChangeCallback?.();
  }

  stop(): void {
    if (!this._active) return;
    this._active = false;
    this.indicatorEl.classList.remove('visible');
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.onChangeCallback?.();
  }

  private updateIndicator(): void {
    this.indicatorEl.textContent = this._repeat ? 'Auto ↻' : 'Auto';
  }

  private scheduleNext(): void {
    if (!this._active) return;

    const slide = this.engine.currentSlide;
    const hasFragments = slide && this.engine.currentFragment < slide.fragmentCount;
    const delay = hasFragments ? this.fragmentIntervalMs : this.slideIntervalMs;

    this.timerId = setTimeout(() => {
      if (!this._active) return;

      const isLastSlide = this.engine.currentIndex >= this.engine.slideCount - 1;
      const allFragmentsShown = !slide || this.engine.currentFragment >= slide.fragmentCount;

      if (isLastSlide && allFragmentsShown) {
        if (this._repeat) {
          this.engine.goTo(0);
          this.scheduleNext();
        } else {
          this.stop();
        }
        return;
      }

      this.engine.next();
      this.scheduleNext();
    }, delay);
  }
}

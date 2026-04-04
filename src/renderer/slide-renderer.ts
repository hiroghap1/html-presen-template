import { SlideEngine } from '../engine/slide-engine';
import { applyFragmentState } from '../engine/fragment';
import { highlightCode } from './code-highlight';

export type TransitionType = 'slide' | 'fade' | 'zoom' | 'none';
export const TRANSITIONS: TransitionType[] = ['slide', 'fade', 'zoom', 'none'];

export class SlideRenderer {
  private engine: SlideEngine;
  private viewport: HTMLElement;
  private styleEl: HTMLStyleElement;
  private vtStyleEl: HTMLStyleElement;
  private direction: 'forward' | 'backward' = 'forward';
  private prevIndex = 0;
  private supportsVT: boolean;
  private _transition: TransitionType;

  constructor(engine: SlideEngine, viewport: HTMLElement) {
    this.engine = engine;
    this.viewport = viewport;
    this.supportsVT = 'startViewTransition' in document;
    this._transition = (localStorage.getItem('slide-transition') as TransitionType) ?? 'slide';

    this.styleEl = document.createElement('style');
    document.head.appendChild(this.styleEl);

    this.vtStyleEl = document.createElement('style');
    document.head.appendChild(this.vtStyleEl);

    engine.on('slidechange', () => {
      this.direction =
        engine.currentIndex >= this.prevIndex ? 'forward' : 'backward';
      this.prevIndex = engine.currentIndex;
      this.renderSlide();
    });

    engine.on('fragmentchange', () => {
      this.applyFragments();
    });
  }

  get transition(): TransitionType {
    return this._transition;
  }

  setTransition(type: TransitionType): void {
    this._transition = type;
    localStorage.setItem('slide-transition', type);
  }

  cycleTransition(): TransitionType {
    const idx = TRANSITIONS.indexOf(this._transition);
    const next = TRANSITIONS[(idx + 1) % TRANSITIONS.length];
    this.setTransition(next);
    return next;
  }

  render(): void {
    this.styleEl.textContent = this.engine.deckCss;
    if (this.engine.deckTitle) {
      document.title = this.engine.deckTitle;
    }
    this.renderSlide();
  }

  private renderSlide(): void {
    const slide = this.engine.currentSlide;
    if (!slide) return;

    const oldImages = this.collectImageSrcs(this.viewport);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = slide.html;
    const newImages = this.collectImageSrcs(tempDiv);
    const sharedSrcs = oldImages.filter((src) => newImages.includes(src));

    if (this.supportsVT && sharedSrcs.length > 0) {
      this.renderWithViewTransition(slide.html, sharedSrcs);
    } else {
      this.renderImmediate(slide.html);
    }
  }

  private renderWithViewTransition(html: string, sharedSrcs: string[]): void {
    this.assignTransitionNames(this.viewport, sharedSrcs);
    (document as any).startViewTransition(() => {
      this.swapContent(html);
      this.assignTransitionNames(this.viewport, sharedSrcs);
      this.applyFragments();
      this.applyHighlight();
    });
  }

  private renderImmediate(html: string): void {
    this.vtStyleEl.textContent = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'slide-content';
    wrapper.innerHTML = html;

    const animClass = this.getAnimClass();
    if (animClass) wrapper.classList.add(animClass);

    this.viewport.innerHTML = '';
    this.viewport.appendChild(wrapper);
    this.applyFragments();
    this.applyHighlight();

    if (animClass) {
      wrapper.addEventListener(
        'animationend',
        () => wrapper.classList.remove(animClass),
        { once: true },
      );
    }
  }

  private getAnimClass(): string | null {
    switch (this._transition) {
      case 'slide':
        return this.direction === 'forward'
          ? 'trans-slide-forward'
          : 'trans-slide-backward';
      case 'fade':
        return 'trans-fade';
      case 'zoom':
        return this.direction === 'forward'
          ? 'trans-zoom-in'
          : 'trans-zoom-out';
      case 'none':
        return null;
    }
  }

  private swapContent(html: string): void {
    const wrapper = document.createElement('div');
    wrapper.className = 'slide-content';
    wrapper.innerHTML = html;
    this.viewport.innerHTML = '';
    this.viewport.appendChild(wrapper);
  }

  private collectImageSrcs(container: Element | HTMLElement): string[] {
    const imgs = container.querySelectorAll('img');
    const srcs: string[] = [];
    imgs.forEach((img) => {
      const src = img.getAttribute('src');
      if (src && !srcs.includes(src)) srcs.push(src);
    });
    return srcs;
  }

  private assignTransitionNames(
    container: Element | HTMLElement,
    sharedSrcs: string[],
  ): void {
    const imgs = container.querySelectorAll('img');
    imgs.forEach((img) => img.style.removeProperty('view-transition-name'));
    imgs.forEach((img) => {
      const src = img.getAttribute('src');
      if (!src) return;
      const idx = sharedSrcs.indexOf(src);
      if (idx !== -1) {
        img.style.viewTransitionName = `shared-img-${idx}`;
      }
    });
  }

  private applyFragments(): void {
    const content = this.viewport.querySelector('.slide-content');
    if (content) {
      applyFragmentState(content, this.engine.currentFragment);
    }
  }

  private applyHighlight(): void {
    const content = this.viewport.querySelector('.slide-content');
    if (content) {
      highlightCode(content);
    }
  }
}

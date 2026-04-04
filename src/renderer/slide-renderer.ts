import { SlideEngine } from '../engine/slide-engine';
import { applyFragmentState } from '../engine/fragment';

export class SlideRenderer {
  private engine: SlideEngine;
  private viewport: HTMLElement;
  private styleEl: HTMLStyleElement;
  private vtStyleEl: HTMLStyleElement;
  private direction: 'forward' | 'backward' = 'forward';
  private prevIndex = 0;
  private supportsVT: boolean;

  constructor(engine: SlideEngine, viewport: HTMLElement) {
    this.engine = engine;
    this.viewport = viewport;
    this.supportsVT = 'startViewTransition' in document;

    this.styleEl = document.createElement('style');
    document.head.appendChild(this.styleEl);

    // Dedicated style element for dynamic view-transition-name rules
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

    // Collect image srcs from the current (old) slide before replacing
    const oldImages = this.collectImageSrcs(this.viewport);

    // Parse the new slide to find shared images
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = slide.html;
    const newImages = this.collectImageSrcs(tempDiv);

    // Find shared image srcs
    const sharedSrcs = oldImages.filter((src) => newImages.includes(src));

    if (this.supportsVT && sharedSrcs.length > 0) {
      this.renderWithViewTransition(slide.html, sharedSrcs);
    } else {
      this.renderImmediate(slide.html);
    }
  }

  private renderWithViewTransition(html: string, sharedSrcs: string[]): void {
    // Assign view-transition-name to old images
    this.assignTransitionNames(this.viewport, sharedSrcs);

    (document as any).startViewTransition(() => {
      this.swapContent(html);
      // Assign the same view-transition-name to new matching images
      this.assignTransitionNames(this.viewport, sharedSrcs);
      this.applyFragments();
    });
  }

  private renderImmediate(html: string): void {
    // Clear any leftover transition names
    this.vtStyleEl.textContent = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'slide-content';
    wrapper.innerHTML = html;

    const animClass =
      this.direction === 'forward'
        ? 'slide-enter-forward'
        : 'slide-enter-backward';
    wrapper.classList.add(animClass);

    this.viewport.innerHTML = '';
    this.viewport.appendChild(wrapper);

    this.applyFragments();

    wrapper.addEventListener(
      'animationend',
      () => wrapper.classList.remove(animClass),
      { once: true },
    );
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

  /**
   * Assign `view-transition-name` to <img> elements whose src matches
   * one of the shared srcs. Each unique src gets a stable name so the
   * browser can pair old/new images for the transition.
   */
  private assignTransitionNames(
    container: Element | HTMLElement,
    sharedSrcs: string[],
  ): void {
    const imgs = container.querySelectorAll('img');
    // Clear previous names
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
}

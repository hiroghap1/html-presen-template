import { SlideEngine } from '../engine/slide-engine';

export class SlideGrid {
  private engine: SlideEngine;
  private overlay: HTMLElement;
  private grid: HTMLElement;
  private _visible = false;

  constructor(engine: SlideEngine) {
    this.engine = engine;

    this.overlay = document.createElement('div');
    this.overlay.className = 'grid-overlay';

    this.grid = document.createElement('div');
    this.grid.className = 'grid-container';
    this.overlay.appendChild(this.grid);

    // Close on overlay background click
    this.overlay.addEventListener('mousedown', (e) => {
      if (e.target === this.overlay) this.hide();
    });

    document.body.appendChild(this.overlay);

    // Rebuild active marker when slide changes
    engine.on('slidechange', () => {
      if (this._visible) this.updateActive();
    });
  }

  get visible(): boolean {
    return this._visible;
  }

  toggle(): void {
    if (this._visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  show(): void {
    this.buildGrid();
    this._visible = true;
    // Force reflow then add visible class for animation
    this.overlay.offsetHeight;
    this.overlay.classList.add('visible');
  }

  hide(): void {
    this.overlay.classList.remove('visible');
    this._visible = false;
  }

  private buildGrid(): void {
    this.grid.innerHTML = '';
    const deckCss = this.engine.deckCss;

    this.engine.slides.forEach((slide, i) => {
      const card = document.createElement('button');
      card.className = 'grid-card';
      if (i === this.engine.currentIndex) card.classList.add('active');
      card.type = 'button';

      // Thumbnail: render slide HTML in a scaled-down container
      const thumb = document.createElement('div');
      thumb.className = 'grid-thumb';

      const inner = document.createElement('div');
      inner.className = 'grid-thumb-inner';
      inner.innerHTML = `<style>${deckCss}</style>${slide.html}`;
      thumb.appendChild(inner);

      // Page number label
      const label = document.createElement('span');
      label.className = 'grid-label';
      label.textContent = String(i + 1);

      card.appendChild(thumb);
      card.appendChild(label);

      card.addEventListener('click', () => {
        this.engine.goTo(i);
        this.hide();
      });

      this.grid.appendChild(card);
    });

    // Calculate thumbnail scale based on actual card width
    requestAnimationFrame(() => {
      const firstThumb = this.grid.querySelector('.grid-thumb') as HTMLElement | null;
      if (firstThumb) {
        const thumbWidth = firstThumb.clientWidth;
        const scale = thumbWidth / 960;
        this.grid.querySelectorAll('.grid-thumb-inner').forEach((el) => {
          (el as HTMLElement).style.transform = `scale(${scale})`;
        });
      }
      const active = this.grid.querySelector('.grid-card.active');
      active?.scrollIntoView({ block: 'center', behavior: 'instant' });
    });
  }

  private updateActive(): void {
    this.grid.querySelectorAll('.grid-card').forEach((card, i) => {
      card.classList.toggle('active', i === this.engine.currentIndex);
    });
  }
}

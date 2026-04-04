import { SlideEngine } from '../engine/slide-engine';

interface GridAction {
  label: string;
  handler: () => void;
}

export class SlideGrid {
  private engine: SlideEngine;
  private overlay: HTMLElement;
  private grid: HTMLElement;
  private actionBar: HTMLElement;
  private _visible = false;
  private actions: GridAction[] = [];

  constructor(engine: SlideEngine) {
    this.engine = engine;

    this.overlay = document.createElement('div');
    this.overlay.className = 'grid-overlay';

    // Action bar at top
    this.actionBar = document.createElement('div');
    this.actionBar.className = 'grid-action-bar';
    this.overlay.appendChild(this.actionBar);

    this.grid = document.createElement('div');
    this.grid.className = 'grid-container';
    this.overlay.appendChild(this.grid);

    this.overlay.addEventListener('mousedown', (e) => {
      if (e.target === this.overlay) this.hide();
    });

    document.body.appendChild(this.overlay);

    engine.on('slidechange', () => {
      if (this._visible) this.updateActive();
    });
  }

  get visible(): boolean {
    return this._visible;
  }

  addAction(label: string, handler: () => void): void {
    this.actions.push({ label, handler });
  }

  toggle(): void {
    this._visible ? this.hide() : this.show();
  }

  show(): void {
    this.buildActionBar();
    this.buildGrid();
    this._visible = true;
    this.overlay.offsetHeight;
    this.overlay.classList.add('visible');
  }

  hide(): void {
    this.overlay.classList.remove('visible');
    this._visible = false;
  }

  private buildActionBar(): void {
    this.actionBar.innerHTML = '';
    this.actions.forEach(({ label, handler }) => {
      const btn = document.createElement('button');
      btn.className = 'grid-action-btn';
      btn.textContent = label;
      btn.addEventListener('click', () => {
        this.hide();
        handler();
      });
      this.actionBar.appendChild(btn);
    });
  }

  private buildGrid(): void {
    this.grid.innerHTML = '';
    const deckCss = this.engine.deckCss;

    this.engine.slides.forEach((slide, i) => {
      const card = document.createElement('button');
      card.className = 'grid-card';
      if (i === this.engine.currentIndex) card.classList.add('active');
      card.type = 'button';

      const thumb = document.createElement('div');
      thumb.className = 'grid-thumb';

      const inner = document.createElement('div');
      inner.className = 'grid-thumb-inner';
      inner.innerHTML = `<style>${deckCss}</style>${slide.html}`;
      thumb.appendChild(inner);

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

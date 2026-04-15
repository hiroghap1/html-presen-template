/**
 * Magnifier: drag to select a region, zoom into it with a modal backdrop.
 * Uses CSS transform on the actual slide content (keeps text sharp).
 * Z to enter selection mode, drag a rectangle, release to zoom.
 * Click / Z / Escape to dismiss.
 */

export class Magnifier {
  private viewport: HTMLElement;
  private selectionBox: HTMLElement;
  private backdrop: HTMLElement;
  private _selectMode = false;
  private _zoomed = false;
  private startX = 0;
  private startY = 0;
  private onStateChange?: () => void;

  // Saved state for reset
  private savedTransform = '';
  private savedTransformOrigin = '';
  private savedTransition = '';
  private savedViewportZIndex = '';

  constructor(viewport: HTMLElement) {
    this.viewport = viewport;

    this.selectionBox = document.createElement('div');
    this.selectionBox.className = 'magnifier-selection';
    document.body.appendChild(this.selectionBox);

    // Backdrop only (no modal content — we transform the real slide)
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'magnifier-backdrop';
    document.body.appendChild(this.backdrop);

    this.backdrop.addEventListener('click', () => this.dismiss());

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);

    // Capture-phase click handler: suppress clicks on viewport while magnifier is active.
    // Some browsers fire click even after preventDefault on pointerdown.
    this.viewport.addEventListener('click', (e) => {
      if (this._selectMode || this._zoomed) {
        e.stopPropagation();
        e.preventDefault();
      }
    }, true);
  }

  /** Register a callback invoked whenever the magnifier's active state changes */
  setStateChangeCallback(cb: () => void): void {
    this.onStateChange = cb;
  }

  get active(): boolean {
    return this._selectMode || this._zoomed;
  }

  toggle(): void {
    if (this._zoomed) {
      this.dismiss();
    } else if (this._selectMode) {
      this.exitSelectMode();
    } else {
      this.enterSelectMode();
    }
  }

  dismiss(): void {
    if (this._zoomed) {
      const content = this.viewport.querySelector('.slide-content') as HTMLElement;
      if (content) {
        content.style.transition = 'transform 0.3s ease';
        content.style.transform = this.savedTransform;
        content.addEventListener('transitionend', () => {
          content.style.transformOrigin = this.savedTransformOrigin;
          content.style.transition = this.savedTransition;
          // Restore viewport z-index and overflow
          this.viewport.style.zIndex = this.savedViewportZIndex;
          this.viewport.style.overflow = '';
          document.body.style.overflow = '';
        }, { once: true });
      }
      this.backdrop.classList.remove('visible');
      this._zoomed = false;
    }
    if (this._selectMode) {
      this.exitSelectMode();
    }
    this.onStateChange?.();
  }

  private enterSelectMode(): void {
    this._selectMode = true;
    document.body.classList.add('magnifier-selecting');
    document.addEventListener('pointerdown', this.onPointerDown);
  }

  private exitSelectMode(): void {
    this._selectMode = false;
    document.body.classList.remove('magnifier-selecting');
    this.selectionBox.style.display = 'none';
    document.removeEventListener('pointerdown', this.onPointerDown);
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
  }

  private onPointerDown(e: PointerEvent): void {
    const target = e.target as HTMLElement;
    if (target.closest('#controls') || target.closest('.grid-overlay') || target.closest('.help-overlay')) return;

    e.preventDefault();
    this.startX = e.clientX;
    this.startY = e.clientY;

    this.selectionBox.style.display = 'block';
    this.selectionBox.style.left = `${e.clientX}px`;
    this.selectionBox.style.top = `${e.clientY}px`;
    this.selectionBox.style.width = '0';
    this.selectionBox.style.height = '0';

    document.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('pointerup', this.onPointerUp);
  }

  private onPointerMove(e: PointerEvent): void {
    const x = Math.min(this.startX, e.clientX);
    const y = Math.min(this.startY, e.clientY);
    const w = Math.abs(e.clientX - this.startX);
    const h = Math.abs(e.clientY - this.startY);

    this.selectionBox.style.left = `${x}px`;
    this.selectionBox.style.top = `${y}px`;
    this.selectionBox.style.width = `${w}px`;
    this.selectionBox.style.height = `${h}px`;
  }

  private onPointerUp(e: PointerEvent): void {
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);

    const w = Math.abs(e.clientX - this.startX);
    const h = Math.abs(e.clientY - this.startY);

    this.selectionBox.style.display = 'none';
    this.exitSelectMode();

    if (w < 20 || h < 20) {
      this.onStateChange?.();
      return;
    }

    const x = Math.min(this.startX, e.clientX);
    const y = Math.min(this.startY, e.clientY);

    this.zoomInto(x, y, w, h);
  }

  private zoomInto(x: number, y: number, w: number, h: number): void {
    const content = this.viewport.querySelector('.slide-content') as HTMLElement;
    if (!content) return;

    const vpRect = this.viewport.getBoundingClientRect();

    const padFactor = 0.85;
    const scaleX = (vpRect.width * padFactor) / w;
    const scaleY = (vpRect.height * padFactor) / h;
    const scale = Math.min(scaleX, scaleY);

    const selCenterX = x + w / 2 - vpRect.left;
    const selCenterY = y + h / 2 - vpRect.top;

    const vpCenterX = vpRect.width / 2;
    const vpCenterY = vpRect.height / 2;

    const translateX = vpCenterX - selCenterX;
    const translateY = vpCenterY - selCenterY;

    // Save current state
    this.savedTransform = content.style.transform;
    this.savedTransformOrigin = content.style.transformOrigin;
    this.savedTransition = content.style.transition;
    this.savedViewportZIndex = this.viewport.style.zIndex;

    // Allow content to overflow during zoom and lift viewport above backdrop (z-index 300)
    this.viewport.style.overflow = 'visible';
    this.viewport.style.zIndex = '305';
    document.body.style.overflow = 'visible';

    // Apply zoom
    content.style.transformOrigin = `${selCenterX}px ${selCenterY}px`;
    content.style.transition = 'transform 0.35s ease';
    content.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;

    this.backdrop.classList.add('visible');
    this._zoomed = true;
  }
}

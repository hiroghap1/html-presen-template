export class SpotlightOverlay {
  private overlay: HTMLElement;
  private _active = false;
  private radius = 120;
  private readonly MIN_RADIUS = 40;
  private readonly MAX_RADIUS = 400;

  constructor() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'spotlight-overlay';
    document.body.appendChild(this.overlay);

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onWheel = this.onWheel.bind(this);
  }

  get active(): boolean {
    return this._active;
  }

  toggle(): void {
    this._active ? this.hide() : this.show();
  }

  private show(): void {
    this._active = true;
    this.overlay.classList.add('visible');
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('wheel', this.onWheel, { passive: false });
  }

  private hide(): void {
    this._active = false;
    this.overlay.classList.remove('visible');
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('wheel', this.onWheel);
  }

  private onMouseMove(e: MouseEvent): void {
    this.updateGradient(e.clientX, e.clientY);
  }

  private onWheel(e: WheelEvent): void {
    if (!this._active) return;
    e.preventDefault();
    this.radius = Math.max(this.MIN_RADIUS, Math.min(this.MAX_RADIUS, this.radius - e.deltaY * 0.5));
    // Re-apply gradient at current position
    const rect = this.overlay.getBoundingClientRect();
    // Use last known position from the gradient or center
    const style = this.overlay.style.background;
    const match = style.match(/at (\d+(?:\.\d+)?)px (\d+(?:\.\d+)?)px/);
    if (match) {
      this.updateGradient(parseFloat(match[1]), parseFloat(match[2]));
    }
  }

  private updateGradient(x: number, y: number): void {
    // Sharp spotlight: fully transparent inside, soft edge, then dark outside
    const r = this.radius;
    this.overlay.style.background =
      `radial-gradient(circle at ${x}px ${y}px, ` +
      `transparent 0%, transparent ${r * 0.7}px, ` +
      `rgba(0,0,0,0.15) ${r * 0.85}px, ` +
      `rgba(0,0,0,0.85) ${r * 1.1}px)`;
  }
}

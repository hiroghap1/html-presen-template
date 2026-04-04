export class LaserPointer {
  private dot: HTMLElement;
  private _active = false;

  constructor() {
    this.dot = document.createElement('div');
    this.dot.className = 'laser-dot';
    document.body.appendChild(this.dot);

    document.addEventListener('mousemove', (e) => {
      if (!this._active) return;
      this.dot.style.left = `${e.clientX}px`;
      this.dot.style.top = `${e.clientY}px`;
    });
  }

  get active(): boolean {
    return this._active;
  }

  toggle(): void {
    this._active ? this.deactivate() : this.activate();
  }

  activate(): void {
    this._active = true;
    this.dot.classList.add('visible');
  }

  deactivate(): void {
    this._active = false;
    this.dot.classList.remove('visible');
  }
}

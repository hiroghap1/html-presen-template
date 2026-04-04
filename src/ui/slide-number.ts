const STORAGE_KEY = 'slide-number-visible';

export class SlideNumber {
  private el: HTMLElement;
  private _visible: boolean;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'slide-number';
    document.body.appendChild(this.el);

    this._visible = localStorage.getItem(STORAGE_KEY) === 'true';
    if (this._visible) {
      this.el.classList.add('visible');
    }
  }

  toggle(): void {
    this._visible = !this._visible;
    this.el.classList.toggle('visible', this._visible);
    localStorage.setItem(STORAGE_KEY, String(this._visible));
  }

  update(current: number, total: number): void {
    this.el.textContent = `${current} / ${total}`;
  }
}

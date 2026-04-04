export class BlackoutOverlay {
  private overlay: HTMLElement;
  private _active: 'black' | 'white' | null = null;

  constructor() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'blackout-overlay';
    document.body.appendChild(this.overlay);

    // Dismiss on click
    this.overlay.addEventListener('click', () => this.dismiss());
  }

  get active(): 'black' | 'white' | null {
    return this._active;
  }

  toggleBlack(): void {
    if (this._active === 'black') {
      this.dismiss();
    } else {
      this.show('black');
    }
  }

  toggleWhite(): void {
    if (this._active === 'white') {
      this.dismiss();
    } else {
      this.show('white');
    }
  }

  dismiss(): void {
    this._active = null;
    this.overlay.classList.remove('visible');
    this.overlay.style.background = '';
  }

  private show(mode: 'black' | 'white'): void {
    this._active = mode;
    this.overlay.style.background = mode === 'black' ? '#000' : '#fff';
    // Force reflow before adding class
    this.overlay.offsetHeight;
    this.overlay.classList.add('visible');
  }
}

export class QRCodeOverlay {
  private backdrop: HTMLElement;
  private _visible = false;

  constructor() {
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'qrcode-backdrop';

    const container = document.createElement('div');
    container.className = 'qrcode-container';

    const img = document.createElement('img');
    img.className = 'qrcode-img';
    img.alt = 'QR Code';
    img.width = 200;
    img.height = 200;

    const urlLabel = document.createElement('p');
    urlLabel.className = 'qrcode-url';

    container.append(img, urlLabel);
    this.backdrop.appendChild(container);

    this.backdrop.addEventListener('click', () => this.hide());

    document.body.appendChild(this.backdrop);
  }

  get visible(): boolean {
    return this._visible;
  }

  toggle(): void {
    this._visible ? this.hide() : this.show();
  }

  show(): void {
    const url = location.href;
    const img = this.backdrop.querySelector('.qrcode-img') as HTMLImageElement;
    img.src = `https://quickchart.io/qr?text=${encodeURIComponent(url)}&size=200`;

    const urlLabel = this.backdrop.querySelector('.qrcode-url') as HTMLElement;
    urlLabel.textContent = url;

    this._visible = true;
    this.backdrop.offsetHeight; // force reflow
    this.backdrop.classList.add('visible');
  }

  hide(): void {
    this.backdrop.classList.remove('visible');
    this._visible = false;
  }
}

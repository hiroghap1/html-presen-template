export type AspectRatioType = '16:9' | '4:3' | '1:1';
export type SizeType = '1080p' | '720p';

export const ASPECT_RATIOS: AspectRatioType[] = ['16:9', '4:3', '1:1'];
export const SIZES: SizeType[] = ['1080p', '720p'];

/** サイズは標準解像度に対応: 1080p=1920×1080, 720p=1280×720 */
const SIZE_MAP: Record<SizeType, { w: number; h: number }> = {
  '1080p': { w: 1920, h: 1080 },
  '720p': { w: 1280, h: 720 },
};

const RATIO_MAP: Record<AspectRatioType, number> = {
  '16:9': 16 / 9,
  '4:3': 4 / 3,
  '1:1': 1,
};

const RATIO_KEY = 'slide-aspect-ratio';
const SIZE_KEY = 'slide-size';

export class AspectRatio {
  private _ratio: AspectRatioType;
  private _size: SizeType;
  private meta: HTMLMetaElement;
  private viewport: HTMLElement;

  constructor(viewport: HTMLElement) {
    this._ratio = (localStorage.getItem(RATIO_KEY) as AspectRatioType) ?? '16:9';
    this._size = (localStorage.getItem(SIZE_KEY) as SizeType) ?? '1080p';
    this.meta = document.querySelector('meta[name="viewport"]')!;
    this.viewport = viewport;
    this.apply();
    window.addEventListener('resize', () => this.applyZoom());
  }

  get ratio(): AspectRatioType {
    return this._ratio;
  }

  get size(): SizeType {
    return this._size;
  }

  get ratioLabel(): string {
    return this._ratio;
  }

  get sizeLabel(): string {
    return this._size;
  }

  /** 基準幅 — サイズ（解像度）で固定 */
  get baseWidth(): number {
    return SIZE_MAP[this._size].w;
  }

  /** 基準高さ — サイズ（解像度）で固定 */
  get baseHeight(): number {
    return SIZE_MAP[this._size].h;
  }

  /** スライドコンテンツ幅 — 基準高さ × アスペクト比 */
  get contentWidth(): number {
    return Math.round(SIZE_MAP[this._size].h * RATIO_MAP[this._ratio]);
  }

  /** スライドコンテンツ高さ — 基準高さと同じ */
  get contentHeight(): number {
    return SIZE_MAP[this._size].h;
  }

  cycleRatio(): string {
    const idx = ASPECT_RATIOS.indexOf(this._ratio);
    this._ratio = ASPECT_RATIOS[(idx + 1) % ASPECT_RATIOS.length];
    localStorage.setItem(RATIO_KEY, this._ratio);
    this.apply();
    return this._ratio;
  }

  cycleSize(): string {
    const idx = SIZES.indexOf(this._size);
    this._size = SIZES[(idx + 1) % SIZES.length];
    localStorage.setItem(SIZE_KEY, this._size);
    this.apply();
    return this._size;
  }

  private apply(): void {
    const bw = this.baseWidth;
    const cw = this.contentWidth;
    const r = RATIO_MAP[this._ratio];

    // モバイル: viewport meta でスケーリング
    this.meta.setAttribute('content', `width=${bw}`);

    // CSS変数: #slide-viewport の max-width と aspect-ratio
    document.documentElement.style.setProperty('--slide-width', `${cw}px`);
    document.documentElement.style.setProperty('--slide-aspect-ratio', `${r}`);

    // デスクトップ: CSS zoom でスケーリング
    this.applyZoom();
  }

  applyZoom(): void {
    const bw = this.baseWidth;
    const zoom = window.innerWidth / bw;
    document.documentElement.style.setProperty('--slide-zoom', String(zoom));
  }
}

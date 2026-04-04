export type CameraShape = 'rect' | 'circle';
export type CameraSize = 'small' | 'medium' | 'large';

const SIZE_MAP: Record<CameraSize, { width: number; height: number }> = {
  small:  { width: 160, height: 120 },
  medium: { width: 240, height: 180 },
  large:  { width: 360, height: 270 },
};

const SIZES: CameraSize[] = ['small', 'medium', 'large'];

export class CameraOverlay {
  private container: HTMLElement;
  private video: HTMLVideoElement;
  private stream: MediaStream | null = null;
  private _active = false;
  private _shape: CameraShape = 'rect';
  private _size: CameraSize = 'medium';

  // Drag state
  private dragging = false;
  private dragOffset = { x: 0, y: 0 };

  constructor(container: HTMLElement) {
    this.container = container;
    this.video = document.createElement('video');
    this.video.autoplay = true;
    this.video.playsInline = true;
    this.video.muted = true;
    this.video.className = 'camera-video';
    this.container.appendChild(this.video);
    this.container.style.display = 'none';

    this.applySize();
    this.applyShape();
    this.initDrag();
  }

  get active(): boolean {
    return this._active;
  }

  get shape(): CameraShape {
    return this._shape;
  }

  get size(): CameraSize {
    return this._size;
  }

  setShape(shape: CameraShape): void {
    this._shape = shape;
    this.applyShape();
  }

  toggleShape(): void {
    this._shape = this._shape === 'rect' ? 'circle' : 'rect';
    this.applyShape();
  }

  setSize(size: CameraSize): void {
    this._size = size;
    this.applySize();
  }

  cycleSize(): void {
    const idx = SIZES.indexOf(this._size);
    this._size = SIZES[(idx + 1) % SIZES.length];
    this.applySize();
  }

  async toggle(): Promise<void> {
    if (this._active) {
      this.stop();
    } else {
      await this.start();
    }
  }

  async start(deviceId?: string): Promise<void> {
    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: 640, height: 480 }
          : { width: 640, height: 480, facingMode: 'user' },
      };
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;
      this.container.style.display = 'block';
      this._active = true;
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      this._active = false;
    }
  }

  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    this.video.srcObject = null;
    this.container.style.display = 'none';
    this._active = false;
  }

  async getDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((d) => d.kind === 'videoinput');
  }

  private applyShape(): void {
    if (this._shape === 'circle') {
      this.video.classList.add('camera-circle');
    } else {
      this.video.classList.remove('camera-circle');
    }
  }

  private applySize(): void {
    const s = SIZE_MAP[this._size];
    this.video.style.width = `${s.width}px`;
    this.video.style.height = `${s.height}px`;
    // For circle, use the smaller dimension as both width and height
    if (this._shape === 'circle') {
      const dim = Math.min(s.width, s.height);
      this.video.style.width = `${dim}px`;
      this.video.style.height = `${dim}px`;
    }
  }

  // --- Drag support (pointer events) ---
  private initDrag(): void {
    this.container.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    document.addEventListener('pointermove', (e) => this.onPointerMove(e));
    document.addEventListener('pointerup', () => this.onPointerUp());
  }

  private onPointerDown(e: PointerEvent): void {
    // Only left-click drag
    if (e.button !== 0) return;
    this.dragging = true;
    const rect = this.container.getBoundingClientRect();
    this.dragOffset.x = e.clientX - rect.left;
    this.dragOffset.y = e.clientY - rect.top;
    this.container.setPointerCapture(e.pointerId);
    this.container.style.cursor = 'grabbing';
    e.preventDefault();
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.dragging) return;
    const x = e.clientX - this.dragOffset.x;
    const y = e.clientY - this.dragOffset.y;

    // Clamp to viewport
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rect = this.container.getBoundingClientRect();
    const clampedX = Math.max(0, Math.min(x, vw - rect.width));
    const clampedY = Math.max(0, Math.min(y, vh - rect.height));

    // Switch from bottom/right positioning to top/left for free placement
    this.container.style.left = `${clampedX}px`;
    this.container.style.top = `${clampedY}px`;
    this.container.style.right = 'auto';
    this.container.style.bottom = 'auto';
  }

  private onPointerUp(): void {
    if (!this.dragging) return;
    this.dragging = false;
    this.container.style.cursor = 'grab';
  }
}

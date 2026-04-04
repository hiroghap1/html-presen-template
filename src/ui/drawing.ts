const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#ffffff', '#000000'];
const WIDTHS = [2, 4, 8];

function penCursor(color: string, width: number): string {
  const encoded = encodeURIComponent(color);
  const sw = width <= 2 ? 1.2 : width <= 4 ? 2 : 3;
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24'%3E%3Cpath d='M3 21l1.5-4.5L17.5 3.5a1.5 1.5 0 0 1 2 0l1 1a1.5 1.5 0 0 1 0 2L7.5 19.5Z' fill='none' stroke='${encoded}' stroke-width='${sw}'/%3E%3Cpath d='M14.5 6.5l3 3' stroke='${encoded}' stroke-width='${sw}'/%3E%3C/svg%3E") 2 26, crosshair`;
}

export class DrawingOverlay {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private _active = false;
  private drawing = false;
  private colorIndex = 0;
  private widthIndex = 0;

  // Per-slide drawing storage
  private slideDrawings = new Map<number, ImageData>();
  private currentSlideIndex = 0;

  // For straight line (Shift) and undo
  private lineStartX = 0;
  private lineStartY = 0;
  private shiftHeld = false;
  private snapshotBeforeStroke: ImageData | null = null;
  private undoStack: ImageData[] = [];
  private static readonly MAX_UNDO = 30;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'drawing-overlay';
    this.ctx = this.canvas.getContext('2d')!;
    document.body.appendChild(this.canvas);

    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    this.canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
    this.canvas.addEventListener('pointerup', (e) => this.onPointerUp(e));
    this.canvas.addEventListener('pointercancel', () => { this.drawing = false; });

    // Track Shift key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Shift') this.shiftHeld = true;
    });
    document.addEventListener('keyup', (e) => {
      if (e.key === 'Shift') this.shiftHeld = false;
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
    this.canvas.classList.add('active');
    this.updateCursor();
  }

  deactivate(): void {
    this._active = false;
    this.drawing = false;
    this.canvas.classList.remove('active');
  }

  clear(): void {
    this.pushUndo();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // Also clear stored drawing for current slide
    this.slideDrawings.delete(this.currentSlideIndex);
  }

  /** Call when slide changes to save/restore per-slide drawings */
  onSlideChange(newIndex: number): void {
    // Save current slide's drawing
    this.saveCurrentSlide();
    // Switch to new slide
    this.currentSlideIndex = newIndex;
    this.undoStack = [];
    // Restore new slide's drawing (or clear)
    this.restoreSlide(newIndex);
  }

  private saveCurrentSlide(): void {
    const data = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    // Check if canvas is blank
    const isEmpty = !data.data.some((v, i) => i % 4 === 3 && v > 0);
    if (isEmpty) {
      this.slideDrawings.delete(this.currentSlideIndex);
    } else {
      this.slideDrawings.set(this.currentSlideIndex, data);
    }
  }

  private restoreSlide(index: number): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const saved = this.slideDrawings.get(index);
    if (saved) {
      this.ctx.putImageData(saved, 0, 0);
    }
  }

  undo(): void {
    if (this.undoStack.length === 0) return;
    const data = this.undoStack.pop()!;
    this.ctx.putImageData(data, 0, 0);
  }

  setColor(index: number): void {
    if (index >= 0 && index < COLORS.length) {
      this.colorIndex = index;
      this.updateCursor();
    }
  }

  nextColor(): void {
    this.colorIndex = (this.colorIndex + 1) % COLORS.length;
    this.updateCursor();
  }

  prevColor(): void {
    this.colorIndex = (this.colorIndex - 1 + COLORS.length) % COLORS.length;
    this.updateCursor();
  }

  cycleWidth(): void {
    this.widthIndex = (this.widthIndex + 1) % WIDTHS.length;
    this.updateCursor();
  }

  nextWidth(): void {
    if (this.widthIndex < WIDTHS.length - 1) {
      this.widthIndex++;
      this.updateCursor();
    }
  }

  prevWidth(): void {
    if (this.widthIndex > 0) {
      this.widthIndex--;
      this.updateCursor();
    }
  }

  get currentWidth(): number {
    return WIDTHS[this.widthIndex];
  }

  private updateCursor(): void {
    if (this._active) {
      this.canvas.style.cursor = penCursor(COLORS[this.colorIndex], WIDTHS[this.widthIndex]);
    }
  }

  private pushUndo(): void {
    if (this.undoStack.length >= DrawingOverlay.MAX_UNDO) {
      this.undoStack.shift();
    }
    this.undoStack.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
  }

  private resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;

    const imageData = this.canvas.width > 0 && this.canvas.height > 0
      ? this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
      : null;

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (imageData) {
      this.ctx.putImageData(imageData, 0, 0);
    }

    // Reset undo stack on resize (pixel data changes)
    this.undoStack = [];
  }

  private setupStroke(): void {
    this.ctx.strokeStyle = COLORS[this.colorIndex];
    this.ctx.lineWidth = WIDTHS[this.widthIndex];
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  private onPointerDown(e: PointerEvent): void {
    if (!this._active) return;
    this.drawing = true;
    this.canvas.setPointerCapture(e.pointerId);

    // Save state for undo
    this.pushUndo();

    this.lineStartX = e.clientX;
    this.lineStartY = e.clientY;

    if (this.shiftHeld) {
      // Straight line mode: save canvas snapshot to redraw preview
      this.snapshotBeforeStroke = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    } else {
      // Freehand mode
      this.ctx.beginPath();
      this.ctx.moveTo(e.clientX, e.clientY);
      this.setupStroke();
    }
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.drawing) return;

    if (this.shiftHeld && this.snapshotBeforeStroke) {
      // Straight line preview: restore snapshot then draw line
      this.ctx.putImageData(this.snapshotBeforeStroke, 0, 0);
      this.setupStroke();
      this.ctx.beginPath();
      this.ctx.moveTo(this.lineStartX, this.lineStartY);
      this.ctx.lineTo(e.clientX, e.clientY);
      this.ctx.stroke();
    } else {
      // Freehand
      this.ctx.lineTo(e.clientX, e.clientY);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(e.clientX, e.clientY);
    }
  }

  private onPointerUp(e: PointerEvent): void {
    if (!this.drawing) return;

    if (this.shiftHeld && this.snapshotBeforeStroke) {
      // Finalize straight line
      this.ctx.putImageData(this.snapshotBeforeStroke, 0, 0);
      this.setupStroke();
      this.ctx.beginPath();
      this.ctx.moveTo(this.lineStartX, this.lineStartY);
      this.ctx.lineTo(e.clientX, e.clientY);
      this.ctx.stroke();
      this.snapshotBeforeStroke = null;
    }

    this.drawing = false;
  }
}

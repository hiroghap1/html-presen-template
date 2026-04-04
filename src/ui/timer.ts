export type TimerMode = 'elapsed' | 'clock' | 'off';
export type TimerPosition = 'toolbar' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

const MODES: TimerMode[] = ['elapsed', 'clock', 'off'];
const POSITIONS: TimerPosition[] = ['toolbar', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];

export class Timer {
  /** Inline element for the toolbar */
  private inlineEl: HTMLElement;
  /** Overlay element shown on screen */
  private overlayEl: HTMLElement;

  private _mode: TimerMode;
  private _position: TimerPosition;
  private startTime: number;
  private rafId: number | null = null;

  constructor() {
    this.inlineEl = document.createElement('span');
    this.inlineEl.className = 'ctrl-timer';

    this.overlayEl = document.createElement('div');
    this.overlayEl.className = 'timer-overlay';
    document.body.appendChild(this.overlayEl);

    this._mode = (localStorage.getItem('timer-mode') as TimerMode) ?? 'off';
    this._position = (localStorage.getItem('timer-position') as TimerPosition) ?? 'toolbar';
    this.startTime = Date.now();

    this.applyPosition();
    if (this._mode !== 'off') this.start();
    this.update();
  }

  get inlineElement(): HTMLElement {
    return this.inlineEl;
  }

  get mode(): TimerMode {
    return this._mode;
  }

  get position(): TimerPosition {
    return this._position;
  }

  cycleMode(): TimerMode {
    const idx = MODES.indexOf(this._mode);
    this._mode = MODES[(idx + 1) % MODES.length];
    localStorage.setItem('timer-mode', this._mode);

    if (this._mode === 'elapsed') {
      this.startTime = Date.now();
    }

    if (this._mode !== 'off') {
      this.start();
    } else {
      this.stop();
    }
    this.update();
    return this._mode;
  }

  cyclePosition(): TimerPosition {
    const idx = POSITIONS.indexOf(this._position);
    this._position = POSITIONS[(idx + 1) % POSITIONS.length];
    localStorage.setItem('timer-position', this._position);
    this.applyPosition();
    this.update();
    return this._position;
  }

  reset(): void {
    this.startTime = Date.now();
    this.update();
  }

  private applyPosition(): void {
    // Reset overlay placement
    this.overlayEl.removeAttribute('data-pos');

    if (this._position === 'toolbar') {
      this.overlayEl.style.display = 'none';
    } else {
      this.overlayEl.style.display = '';
      this.overlayEl.setAttribute('data-pos', this._position);
    }
  }

  private start(): void {
    if (this.rafId !== null) return;
    const tick = () => {
      this.update();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private update(): void {
    const text = this.formatText();

    // Inline (toolbar) — show only when position is toolbar
    if (this._position === 'toolbar' && this._mode !== 'off') {
      this.inlineEl.textContent = text;
      this.inlineEl.style.display = '';
    } else {
      this.inlineEl.textContent = '';
      this.inlineEl.style.display = 'none';
    }

    // Overlay — show only when position is not toolbar
    if (this._position !== 'toolbar' && this._mode !== 'off') {
      this.overlayEl.textContent = text;
      this.overlayEl.style.display = '';
    } else {
      this.overlayEl.textContent = '';
      if (this._position === 'toolbar' || this._mode === 'off') {
        this.overlayEl.style.display = 'none';
      }
    }
  }

  private formatText(): string {
    switch (this._mode) {
      case 'elapsed': {
        const diff = Date.now() - this.startTime;
        const secs = Math.floor(diff / 1000);
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      }
      case 'clock': {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        return `${h}:${min}`;
      }
      case 'off':
        return '';
    }
  }
}

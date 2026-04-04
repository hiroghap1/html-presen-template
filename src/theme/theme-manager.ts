import type { ThemeMode } from '../types';

const STORAGE_KEY = 'slide-theme';

export class ThemeManager {
  private _mode: ThemeMode;

  constructor() {
    this._mode = this.loadSaved() ?? this.detectPreferred();
    this.apply();
  }

  get mode(): ThemeMode {
    return this._mode;
  }

  toggle(): void {
    this._mode = this._mode === 'light' ? 'dark' : 'light';
    this.apply();
    localStorage.setItem(STORAGE_KEY, this._mode);
  }

  private apply(): void {
    document.documentElement.setAttribute('data-theme', this._mode);
  }

  private loadSaved(): ThemeMode | null {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return null;
  }

  private detectPreferred(): ThemeMode {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
}

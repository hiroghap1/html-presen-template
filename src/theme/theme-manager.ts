import type { ThemeMode } from '../types';

const STORAGE_KEY = 'slide-theme';
const CUSTOM_THEME_KEY = 'slide-custom-theme';

export const PRESET_THEMES = [
  { id: 'default', label: 'Default' },
  { id: 'corporate', label: 'Corporate' },
  { id: 'pop', label: 'Pop' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'nature', label: 'Nature' },
  { id: 'neon', label: 'Neon' },
] as const;

export type PresetThemeId = (typeof PRESET_THEMES)[number]['id'];

export class ThemeManager {
  private _mode: ThemeMode;
  private _customTheme: string; // preset id or URL
  private customStyleEl: HTMLStyleElement;

  constructor() {
    this._mode = this.loadSaved() ?? this.detectPreferred();
    this._customTheme = localStorage.getItem(CUSTOM_THEME_KEY) ?? 'default';
    this.customStyleEl = document.createElement('style');
    this.customStyleEl.id = 'custom-theme';
    document.head.appendChild(this.customStyleEl);

    this.apply();
    this.loadCustomTheme(this._customTheme);
  }

  get mode(): ThemeMode {
    return this._mode;
  }

  get customTheme(): string {
    return this._customTheme;
  }

  toggle(): void {
    this._mode = this._mode === 'light' ? 'dark' : 'light';
    this.apply();
    localStorage.setItem(STORAGE_KEY, this._mode);
  }

  async setCustomTheme(themeIdOrUrl: string): Promise<void> {
    this._customTheme = themeIdOrUrl;
    localStorage.setItem(CUSTOM_THEME_KEY, themeIdOrUrl);
    await this.loadCustomTheme(themeIdOrUrl);
  }

  async cyclePreset(): Promise<string> {
    const idx = PRESET_THEMES.findIndex((t) => t.id === this._customTheme);
    const next = PRESET_THEMES[(idx + 1) % PRESET_THEMES.length];
    await this.setCustomTheme(next.id);
    return next.id;
  }

  private apply(): void {
    document.documentElement.setAttribute('data-theme', this._mode);
  }

  private async loadCustomTheme(themeIdOrUrl: string): Promise<void> {
    if (themeIdOrUrl === 'default') {
      this.customStyleEl.textContent = '';
      return;
    }

    // Determine URL: preset id or external URL
    const isPreset = PRESET_THEMES.some((t) => t.id === themeIdOrUrl);
    const url = isPreset ? `themes/${themeIdOrUrl}.css` : themeIdOrUrl;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status}`);
      const css = await res.text();
      this.customStyleEl.textContent = css;
    } catch (err) {
      console.warn(`Failed to load theme: ${url}`, err);
      this.customStyleEl.textContent = '';
    }
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

import { SlideEngine } from '../engine/slide-engine';
import { ThemeManager } from '../theme/theme-manager';
import { CameraOverlay } from '../camera/camera-overlay';
import { SlideGrid } from './slide-grid';
import type { SlideRenderer } from '../renderer/slide-renderer';
import { Timer } from './timer';
import { printDeck } from './print';
import { HelpOverlay } from './help';
import { PresenterView } from './presenter';

interface ControlsDeps {
  engine: SlideEngine;
  theme: ThemeManager;
  camera: CameraOverlay;
  progressBar: HTMLElement;
  renderer: SlideRenderer;
}

export function initControls(
  container: HTMLElement,
  { engine, theme, camera, progressBar, renderer }: ControlsDeps,
): void {
  const help = new HelpOverlay();
  const grid = new SlideGrid(engine);
  const timer = new Timer();

  // --- Helper to create buttons ---
  function btn(text: string, title: string, onClick: () => void): HTMLButtonElement {
    const b = document.createElement('button');
    b.className = 'ctrl-btn';
    b.title = title;
    b.textContent = text;
    b.addEventListener('click', onClick);
    return b;
  }

  // === Main toolbar buttons ===

  // Slide counter
  const counter = document.createElement('span');
  counter.className = 'ctrl-counter';
  const updateCounter = () => {
    counter.textContent = `${engine.currentIndex + 1} / ${engine.slideCount}`;
  };
  updateCounter();
  engine.on('slidechange', updateCounter);

  // Theme (light/dark)
  const themeBtn = btn(
    theme.mode === 'dark' ? 'Light' : 'Dark',
    'テーマ切替 (T)',
    () => { theme.toggle(); themeBtn.textContent = theme.mode === 'dark' ? 'Light' : 'Dark'; },
  );

  // Custom theme preset
  const customThemeBtn = btn(
    theme.customTheme,
    'カスタムテーマ切替',
    async () => { customThemeBtn.textContent = await theme.cyclePreset(); },
  );

  // Grid (with Print inside)
  const gridBtn = document.createElement('button');
  gridBtn.className = 'ctrl-btn';
  gridBtn.title = 'スライド一覧 (G)';
  gridBtn.textContent = 'Grid';
  gridBtn.addEventListener('click', (e) => { e.stopPropagation(); grid.toggle(); });

  // Fullscreen
  const fsBtn = btn('Full', 'フルスクリーン (F)', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  // Help
  const helpBtn = btn('?', 'ヘルプ (?)', () => help.toggle());

  // Camera
  const cameraBtn = btn('Cam', 'カメラ ON/OFF (C)', async () => {
    await camera.toggle();
    cameraBtn.classList.toggle('active', camera.active);
    syncOptVisibility();
  });

  // Camera shape
  const shapeBtn = btn(
    camera.shape === 'circle' ? '○' : '□',
    'カメラ形状',
    () => { camera.toggleShape(); shapeBtn.textContent = camera.shape === 'circle' ? '○' : '□'; },
  );

  // Camera size
  const sizeLabels = { small: 'S', medium: 'M', large: 'L' } as const;
  const sizeBtn = btn(sizeLabels[camera.size], 'カメラサイズ', () => {
    camera.cycleSize();
    sizeBtn.textContent = sizeLabels[camera.size];
  });


  // Progress bar
  const progBtn = btn('Prog', 'プログレスバー (P)', () => {
    progressBar.classList.toggle('hidden');
    progBtn.classList.toggle('active', !progressBar.classList.contains('hidden'));
  });
  progBtn.classList.add('active');

  // Transition
  const transBtn = btn(renderer.transition, 'トランジション切替', () => {
    transBtn.textContent = renderer.cycleTransition();
  });

  // Timer mode
  const timerModeLabels = { elapsed: 'Timer', clock: 'Clock', off: 'Timer Off' } as const;
  const timerBtn = btn(timerModeLabels[timer.mode], 'タイマーモード切替', () => {
    timerBtn.textContent = timerModeLabels[timer.cycleMode()];
    syncOptVisibility();
  });

  // Timer position
  const posLabels: Record<string, string> = {
    'toolbar': 'Pos:Bar', 'top-left': 'Pos:TL', 'top-right': 'Pos:TR',
    'bottom-left': 'Pos:BL', 'bottom-right': 'Pos:BR',
  };
  const timerPosBtn = btn(posLabels[timer.position], 'タイマー表示位置', () => {
    timerPosBtn.textContent = posLabels[timer.cyclePosition()];
  });


  // --- Group: dividers ---
  function sep(): HTMLElement {
    const s = document.createElement('span');
    s.className = 'ctrl-sep';
    return s;
  }

  // Presenter view
  const presenter = new PresenterView(engine);

  // --- Layout ---
  const camSep = sep();
  const timerSep = sep();

  container.append(
    counter, timer.inlineElement,
    sep(),
    themeBtn, customThemeBtn, progBtn, transBtn,
    sep(),
    cameraBtn, shapeBtn, sizeBtn,
    camSep,
    timerBtn, timerPosBtn,
    timerSep,
    gridBtn, helpBtn, fsBtn,
  );

  // Sync all conditional visibility
  function syncOptVisibility() {
    const camOn = camera.active;
    shapeBtn.style.display = camOn ? '' : 'none';
    sizeBtn.style.display = camOn ? '' : 'none';
    // camSep: divider after camera group, hide when no camera options showing
    camSep.style.display = camOn ? '' : 'none';

    const timerOn = timer.mode !== 'off';
    timerPosBtn.style.display = timerOn ? '' : 'none';
    // timerSep: divider after timer group, hide when no timer options showing
    timerSep.style.display = timerOn ? '' : 'none';
  }
  syncOptVisibility();

  // === Grid overlay actions ===
  grid.addAction('Presenter', () => presenter.open());
  grid.addAction('Print / PDF', () => {
    const viewport = document.getElementById('slide-viewport')!;
    printDeck(engine, viewport);
  });

  // === Toolbar visibility ===
  let hideTimerId: ReturnType<typeof setTimeout> | null = null;

  function showToolbar() {
    container.classList.add('visible');
    resetHideTimer();
  }
  function hideToolbar() {
    container.classList.remove('visible');
  }
  function resetHideTimer() {
    if (hideTimerId) clearTimeout(hideTimerId);
    hideTimerId = setTimeout(hideToolbar, 3000);
  }
  function toggleToolbar() {
    if (container.classList.contains('visible')) {
      hideToolbar();
      if (hideTimerId) clearTimeout(hideTimerId);
    } else {
      showToolbar();
    }
  }

  document.addEventListener('contextmenu', (e) => { e.preventDefault(); toggleToolbar(); });
  document.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) { e.preventDefault(); toggleToolbar(); }
  });

  // === Keyboard shortcuts ===
  document.addEventListener('keydown', (e) => {
    // ? for help
    if (e.key === '?') {
      e.preventDefault();
      help.toggle();
      return;
    }
    // G for grid
    if ((e.key === 'g' || e.key === 'G') && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      grid.toggle();
      return;
    }
    // Escape: close overlays in order
    if (e.key === 'Escape') {
      e.preventDefault();
      if (help.visible) { help.hide(); return; }
      if (grid.visible) { grid.hide(); return; }
      toggleToolbar();
      return;
    }
    if (e.ctrlKey || e.metaKey) return;
    switch (e.key.toLowerCase()) {
      case 'm':
        e.preventDefault();
        toggleToolbar();
        break;
      case 't':
        theme.toggle();
        themeBtn.textContent = theme.mode === 'dark' ? 'Light' : 'Dark';
        break;
      case 'c':
        camera.toggle().then(() => {
          cameraBtn.classList.toggle('active', camera.active);
          syncOptVisibility();
        });
        break;
      case 'p':
        progressBar.classList.toggle('hidden');
        progBtn.classList.toggle('active', !progressBar.classList.contains('hidden'));
        break;
    }
  });
}

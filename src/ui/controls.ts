import { SlideEngine } from '../engine/slide-engine';
import { ThemeManager } from '../theme/theme-manager';
import { CameraOverlay } from '../camera/camera-overlay';
import { SlideGrid } from './slide-grid';
import type { SlideRenderer } from '../renderer/slide-renderer';
import { Timer } from './timer';
import { printDeck } from './print';
import { HelpOverlay } from './help';
import { PresenterView } from './presenter';
import { BlackoutOverlay } from './blackout';
import { SpotlightOverlay } from './spotlight';
import { DrawingOverlay } from './drawing';
import { Magnifier } from './magnifier';
import { LaserPointer } from './laser';
import { SlideNumber } from './slide-number';
import { Autoplay } from './autoplay';
import { QRCodeOverlay } from './qrcode';
import { FontSize } from './font-size';
import { AspectRatio } from './aspect-ratio';

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
  const blackout = new BlackoutOverlay();
  const spotlight = new SpotlightOverlay();
  const drawing = new DrawingOverlay();
  const magnifier = new Magnifier(document.getElementById('slide-viewport')!);
  const laser = new LaserPointer();
  const slideNumber = new SlideNumber();
  const autoplay = new Autoplay(engine);
  const qrcode = new QRCodeOverlay();
  const fontSize = new FontSize();
  const aspectRatio = new AspectRatio(document.getElementById('slide-viewport')!);

  /** Lock slide navigation when drawing or zooming */
  function syncNavLock() {
    engine.navigationLocked = drawing.active || magnifier.active;
  }

  // Sync drawing canvas with slide changes (hide during transition to prevent flash)
  engine.on('slidechange', () => {
    drawing.hideCanvas();
    drawing.onSlideChange(engine.currentIndex);
    requestAnimationFrame(() => drawing.showCanvas());
    slideNumber.update(engine.currentIndex + 1, engine.slideCount);
  });

  // Initial slide number
  slideNumber.update(engine.currentIndex + 1, engine.slideCount);

  // Stop auto-play on manual keyboard/click navigation
  // (we hook into keydown/click rather than slidechange to avoid stopping on autoplay's own advance)

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

  // Slide counter (clickable to toggle slide number display)
  const counter = document.createElement('span');
  counter.className = 'ctrl-counter';
  counter.style.cursor = 'pointer';
  counter.title = 'スライド番号表示切替 (N)';
  counter.addEventListener('click', () => slideNumber.toggle());
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

  // Font size
  const fontSizeBtn = btn(fontSize.label, 'フォントサイズ (+/-/0)', () => {
    fontSizeBtn.textContent = fontSize.reset();
  });
  const fontUpBtn = btn('A+', 'フォント拡大 (+)', () => {
    fontSizeBtn.textContent = fontSize.increase();
  });
  const fontDownBtn = btn('A-', 'フォント縮小 (-)', () => {
    fontSizeBtn.textContent = fontSize.decrease();
  });

  // Aspect ratio
  const ratioBtn = btn(aspectRatio.ratioLabel, 'アスペクト比切替', () => {
    ratioBtn.textContent = aspectRatio.cycleRatio();
  });

  // Size
  const slideSizeBtn = btn(aspectRatio.sizeLabel, 'サイズ切替', () => {
    slideSizeBtn.textContent = aspectRatio.cycleSize();
  });

  // Timer mode
  const timerModeLabels = { elapsed: 'Timer', clock: 'Clock', countdown: 'Count', off: 'Timer Off' } as const;
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


  // Autoplay
  const autoPlayBtn = btn('▶', '自動再生 (A)', () => {
    if (autoplay.active) {
      autoplay.stop();
      autoSettingsPanel.classList.remove('visible');
    } else {
      syncAutoSettingsUI();
      autoSettingsPanel.classList.add('visible');
      const rect = autoPlayBtn.getBoundingClientRect();
      autoSettingsPanel.style.left = `${rect.left}px`;
      autoSettingsPanel.style.bottom = `${window.innerHeight - rect.top + 8}px`;
    }
    updateAutoplayBtns();
  });

  // Settings popover
  const autoSettingsPanel = document.createElement('div');
  autoSettingsPanel.className = 'auto-settings-panel';
  autoSettingsPanel.innerHTML = `
    <label>
      <span>スライド間隔</span>
      <input type="range" min="3" max="30" step="1" class="auto-slide-range" />
      <span class="auto-slide-val"></span>
    </label>
    <label>
      <span>フラグメント間隔</span>
      <input type="range" min="1" max="10" step="0.5" class="auto-frag-range" />
      <span class="auto-frag-val"></span>
    </label>
    <label class="auto-repeat-label">
      <input type="checkbox" class="auto-repeat-check" />
      <span>リピート</span>
    </label>
    <button type="button" class="auto-start-btn">▶ 再生開始</button>
  `;
  document.body.appendChild(autoSettingsPanel);

  const slideRange = autoSettingsPanel.querySelector('.auto-slide-range') as HTMLInputElement;
  const slideVal = autoSettingsPanel.querySelector('.auto-slide-val') as HTMLElement;
  const fragRange = autoSettingsPanel.querySelector('.auto-frag-range') as HTMLInputElement;
  const fragVal = autoSettingsPanel.querySelector('.auto-frag-val') as HTMLElement;
  const repeatCheck = autoSettingsPanel.querySelector('.auto-repeat-check') as HTMLInputElement;

  function syncAutoSettingsUI() {
    slideRange.value = String(autoplay.slideInterval);
    slideVal.textContent = `${autoplay.slideInterval}s`;
    fragRange.value = String(autoplay.fragmentInterval);
    fragVal.textContent = `${autoplay.fragmentInterval}s`;
    repeatCheck.checked = autoplay.repeat;
  }
  syncAutoSettingsUI();

  slideRange.addEventListener('input', () => {
    const v = parseFloat(slideRange.value);
    autoplay.setSlideInterval(v);
    slideVal.textContent = `${v}s`;
  });
  fragRange.addEventListener('input', () => {
    const v = parseFloat(fragRange.value);
    autoplay.setFragmentInterval(v);
    fragVal.textContent = `${v}s`;
  });
  repeatCheck.addEventListener('change', () => {
    autoplay.setRepeat(repeatCheck.checked);
  });

  const autoStartBtn = autoSettingsPanel.querySelector('.auto-start-btn') as HTMLButtonElement;
  autoStartBtn.addEventListener('click', () => {
    autoSettingsPanel.classList.remove('visible');
    autoplay.start();
    updateAutoplayBtns();
  });

  // Close panel when clicking outside
  document.addEventListener('mousedown', (e) => {
    if (!autoSettingsPanel.contains(e.target as Node) &&
        e.target !== autoPlayBtn) {
      autoSettingsPanel.classList.remove('visible');
    }
  });

  function updateAutoplayBtns() {
    autoPlayBtn.textContent = autoplay.active ? '■' : '▶';
    autoPlayBtn.classList.toggle('active', autoplay.active);
  }

  autoplay.onChange(updateAutoplayBtns);

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
    autoPlayBtn,
    sep(),
    themeBtn, customThemeBtn, progBtn, transBtn, fontDownBtn, fontSizeBtn, fontUpBtn, ratioBtn, slideSizeBtn,
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
  grid.addAction('Share', () => {
    const url = new URL(location.href);
    url.hash = String(engine.currentIndex + 1);
    navigator.clipboard.writeText(url.toString()).then(() => {
      const toast = document.createElement('div');
      toast.className = 'share-copied-toast';
      toast.textContent = 'Copied!';
      document.body.appendChild(toast);
      requestAnimationFrame(() => toast.classList.add('visible'));
      setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 200);
      }, 1500);
    }).catch(() => {});
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

  // === D key hold state for arrow key combos ===
  let dKeyHeld = false;

  document.addEventListener('keyup', (e) => {
    if (e.key === 'd' || e.key === 'D') {
      dKeyHeld = false;
    }
  });

  // === Keyboard shortcuts ===
  document.addEventListener('keydown', (e) => {
    // D held + arrow keys: change pen color/width
    if (dKeyHeld && drawing.active) {
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          drawing.nextColor();
          return;
        case 'ArrowLeft':
          e.preventDefault();
          drawing.prevColor();
          return;
        case 'ArrowUp':
          e.preventDefault();
          drawing.nextWidth();
          return;
        case 'ArrowDown':
          e.preventDefault();
          drawing.prevWidth();
          return;
      }
    }
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
      if (qrcode.visible) { qrcode.hide(); return; }
      if (laser.active) { laser.deactivate(); return; }
      if (drawing.active) { drawing.deactivate(); syncNavLock(); return; }
      if (magnifier.active) { magnifier.dismiss(); syncNavLock(); return; }
      if (blackout.active) { blackout.dismiss(); return; }
      if (help.visible) { help.hide(); return; }
      if (grid.visible) { grid.hide(); return; }
      toggleToolbar();
      return;
    }

    // Undo drawing (Ctrl/Cmd+Z)
    if (drawing.active && e.key === 'z' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      drawing.undo();
      return;
    }

    // Drawing mode: number keys 1-5 to change color, Q to cycle width
    if (drawing.active) {
      if (e.key >= '1' && e.key <= '5') {
        e.preventDefault();
        drawing.setColor(parseInt(e.key, 10) - 1);
        return;
      }
      if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        drawing.cycleWidth();
        return;
      }
    }

    // Dismiss blackout on any key (except B/W which toggle)
    if (blackout.active && e.key !== 'b' && e.key !== 'B' && e.key !== 'w' && e.key !== 'W') {
      blackout.dismiss();
      return;
    }

    if (e.ctrlKey || e.metaKey) return;

    // Shift+D: clear drawings
    if (e.key === 'D' && e.shiftKey) {
      e.preventDefault();
      drawing.clear();
      return;
    }

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
      case 'b':
        e.preventDefault();
        blackout.toggleBlack();
        break;
      case 'w':
        e.preventDefault();
        blackout.toggleWhite();
        break;
      case 's':
        e.preventDefault();
        spotlight.toggle();
        break;
      case 'd':
        e.preventDefault();
        if (!dKeyHeld) {
          drawing.toggle();
          syncNavLock();
        }
        dKeyHeld = true;
        break;
      case 'z':
        e.preventDefault();
        magnifier.toggle();
        syncNavLock();
        break;
      case 'l':
        e.preventDefault();
        laser.toggle();
        break;
      case 'n':
        e.preventDefault();
        slideNumber.toggle();
        break;
      case 'a':
        e.preventDefault();
        autoplay.toggle();
        updateAutoplayBtns();
        break;
      case 'r':
        e.preventDefault();
        qrcode.toggle();
        break;
      case '+':
      case ';':
        e.preventDefault();
        fontSizeBtn.textContent = fontSize.increase();
        break;
      case '-':
        e.preventDefault();
        fontSizeBtn.textContent = fontSize.decrease();
        break;
      case '0':
        e.preventDefault();
        fontSizeBtn.textContent = fontSize.reset();
        break;
    }
  });

  // Stop auto-play on manual navigation keys
  document.addEventListener('keydown', (e) => {
    if (!autoplay.active) return;
    const navKeys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', ' ', 'Home', 'End'];
    if (navKeys.includes(e.key)) {
      autoplay.stop();
    }
  });
}

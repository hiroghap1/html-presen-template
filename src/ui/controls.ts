import { SlideEngine } from '../engine/slide-engine';
import { ThemeManager } from '../theme/theme-manager';
import { CameraOverlay } from '../camera/camera-overlay';
import { SlideGrid } from './slide-grid';

interface ControlsDeps {
  engine: SlideEngine;
  theme: ThemeManager;
  camera: CameraOverlay;
  progressBar: HTMLElement;
}

export function initControls(
  container: HTMLElement,
  { engine, theme, camera, progressBar }: ControlsDeps,
): void {
  // Theme toggle
  const themeBtn = document.createElement('button');
  themeBtn.className = 'ctrl-btn';
  themeBtn.title = 'テーマ切替 (T)';
  themeBtn.textContent = theme.mode === 'dark' ? 'Light' : 'Dark';
  themeBtn.addEventListener('click', () => {
    theme.toggle();
    themeBtn.textContent = theme.mode === 'dark' ? 'Light' : 'Dark';
  });

  // Camera toggle
  const cameraBtn = document.createElement('button');
  cameraBtn.className = 'ctrl-btn';
  cameraBtn.title = 'カメラ ON/OFF (C)';
  cameraBtn.textContent = 'Cam';
  cameraBtn.addEventListener('click', () => {
    camera.toggle();
    cameraBtn.classList.toggle('active', camera.active);
  });

  // Camera shape toggle
  const shapeBtn = document.createElement('button');
  shapeBtn.className = 'ctrl-btn';
  shapeBtn.title = 'カメラ形状';
  shapeBtn.textContent = camera.shape === 'circle' ? '○' : '□';
  shapeBtn.addEventListener('click', () => {
    camera.toggleShape();
    shapeBtn.textContent = camera.shape === 'circle' ? '○' : '□';
  });

  // Camera size cycle
  const sizeBtn = document.createElement('button');
  sizeBtn.className = 'ctrl-btn';
  sizeBtn.title = 'カメラサイズ';
  const sizeLabels = { small: 'S', medium: 'M', large: 'L' } as const;
  sizeBtn.textContent = sizeLabels[camera.size];
  sizeBtn.addEventListener('click', () => {
    camera.cycleSize();
    sizeBtn.textContent = sizeLabels[camera.size];
  });

  // Slide counter
  const counter = document.createElement('span');
  counter.className = 'ctrl-counter';
  const updateCounter = () => {
    counter.textContent = `${engine.currentIndex + 1} / ${engine.slideCount}`;
  };
  updateCounter();
  engine.on('slidechange', updateCounter);

  // Fullscreen
  const fsBtn = document.createElement('button');
  fsBtn.className = 'ctrl-btn';
  fsBtn.title = 'フルスクリーン (F)';
  fsBtn.textContent = 'Full';
  fsBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  // Slide grid
  const grid = new SlideGrid(engine);
  const gridBtn = document.createElement('button');
  gridBtn.className = 'ctrl-btn';
  gridBtn.title = 'スライド一覧 (G)';
  gridBtn.textContent = 'Grid';
  gridBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    grid.toggle();
  });

  // Progress bar toggle
  const progBtn = document.createElement('button');
  progBtn.className = 'ctrl-btn active';
  progBtn.title = 'プログレスバー (P)';
  progBtn.textContent = 'Prog';
  progBtn.addEventListener('click', () => {
    progressBar.classList.toggle('hidden');
    progBtn.classList.toggle('active', !progressBar.classList.contains('hidden'));
  });

  container.append(themeBtn, cameraBtn, shapeBtn, sizeBtn, counter, gridBtn, progBtn, fsBtn);

  // Toolbar visibility management
  let hideTimer: ReturnType<typeof setTimeout> | null = null;

  function showToolbar() {
    container.classList.add('visible');
    resetHideTimer();
  }

  function hideToolbar() {
    container.classList.remove('visible');
  }

  function resetHideTimer() {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(hideToolbar, 3000);
  }

  function toggleToolbar() {
    if (container.classList.contains('visible')) {
      hideToolbar();
      if (hideTimer) clearTimeout(hideTimer);
    } else {
      showToolbar();
    }
  }

  // Right-click (contextmenu) to show toolbar
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    toggleToolbar();
  });

  // Two-finger tap (touchstart with 2 touches)
  document.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      toggleToolbar();
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // G to toggle slide grid
    if (e.key === 'g' || e.key === 'G') {
      if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        grid.toggle();
        return;
      }
    }
    // Escape: close grid first, otherwise toggle toolbar
    if (e.key === 'Escape') {
      if (grid.visible) {
        e.preventDefault();
        grid.hide();
        return;
      }
      if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toggleToolbar();
      }
      return;
    }
    // M to toggle toolbar
    if (e.key === 'm' || e.key === 'M') {
      if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toggleToolbar();
      }
    }
    if (e.key === 't' || e.key === 'T') {
      if (!e.ctrlKey && !e.metaKey) {
        theme.toggle();
        themeBtn.textContent = theme.mode === 'dark' ? 'Light' : 'Dark';
      }
    }
    if (e.key === 'c' || e.key === 'C') {
      if (!e.ctrlKey && !e.metaKey) {
        camera.toggle();
        setTimeout(() => {
          cameraBtn.classList.toggle('active', camera.active);
        }, 100);
      }
    }
    if (e.key === 'p' || e.key === 'P') {
      if (!e.ctrlKey && !e.metaKey) {
        progressBar.classList.toggle('hidden');
        progBtn.classList.toggle('active', !progressBar.classList.contains('hidden'));
      }
    }
  });
}

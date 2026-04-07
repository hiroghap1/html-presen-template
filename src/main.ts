import './style.css';
import { loadDeck, loadDeckFromText } from './loader';
import { SlideEngine } from './engine/slide-engine';
import { SlideRenderer } from './renderer/slide-renderer';
import { ThemeManager } from './theme/theme-manager';
import { CameraOverlay } from './camera/camera-overlay';
import { initControls } from './ui/controls';
import { showStartPage, type DeckSource } from './ui/start-page';
import { AspectRatio } from './ui/aspect-ratio';
import type { Deck } from './types';

async function main() {
  const params = new URLSearchParams(location.search);
  const deckPath = params.get('deck');

  const viewport = document.getElementById('slide-viewport')!;
  const cameraContainer = document.getElementById('camera-overlay')!;
  const controlsContainer = document.getElementById('controls')!;

  // Initialize viewport size early (sets meta viewport width + CSS vars + zoom)
  new AspectRatio(viewport);

  // Initialize theme early so start page also gets themed
  const theme = new ThemeManager();

  // Apply theme from URL parameter if specified
  const themeParam = params.get('theme');
  if (themeParam) {
    theme.setCustomTheme(themeParam);
  }

  if (deckPath) {
    // Direct deck load via URL parameter
    await startPresentation(deckPath, viewport, cameraContainer, controlsContainer, theme);
  } else {
    // Show start page
    const source = await showStartPage(viewport);
    await startFromSource(source, viewport, cameraContainer, controlsContainer, theme);
  }
}

async function startFromSource(
  source: DeckSource,
  viewport: HTMLElement,
  cameraContainer: HTMLElement,
  controlsContainer: HTMLElement,
  theme: ThemeManager,
) {
  if (source.type === 'url') {
    // Update URL parameter so refresh works
    const url = new URL(location.href);
    url.searchParams.set('deck', source.path);
    url.hash = '';
    history.replaceState(null, '', url.toString());
    await startPresentation(source.path, viewport, cameraContainer, controlsContainer, theme);
  } else {
    // File loaded from local filesystem
    const deck = loadDeckFromText(source.text, source.name);
    launchEngine(deck, viewport, cameraContainer, controlsContainer, theme);
  }
}

async function startPresentation(
  path: string,
  viewport: HTMLElement,
  cameraContainer: HTMLElement,
  controlsContainer: HTMLElement,
  theme: ThemeManager,
) {
  try {
    const deck = await loadDeck(path);
    launchEngine(deck, viewport, cameraContainer, controlsContainer, theme);
  } catch (err) {
    viewport.innerHTML = `<div style="padding:2rem;color:red;">
      <h2>デッキの読み込みに失敗しました</h2>
      <p>${err instanceof Error ? err.message : String(err)}</p>
      <p><a href="${location.pathname}" style="color:var(--slide-accent)">スタートページに戻る</a></p>
    </div>`;
  }
}

function launchEngine(
  deck: Deck,
  viewport: HTMLElement,
  cameraContainer: HTMLElement,
  controlsContainer: HTMLElement,
  theme: ThemeManager,
) {
  viewport.style.cursor = '';
  const engine = new SlideEngine(deck);
  const renderer = new SlideRenderer(engine, viewport);
  const camera = new CameraOverlay(cameraContainer);
  const progressBar = document.getElementById('progress-bar')!;

  const updateProgress = () => {
    const pct = engine.slideCount <= 1
      ? 100
      : (engine.currentIndex / (engine.slideCount - 1)) * 100;
    progressBar.style.width = `${pct}%`;
  };

  initControls(controlsContainer, { engine, theme, camera, progressBar, renderer });

  engine.on('slidechange', updateProgress);
  engine.initKeyboard();
  engine.initClickNavigation(viewport);
  engine.initSwipeNavigation(viewport);
  engine.initHash();
  renderer.render();
  updateProgress();
}

main();

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

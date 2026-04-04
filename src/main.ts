import './style.css';
import { loadDeck } from './loader';
import { SlideEngine } from './engine/slide-engine';
import { SlideRenderer } from './renderer/slide-renderer';
import { ThemeManager } from './theme/theme-manager';
import { CameraOverlay } from './camera/camera-overlay';
import { initControls } from './ui/controls';

async function main() {
  const params = new URLSearchParams(location.search);
  const deckPath = params.get('deck') ?? 'decks/sample.md';

  const viewport = document.getElementById('slide-viewport')!;
  const cameraContainer = document.getElementById('camera-overlay')!;
  const controlsContainer = document.getElementById('controls')!;

  try {
    const deck = await loadDeck(deckPath);
    const engine = new SlideEngine(deck);
    const renderer = new SlideRenderer(engine, viewport);
    const theme = new ThemeManager();
    const camera = new CameraOverlay(cameraContainer);

    initControls(controlsContainer, { engine, theme, camera });

    engine.initKeyboard();
    engine.initClickNavigation(viewport);
    renderer.render();
  } catch (err) {
    viewport.innerHTML = `<div style="padding:2rem;color:red;">
      <h2>デッキの読み込みに失敗しました</h2>
      <p>${err instanceof Error ? err.message : String(err)}</p>
      <p>URLパラメータ <code>?deck=path/to/file.md</code> でデッキを指定してください。</p>
    </div>`;
  }
}

main();

import { SlideEngine } from '../engine/slide-engine';

export function printDeck(engine: SlideEngine, viewport: HTMLElement): void {
  // Save current content
  const saved = viewport.innerHTML;

  // Render all slides into the viewport for printing
  viewport.innerHTML = '';
  engine.slides.forEach((slide) => {
    const page = document.createElement('div');
    page.className = 'print-page';
    page.innerHTML = slide.html;
    viewport.appendChild(page);
  });

  window.print();

  // Restore after print dialog closes
  const restore = () => {
    viewport.innerHTML = saved;
    window.removeEventListener('afterprint', restore);
  };
  window.addEventListener('afterprint', restore);
}

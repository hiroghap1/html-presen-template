import { SlideEngine } from '../engine/slide-engine';

const CHANNEL_NAME = 'wsp-presenter';

export class PresenterView {
  private engine: SlideEngine;
  private win: Window | null = null;
  private channel: BroadcastChannel;

  constructor(engine: SlideEngine) {
    this.engine = engine;
    this.channel = new BroadcastChannel(CHANNEL_NAME);

    engine.on('slidechange', () => this.broadcast());
    engine.on('fragmentchange', () => this.broadcast());
  }

  open(): void {
    if (this.win && !this.win.closed) {
      this.win.focus();
      return;
    }

    this.win = window.open('', 'presenter', 'width=800,height=600');
    if (!this.win) return;

    this.win.document.write(this.buildHTML());
    this.win.document.close();

    // Inject deck CSS once the document is ready
    this.injectDeckCss();
    this.updateContent();
  }

  private broadcast(): void {
    this.channel.postMessage({
      index: this.engine.currentIndex,
      fragment: this.engine.currentFragment,
    });
    this.updateContent();
  }

  private injectDeckCss(): void {
    if (!this.win || this.win.closed) return;
    const doc = this.win.document;
    const deckStyle = doc.getElementById('pv-deck-css');
    if (deckStyle) {
      deckStyle.textContent = this.engine.deckCss;
    }
  }

  private updateContent(): void {
    if (!this.win || this.win.closed) return;
    const doc = this.win.document;

    const current = this.engine.currentSlide;
    const nextSlide = this.engine.slides[this.engine.currentIndex + 1];

    const currentEl = doc.getElementById('pv-current');
    const nextEl = doc.getElementById('pv-next');
    const notesEl = doc.getElementById('pv-notes');
    const counterEl = doc.getElementById('pv-counter');

    if (currentEl) currentEl.innerHTML = current?.html ?? '';
    if (nextEl) nextEl.innerHTML = nextSlide?.html ?? '<p class="pv-end-msg">最後のスライドです</p>';
    if (notesEl) notesEl.textContent = current?.notes ?? '';
    if (counterEl) counterEl.textContent = `${this.engine.currentIndex + 1} / ${this.engine.slideCount}`;

    // Re-scale after content injection
    if (this.win) {
      this.win.postMessage('rescale', '*');
    }
  }

  private buildHTML(): string {
    return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>Presenter View</title>
<style id="pv-deck-css"></style>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "Hiragino Kaku Gothic ProN", "Hiragino Sans", sans-serif;
    background: #1a1a2e; color: #e2e8f0;
    display: grid;
    grid-template-columns: 2fr 1fr;
    grid-template-rows: auto 1fr;
    height: 100vh;
    gap: 1rem;
    padding: 1rem;
  }
  #pv-header {
    grid-column: 1 / -1;
    display: flex; justify-content: space-between; align-items: center;
    font-size: 0.85rem; color: #94a3b8;
  }
  #pv-counter { font-variant-numeric: tabular-nums; }
  #pv-timer { font-variant-numeric: tabular-nums; }

  /* Current slide */
  #pv-current-wrap {
    border: 1px solid #334155; border-radius: 8px;
    overflow: hidden; background: #fff; color: #1a1a2e;
    position: relative;
  }
  #pv-current {
    width: 960px;
    transform-origin: top left;
  }
  /* Scope deck CSS: reset section sizing for preview */
  #pv-current > section,
  #pv-next > section {
    position: relative !important;
    width: 960px !important;
    height: auto !important;
    min-height: 0 !important;
    padding: 2rem !important;
  }

  /* Sidebar */
  #pv-sidebar {
    display: flex; flex-direction: column; gap: 1rem;
    overflow: hidden;
  }
  #pv-next-wrap {
    position: relative;
    border: 1px solid #334155; border-radius: 8px;
    overflow: hidden; background: #fff; color: #1a1a2e;
    flex: 0 0 auto; max-height: 40%;
  }
  #pv-next-wrap::before {
    content: 'NEXT'; position: absolute; top: 4px; left: 8px;
    font-size: 0.65rem; color: #94a3b8; text-transform: uppercase;
    z-index: 1;
  }
  #pv-next {
    width: 960px;
    transform-origin: top left;
  }
  .pv-end-msg {
    padding: 2rem; color: #888; font-size: 1rem;
  }

  /* Notes */
  #pv-notes-wrap {
    flex: 1; overflow-y: auto;
    border: 1px solid #334155; border-radius: 8px;
    padding: 1rem;
  }
  #pv-notes-wrap h3 {
    font-size: 0.75rem; color: #94a3b8; margin-bottom: 0.5rem;
    text-transform: uppercase; letter-spacing: 0.05em;
  }
  #pv-notes {
    font-size: 1.1rem; line-height: 1.7; white-space: pre-wrap;
  }
</style>
</head>
<body>
  <div id="pv-header">
    <span id="pv-counter"></span>
    <span id="pv-timer"></span>
  </div>
  <div id="pv-current-wrap"><div id="pv-current"></div></div>
  <div id="pv-sidebar">
    <div id="pv-next-wrap"><div id="pv-next"></div></div>
    <div id="pv-notes-wrap">
      <h3>Notes</h3>
      <div id="pv-notes"></div>
    </div>
  </div>
  <script>
    function rescale() {
      scaleSlide('pv-current', 'pv-current-wrap');
      scaleSlide('pv-next', 'pv-next-wrap');
    }

    function scaleSlide(innerId, wrapperId) {
      var inner = document.getElementById(innerId);
      var wrap = document.getElementById(wrapperId);
      if (!inner || !wrap) return;
      var scale = wrap.clientWidth / 960;
      inner.style.transform = 'scale(' + scale + ')';
      // Set the wrapper's effective content height
      var contentH = inner.scrollHeight * scale;
      // Don't constrain — let it just scale down
    }

    var obs = new ResizeObserver(rescale);
    obs.observe(document.getElementById('pv-current-wrap'));
    obs.observe(document.getElementById('pv-next-wrap'));

    // Listen for rescale requests from main window
    window.addEventListener('message', function(e) {
      if (e.data === 'rescale') {
        requestAnimationFrame(rescale);
      }
    });

    // Timer
    var start = Date.now();
    var timerEl = document.getElementById('pv-timer');
    setInterval(function() {
      var s = Math.floor((Date.now() - start) / 1000);
      var m = Math.floor(s / 60);
      timerEl.textContent = String(m).padStart(2,'0') + ':' + String(s%60).padStart(2,'0');
    }, 1000);
  </script>
</body>
</html>`;
  }
}

export function listenForPresenterSync(engine: SlideEngine): void {
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = (e) => {
    const { index } = e.data;
    if (typeof index === 'number' && index !== engine.currentIndex) {
      engine.goTo(index);
    }
  };
}

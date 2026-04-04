import { detectFormat } from '../loader';

/**
 * Render the start page into the viewport.
 * Returns a Promise that resolves with either:
 *   - { type: 'url', path: string } — a remote deck path to fetch
 *   - { type: 'file', text: string, name: string } — a local file's content
 */
export interface DeckSourceUrl {
  type: 'url';
  path: string;
}

export interface DeckSourceFile {
  type: 'file';
  text: string;
  name: string;
}

export type DeckSource = DeckSourceUrl | DeckSourceFile;

export function showStartPage(viewport: HTMLElement): Promise<DeckSource> {
  return new Promise((resolve) => {
    viewport.innerHTML = '';
    viewport.style.cursor = 'default';

    const page = document.createElement('div');
    page.className = 'start-page';

    page.innerHTML = `
      <h1>Web Slide Presenter</h1>
      <p class="start-sub">Marp Markdown または HTML ファイルを読み込んでプレゼンテーションを開始</p>

      <div class="start-sections">
        <section class="start-section">
          <h2>ファイルを開く</h2>
          <div class="start-drop" tabindex="0">
            <p>ここにドラッグ＆ドロップ</p>
            <p class="start-or">または</p>
            <label class="start-file-label">
              ファイルを選択
              <input type="file" accept=".md,.markdown,.html,.htm" hidden />
            </label>
          </div>
        </section>

        <section class="start-section">
          <h2>URL を指定</h2>
          <form class="start-url-form">
            <input type="text" placeholder="decks/sample.md" class="start-url-input" />
            <button type="submit" class="start-url-btn">開く</button>
          </form>
        </section>

        <section class="start-section">
          <h2>サンプル</h2>
          <ul class="start-samples">
            <li>
              <a href="?deck=decks/sample.md" data-deck="decks/sample.md">Marp Markdown サンプル</a>
              <a href="decks/sample.md" download="sample.md" class="start-dl" title="ダウンロード">DL</a>
              <button type="button" class="start-prompt-btn" data-file="decks/sample.md" title="AIプロンプトをコピー">Prompt</button>
            </li>
            <li>
              <a href="?deck=decks/sample.html" data-deck="decks/sample.html">HTML デッキサンプル</a>
              <a href="decks/sample.html" download="sample.html" class="start-dl" title="ダウンロード">DL</a>
              <button type="button" class="start-prompt-btn" data-file="decks/sample.html" title="AIプロンプトをコピー">Prompt</button>
            </li>
          </ul>
        </section>

        <section class="start-section">
          <h2>テーマ</h2>
          <p class="start-theme-hint">URLパラメータ <code>?theme=テーマ名</code> で適用（例: <code>?deck=decks/sample.md&theme=neon</code>）</p>
          <div class="start-theme-list">
            <span class="start-theme-chip" data-theme-preview="default">Default</span>
            <span class="start-theme-chip" data-theme-preview="corporate">Corporate</span>
            <span class="start-theme-chip" data-theme-preview="pop">Pop</span>
            <span class="start-theme-chip" data-theme-preview="minimal">Minimal</span>
            <span class="start-theme-chip" data-theme-preview="nature">Nature</span>
            <span class="start-theme-chip" data-theme-preview="neon">Neon</span>
          </div>
        </section>
      </div>
    `;

    viewport.appendChild(page);

    // --- File input ---
    const fileInput = page.querySelector('input[type="file"]') as HTMLInputElement;
    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (file) readFile(file).then(resolve);
    });

    // --- Drag & drop ---
    const dropZone = page.querySelector('.start-drop') as HTMLElement;

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      const file = e.dataTransfer?.files[0];
      if (file) readFile(file).then(resolve);
    });

    // --- URL form ---
    const urlForm = page.querySelector('.start-url-form') as HTMLFormElement;
    const urlInput = page.querySelector('.start-url-input') as HTMLInputElement;
    urlForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const path = urlInput.value.trim();
      if (path) resolve({ type: 'url', path });
    });

    // --- Sample links ---
    page.querySelectorAll('[data-deck]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const path = (link as HTMLElement).dataset.deck!;
        resolve({ type: 'url', path });
      });
    });

    // --- Prompt copy buttons ---
    page.querySelectorAll('.start-prompt-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const file = (btn as HTMLElement).dataset.file!;
        const fileUrl = new URL(file, location.href).href;
        const text = `${fileUrl}\nこのファイルを参考にプレゼン資料を作ってください。`;
        await navigator.clipboard.writeText(text);
        const orig = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = orig; }, 1500);
      });
    });
  });
}

async function readFile(file: File): Promise<DeckSourceFile> {
  const text = await file.text();
  return { type: 'file', text, name: file.name };
}

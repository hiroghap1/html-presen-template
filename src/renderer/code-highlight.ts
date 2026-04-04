import type { Highlighter } from 'shiki';

let highlighter: Highlighter | null = null;
let loading: Promise<Highlighter> | null = null;

async function getHighlighter(): Promise<Highlighter> {
  if (highlighter) return highlighter;
  if (loading) return loading;

  loading = import('shiki').then(async ({ createHighlighter }) => {
    highlighter = await createHighlighter({
      themes: ['github-light', 'github-dark'],
      langs: [
        'javascript', 'typescript', 'html', 'css', 'json',
        'python', 'rust', 'go', 'bash', 'markdown', 'yaml', 'jsx', 'tsx',
      ],
    });
    return highlighter;
  });

  return loading;
}

/**
 * Highlight all <pre><code> blocks inside the given container.
 * Detects language from class="language-xxx" (Marp/markdown convention).
 */
export async function highlightCode(container: Element): Promise<void> {
  const codeBlocks = container.querySelectorAll('pre code');
  if (codeBlocks.length === 0) return;

  const hl = await getHighlighter();
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const theme = isDark ? 'github-dark' : 'github-light';

  codeBlocks.forEach((codeEl) => {
    const pre = codeEl.parentElement;
    if (!pre || pre.dataset.highlighted === 'true') return;

    // Detect language
    const lang = detectLang(codeEl);
    const code = codeEl.textContent ?? '';

    if (!lang || !hl.getLoadedLanguages().includes(lang)) return;

    const html = hl.codeToHtml(code, { lang, theme });
    pre.outerHTML = html;
    // Mark to avoid re-highlighting
    const newPre = container.querySelector(`pre:not([data-highlighted]) code`)?.parentElement;
    if (newPre) newPre.dataset.highlighted = 'true';
  });
}

function detectLang(codeEl: Element): string | null {
  for (const cls of codeEl.classList) {
    if (cls.startsWith('language-')) return cls.replace('language-', '');
  }
  return null;
}

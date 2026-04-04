/**
 * Fragment (step-reveal) support.
 *
 * Convention:
 *   - Elements with `data-fragment="N"` (N >= 1) are hidden until fragment step >= N.
 *   - For Marp decks, <li> elements are auto-assigned sequential fragment indices.
 */

export function autoAssignFragments(slide: Element): void {
  const items = slide.querySelectorAll('li');
  items.forEach((li, i) => {
    if (!li.hasAttribute('data-fragment')) {
      li.setAttribute('data-fragment', String(i + 1));
    }
  });
}

export function countFragments(slide: Element): number {
  let max = 0;
  slide.querySelectorAll('[data-fragment]').forEach((el) => {
    const n = parseInt(el.getAttribute('data-fragment') ?? '0', 10);
    if (n > max) max = n;
  });
  return max;
}

export function applyFragmentState(container: Element, step: number): void {
  container.querySelectorAll('[data-fragment]').forEach((el) => {
    const n = parseInt(el.getAttribute('data-fragment') ?? '0', 10);
    if (n <= step) {
      el.classList.remove('fragment-hidden');
      el.classList.add('fragment-visible');
    } else {
      el.classList.add('fragment-hidden');
      el.classList.remove('fragment-visible');
    }
  });
}

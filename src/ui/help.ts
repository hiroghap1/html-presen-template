const SHORTCUTS = [
  { key: '→ ↓ Space', desc: '次のスライド / フラグメント' },
  { key: '← ↑', desc: '前のスライド / フラグメント' },
  { key: 'Home / End', desc: '最初 / 最後のスライドへ' },
  { key: 'F', desc: 'フルスクリーン切替' },
  { key: 'G', desc: 'スライド一覧' },
  { key: 'T', desc: 'テーマ切替（ライト/ダーク）' },
  { key: 'C', desc: 'カメラ ON/OFF' },
  { key: 'P', desc: 'プログレスバー表示/非表示' },
  { key: 'M', desc: 'ツールバー表示/非表示' },
  { key: 'Esc', desc: '一覧を閉じる / ツールバー切替' },
  { key: '右クリック', desc: 'ツールバー表示/非表示' },
  { key: '2本指タップ', desc: 'ツールバー表示/非表示' },
  { key: '?', desc: 'このヘルプを表示' },
];

export class HelpOverlay {
  private overlay: HTMLElement;
  private _visible = false;

  constructor() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'help-overlay';

    const panel = document.createElement('div');
    panel.className = 'help-panel';

    const title = document.createElement('h2');
    title.textContent = 'キーボードショートカット';
    panel.appendChild(title);

    const table = document.createElement('table');
    table.className = 'help-table';
    SHORTCUTS.forEach(({ key, desc }) => {
      const tr = document.createElement('tr');
      const tdKey = document.createElement('td');
      tdKey.className = 'help-key';
      tdKey.textContent = key;
      const tdDesc = document.createElement('td');
      tdDesc.textContent = desc;
      tr.append(tdKey, tdDesc);
      table.appendChild(tr);
    });
    panel.appendChild(table);

    const hint = document.createElement('p');
    hint.className = 'help-hint';
    hint.textContent = '? または Esc で閉じる';
    panel.appendChild(hint);

    this.overlay.appendChild(panel);

    this.overlay.addEventListener('mousedown', (e) => {
      if (e.target === this.overlay) this.hide();
    });

    document.body.appendChild(this.overlay);
  }

  get visible(): boolean {
    return this._visible;
  }

  toggle(): void {
    this._visible ? this.hide() : this.show();
  }

  show(): void {
    this._visible = true;
    this.overlay.offsetHeight;
    this.overlay.classList.add('visible');
  }

  hide(): void {
    this.overlay.classList.remove('visible');
    this._visible = false;
  }
}

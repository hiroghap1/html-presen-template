---
marp: true
---

# Web プレゼンテーションツール

**ブラウザで完結するスライド表示**

株式会社ステラクリエイト

<!-- タイトルスライドです。会社紹介と製品概要を簡単に述べてから次へ進みましょう。 -->

---

## 特徴

- Marp Markdown をそのまま読み込み
- 事前ビルド不要でスライド表示
- ライト／ダークテーマ切り替え
- カメラオーバーレイ対応
- 段階表示アニメーション

<!-- 各特徴について補足説明を加えてください。特にMarp対応とカメラオーバーレイは競合にない強みです。 -->

---

## 日本語タイポグラフィ

禁則処理や和欧間スペースなど、日本語の可読性を重視したCSS設定を採用しています。

ABCDの英字と「かな漢字」の混植も美しく表示されます。

プロポーショナルメトリクス（`font-feature-settings: "palt"`）により、
約物の詰めも自然に処理されます。

---

## 操作方法

- **→ / ↓ / Space** — 次へ
- **← / ↑** — 前へ
- **F** — フルスクリーン
- **T** — テーマ切替
- **C** — カメラ ON/OFF

---

## コードブロック — JavaScript

```javascript
const marp = new Marp({ html: true });
const { html, css } = marp.render(markdown);

// ブラウザ上でリアルタイムに変換
document.body.innerHTML = html;
```

---

## コードブロック — TypeScript

```typescript
interface Slide {
  html: string;
  notes?: string;
  fragmentCount: number;
}

async function loadDeck(path: string): Promise<Slide[]> {
  const res = await fetch(path);
  const md = await res.text();
  return parseMarp(md);
}
```

---

## コードブロック — HTML / CSS

```html
<article data-slide-deck>
  <section>
    <h1>スライド 1</h1>
    <p>section 要素 = 1 ページ</p>
  </section>
  <section>
    <h2>スライド 2</h2>
  </section>
</article>
```

---

## コードブロック — Python

```python
from pathlib import Path
import markdown

def render_slides(path: str) -> list[str]:
    """Markdownファイルをスライドに分割"""
    text = Path(path).read_text()
    pages = text.split("\n---\n")
    return [markdown.markdown(p) for p in pages]
```

---

## コードブロック — Bash

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# GitHub Pages へデプロイ
git push origin main
```

---

## ご清聴ありがとうございました

質疑応答の時間です。

<!-- 質疑応答では、デモを見せながら回答するのが効果的です。Gキーでスライド一覧を開けることも紹介しましょう。 -->

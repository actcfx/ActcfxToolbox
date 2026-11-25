# Actcfx Toolbox


一些自己做的小工具與整理筆記

## 收錄內容

| 頁面 | 說明 |
|---|---|
| [日語動詞整理](src/pages/jp-verbs/) | 大家的日本語動詞整理，共 45 課，448 個動詞，附自他配對與相關詞對照。 |

## 技術

- 用 Astro 建置靜態網站，互動元件用 Svelte。
- 首頁依各頁面的 `_meta.json` 自動產生。
- 部署在 Cloudflare Workers（靜態資源）。

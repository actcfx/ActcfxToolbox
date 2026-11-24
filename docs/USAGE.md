# 使用說明（維護用）

把單檔小網頁快速上架到自己網域的極簡框架。每個頁面一個資料夾，首頁自動列出全部頁面。不需要安裝任何套件，只要 Node 18+。

## 指令

| 指令 | 用途 |
|---|---|
| `npm run dev` | 建置並在 http://localhost:8080 預覽（`PORT=3000 npm run dev` 換埠號） |
| `npm run build` | 建置到 `dist/` |
| `npm run new <slug> [標題]` | 建立新頁面骨架 `pages/<slug>/` |

## 上架新頁面

1. 建資料夾 `pages/<slug>/`，把 HTML 存成 `index.html`（也可以用 `npm run new <slug>`）。
   - 網址會是 `你的網域/<slug>/`。slug 用小寫英數和 `-`。
   - 圖片、JS 等其他檔案放在同一個資料夾，用相對路徑引用。
2. 填寫 `meta.json`（可以省略，省略時用 `<title>` 當標題）：
   ```json
   {
     "title": "日語動詞整理",
     "description": "首頁卡片上的一句話介紹",
     "date": "2026-11-23",
     "tags": ["日語", "學習"],
     "hidden": false
   }
   ```
   - 首頁依 `date` 排序，新的在前。
   - `hidden: true`：網址仍然打得開，但首頁不列出。
   - 資料夾名稱用 `_` 開頭（例如 `_draft`）：完全不建置，可當草稿。
3. `git push`，Cloudflare 會自動部署。

**修改頁面**：直接改 `pages/<slug>/index.html`，然後 push。
**修改首頁**：網站名稱與副標在 `site.json`；版面在 `home/template.html`；樣式在 `home/style.css`（首頁和 404 共用）。

## Cloudflare Pages 設定（一次性）

1. 把這個 repo 推到 GitHub。
2. Cloudflare 後台 → Workers & Pages → Create → Pages → Connect to Git，選這個 repo。
3. Build command：`node scripts/build.mjs`；Build output directory：`dist`。
4. 部署完成後，到 Custom domains 綁定自己的網域。

產出的 `dist/` 是純靜態檔案，要換到 GitHub Pages、Netlify 或自己的主機都能直接用。

## 加後端 API（選用）

Cloudflare Pages Functions：在 `functions/` 放 JS 檔就會變成 API，路徑對應網址。

- `functions/<slug>/api/hello.js` → `/<slug>/api/hello`
- 範例：`functions/_example/api/hello.js.example`（複製到正確位置並改掉 `.example` 副檔名）
- 需要儲存資料時，可以在 `wrangler.toml` 或 Cloudflare 後台綁定 KV、D1（SQLite）或 R2（檔案），在程式中用 `env.KV`、`env.DB` 存取。
- 本機測試 functions：`npm run build && npx wrangler pages dev`（一般預覽用 `npm run dev` 就夠了）。

文件：https://developers.cloudflare.com/pages/functions/

## 結構

```
pages/<slug>/index.html   各頁面（原封不動複製到 dist/<slug>/）
pages/<slug>/meta.json    首頁卡片資訊
home/                     首頁模板、404、共用樣式
site.json                 網站名稱與副標
functions/                （選用）後端 API
scripts/                  build / new / serve
```

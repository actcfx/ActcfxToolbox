# 使用說明（維護用）

把單檔小網頁快速上架到自己網域的極簡框架。每個頁面一個資料夾，首頁自動列出全部頁面。不需要安裝任何套件，只要 Node 18+。

## 指令

| 指令 | 用途 |
|---|---|
| `npm run dev` | 建置並在 http://localhost:3000 預覽（`PORT=4000 npm run dev` 換埠號） |
| `npm run build` | 建置到 `dist/` |
| `npm run new <slug> [標題]` | 建立新頁面骨架 `pages/<slug>/` |

## 本機留言工具

`npm run dev` 預覽時，每個頁面左下角會出現「✎ 留言」按鈕（快捷鍵 Alt+C）。進入留言模式後點頁面上的元素，輸入意見後送出。留言存在 `.feedback/notes.jsonl`（不進 git），頁面上會用紅色數字標出位置。這個工具只在本機預覽時注入，不會出現在 `dist/` 或部署的網站上。

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

## Cloudflare 部署設定（一次性）

1. 把這個 repo 推到 GitHub。
2. Cloudflare 後台 → Workers & Pages → Create → Import a repository，選這個 repo。
3. Build command：`npm run build`；Deploy command：`npx wrangler deploy`（預設值）。
4. 部署完成後，到 Settings → Domains & Routes 綁定自己的網域。

靜態檔案的設定在 `wrangler.toml` 的 `[assets]`。產出的 `dist/` 是純靜態檔案，要換到 GitHub Pages、Netlify 或自己的主機都能直接用。

## 加後端 API（選用）

用同一個 Worker 處理 API，其他網址照常回傳靜態檔案。

1. 把 `worker/index.js.example` 改名為 `worker/index.js`，在裡面寫 API。
2. 在 `wrangler.toml` 打開 `main`、`binding = "ASSETS"`、`run_worker_first = ["/*/api/*"]`。
3. 慣例：每個頁面的 API 放在 `/<slug>/api/*`。
4. 需要儲存資料時，在 `wrangler.toml` 綁定 KV、D1（SQLite）或 R2（檔案），程式中用 `env.KV`、`env.DB` 存取。
5. 本機測試：`npm run build && npx wrangler dev`（只看靜態頁面用 `npm run dev` 就夠了）。

文件：https://developers.cloudflare.com/workers/static-assets/

## 結構

```
pages/<slug>/index.html   各頁面（原封不動複製到 dist/<slug>/）
pages/<slug>/meta.json    首頁卡片資訊
home/                     首頁模板、404、共用樣式
site.json                 網站名稱與副標
worker/                   （選用）後端 API
wrangler.toml             Cloudflare 部署設定
scripts/                  build / new / serve
```

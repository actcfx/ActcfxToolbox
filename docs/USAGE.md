# 使用說明（維護用）

用 [Astro](https://docs.astro.build/) 建置的靜態網站，互動元件用 [Svelte](https://svelte.dev/)。每個頁面一個資料夾，首頁自動列出全部頁面。需要 Node 22.23.4 以上，第一次使用先跑 `npm install`。

## 指令

| 指令 | 用途 |
|---|---|
| `npm run dev` | 開發伺服器 http://localhost:3000，存檔後自動更新（`npm run dev -- --port 4000` 換埠號） |
| `npm run build` | 建置到 `dist/` |
| `npm run preview` | 預覽 `dist/` 的建置結果 |
| `npm run new <slug> [標題]` | 建立新頁面骨架 `src/pages/<slug>/` |
| `npm run icons` | 從 `assets/icon.svg` 重新產生網站圖示 |
| `npm run og` | 重新截取連結預覽圖 `public/og/*.png`（頁面最上方的內容改了之後執行） |

## 本機留言工具

`npm run dev` 預覽時，每個頁面左下角會出現「✎ 留言」按鈕（快捷鍵 Alt+C）。進入留言模式後點頁面上的元素，輸入意見後送出。留言存在 `.feedback/notes.jsonl`（不進 git），頁面上會用紅色數字標出位置。這個工具只在 `npm run dev` 時載入（`dev/feedback-integration.mjs`），不會出現在 `dist/` 或部署的網站上。

## 字體

全站使用 [M PLUS 2](https://fonts.google.com/specimen/M+PLUS+2)（套件 `@fontsource-variable/m-plus-2`，字型檔跟著網站一起部署，不連 Google）。字型檔依字元範圍切成很多小檔，瀏覽器只下載頁面用到的部分。M PLUS 2 沒有的字（例如「值」「啟」「夠」「查」）會改用後面列的系統字體。

## 網站圖示與連結預覽

- 網站圖示的原始檔是 `assets/icon.svg`（照狐狸 emoji 的形狀畫的北極狐頭：寬耳朵、往外翹的臉頰毛，全白，只有深色的外框、眼睛和鼻子；透明背景）。改了之後執行 `npm run icons`，會產生 `public/favicon.svg`、`favicon.ico`（16、32、48px）和主畫面用的 `apple-touch-icon.png`、`icon-192.png`、`icon-512.png`（淺灰底滿版方形，系統會自己裁成圓角）。`public/site.webmanifest` 列出這些圖示。
- 連結預覽圖（Open Graph，1200×630）由 `npm run og` 產生：先建置網站，再用 Chromium 截取每個網頁最上方 1200×630 的畫面（深色模式）。首頁是 `public/og/site.png`（404 也用這張），每個頁面是 `public/og/<slug>.png`。這些圖會進 git，因為 Cloudflare 建置時沒有瀏覽器可以產生它們。改了頁面最上方的內容後，記得重跑。
- `npm run og` 需要 Playwright 的 Chromium，第一次先跑 `npx playwright install chromium`。
- 各頁面的 `<head>` 標籤由 `src/components/PageMeta.astro` 產生。預覽圖要完整網址，網域設定在 `astro.config.mjs` 的 `site`（`https://tool.actcfx.net`）。

## 上架新頁面

1. 執行 `npm run new <slug> [標題]`，會建立 `src/pages/<slug>/index.astro` 和 `_meta.json`。
   - 網址會是 `你的網域/<slug>/`。slug 用小寫英數和 `-`。
   - 頁面可以用共用版型 `src/layouts/Site.astro`，需要互動的部分寫成 Svelte 元件（`.svelte`）。
   - 圖片等不需要處理的檔案放在 `public/`，會原封不動複製到 `dist/`。
2. 填寫 `_meta.json`（首頁卡片資訊；沒有這個檔案的頁面不會出現在首頁）：
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
   - 資料夾或檔案名稱用 `_` 開頭（例如 `_draft`）：Astro 不建置，可當草稿。
3. `git push`，Cloudflare 會自動部署。

**修改頁面**：改 `src/pages/<slug>/` 裡的檔案，然後 push。
**修改首頁**：網站名稱與副標在 `site.json`；首頁在 `src/pages/index.astro`；404 在 `src/pages/404.astro`；共用版型在 `src/layouts/Site.astro`；樣式在 `src/styles/home.css`。

**日語動詞整理**：
- 資料在 `src/data/jp-verbs.json`（課次、每一列的辭書形、ます形、て形、類別、說明）。改資料只要改這個檔案。
- 頁面在 `src/pages/jp-verbs/index.astro`，表格由 `_components/Lesson.astro` 和 `_components/VerbRow.astro` 產生，資料型別在 `_types.ts`。
- 樣式在 `_jp-verbs.css`；互動程式在 `_scripts/`（`_main.js`：頂欄、索引、折疊、課次總覽；`_layout.js`：版面切換、換行動畫、保持畫面位置；`_ui.js`：提示框、說明區塊動畫；`_head-*.js`：第一次顯示前就要執行的部分）。
- 互動程式之後會改寫成 Svelte 元件。

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
src/pages/<slug>/index.astro   各頁面（建置成 dist/<slug>/index.html）
src/pages/<slug>/_meta.json    首頁卡片資訊
src/pages/index.astro、404.astro  首頁、404
src/layouts/                   共用版型
src/components/                共用元件（PageMeta.astro：圖示與連結預覽標籤）
src/styles/                    共用樣式
src/data/                      頁面資料（JSON）
public/                        原封不動複製的檔案：網站圖示、site.webmanifest、og/ 預覽圖
assets/icon.svg                網站圖示的原始檔
assets/icon-toolbox.svg        舊版圖示（北極狐趴在工具提箱裡），留著備用，不會被 npm run icons 使用
site.json                      網站名稱與副標
astro.config.mjs               Astro 設定
dev/                           本機留言工具（只在 npm run dev 時使用）
scripts/new.mjs                建立新頁面
scripts/icons.mjs              從 assets/icon.svg 產生網站圖示
scripts/og.mjs                 截取連結預覽圖
worker/                        （選用）後端 API
wrangler.toml                  Cloudflare 部署設定
```

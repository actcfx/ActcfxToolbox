// npm run new <slug> [標題] —— 建立 pages/<slug>/index.html 與 meta.json
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const [slug, ...titleParts] = process.argv.slice(2);

if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
  console.error("用法：npm run new <slug> [標題]\nslug 只能用小寫英數與 -，例如 jp-verbs");
  process.exit(1);
}
const dir = join(root, "pages", slug);
if (existsSync(dir)) {
  console.error(`pages/${slug}/ 已經存在`);
  process.exit(1);
}

const title = titleParts.join(" ") || slug;
const today = new Date().toISOString().slice(0, 10);
const style = await readFile(join(root, "home/style.css"), "utf8");
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

await mkdir(dir, { recursive: true });
await writeFile(
  join(dir, "meta.json"),
  JSON.stringify({ title, description: "", date: today, tags: [], hidden: false }, null, 2) + "\n"
);
await writeFile(
  join(dir, "index.html"),
  `<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
${style.trim()}
.panel{background:var(--card);border-radius:18px;padding:24px}
</style></head><body>
<header class="bar"><div class="bar-in"><a class="bar-title" href="/">← 首頁</a></div></header>
<main>
<section class="hero"><h1>${esc(title)}</h1><p class="sub">在這裡寫副標題。</p></section>
<div class="panel">內容放這裡。</div>
</main>
</body></html>
`
);
console.log(`✓ 已建立 pages/${slug}/（index.html、meta.json）\n  執行 npm run dev 後到 http://localhost:3000/${slug}/ 預覽`);

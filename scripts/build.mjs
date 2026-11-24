// 把 pages/<slug>/ 複製到 dist/<slug>/，並依 meta.json 產生首頁 dist/index.html。
// 無任何依賴，Node 18+ 可跑。
import { readFile, writeFile, readdir, rm, cp, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pagesDir = join(root, "pages");
const dist = join(root, "dist");

const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const fill = (tpl, vars) => tpl.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? vars[k] : m));

async function readMeta(slug) {
  const dir = join(pagesDir, slug);
  let meta = {};
  const metaPath = join(dir, "meta.json");
  if (existsSync(metaPath)) {
    try {
      meta = JSON.parse(await readFile(metaPath, "utf8"));
    } catch (e) {
      throw new Error(`pages/${slug}/meta.json 格式錯誤：${e.message}`);
    }
  }
  if (!meta.title) {
    const html = await readFile(join(dir, "index.html"), "utf8").catch(() => "");
    meta.title = html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() || slug;
  }
  return { slug, tags: [], description: "", date: "", hidden: false, ...meta };
}

function card(p) {
  const tags = p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("");
  return `<a class="card" href="/${encodeURI(p.slug)}/">
${tags ? `<div class="tags">${tags}</div>` : ""}
<h2>${esc(p.title)}</h2>
${p.description ? `<p>${esc(p.description)}</p>` : ""}
<div class="card-foot"><span class="date">${esc(p.date)}</span><span class="grow"></span><span class="go">打開 ›</span></div>
</a>`;
}

const site = JSON.parse(await readFile(join(root, "site.json"), "utf8"));
const style = (await readFile(join(root, "home/style.css"), "utf8")).trim();

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

// 底線或點開頭的資料夾視為草稿/私用，不會建置
const slugs = (await readdir(pagesDir, { withFileTypes: true }))
  .filter((d) => d.isDirectory() && !/^[_.]/.test(d.name))
  .map((d) => d.name);

const pages = [];
for (const slug of slugs) {
  if (!existsSync(join(pagesDir, slug, "index.html"))) {
    console.warn(`⚠ 略過 pages/${slug}/（沒有 index.html）`);
    continue;
  }
  await cp(join(pagesDir, slug), join(dist, slug), {
    recursive: true,
    filter: (src) => !src.endsWith("meta.json"),
  });
  pages.push(await readMeta(slug));
}

const listed = pages
  .filter((p) => !p.hidden)
  .sort((a, b) => String(b.date).localeCompare(String(a.date)) || a.title.localeCompare(b.title));

const vars = {
  LANG: esc(site.lang || "zh-Hant"),
  SITE_TITLE: esc(site.title),
  SITE_SUBTITLE: esc(site.subtitle || ""),
  STYLE: style,
  COUNT: String(listed.length),
  YEAR: String(new Date().getFullYear()),
  CARDS: listed.length ? listed.map(card).join("\n") : `<div class="empty">還沒有頁面。用 <code>npm run new &lt;slug&gt;</code> 建立第一個。</div>`,
};

await writeFile(join(dist, "index.html"), fill(await readFile(join(root, "home/template.html"), "utf8"), vars));
await writeFile(join(dist, "404.html"), fill(await readFile(join(root, "home/404.html"), "utf8"), vars));

console.log(`✓ 建置完成：${pages.length} 個頁面（首頁列出 ${listed.length} 個）→ dist/`);
for (const p of pages) console.log(`  /${p.slug}/  ${p.title}${p.hidden ? "  (hidden)" : ""}`);

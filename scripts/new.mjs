// npm run new <slug> [標題] —— 建立 src/pages/<slug>/index.astro 與 _meta.json
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const [slug, ...titleParts] = process.argv.slice(2);

if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    console.error("用法：npm run new <slug> [標題]\nslug 只能用小寫英數與 -，例如 jp-verbs");
    process.exit(1);
}
const dir = join(root, "src", "pages", slug);
if (existsSync(dir)) {
    console.error(`src/pages/${slug}/ 已經存在`);
    process.exit(1);
}

const title = titleParts.join(" ") || slug;
const today = new Date().toISOString().slice(0, 10);

await mkdir(dir, { recursive: true });
await writeFile(
    join(dir, "_meta.json"),
    JSON.stringify({ title, description: "", date: today, tags: [], hidden: false }, null, 4) + "\n"
);
await writeFile(
    join(dir, "index.astro"),
    `---
import Site from "../../layouts/Site.astro";
import meta from "./_meta.json";
---
<Site title={meta.title} description={meta.description}>
    <section class="hero">
        <h1>{meta.title}</h1>
        <p class="sub">在這裡寫副標題。</p>
    </section>
    <div class="panel">內容放這裡。</div>
</Site>

<style>
    .panel {
        background: var(--card);
        border-radius: 18px;
        padding: 24px;
    }
</style>
`
);
console.log(`✓ 已建立 src/pages/${slug}/（index.astro、_meta.json）\n  執行 npm run dev 後到 http://localhost:3000/${slug}/ 預覽`);

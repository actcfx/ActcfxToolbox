// npm run og —— 產生連結預覽圖（Open Graph，1200×630）
// 直接截取網頁最上方的畫面：
// public/og/site.png：首頁（404 也用這張）
// public/og/<slug>.png：每個有 _meta.json 的頁面
// 流程：astro build → 在本機開預覽伺服器 → 用 Chromium 截圖。
// 需要 Playwright 的 Chromium：第一次先跑 npx playwright install chromium
import { readdir, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { build, preview } from "astro";
import { chromium } from "playwright";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "og");
const port = 4329;

const shots = [{ name: "site", path: "/" }];
const pagesDir = join(root, "src", "pages");
for (const d of await readdir(pagesDir, { withFileTypes: true })) {
    if (d.isDirectory() && !d.name.startsWith("_") && existsSync(join(pagesDir, d.name, "_meta.json"))) {
        shots.push({ name: d.name, path: `/${d.name}/` });
    }
}

await build({ root, logLevel: "warn" });
const server = await preview({ root, server: { port }, logLevel: "warn" });
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, colorScheme: "dark", deviceScaleFactor: 1 });
try {
    for (const s of shots) {
        await page.goto(`http://localhost:${port}${s.path}`, { waitUntil: "networkidle" });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(500); // let entrance animations finish
        await page.screenshot({ path: join(outDir, `${s.name}.png`) });
        console.log(`✓ public/og/${s.name}.png  ←  ${s.path}`);
    }
} finally {
    await browser.close();
    await server.stop();
}

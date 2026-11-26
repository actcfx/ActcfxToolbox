// npm run icons —— 從 assets/icon.svg 產生網站圖示
// public/favicon.svg：瀏覽器分頁（透明背景）
// public/favicon.ico：16、32、48px（舊瀏覽器）
// public/apple-touch-icon.png、icon-192.png、icon-512.png：主畫面圖示，淺灰底滿版方形，狐狸縮到 80%
//   （主畫面圖示不能透明；系統會自己裁成圓角，四周要留空間）
// 需要 Playwright 的 Chromium：第一次先跑 npx playwright install chromium
import { readFile, writeFile, copyFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public");
const svg = await readFile(join(root, "assets", "icon.svg"), "utf8");
// Home-screen version: opaque light background, the drawing at 80% inside the safe zone
const viewBox = svg.match(/viewBox="([^"]+)"/)[1];
const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const square = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#f5f5f7"/>`
    + `<svg x="51.2" y="51.2" width="409.6" height="409.6" viewBox="${viewBox}">${inner}</svg></svg>`;

const browser = await chromium.launch();
const render = async (source, size) => {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(`<body style="margin:0">${source.replace("<svg ", `<svg width="${size}" height="${size}" `)}</body>`);
    const png = await page.screenshot({ omitBackground: true });
    await page.close();
    return png;
};

// .ico with PNG images inside (supported by all current browsers)
const ico = (images) => {
    const head = Buffer.alloc(6 + 16 * images.length);
    head.writeUInt16LE(0, 0);
    head.writeUInt16LE(1, 2);
    head.writeUInt16LE(images.length, 4);
    let offset = head.length;
    images.forEach(({ size, png }, i) => {
        const e = 6 + 16 * i;
        head.writeUInt8(size >= 256 ? 0 : size, e);
        head.writeUInt8(size >= 256 ? 0 : size, e + 1);
        head.writeUInt16LE(1, e + 4);
        head.writeUInt16LE(32, e + 6);
        head.writeUInt32LE(png.length, e + 8);
        head.writeUInt32LE(offset, e + 12);
        offset += png.length;
    });
    return Buffer.concat([head, ...images.map((x) => x.png)]);
};

try {
    await copyFile(join(root, "assets", "icon.svg"), join(pub, "favicon.svg"));
    const small = [];
    for (const size of [16, 32, 48]) small.push({ size, png: await render(svg, size) });
    await writeFile(join(pub, "favicon.ico"), ico(small));
    await writeFile(join(pub, "apple-touch-icon.png"), await render(square, 180));
    await writeFile(join(pub, "icon-192.png"), await render(square, 192));
    await writeFile(join(pub, "icon-512.png"), await render(square, 512));
    console.log("✓ public/favicon.svg, favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png");
} finally {
    await browser.close();
}

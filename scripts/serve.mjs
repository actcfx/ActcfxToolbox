// 本機預覽 dist/（無依賴）。PORT=4000 npm run dev 可換埠號。
// 本機預覽時會在每個 HTML 頁面注入留言工具（scripts/feedback.js），
// 留言存在 .feedback/notes.jsonl。部署的網站不受影響。
import { createServer } from "node:http";
import { readFile, stat, mkdir, appendFile } from "node:fs/promises";
import { join, extname, dirname, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const fbDir = join(root, ".feedback");
const fbFile = join(fbDir, "notes.jsonl");
const fbScript = join(root, "scripts", "feedback.js");
const port = Number(process.env.PORT) || 3000;
const types = {
    ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
    ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp",
    ".ico": "image/x-icon", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8", ".pdf": "application/pdf",
};

const inject = (buf) => buf.toString("utf8").replace(/<\/body>/i, '<script src="/__feedback.js"></script></body>');

const readNotes = async () => {
    const text = await readFile(fbFile, "utf8").catch(() => "");
    return text.split("\n").filter(Boolean).map((line) => JSON.parse(line));
};

const readBody = (req) => new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
        size += c.length;
        if (size > 200_000) {
            reject(new Error("too large"));
            req.destroy();
            return;
        }
        chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
});

const json = (res, code, data) => res.writeHead(code, { "Content-Type": types[".json"] }).end(JSON.stringify(data));

async function feedback(req, res, url) {
    if (url === "/__feedback.js") {
        const body = await readFile(fbScript);
        return res.writeHead(200, { "Content-Type": types[".js"], "Cache-Control": "no-store" }).end(body);
    }
    if (req.method === "GET") return json(res, 200, await readNotes());
    if (req.method === "POST") {
        try {
            const note = JSON.parse(await readBody(req));
            const notes = await readNotes();
            const id = notes.reduce((m, n) => Math.max(m, n.id || 0), 0) + 1;
            const entry = { id, time: new Date().toISOString(), ...note };
            await mkdir(fbDir, { recursive: true });
            await appendFile(fbFile, JSON.stringify(entry) + "\n");
            console.log(`✎ 留言 #${id}：${String(note.note || "").slice(0, 60)}`);
            return json(res, 200, { id });
        } catch (e) {
            return json(res, 400, { error: e.message });
        }
    }
    return res.writeHead(405).end();
}

createServer(async (req, res) => {
    const url = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (url.startsWith("/__feedback")) return feedback(req, res, url);
    let file = normalize(join(dist, url));
    if (!file.startsWith(dist)) return res.writeHead(403).end();
    try {
        const s = await stat(file);
        if (s.isDirectory()) {
            if (!url.endsWith("/")) return res.writeHead(301, { Location: url + "/" }).end();
            file = join(file, "index.html");
        }
        let body = await readFile(file);
        if (extname(file) === ".html") body = inject(body);
        res.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream" }).end(body);
    } catch {
        const page = await readFile(join(dist, "404.html")).catch(() => null);
        res.writeHead(404, { "Content-Type": types[".html"] }).end(page ? inject(page) : "404");
    }
}).listen(port, () => console.log(`▶ http://localhost:${port}`));

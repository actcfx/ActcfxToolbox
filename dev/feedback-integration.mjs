// Astro integration: the local click-to-comment tool (dev server only).
// - Serves dev/feedback.js at /__feedback.js
// - GET /__feedback returns all notes, POST /__feedback appends one
// Notes are stored in .feedback/notes.jsonl. Nothing here is part of the build.
import { readFile, mkdir, appendFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fbDir = join(root, ".feedback");
const fbFile = join(fbDir, "notes.jsonl");
const fbScript = join(root, "dev", "feedback.js");

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

const json = (res, code, data) => {
    res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(data));
};

export default function feedback() {
    return {
        name: "local-feedback",
        hooks: {
            "astro:server:setup": ({ server, logger }) => {
                server.middlewares.use(async (req, res, next) => {
                    const url = new URL(req.url, "http://x").pathname;
                    if (url === "/__feedback.js") {
                        res.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "no-store" });
                        res.end(await readFile(fbScript));
                        return;
                    }
                    if (url !== "/__feedback") return next();
                    if (req.method === "GET") return json(res, 200, await readNotes());
                    if (req.method !== "POST") {
                        res.writeHead(405).end();
                        return;
                    }
                    try {
                        const note = JSON.parse(await readBody(req));
                        const notes = await readNotes();
                        const id = notes.reduce((m, n) => Math.max(m, n.id || 0), 0) + 1;
                        const entry = { id, time: new Date().toISOString(), ...note };
                        await mkdir(fbDir, { recursive: true });
                        await appendFile(fbFile, JSON.stringify(entry) + "\n");
                        logger.info(`留言 #${id}：${String(note.note || "").slice(0, 60)}`);
                        json(res, 200, { id });
                    } catch (e) {
                        json(res, 400, { error: e.message });
                    }
                });
            },
        },
    };
}

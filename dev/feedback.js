// 本機預覽專用的「點選留言」工具。由 scripts/serve.mjs 注入，不會出現在 dist/ 裡。
// 用法：按左下角的「留言」或 Alt+C 進入留言模式，點頁面上的元素，輸入意見後送出。
// 留言存在專案的 .feedback/notes.jsonl。
(() => {
    if (window.__feedback) return;
    window.__feedback = true;

    const host = document.createElement("div");
    host.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483647";
    document.documentElement.appendChild(host);
    const ui = host.attachShadow({ mode: "open" });
    ui.innerHTML = `
<style>
:host{all:initial}
*{box-sizing:border-box;font-family:system-ui,-apple-system,"PingFang TC","Noto Sans CJK TC",sans-serif}
.pill{position:fixed;left:16px;bottom:16px;pointer-events:auto;border:0;border-radius:999px;padding:8px 14px;font-size:13px;font-weight:600;
 background:#1d1d1f;color:#fff;box-shadow:0 4px 16px rgba(0,0,0,.25);cursor:pointer}
.pill.on{background:#0066cc}
.hl{position:fixed;border:2px solid #0066cc;background:rgba(0,102,204,.08);border-radius:4px;pointer-events:none;display:none}
.tag{position:absolute;left:-2px;top:-22px;background:#0066cc;color:#fff;font:600 11px/1 ui-monospace,monospace;padding:4px 6px;border-radius:4px;white-space:nowrap}
.box{position:fixed;width:300px;pointer-events:auto;background:#fff;color:#1d1d1f;border-radius:12px;padding:12px;box-shadow:0 12px 40px rgba(0,0,0,.3);display:none}
.box textarea{width:100%;height:90px;resize:vertical;border:1px solid #d2d2d7;border-radius:8px;padding:8px;font-size:14px;outline:none}
.box textarea:focus{border-color:#0066cc}
.row{display:flex;gap:8px;justify-content:flex-end;margin-top:8px;align-items:center}
.hint{margin-right:auto;font-size:11px;color:#86868b}
.row button{border:0;border-radius:8px;padding:6px 12px;font-size:13px;cursor:pointer;background:#e8e8ed;color:#1d1d1f}
.row button.go{background:#0066cc;color:#fff}
.pin{position:fixed;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:#ff3b30;color:#fff;font:700 11px/22px system-ui;text-align:center;
 pointer-events:auto;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.3)}
.tip{position:fixed;max-width:280px;pointer-events:none;background:#1d1d1f;color:#fff;font-size:12px;line-height:1.5;padding:8px 10px;border-radius:8px;display:none;white-space:pre-wrap}
</style>
<button class="pill" type="button">✎ 留言</button>
<div class="hl"><span class="tag"></span></div>
<div class="box"><textarea placeholder="這裡有什麼問題？"></textarea>
<div class="row"><span class="hint">⌘/Ctrl+Enter 送出 · Esc 取消</span><button type="button" class="no">取消</button><button type="button" class="go">送出</button></div></div>
<div class="pins"></div><div class="tip"></div>`;

    const $ = (s) => ui.querySelector(s);
    const pill = $(".pill");
    const hl = $(".hl");
    const tag = $(".tag");
    const box = $(".box");
    const ta = $("textarea");
    const pinsEl = $(".pins");
    const tip = $(".tip");
    let mode = false;
    let target = null;
    let picked = null;
    let pins = [];

    const selectorOf = (el) => {
        const parts = [];
        while (el && el.nodeType === 1 && el !== document.body && el !== document.documentElement) {
            if (el.id) {
                parts.unshift("#" + CSS.escape(el.id));
                break;
            }
            let p = el.tagName.toLowerCase();
            const cls = [...el.classList].map((c) => "." + CSS.escape(c)).join("");
            p += cls;
            const sib = el.parentElement ? [...el.parentElement.children].filter((x) => x.tagName === el.tagName) : [];
            if (sib.length > 1) p += `:nth-of-type(${sib.indexOf(el) + 1})`;
            parts.unshift(p);
            el = el.parentElement;
        }
        return parts.join(" > ") || "body";
    };

    const theme = () => {
        const t = document.documentElement.dataset.theme;
        if (t) return t;
        return matchMedia("(prefers-color-scheme: dark)").matches ? "dark (system)" : "light (system)";
    };

    const label = (el) => {
        const id = el.id ? "#" + el.id : "";
        const cls = el.classList.length ? "." + [...el.classList].slice(0, 2).join(".") : "";
        return el.tagName.toLowerCase() + id + cls;
    };

    const setMode = (on) => {
        mode = on;
        pill.classList.toggle("on", on);
        pill.textContent = on ? "✎ 點選要留言的地方（Esc 結束）" : "✎ 留言";
        document.documentElement.style.cursor = on ? "crosshair" : "";
        if (!on) hl.style.display = "none";
    };

    const showHl = (el) => {
        const r = el.getBoundingClientRect();
        Object.assign(hl.style, { display: "block", left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" });
        tag.textContent = label(el);
    };

    const closeBox = () => {
        box.style.display = "none";
        ta.value = "";
        picked = null;
    };

    const openBox = (x, y) => {
        const w = 300;
        const left = Math.min(Math.max(8, x + 12), innerWidth - w - 8);
        const top = Math.min(Math.max(8, y + 12), innerHeight - 170);
        Object.assign(box.style, { display: "block", left: left + "px", top: top + "px" });
        ta.focus();
    };

    const send = async () => {
        if (!picked || !ta.value.trim()) return;
        const { el, x, y } = picked;
        const r = el.getBoundingClientRect();
        const ctx = el.closest("[id]");
        const lesson = el.closest(".lesson");
        const data = {
            path: location.pathname,
            hash: location.hash,
            note: ta.value.trim(),
            selector: selectorOf(el),
            tag: el.tagName.toLowerCase(),
            text: (el.innerText || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 200),
            html: el.outerHTML.slice(0, 500),
            nearestId: ctx ? ctx.id : null,
            lesson: lesson ? (lesson.querySelector("h3") || {}).textContent || lesson.id : null,
            rect: { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) },
            point: { x: Math.round(x), y: Math.round(y) },
            offset: { fx: r.width ? +((x - r.left) / r.width).toFixed(3) : 0.5, fy: r.height ? +((y - r.top) / r.height).toFixed(3) : 0.5 },
            viewport: { w: innerWidth, h: innerHeight, dpr: devicePixelRatio },
            scrollY: Math.round(scrollY),
            theme: theme(),
            rootClass: document.documentElement.className,
            userAgent: navigator.userAgent,
        };
        const res = await fetch("/__feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
        const { id } = await res.json();
        pins.push({ id, ...data });
        drawPins();
        closeBox();
        setMode(false);
    };

    const drawPins = () => {
        pinsEl.innerHTML = "";
        for (const n of pins) {
            const d = document.createElement("div");
            d.className = "pin";
            d.textContent = n.id;
            d.dataset.id = n.id;
            pinsEl.appendChild(d);
        }
        placePins();
    };

    const placePins = () => {
        for (const d of pinsEl.children) {
            const n = pins.find((p) => String(p.id) === d.dataset.id);
            let el = null;
            try {
                el = document.querySelector(n.selector);
            } catch {
                el = null;
            }
            const r = el && el.getBoundingClientRect();
            if (!r || (r.width === 0 && r.height === 0)) {
                d.style.display = "none";
                continue;
            }
            d.style.display = "block";
            d.style.left = r.left + r.width * n.offset.fx + "px";
            d.style.top = r.top + r.height * n.offset.fy + "px";
        }
    };

    let raf = 0;
    const schedule = () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
            raf = 0;
            placePins();
        });
    };
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule);
    setInterval(placePins, 1000);

    pinsEl.addEventListener("mouseover", (e) => {
        const d = e.target.closest(".pin");
        if (!d) return;
        const n = pins.find((p) => String(p.id) === d.dataset.id);
        const r = d.getBoundingClientRect();
        tip.textContent = `#${n.id}　${n.note}`;
        Object.assign(tip.style, { display: "block", left: Math.min(r.right + 6, innerWidth - 290) + "px", top: r.top + "px" });
    });
    pinsEl.addEventListener("mouseout", () => {
        tip.style.display = "none";
    });

    pill.addEventListener("click", () => {
        closeBox();
        setMode(!mode);
    });
    $(".no").addEventListener("click", () => {
        closeBox();
        setMode(false);
    });
    $(".go").addEventListener("click", send);
    ta.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
        if (e.key === "Escape") {
            closeBox();
            setMode(false);
        }
        e.stopPropagation();
    });

    const ours = (e) => e.composedPath().includes(host);

    document.addEventListener("mousemove", (e) => {
        if (!mode || picked || ours(e)) return;
        const el = document.elementFromPoint(e.clientX, e.clientY);
        if (el && el !== target) {
            target = el;
            showHl(el);
        }
    }, true);

    const block = (e) => {
        if (!mode || ours(e)) return;
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    };
    ["pointerdown", "mousedown", "pointerup", "mouseup"].forEach((t) => document.addEventListener(t, block, true));
    document.addEventListener("click", (e) => {
        if (!mode || ours(e)) return;
        block(e);
        if (picked) return;
        const el = document.elementFromPoint(e.clientX, e.clientY);
        if (!el) return;
        picked = { el, x: e.clientX, y: e.clientY };
        showHl(el);
        openBox(e.clientX, e.clientY);
    }, true);

    addEventListener("keydown", (e) => {
        if (e.altKey && e.code === "KeyC") {
            e.preventDefault();
            closeBox();
            setMode(!mode);
        } else if (e.key === "Escape" && mode) {
            closeBox();
            setMode(false);
        }
    }, true);

    fetch("/__feedback")
        .then((r) => r.json())
        .then((all) => {
            pins = all.filter((n) => n.path === location.pathname && !n.done);
            drawPins();
        })
        .catch(() => {});
})();

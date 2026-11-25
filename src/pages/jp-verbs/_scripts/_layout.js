(() => {
    const root = document.documentElement;
    const still = matchMedia("(prefers-reduced-motion: reduce)");
    // Phones and tablets: skip the per-character wrap animation and the row glide.
    // They only resize on rotation, and measuring every character is heavy there.
    const coarse = matchMedia("(pointer: coarse)");
    const ease = "cubic-bezier(.2,.8,.2,1)";
    const modes = [
        ["mid", matchMedia("(min-width:761px) and (max-width:1160px)")],
        ["m", matchMedia("(max-width:760px)")],
    ];
    const pending = () => modes.some(([c, q]) => root.classList.contains(c) !== q.matches);
    const applyModes = () => modes.forEach(([c, q]) => root.classList.toggle(c, q.matches));
    const lessonsInView = (margin) => {
        const vh = innerHeight;
        return [...document.querySelectorAll(".lesson")].filter((l) => {
            const r = l.getBoundingClientRect();
            return r.bottom > -margin && r.top < vh + margin;
        });
    };

    // Layout switch: cells leave to the right, the new layout comes in from the left
    const running = [];
    const visibleCells = () => {
        const vh = innerHeight;
        const cells = [];
        for (const l of lessonsInView(0)) {
            for (const tr of l.querySelectorAll("tr")) {
                const r = tr.getBoundingClientRect();
                if (r.bottom < 0 || r.top > vh || r.height === 0) continue;
                for (const c of tr.children) cells.push(c);
            }
        }
        return cells;
    };
    const IN = 380;
    // Where each cell sits inside its row (and how big it is) in the layout now on screen
    const place = (cells) => cells.map((c) => {
        const r = c.getBoundingClientRect();
        const t = c.parentElement.getBoundingClientRect();
        return { r, rel: r.top - t.top, h: r.height };
    });
    // Keep what is in the middle of the screen in place while the window changes size
    let anc = null;
    let ancOff = 0;
    let selfScroll = false;
    let pickR = 0;
    let idleT = 0;
    const pickAnchor = () => {
        const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
        anc = el ? el.closest("tr, h3, h2, .hero, .info, .lesson") : null;
        if (anc) ancOff = anc.getBoundingClientRect().top - innerHeight / 2;
    };
    const holdAnchor = () => {
        if (!anc || !anc.isConnected) return;
        const d = anc.getBoundingClientRect().top - innerHeight / 2 - ancOff;
        if (Math.abs(d) < 0.5) return;
        selfScroll = true;
        scrollBy({ top: d, behavior: "instant" });
    };
    addEventListener("scroll", () => {
        if (selfScroll) {
            selfScroll = false;
            return;
        }
        // elementFromPoint is slow on this large page, so pick only after scrolling stops.
        // If the window is resized before that, onResize picks one first.
        anc = null;
        clearTimeout(pickR);
        pickR = setTimeout(pickAnchor, 200);
    }, { passive: true });
    requestAnimationFrame(pickAnchor);

    // Layout switch: every cell slides from its old place to its new place
    const switchLayout = () => {
        if (!pending()) return;
        resetText();
        while (running.length) running.pop().cancel();
        if (still.matches) {
            applyModes();
            return;
        }
        const cells = visibleCells();
        const before = place(cells);
        root.style.overflowAnchor = "none";
        if (!anc) pickAnchor();
        applyModes();
        holdAnchor();
        const now = place(cells);
        cells.forEach((c, i) => {
            if (now[i].h === 0) return;
            if (before[i].h === 0) {
                running.push(c.animate([{ opacity: 0 }, { opacity: 1 }], { duration: IN, easing: ease }));
                return;
            }
            const dx = before[i].r.left - now[i].r.left;
            const dy = before[i].r.top - now[i].r.top;
            if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
            // Cells that travel far fade out on the way, so they do not cross over other text
            const far = Math.hypot(dx, dy) > 40;
            const frames = far
                ? [
                    { transform: `translate3d(${dx}px,${dy}px,0)`, opacity: 1 },
                    { opacity: 0.12, offset: 0.4 },
                    { transform: "none", opacity: 1 },
                ]
                : [{ transform: `translate3d(${dx}px,${dy}px,0)` }, { transform: "none" }];
            running.push(c.animate(frames, { duration: IN, easing: ease }));
        });
    };
    modes.forEach(([, q]) => q.addEventListener("change", switchLayout));

    // Text wrap: a character pushed to the next line leaves to the right
    // and comes in from the left (the other way round when the line grows)
    const BLOCKS = "td.note p,td.note dd,td.masu,td.te,td.meta";
    const TOKEN = /[A-Za-z0-9]+|\s+|./gsu;
    const ghosts = document.createElement("div");
    ghosts.className = "reflow-ghosts";
    document.body.appendChild(ghosts);
    let cache = new Map();
    const live = new Set();
    const keep = (a) => {
        live.add(a);
        const drop = () => live.delete(a);
        a.addEventListener("finish", drop);
        a.addEventListener("cancel", drop);
        return a;
    };
    const resetText = () => {
        cache = new Map();
        vcache = new Map();
        for (const a of [...live]) a.cancel();
        ghosts.replaceChildren();
        for (const g of ghostSet) g.remove();
        ghostSet.clear();
    };
    const tokenize = (el) => {
        if (el.dataset.tok) return;
        el.dataset.tok = "1";
        const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
            acceptNode: (n) => (n.parentElement.closest("ruby,rt,.rb,button,svg,.ch") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
        });
        const nodes = [];
        while (walk.nextNode()) nodes.push(walk.currentNode);
        for (const n of nodes) {
            const frag = document.createDocumentFragment();
            for (const t of n.data.match(TOKEN) || []) {
                if (/^\s+$/.test(t)) {
                    frag.append(t);
                    continue;
                }
                const sp = document.createElement("span");
                sp.className = "ch";
                sp.textContent = t;
                frag.append(sp);
            }
            n.replaceWith(frag);
        }
    };
    // The leaving copy lives inside the same box as the text, so it moves with it
    const ghostSet = new Set();
    const ghostOf = (sp, ref, x, y, h) => {
        const cs = getComputedStyle(sp);
        const g = document.createElement("span");
        g.className = "chg";
        g.setAttribute("aria-hidden", "true");
        g.textContent = sp.textContent;
        g.style.cssText = `left:${x}px;top:${y}px;height:${h}px;font-family:${cs.fontFamily};font-size:${cs.fontSize};font-weight:${cs.fontWeight};line-height:${h}px;color:${cs.color};letter-spacing:${cs.letterSpacing}`;
        ref.appendChild(g);
        ghostSet.add(g);
        return g;
    };
    const spRun = new WeakMap();
    // Row grows or shrinks: the other cells glide to their new vertical place
    let vcache = new Map();
    const vrun = new WeakMap();
    const wrapCells = (tr) => {
        if (tr.dataset.cv) return;
        tr.dataset.cv = "1";
        for (const td of tr.children) {
            if (td.classList.contains("note") || td.querySelector(":scope > .cw")) continue;
            const kids = [...td.childNodes].filter((n) => !(n.nodeType === 1 && n.classList.contains("disc")));
            if (!kids.length) continue;
            const w = document.createElement("span");
            w.className = "cv";
            td.insertBefore(w, kids[0]);
            w.append(...kids);
        }
    };
    const glideCells = (lessons) => {
        const next = new Map();
        const jobs = [];
        for (const l of lessons) {
            for (const tr of l.querySelectorAll("tbody tr")) {
                const tb = tr.getBoundingClientRect();
                if (tb.height === 0 || tb.bottom < -100 || tb.top > innerHeight + 100) continue;
                wrapCells(tr);
                for (const m of tr.querySelectorAll(":scope > td:not(.note) > .cv, :scope > td:not(.note) > .cw, :scope > td > .disc")) {
                    const a = vrun.get(m);
                    const ty = a ? new DOMMatrixReadOnly(getComputedStyle(m).transform).m42 : 0;
                    const now = m.getBoundingClientRect().top - tb.top - ty;
                    next.set(m, now);
                    const old = vcache.get(m);
                    if (old === undefined || Math.abs(old - now) < 0.5) continue;
                    jobs.push([m, old + ty - now]);
                }
            }
        }
        vcache = next;
        for (const [m, dy] of jobs) {
            const prev = vrun.get(m);
            if (prev) prev.cancel();
            const a = keep(m.animate(
                [{ transform: `translateY(${dy}px)` }, { transform: "none" }],
                { duration: 500, easing: ease }
            ));
            vrun.set(m, a);
            const done = () => {
                if (vrun.get(m) === a) vrun.delete(m);
            };
            a.addEventListener("finish", done);
            a.addEventListener("cancel", done);
        }
    };

    const onResize = () => {
        if (!anc) pickAnchor();
        holdAnchor();
        root.style.overflowAnchor = "none";
        // Off-screen lessons skip layout only while resizing (see _jp-verbs.css)
        root.classList.add("resizing");
        clearTimeout(idleT);
        idleT = setTimeout(() => {
            root.style.overflowAnchor = "";
            root.classList.remove("resizing");
            pickAnchor();
        }, 400);
        if (still.matches || coarse.matches || pending()) {
            resetText();
            return;
        }
        if (!root.classList.contains("mid") && !root.classList.contains("m")) glideCells(lessonsInView(100));
        const next = new Map();
        const moved = [];
        const shifted = [];
        for (const l of lessonsInView(100)) {
            for (const el of l.querySelectorAll(BLOCKS)) {
                tokenize(el);
                const ref = el.querySelector(":scope > .cv, :scope > .cw") || el;
                const br = ref.getBoundingClientRect();
                if (br.height === 0) continue;
                for (const sp of el.querySelectorAll(".ch")) {
                    const r = sp.getBoundingClientRect();
                    const off = spRun.has(sp) ? parseFloat(getComputedStyle(sp).left) || 0 : 0;
                    const rel = { x: r.left - br.left - off, y: r.top - br.top, h: r.height };
                    next.set(sp, rel);
                    const old = cache.get(sp);
                    if (old && Math.abs(rel.y - old.y) > r.height * 0.5) {
                        moved.push({ sp, ref, dir: rel.y > old.y ? 1 : -1, x: old.x + off, y: old.y, h: old.h });
                    } else if (old && Math.abs(rel.x - old.x) > 0.5) {
                        shifted.push({ sp, dx: old.x - rel.x + off, live: off !== 0 });
                    }
                }
            }
        }
        cache = next;
        if (!moved.length) return;
        const shiftedSet = shifted;
        const d = 16;
        const track = (sp, a) => {
            const prev = spRun.get(sp);
            if (prev) prev.cancel();
            spRun.set(sp, keep(a));
            const drop = () => {
                if (spRun.get(sp) === a) spRun.delete(sp);
            };
            a.addEventListener("finish", drop);
            a.addEventListener("cancel", drop);
        };
        for (const m of moved) {
            const g = ghostOf(m.sp, m.ref, m.x, m.y, m.h);
            const out = keep(g.animate(
                [{ transform: "none", opacity: 1 }, { transform: `translateX(${m.dir * d}px)`, opacity: 0 }],
                { duration: 280, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" }
            ));
            const gone = () => {
                g.remove();
                ghostSet.delete(g);
            };
            out.addEventListener("finish", gone);
            out.addEventListener("cancel", gone);
            track(m.sp, m.sp.animate(
                [{ left: `${-m.dir * d}px`, opacity: 0 }, { left: "0px", opacity: 1 }],
                { duration: 380, delay: 280, easing: ease, fill: "backwards" }
            ));
        }
        for (const sh of shiftedSet) {
            track(sh.sp, sh.sp.animate(
                [{ left: `${sh.dx}px` }, { left: "0px" }],
                { duration: 380, delay: sh.live ? 0 : 280, easing: ease, fill: "backwards" }
            ));
        }
    };
    addEventListener("jp:resize", onResize);
})();

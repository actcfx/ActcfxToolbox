import { scrollToEl } from "./_scroll.js";

// Reload and back/forward: return to the row that was in the middle of the screen.
// A link with #lesson: land exactly on that lesson.
// The browser's own restore is not reliable here: the fold state and the layout
// class are applied by script, which changes the page height after load.
(() => {
    const KEY = "jp-verbs:pos:" + location.pathname;
    const nav = performance.getEntriesByType("navigation")[0];
    const returning = nav && (nav.type === "reload" || nav.type === "back_forward");

    const anchorAt = (y) => {
        const el = document.elementFromPoint(innerWidth / 2, y);
        return el ? el.closest("tr[id], section.lesson[id], .sec[id], .hero[id]") : null;
    };

    const save = () => {
        const mid = innerHeight / 2;
        const el = anchorAt(mid);
        const data = { y: scrollY };
        if (el) {
            data.id = el.id;
            data.off = el.getBoundingClientRect().top - mid;
        }
        try {
            sessionStorage.setItem(KEY, JSON.stringify(data));
        } catch {
            // storage can be blocked; then the browser default is used
        }
    };

    let saveT = 0;
    addEventListener("scroll", () => {
        clearTimeout(saveT);
        saveT = setTimeout(save, 250);
    }, { passive: true });
    addEventListener("pagehide", save);

    if (!returning) {
        const id = decodeURIComponent(location.hash.slice(1));
        const el = id && document.getElementById(id);
        if (el) scrollToEl(el, { smooth: false });
        return;
    }
    let data = null;
    try {
        data = JSON.parse(sessionStorage.getItem(KEY) || "null");
    } catch {
        data = null;
    }
    if (!data) return;
    const el = data.id && document.getElementById(data.id);
    if (el) {
        const top = el.getBoundingClientRect().top + scrollY - innerHeight / 2 - data.off;
        scrollTo({ top, behavior: "instant" });
        // Lessons above get their real height once they render; scroll once more after that
        requestAnimationFrame(() => {
            const again = el.getBoundingClientRect().top - innerHeight / 2 - data.off;
            if (Math.abs(again) > 1) scrollBy({ top: again, behavior: "instant" });
        });
    } else {
        scrollTo({ top: data.y, behavior: "instant" });
    }
})();

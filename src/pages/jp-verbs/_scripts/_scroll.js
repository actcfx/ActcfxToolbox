// Scroll to an element and land exactly on it.
// Every frame re-reads where the target is now, and a few frames after the end
// correct any last shift (for example a fold animation or images above the target).

let run = 0;
const still = matchMedia("(prefers-reduced-motion: reduce)");

const offset = () => {
    const bar = document.querySelector(".bar");
    return (bar ? bar.offsetHeight : 52) + 12;
};

const targetY = (el) => {
    const box = el.classList.contains("sec") ? el.querySelector("h2") || el : el;
    return box.getBoundingClientRect().top + scrollY - offset();
};

const stop = () => cancelAnimationFrame(run);
for (const type of ["wheel", "touchstart", "keydown"]) {
    addEventListener(type, stop, { passive: true });
}

const settle = (el, frames) => {
    const fix = () => {
        const y = targetY(el);
        if (Math.abs(y - scrollY) > 1) scrollTo({ top: y, behavior: "instant" });
        if (--frames > 0) run = requestAnimationFrame(fix);
    };
    run = requestAnimationFrame(fix);
};

export function scrollToEl(el, { smooth = true } = {}) {
    dispatchEvent(new CustomEvent("jp:jump", { detail: el }));
    stop();
    if (!smooth || still.matches) {
        scrollTo({ top: targetY(el), behavior: "instant" });
        settle(el, 4);
        return;
    }
    const y0 = scrollY;
    const t0 = performance.now();
    const dur = Math.min(700, 320 + Math.abs(targetY(el) - y0) / 12);
    const step = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        const k = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        scrollTo({ top: y0 + (targetY(el) - y0) * k, behavior: "instant" });
        if (p < 1) run = requestAnimationFrame(step);
        else settle(el, 4);
    };
    run = requestAnimationFrame(step);
}

// Flash a row the same way :target does
export function flash(el) {
    if (el.tagName !== "TR") return;
    el.classList.remove("hit");
    void el.offsetWidth;
    el.classList.add("hit");
}

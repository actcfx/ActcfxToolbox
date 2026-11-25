// Right-side index: the bar that marks the current lesson glides to the new lesson
// instead of jumping, also while the pointer is on the index. It scales with the
// tick under it, so it grows with the magnification.
//
// Cost: only class changes are watched. While the pointer is on the index the
// marker is updated once per frame; otherwise it sleeps.
(() => {
    const rail = document.querySelector(".idx");
    if (!rail) return;
    const cur = document.createElement("span");
    cur.className = "cur";
    cur.setAttribute("aria-hidden", "true");
    rail.appendChild(cur);

    let raf = 0;
    let until = 0;

    // Center of a tick, measured from the top of the index (transforms ignored)
    const centerOf = (a) => {
        let y = 0;
        for (let n = a; n && n !== rail; n = n.offsetParent) y += n.offsetTop;
        return y + a.offsetHeight / 2;
    };

    const place = () => {
        const a = rail.querySelector(".grp.open a.on") || rail.querySelector("a.on");
        if (!a || !a.offsetParent) {
            cur.classList.remove("vis");
            return;
        }
        const sx = a.style.getPropertyValue("--sx") || "1";
        const sy = a.style.getPropertyValue("--sy") || "1";
        cur.style.transform = `translateY(${centerOf(a)}px) translateY(-50%) scale(${sx},${sy})`;
        cur.classList.add("vis");
    };

    // Run every frame while the index is in use, and for a short time after any change
    // (the open group can still be changing height)
    const busy = () => rail.classList.contains("tracking") || rail.classList.contains("dragging");
    const tick = (t) => {
        raf = 0;
        place();
        if (t < until || busy()) raf = requestAnimationFrame(tick);
    };
    const follow = () => {
        until = performance.now() + 600;
        if (!raf) raf = requestAnimationFrame(tick);
    };

    // Only class changes on other elements (the marker never changes its own class here,
    // except "vis", which is filtered out)
    new MutationObserver((records) => {
        if (records.some((r) => r.target !== cur)) follow();
    }).observe(rail, { subtree: true, attributes: true, attributeFilter: ["class"] });
    addEventListener("jp:resize", follow);
    follow();
})();

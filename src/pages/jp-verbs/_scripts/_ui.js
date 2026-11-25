(() => {
    const ease = "cubic-bezier(.2,.8,.2,1)";
    const still = matchMedia("(prefers-reduced-motion: reduce)");

    // Tooltips
    const tip = document.createElement("div");
    tip.className = "tip";
    tip.setAttribute("role", "tooltip");
    document.body.appendChild(tip);
    const open = (el) => el.getAttribute("aria-expanded") !== "false";
    const tips = [
        [".disc", (el) => (open(el) ? "收起對照" : "展開對照")],
        [".lfold", (el) => (open(el) ? "收起本課對照" : "展開本課對照")],
        [".home", () => "回到首頁"],
        [".bar-title", () => "回到頁首"],
        [".theme", () => "切換深色／淺色"],
    ];
    const sel = tips.map(([s]) => s).join(",");
    const textOf = (el) => {
        const hit = tips.find(([s]) => el.matches(s));
        return hit ? hit[1](el) : "";
    };
    let cur = null;
    let timer = 0;
    const place = (el) => {
        tip.textContent = textOf(el);
        const r = el.getBoundingClientRect();
        const w = tip.offsetWidth;
        const h = tip.offsetHeight;
        let x = r.left + r.width / 2 - w / 2;
        x = Math.max(8, Math.min(x, innerWidth - w - 8));
        let y = r.bottom + 8;
        if (y + h > innerHeight - 8) y = r.top - h - 8;
        tip.style.left = x + "px";
        tip.style.top = y + "px";
    };
    const hide = () => {
        clearTimeout(timer);
        cur = null;
        tip.classList.remove("show");
    };
    document.addEventListener("pointerover", (e) => {
        if (e.pointerType === "touch") return;
        const el = e.target.closest(sel);
        if (el === cur) return;
        hide();
        if (!el) return;
        cur = el;
        timer = setTimeout(() => {
            place(el);
            tip.classList.add("show");
        }, 350);
    });
    document.addEventListener("pointerout", (e) => {
        if (cur && !cur.contains(e.relatedTarget)) hide();
    });
    document.addEventListener("click", (e) => {
        const el = e.target.closest(sel);
        if (el && el === cur && tip.classList.contains("show")) {
            requestAnimationFrame(() => place(el));
        }
    });
    addEventListener("scroll", hide, { passive: true });

    // Animated <details> in the info area
    const running = new WeakMap();
    document.querySelectorAll(".info details").forEach((d) => {
        const sum = d.querySelector("summary");
        sum.addEventListener("click", (e) => {
            if (still.matches) return;
            e.preventDefault();
            const opening = !d.open || d.classList.contains("closing");
            const h0 = d.getBoundingClientRect().height;
            const prev = running.get(d);
            if (prev) prev.cancel();
            d.style.overflow = "hidden";
            d.classList.toggle("closing", !opening);
            d.open = true;
            const h1 = opening ? d.offsetHeight : sum.offsetHeight;
            const a = d.animate(
                [{ height: h0 + "px" }, { height: h1 + "px" }],
                { duration: 320, easing: ease }
            );
            running.set(d, a);
            a.onfinish = () => {
                running.delete(d);
                d.style.overflow = "";
                if (!opening) {
                    d.open = false;
                    d.classList.remove("closing");
                }
            };
        });
    });
})();

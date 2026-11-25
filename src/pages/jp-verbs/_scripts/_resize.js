// "jp:resize" fires only when the window width changes.
// On iPhone and iPad, the address bar showing and hiding while you scroll fires
// "resize" with only a new height. The page layout does not depend on that, and
// reacting to it (re-measuring the index, holding the scroll position) fought with
// scrolling and made Safari unstable.
let width = innerWidth;
addEventListener("resize", () => {
    if (innerWidth === width) return;
    width = innerWidth;
    dispatchEvent(new Event("jp:resize"));
});

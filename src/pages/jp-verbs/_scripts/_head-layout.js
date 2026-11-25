(()=>{const r=document.documentElement;r.classList.toggle("mid",matchMedia("(min-width:761px) and (max-width:1160px)").matches);r.classList.toggle("m",matchMedia("(max-width:760px)").matches)})()
// The page restores its own scroll position (see _restore.js)
if("scrollRestoration" in history)history.scrollRestoration="manual";

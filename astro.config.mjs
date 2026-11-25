import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import feedback from "./dev/feedback-integration.mjs";

export default defineConfig({
    // Full URLs for link previews (og:image, og:url)
    site: "https://tool.actcfx.net",
    // Every page is built as <slug>/index.html, so URLs end with "/"
    build: { format: "directory" },
    trailingSlash: "ignore",
    server: { port: 3000 },
    integrations: [svelte(), feedback()],
});

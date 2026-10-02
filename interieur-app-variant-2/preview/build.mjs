// Bouwt de app als één los HTML-bestand (preview/dist/mim-studioportaal.html)
// dat zonder server werkt, zodat het als privélink gedeeld kan worden.
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const dist = join(here, "dist");
mkdirSync(dist, { recursive: true });

const shim = (file) => join(here, "shims", file);
const js = await build({
  entryPoints: [join(here, "entry.tsx")],
  bundle: true,
  minify: true,
  write: false,
  format: "iife",
  target: "es2020",
  jsx: "automatic",
  loader: { ".png": "dataurl" },
  alias: {
    "next/link": shim("next-link.tsx"),
    "next/navigation": shim("next-navigation.ts"),
    "next/image": shim("next-image.tsx"),
    "@": join(root, "src"),
  },
  define: {
    "process.env.NODE_ENV": '"production"',
    "process.env.NEXT_PUBLIC_EMBED": '"1"',
  },
});

const cssFile = join(dist, "app.css");
execFileSync("npx", ["@tailwindcss/cli", "-i", join(root, "src/app/globals.css"), "-o", cssFile, "--minify"], {
  cwd: root,
  stdio: "inherit",
});

const fonts =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=Jost:wght@400;500&display=swap";
const script = js.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const html = `<title>mim studioportaal</title>
<link rel="stylesheet" href="${fonts}">
<style>
:root{--font-cormorant:"Cormorant Garamond",Georgia,"Times New Roman",serif;--font-jost:"Jost",system-ui,-apple-system,"Segoe UI",sans-serif;color-scheme:light}
html,body{min-height:100%}
${readFileSync(cssFile, "utf8")}
</style>
<div id="root"></div>
<script>${script}</script>
`;
writeFileSync(join(dist, "mim-studioportaal.html"), html);
console.log(`preview/dist/mim-studioportaal.html (${Math.round(html.length / 1024)} kB)`);

// Bouwt de app als één los HTML-bestand dat zonder server werkt.
//   node preview/build.mjs         -> preview/dist/mim-klantportaal.html (voor de privélink)
//   node preview/build.mjs --site  -> site/index.html (om zelf online te hosten)
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const site = process.argv.includes("--site");
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
    // Op een eigen website werkt printen wel, dus daar komt "Download PDF" terug.
    "process.env.NEXT_PUBLIC_EMBED": site ? '"0"' : '"1"',
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
const body = `<title>mim klantportaal</title>
<link rel="stylesheet" href="${fonts}">
<style>
:root{--font-cormorant:"Cormorant Garamond",Georgia,"Times New Roman",serif;--font-jost:"Jost",system-ui,-apple-system,"Segoe UI",sans-serif;color-scheme:light}
html,body{min-height:100%}
${readFileSync(cssFile, "utf8")}
</style>
<div id="root"></div>
<script>${script}</script>
`;
if (site) {
  const icon = `data:image/png;base64,${readFileSync(join(root, "public/logo.png")).toString("base64")}`;
  const html = `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Klantportaal van mim | interiors: ontwerp, keuzes, planning en facturen op één plek.">
<meta name="robots" content="noindex">
<link rel="icon" href="${icon}">
<link rel="apple-touch-icon" href="${icon}">
${body.replace("<div id=\"root\"></div>", "</head>\n<body>\n<div id=\"root\"></div>")}</body>
</html>
`;
  const out = join(root, "site");
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, "index.html"), html);
  console.log(`site/index.html (${Math.round(html.length / 1024)} kB)`);
} else {
  writeFileSync(join(dist, "mim-klantportaal.html"), body);
  console.log(`preview/dist/mim-klantportaal.html (${Math.round(body.length / 1024)} kB)`);
}

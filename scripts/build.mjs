import { mkdir, writeFile, cp, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  renderedPages,
  redirects,
  renderRedirect,
  origin,
} from "../src/render.mjs";

const output = new URL("../dist/", import.meta.url);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(new URL("../public/", import.meta.url), output, { recursive: true });
async function write(path, content) {
  const relative = path.endsWith("/") ? `${path}index.html` : path;
  const file = join(output.pathname, relative);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, content);
}
for (const page of renderedPages) await write(page.path, page.html);
for (const [path, target] of Object.entries(redirects))
  await write(path, renderRedirect(path, target));
await write(
  "/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${renderedPages
    .filter((p) => !p.noindex)
    .map((p) => `<url><loc>${origin}${p.path}</loc></url>`)
    .join("")}</urlset>`,
);
await write(
  "/robots.txt",
  `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`,
);
console.log(
  `Built ${renderedPages.length} pages and ${Object.keys(redirects).length} legacy redirects in dist/.`,
);

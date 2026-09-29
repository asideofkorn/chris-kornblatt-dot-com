import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { resolve, join } from "node:path";
import { runInNewContext } from "node:vm";
import { parseHTML } from "linkedom";

const root = resolve("dist");
async function files(dir = root) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) result.push(...(await files(path)));
    else result.push(path);
  }
  return result;
}
const output = await files();
const pages = await Promise.all(
  output
    .filter((p) => p.endsWith(".html"))
    .map(async (file) => {
      const html = await readFile(file, "utf8");
      return { file, html, document: parseHTML(html).document };
    }),
);
const canonicalPages = pages.filter(
  (p) => !p.document.querySelector('meta[http-equiv="refresh"]'),
);

test("ships eight substantive pages, a real 404, and only three main destinations", () => {
  assert.equal(canonicalPages.length, 9);
  for (const { document, file } of canonicalPages) {
    assert.equal(document.querySelectorAll("h1").length, 1, file);
    assert.equal(document.querySelectorAll("main").length, 1, file);
    assert.deepEqual(
      [...document.querySelectorAll(".site-nav a")].map((a) =>
        a.getAttribute("href"),
      ),
      ["/", "/work/", "/projects/"],
    );
    assert.equal(
      document.querySelector(".skip-link").getAttribute("href"),
      "#main",
    );
    const headings = [...document.querySelectorAll("h1,h2,h3,h4")].map((h) =>
      Number(h.tagName[1]),
    );
    for (let i = 1; i < headings.length; i++)
      assert.ok(
        headings[i] <= headings[i - 1] + 1,
        `Skipped heading level: ${file}`,
      );
  }
});

test("all local links, assets, and fragment targets resolve in the production build", async () => {
  for (const { document, file } of pages) {
    for (const element of document.querySelectorAll("[href], [src]")) {
      const value = element.getAttribute("href") || element.getAttribute("src");
      if (!value || /^(https?:|mailto:)/.test(value)) continue;
      const current = new URL(
        `https://chriskornblatt.com/${file.slice(root.length + 1)}`,
      );
      const target = new URL(value, current);
      let path = join(root, target.pathname);
      if ((await stat(path)).isDirectory()) path = join(path, "index.html");
      assert.ok((await stat(path)).isFile(), `${file}: ${value}`);
      if (target.hash) {
        const destination = parseHTML(await readFile(path, "utf8")).document;
        assert.ok(
          destination.getElementById(target.hash.slice(1)),
          `${file}: missing ${value}`,
        );
      }
    }
  }
});

test("public output excludes retired copy, confidential details, and em dashes", async () => {
  for (const file of output.filter((p) =>
    /\.(html|css|js|xml|txt|svg)$/.test(p),
  )) {
    const text = await readFile(file, "utf8");
    assert.doesNotMatch(text, /\u2014|&mdash;|&#8212;|&#x2014;/i, file);
    assert.doesNotMatch(
      text,
      /slack\.com|docs\.google\.com|coming soon|forthcoming|placeholder/i,
      file,
    );
    if (file.endsWith(".html"))
      assert.doesNotMatch(
        text,
        /Building for the desert|Designing the human side of an AI system|When one product object is secretly several concepts/,
      );
  }
  const t49 = await readFile(join(root, "work/terminal49/index.html"), "utf8");
  assert.match(t49, /55\+/);
  assert.match(t49, /1,100/);
  assert.doesNotMatch(t49, /\$|contract value|billing discrepancy/i);
});

test("canonical pages have distinct titles, descriptions, canonical URLs, and social previews", async () => {
  const titles = new Set();
  for (const { document, file } of canonicalPages) {
    const title = document.querySelector("title").textContent;
    assert.ok(!titles.has(title), file);
    titles.add(title);
    assert.ok(
      document.querySelector('meta[name="description"]').getAttribute("content")
        .length > 20,
    );
    assert.equal(
      document
        .querySelector('meta[property="og:title"]')
        .getAttribute("content"),
      title,
    );
    assert.equal(
      document
        .querySelector('meta[property="og:image"]')
        .getAttribute("content"),
      "https://chriskornblatt.com/social.png",
    );
    if (!file.endsWith("404.html"))
      assert.ok(document.querySelector('link[rel="canonical"]'));
  }
  assert.ok((await stat(join(root, "social.png"))).size > 1000);
  assert.equal(
    (await readFile(join(root, "CNAME"), "utf8")).trim(),
    "chriskornblatt.com",
  );
  const sitemap = await readFile(join(root, "sitemap.xml"), "utf8");
  assert.equal((sitemap.match(/<loc>/g) || []).length, 8);
  assert.doesNotMatch(sitemap, /about|field-notes|404/);
  for (const name of ["src", "tests", "node_modules", ".git", "package.json"])
    assert.ok(!output.includes(join(root, name)));
});

test("email enhancement preserves the existing address and a readable no-script fallback", async () => {
  const html = await readFile(join(root, "index.html"), "utf8");
  const { document } = parseHTML(html);
  runInNewContext(await readFile("public/contact.js", "utf8"), { document });
  assert.equal(
    document.querySelector("[data-email-user]").getAttribute("href"),
    "mailto:chris.kornblatt@gmail.com",
  );
  assert.match(
    document.querySelector("noscript").textContent,
    /chris\.kornblatt at gmail dot com/,
  );
  assert.doesNotMatch(html, /mailto:chris/);
});

test("legacy deep links resolve to the new work and project pages", async () => {
  const script = await readFile("public/redirect.js", "utf8");
  for (const [pathname, hash, expected] of [
    ["/work.html", "#document-hub", "/work/terminal49/"],
    ["/work.html", "#review-mode", "/work/terminal49/"],
    ["/work.html", "#shipment-model", "/work/terminal49/"],
    ["/work.html", "", "/work/"],
    ["/projects.html", "#tea", "/projects/quantitea/"],
    ["/projects.html", "#mountains", "/projects/"],
    ["/about.html", "#contact", "/#contact"],
    ["/field-notes.html", "", "/"],
  ]) {
    let destination;
    runInNewContext(script, {
      window: {
        location: {
          pathname,
          hash,
          replace: (value) => {
            destination = value;
          },
        },
      },
    });
    assert.equal(destination, expected);
  }
});

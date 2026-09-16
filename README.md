# chriskornblatt.com

Personal website for Chris Kornblatt. A hand-written static site — no build step,
no dependencies. Six pages, a stylesheet, and one small script, deployed to
GitHub Pages by GitHub Actions on every push to `main`.

## Structure

```
index.html        Home
work.html         Selected work (#work-index, #document-hub, #review-mode, #shipment-model)
projects.html     Independent projects (#projects-index, #tea, #desert, #mountains)
field-notes.html  Notebook — not yet in the main nav (see below)
about.html        About + contact (#contact)
404.html          Not-found page served by GitHub Pages
styles.css        All styling
contact.js        Assembles the email address at runtime (about.html only)
CNAME             Custom domain: chriskornblatt.com
.nojekyll         Serve files as-is, skip Jekyll processing
.github/workflows/pages.yml
```

## Editing notes

**The email address is deliberately never written out in the source.** On
`about.html` the contact link carries the address in three pieces
(`data-email-user`, `data-email-domain`, `data-email-tld`) and `contact.js`
joins them into a `mailto:` href on load. The visible text reads
`chris.kornblatt at gmail dot com`, so the address is still usable with
JavaScript disabled. Don't "tidy" this by inlining a plain `mailto:` — that
hands the address to the first scraper that reads the HTML. Profile links
(GitHub, LinkedIn, X, Threads) are plain links in the footer of every page and
in the contact block on `about.html`.

**Field Notes is demoted until something is published.** The page exists and is
linked from the homepage and every footer, but it is out of the main nav and the
homepage shows a single line rather than a list of unwritten posts. Once a real
note ships, add `<a href="field-notes.html">Field Notes</a>` back to the
`.site-nav` on each page and expand the `.notebook-line` block on `index.html`.

**Work and Projects are single pages with anchored sections.** Each has a
`.page-index` table of contents at the top and `.case-nav` previous/next links at
the foot of every section. If either grows past roughly five entries, that's the
signal to split the sections into their own pages.

## Local preview

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deployment

`.github/workflows/pages.yml` runs on every push to `main` (and on manual
`workflow_dispatch`). It uploads the repository root as a Pages artifact and
deploys it with `actions/deploy-pages`. Nothing is built or compiled.

One-time repository setup: **Settings → Pages → Build and deployment → Source:
GitHub Actions**.

## Custom domain

The domain is registered at Squarespace and already points at GitHub Pages.
These records are live — no DNS changes are needed.

| Type  | Host  | Value                   |
| ----- | ----- | ----------------------- |
| A     | @     | 185.199.108.153         |
| A     | @     | 185.199.109.153         |
| A     | @     | 185.199.110.153         |
| A     | @     | 185.199.111.153         |
| CNAME | www   | asideofkorn.github.io   |

Squarespace also carries a `_domainconnect` CNAME (its own plumbing) and a
`gv-*` CNAME for Google Workspace verification. Both are unrelated to this site
and should be left in place.

In **Settings → Pages**, set the custom domain to `chriskornblatt.com` and
enable **Enforce HTTPS** once the certificate is issued. The `CNAME` file in
this repo keeps that setting in place across deployments; deleting it unsets the
domain on the next deploy.

Optional, not currently configured:

- AAAA records on the apex (`2606:50c0:8000::153` through `...8003::153`) for
  IPv6 clients hitting the bare domain. `www` already resolves over IPv6 via the
  CNAME.
- Domain verification (**Settings → Pages → Verify domain**), which issues a
  `_github-pages-challenge-asideofkorn` TXT record to add at Squarespace. It
  prevents anyone else from claiming the domain for their own Pages site.

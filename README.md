# chriskornblatt.com

Personal website for Chris Kornblatt. A hand-written static site — no build step,
no dependencies. Six pages plus a stylesheet, deployed to GitHub Pages by GitHub
Actions on every push to `main`.

## Structure

```
index.html        Home
work.html         Selected work (#document-hub, #review-mode, #shipment-model)
projects.html     Independent projects (#tea, #desert, #mountains)
field-notes.html  Notebook
about.html        About + contact (#contact)
404.html          Not-found page served by GitHub Pages
styles.css        All styling
CNAME             Custom domain: chriskornblatt.com
.nojekyll         Serve files as-is, skip Jekyll processing
.github/workflows/pages.yml
```

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

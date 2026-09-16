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

The domain is registered at Squarespace and points at GitHub Pages.

DNS records at Squarespace (Domains → chriskornblatt.com → DNS Settings):

| Type  | Host  | Value                   |
| ----- | ----- | ----------------------- |
| A     | @     | 185.199.108.153         |
| A     | @     | 185.199.109.153         |
| A     | @     | 185.199.110.153         |
| A     | @     | 185.199.111.153         |
| CNAME | www   | asideofkorn.github.io.  |

Remove any Squarespace-supplied A/CNAME records for `@` and `www` first, or they
will conflict.

After DNS propagates, set the custom domain in **Settings → Pages** to
`chriskornblatt.com` and enable **Enforce HTTPS** once the certificate is issued.
The `CNAME` file in this repo keeps that setting in place across deployments.

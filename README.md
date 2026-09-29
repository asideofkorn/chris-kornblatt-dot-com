# chriskornblatt.com

Chris Kornblatt's personal website. Home, Work, and Projects, with three work
pages and two project pages. Static HTML and CSS, with a small email enhancement.
No browser framework or runtime dependencies.

## Develop and verify

Requires Node.js 22 or later.

```sh
npm ci
npm run format
npm run build
npm run format:check
npm run lint
npm test
npm run preview
```

Preview: http://127.0.0.1:4173. Rebuild after editing source files.

- `src/content.mjs`: approved public copy and profile/project links.
- `src/render.mjs`: shared page shell, page layouts, metadata, and legacy redirects.
- `public/`: responsive stylesheet, email enhancement, icons, social image, domain.
- `scripts/build.mjs`: dependency-free static build to `dist/`.
- `tests/`: generated-site checks for navigation, metadata, links, retired content,
  confidentiality, and email/redirect behavior.

The design retains the previous site's warm paper, green accent, content grids,
responsive shell, and understated link treatment. Shared templates keep navigation
and footer consistent. Long-form copy uses a narrow reading column and system fonts.

## Copy and links

The Career conversation's full specification supplies page copy. Its later voice
revisions supersede the original Home, How I Work, Terminal49 opening, Wayproof
opening, and Quantitea copy. Other copy retains the specification's wording, with
em dashes replaced by sentence structure or punctuation. The displayed Wayproof
lineage comes from its public README.

Only approved aggregate Terminal49 details belong here. Do not add customer names,
customer revenue or contract figures, staffing plans, billing discrepancies, internal
links, screenshots, source documents, or non-public implementation details.

No public resume artifact was selected, so no resume link is rendered. There are no
About or Field Notes content pages. Existing `.html` URLs redirect to their relevant
new pages; legacy Terminal49 section links and the tea link retain useful destinations.

The email remains split across data attributes, as in the existing site. JavaScript
creates the mail link; with JavaScript disabled, Email leads to a readable address.
This is a convenience, not a guarantee against scraping.

## Deployment

The existing GitHub Pages/custom-domain setup is retained. Pull requests run formatting,
HTML/JavaScript linting, tests, and a production build. Pushes to `main` publish only
`dist/`, excluding source, tests, dependencies, and repository files. `public/CNAME`
retains chriskornblatt.com. No DNS changes are required.

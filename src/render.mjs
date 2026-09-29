import {
  home,
  work,
  projects,
  workIntro,
  projectsIntro,
  career,
  links,
} from "./content.mjs";

export const origin = "https://chriskornblatt.com";
export const escape = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
const prose = (text) =>
  escape(text).replaceAll("Tools of Titans", "<em>Tools of Titans</em>");
const paragraphs = (values) =>
  values.map((p) => `<p>${prose(p)}</p>`).join("\n");
const link = (href, label) => `<a href="${escape(href)}">${escape(label)}</a>`;
const footer = `<footer class="site-footer shell" id="contact">
  <div><span class="footer-name">Chris Kornblatt</span><span>Oakland, California</span></div>
  <nav class="footer-social" aria-label="Profiles and email">
    <a class="email" href="#email" data-email-user="chris.kornblatt" data-email-domain="gmail" data-email-tld="com">Email</a>
    ${link(links.linkedin, "LinkedIn")}${link(links.github, "GitHub")}
  </nav>
  <noscript><p id="email">chris.kornblatt at gmail dot com</p></noscript>
</footer>`;

function layout({ path, title, description, body, noindex = false }) {
  const nav = [
    ["/", "Home"],
    ["/work/", "Work"],
    ["/projects/", "Projects"],
  ]
    .map(([href, name]) => {
      const current = path === href || (href !== "/" && path.startsWith(href));
      return `<a href="${href}"${current ? ` aria-current="${path === href ? "page" : "true"}"` : ""}>${name}</a>`;
    })
    .join("");
  return `<!DOCTYPE html>
<html lang="en"><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(title)}</title>
  <meta name="description" content="${escape(description)}">
  ${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${origin}${path}">`}
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Chris Kornblatt">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(description)}">
  <meta property="og:url" content="${origin}${path}">
  <meta property="og:image" content="${origin}/social.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Chris Kornblatt. Product manager and builder. Oakland, California.">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="/styles.css">
  <script src="/contact.js" defer></script>
</head><body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header shell"><a class="wordmark" href="/">Chris Kornblatt</a><nav class="site-nav" aria-label="Main navigation">${nav}</nav></header>
  <main class="shell" id="main" tabindex="-1">${body}</main>
  ${footer}
</body></html>`;
}

function entries(items, group, heading = 2) {
  return `<div class="work-list">${items
    .map(
      (item, i) => `<article class="work-item">
    <div class="work-label"><span class="work-number">${String(i + 1).padStart(2, "0")}</span><span>${escape(item.name)}</span></div>
    <div><h${heading}>${link(`/${group}/${item.slug}/`, item.previewTitle || item.subtitle || item.title)}</h${heading}>
    <p>${prose(item.summary)}</p>
    <a class="text-link" href="/${group}/${item.slug}/">${group === "work" ? "Read about the work" : item.slug === "wayproof" ? "Explore Wayproof" : "The story"} <span aria-hidden="true">→</span><span class="sr-only">: ${escape(item.name)}</span></a></div>
  </article>`,
    )
    .join("")}</div>`;
}

function detail(item, group, next) {
  const body = `<article class="detail">
    <header class="page-hero"><p class="eyebrow">${link(`/${group}/`, group === "work" ? "Work" : "Projects")} <span aria-hidden="true">/</span> ${escape(item.name)}</p>
    <h1>${escape(item.title)}</h1>${item.subtitle ? `<p class="subtitle">${escape(item.subtitle)}</p>` : ""}</header>
    <div class="reading-column prose">${paragraphs(item.intro)}
    ${item.sections.map((section) => `<section><h2>${escape(section.title)}</h2>${paragraphs(section.paragraphs)}</section>`).join("")}
    ${item.slug === "wayproof" ? `<figure class="evidence-model"><figcaption>Evidence lineage <span>From the Wayproof repository</span></figcaption><ol><li>Source</li><li>Observation</li><li>Evidence</li><li>Claim</li><li>Rule / DerivedResult</li></ol><a href="${links.wayproofRepo}#trust-model">Read the trust model <span aria-hidden="true">↗</span></a></figure><div class="project-links">${link(links.wayproof, "Visit Wayproof ↗")}${link(links.wayproofRepo, "View on GitHub ↗")}</div>` : ""}
    <nav class="case-nav" aria-label="More ${group}">${link(`/${group}/`, `← All ${group}`)}${next ? link(`/${group}/${next.slug}/`, `${next.name} →`) : ""}</nav>
    </div>
  </article>`;
  return {
    path: `/${group}/${item.slug}/`,
    title: `${item.name} | Chris Kornblatt`,
    description: item.intro[0],
    body,
  };
}

const pages = [
  {
    path: "/",
    title: "Chris Kornblatt | Technical Product Leader & Builder",
    description:
      "Chris Kornblatt builds AI, platform, and automation products that turn complex operational workflows into scalable systems.",
    body: `
    <section class="hero"><p class="eyebrow">Product manager &amp; builder</p><h1>${escape(home.title)}</h1><div class="hero-intro">${paragraphs(home.intro)}</div><nav class="hero-links" aria-label="Explore">${link("/work/", "Work →")}${link("/projects/", "Projects →")}</nav></section>
    <section class="section"><h2 class="section-title">Selected work</h2>${entries(work, "work", 3)}</section>
    <section class="section content-grid"><p class="eyebrow">How I work</p><div class="prose"><h2>${escape(home.howTitle)}</h2>${paragraphs(home.how)}</div></section>
    <section class="section"><h2 class="section-title">Selected projects</h2>${entries(projects, "projects", 3)}</section>
    <section class="section content-grid"><h2 class="section-title">Elsewhere</h2><div class="prose"><p>${prose(home.elsewhere)}</p></div></section>`,
  },
  {
    path: "/work/",
    title: "Work | Chris Kornblatt",
    description:
      "Product work at Terminal49, Lula / Addify, and Invitae: AI document workflows, commercial insurance, and systems that scale.",
    body: `<header class="page-hero"><p class="eyebrow">AI · Insurance · Biotech</p><h1>Work</h1><div class="lede">${paragraphs(workIntro)}</div></header>${entries(work, "work")}<section class="section content-grid"><h2 class="section-title">Career</h2><ol class="career">${career.map(([years, name, role]) => `<li><span class="career-years">${years}</span><div><h3>${escape(name)}</h3><p>${escape(role)}</p></div></li>`).join("")}</ol></section>`,
  },
  {
    path: "/projects/",
    title: "Projects | Chris Kornblatt",
    description:
      "Wayproof and Quantitea: independent projects in outdoor planning, structured evidence, and better tea through measurement.",
    body: `<header class="page-hero"><p class="eyebrow">Independent projects</p><h1>Projects</h1><div class="lede">${paragraphs(projectsIntro)}</div></header>${entries(projects, "projects")}`,
  },
  ...work.map((item, index) => detail(item, "work", work[index + 1])),
  ...projects.map((item, index) =>
    detail(item, "projects", projects[index + 1]),
  ),
  {
    path: "/404.html",
    title: "Page not found | Chris Kornblatt",
    description: "This page could not be found.",
    noindex: true,
    body: '<header class="page-hero"><p class="eyebrow">404</p><h1>Page not found.</h1><p>The page may have moved. You can find my work and projects below.</p><nav class="hero-links" aria-label="Find a page"><a href="/">Home →</a><a href="/work/">Work →</a><a href="/projects/">Projects →</a></nav></header>',
  },
];
export const renderedPages = pages.map((page) => ({
  ...page,
  html: layout(page),
}));

// Keep existing inbound links useful without retaining retired content.
export const redirects = {
  "/work.html": "/work/",
  "/projects.html": "/projects/",
  "/about.html": "/#contact",
  "/field-notes.html": "/",
};
export const renderRedirect = (path, target) =>
  `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Page moved | Chris Kornblatt</title><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url=${target}"><link rel="canonical" href="${origin}${target.split("#")[0]}"><link rel="stylesheet" href="/styles.css"></head><body><main class="shell page-hero"><h1>This page has moved.</h1><p>${link(target, "Continue to the page →")}</p></main><script src="/redirect.js" data-path="${path}"></script></body></html>`;

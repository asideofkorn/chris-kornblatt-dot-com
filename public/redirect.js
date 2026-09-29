const workAnchors = new Set(["document-hub", "review-mode", "shipment-model"]);
const { pathname, hash } = window.location;
let target;
if (pathname === "/work.html")
  target = workAnchors.has(hash.slice(1)) ? "/work/terminal49/" : "/work/";
if (pathname === "/projects.html")
  target = hash === "#tea" ? "/projects/quantitea/" : "/projects/";
if (pathname === "/about.html") target = "/#contact";
if (pathname === "/field-notes.html") target = "/";
if (target) window.location.replace(target);

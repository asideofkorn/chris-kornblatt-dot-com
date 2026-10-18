// Runs the real tracker page in headless Chromium against recorded race-day data, with the timing feed (RTRT.me)
// replaced by fixtures, so a test can replay any moment of the race and read back what the page shows.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
export const PAGE = "file://" + join(here, "..", "bradley-ironman", "index.html");
// Anonymized field data at 4:36 pm (mats placed by the race-day definitions).
export const FIELD = JSON.parse(readFileSync(join(here, "fixtures", "field-1636.json"), "utf8"));
export const FEED_POINTS = JSON.parse(readFileSync(join(here, "fixtures", "points-raceday.json"), "utf8")).list;
export const PROFILE_FROZEN = JSON.parse(readFileSync(join(here, "fixtures", "profile-frozen-1311.json"), "utf8")).list;
export const PID = "RL78MBN2";

const hms = (s) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${x.toFixed(3).padStart(6, "0")}`; };

// Each mat's crossing list, built from the anonymized field data; Bradley's rows carry his real id.
export function matLists(field = FIELD) {
  const lists = {};
  field.mats.forEach((m, i) => {
    const L = [];
    field.athletes.forEach((a, n) => {
      for (let k = 2; k + 1 < a.length; k += 2) if (a[k] === i) {
        L.push({ point: m.name, label: m.name, pid: n === field.bradley ? PID : "P" + n, epochTime: String(a[1] + a[k + 1]), netTime: hms(a[k + 1]), race: "Ironman, " + (field.divs[field.div[n]] || "") });
        break;
      }
    });
    lists[m.name] = L;
  });
  return lists;
}

// Bradley's real crossings: [{ point, cum, t (sec) }].
export function bradleyCrossings(field = FIELD) {
  const a = field.athletes[field.bradley], out = [];
  for (let k = 2; k + 1 < a.length; k += 2) out.push({ point: field.mats[a[k]].name, cum: field.mats[a[k]].cum, t: a[1] + a[k + 1] });
  return out.sort((x, y) => x.t - y.t);
}

// Where he actually was at time t (sec), interpolating between his real crossings, in cumulative race miles.
export function actualCum(t, field = FIELD) {
  const c = bradleyCrossings(field);
  for (let i = 1; i < c.length; i++) if (t <= c[i].t) return c[i - 1].cum + (c[i].cum - c[i - 1].cum) * (t - c[i - 1].t) / (c[i].t - c[i - 1].t);
  return null;
}

export const at = (hhmm) => new Date(`2026-10-18T${hhmm}:00-07:00`);

/**
 * Open the page at a race moment.
 * opts.now        Date the page's clock is set to
 * opts.profile    rows his own feed returns (default: the real frozen feed)
 * opts.lists      per-mat lists (default: built from the field data); only crossings before `now` are served
 * opts.extra      extra rows to add to mat lists, e.g. a stray chip read: [{ point, epochTime }]
 * opts.saved      localStorage state to start from (a phone that already had the page open)
 * opts.settle     ms of page time to run before reading results
 */
export async function openAt(browser, opts) {
  const now = opts.now, cut = now.getTime() / 1000;
  const lists = opts.lists || matLists();
  for (const x of opts.extra || []) (lists[x.point] ||= []).push({ label: x.point, pid: PID, netTime: "00:00:00.000", ...x });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: "America/Los_Angeles" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  if (process.env.LEAFLET_DIR) {
    await page.route("https://cdnjs.cloudflare.com/**/leaflet.min.js", (r) => r.fulfill({ path: join(process.env.LEAFLET_DIR, "leaflet.js"), contentType: "application/javascript" }));
    await page.route("https://cdnjs.cloudflare.com/**/leaflet.min.css", (r) => r.fulfill({ path: join(process.env.LEAFLET_DIR, "leaflet.css"), contentType: "text/css" }));
  }
  await page.route(/tile\.openstreetmap\.org|fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.route("https://api.rtrt.me/**", (r) => {
    const u = new URL(r.request().url());
    let body;
    if (u.pathname === "/register") body = { token: "TEST" };
    else if (/\/events\/[^/]+\/points$/.test(u.pathname)) body = { list: opts.points || FEED_POINTS };
    else if (u.pathname.includes("/profiles/")) body = { list: (opts.profile || PROFILE_FROZEN).filter((x) => +x.epochTime <= cut) };
    else {
      const m = u.pathname.match(/points\/(\w+)\/splits/), st = +(u.searchParams.get("start") || 1), mx = +(u.searchParams.get("max") || 1000);
      const L = ((m && lists[m[1]]) || []).filter((x) => +x.epochTime <= cut).sort((a, b) => a.epochTime - b.epochTime).slice(st - 1, st - 1 + mx);
      body = L.length ? { list: L } : { error: { type: "no_results", msg: "No splits found" } };
    }
    r.fulfill({ contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(body) });
  });
  if (opts.saved) await page.addInitScript((s) => { if (!sessionStorage.seeded) { sessionStorage.seeded = 1; localStorage.setItem("bradley-imca-2026-v1", JSON.stringify(s)); } }, opts.saved);
  await page.clock.install({ time: now });
  await page.goto(PAGE);
  // Let the page poll, find his mats and catch up, in page time.
  const settle = opts.settle ?? 30000;
  for (let t = 0; t < settle; t += 1000) { await page.clock.runFor(1000); await page.waitForTimeout(60); }
  return { page, ctx, errors };
}

// What the page currently believes, read from its own model.
export function readState(page) {
  return page.evaluate(() => {
    const M = buildModel(), now = Date.now(), cur = currentState(M, now), ap = appPosition(now);
    const auto = S.obs.filter((o) => o.src === "auto").sort((a, b) => a.t - b.t);
    const last = auto[auto.length - 1];
    return {
      cum: cur.pre ? 0 : toCum(cur.pos.leg, cur.pos.mile),
      pos: cur.pre ? null : { leg: cur.pos.leg, mile: cur.pos.mile },
      lastMat: last && { point: last.point, t: last.t / 1000 },
      mats: auto.map((o) => o.point),
      finish: M.predict(M.UT).x / 1000,
      app: ap ? toCum(ap.leg, ap.mile) : null,
      speedText: (document.querySelector(".kv2") || {}).innerText || "",
    };
  });
}

export const launch = () => chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});

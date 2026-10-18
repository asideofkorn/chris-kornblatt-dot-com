// Saves the tracker's own forecast each time Bradley crosses a timing mat, so the post-race review can see how
// the prediction moved. Runs the real tracker page in headless Chrome, fed with the splits the race recorder
// saved (data/bradley.jsonl on the race-data branch), and appends one line per mat to data/forecasts.jsonl.
// A mat seen within 15 minutes is snapshotted live (with today's field comparables); older mats are
// reconstructed from the splits up to that mat only, with the clock set just after it and no field data.
// Usage (from a race-data checkout): SITE=/path/to/site node forecast-snapshots.mjs
import { readFileSync, appendFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { chromium } from "playwright-core";

const SITE = process.env.SITE || "../site";
const PAGE = `file://${SITE}/bradley-ironman/index.html`;
const SPLITS = "data/bradley.jsonl", OUT = "data/forecasts.jsonl";
const EVERY_MS = 2 * 60 * 1000;
const RUN_MS = (Number(process.env.RUN_MINUTES) || 0) * 60 * 1000;
const STOP_AT = Date.parse("2026-10-19T09:00:00Z");
const LIVE_MS = 15 * 60 * 1000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function latestSplits() {
  if (!existsSync(SPLITS)) return [];
  const lines = readFileSync(SPLITS, "utf8").trim().split("\n").reverse();
  for (const l of lines) { try { const j = JSON.parse(l); if (j.ok && j.list) return j.list; } catch {} }
  return [];
}
function done() {
  if (!existsSync(OUT)) return new Set();
  return new Set(readFileSync(OUT, "utf8").trim().split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l).mat; } catch { return null; } }));
}

async function snapshot(browser, list, idx) {
  const mat = list[idx], matT = parseFloat(mat.epochTime) * 1000;
  const live = idx === list.length - 1 && Date.now() - matT < LIVE_MS;
  const shown = list.slice(0, idx + 1);
  const ctx = await browser.newContext({ timezoneId: "America/Los_Angeles" });
  const p = await ctx.newPage();
  await p.route(/tile\.openstreetmap\.org|fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await p.route("https://api.rtrt.me/**", (r) => {
    const u = new URL(r.request().url());
    if (u.pathname.endsWith("/splits") && u.pathname.includes("/profiles/")) return r.fulfill({ contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify({ list: shown }) });
    if (!live && u.pathname.includes("/points/")) return r.fulfill({ contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify({ error: { type: "no_results" } }) });
    if (!live && u.pathname === "/register") return r.fulfill({ contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify({ token: "RECONSTRUCT" }) });
    return r.continue();
  });
  if (!live) await p.clock.setFixedTime(new Date(matT + 90 * 1000));
  await p.goto(PAGE);
  // Wait for the page to take in the split, and when live, for its field comparables at this mat.
  for (let n = 0; n < 120; n++) {
    await sleep(500);
    const ready = await p.evaluate(([pt, live]) => S.obs.some((o) => o.point === pt) && (!live || (S.field && S.field.P === pt)), [mat.point, live]).catch(() => false);
    if (ready) break;
  }
  const hasMat = await p.evaluate((pt) => S.obs.some((o) => o.point === pt), mat.point).catch(() => false);
  if (!hasMat) { await ctx.close(); throw new Error("page didn't load the split; will retry"); }
  await sleep(1000);
  const snap = await p.evaluate(() => {
    const M = buildModel(), now = Date.now(), iso = (t) => new Date(t).toISOString();
    const at = (leg, mile) => { const q = M.predict(M.posToU(leg, mile)); return { likely: iso(q.x), early: iso(q.e), late: iso(q.l), done: q.past || q.x <= now }; };
    const milestones = [["Swim done", "SWIM"], ["T1 out", "T1"], ["Bike done", "BIKE"], ["T2 out", "T2"], ["Finish", "FINISH"]].map(([name, pt]) => ({ name, point: pt, ...at(...POINTS[pt]) }));
    return {
      milestones,
      spots: allPasses(M, now).map((x) => ({ spot: x.spot.name, pass: x.spot.passes.length > 1 ? x.k + 1 : undefined, ...at(x.pass.leg, x.pass.mile) })),
      mats: FIELD_ORDER.map((pt) => ({ point: pt, ...at(...POINTS[pt]) })),
      model: { paceRatio: M.R.map((r) => +r.toFixed(3)), form: +M.rAll.toFixed(3), field: S.field ? { at: S.field.P, peers: S.field.peers, next: S.field.qs.map((q) => q.point) } : null },
    };
  });
  await ctx.close();
  return { at: new Date().toISOString(), mat: mat.point, label: mat.label, matTime: new Date(matT).toISOString(), netTime: mat.netTime, mode: live ? "live" : "reconstructed", ironman: { next: mat.etnp || null, finish: mat.etfp || null }, ...snap };
}

function push() {
  try { execSync(`git add ${OUT} && git commit -q -m "Forecast snapshots $(date -u +%H:%M)" && (git push -q origin HEAD:race-data || (git pull -q --rebase origin race-data && git push -q origin HEAD:race-data))`, { stdio: "inherit", shell: "/bin/bash" }); } catch {}
}

if (Date.now() > STOP_AT && !process.env.FORCE) { console.log("Race window over."); process.exit(0); }
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" });
const end = Date.now() + RUN_MS;
do {
  const started = Date.now();
  try { execSync("git pull -q --rebase origin race-data", { stdio: "inherit" }); } catch {}
  const list = latestSplits(), have = done();
  let added = 0;
  for (let i = 0; i < list.length; i++) {
    if (list[i].point === "START" || have.has(list[i].point)) continue;
    try {
      const s = await snapshot(browser, list, i);
      appendFileSync(OUT, JSON.stringify(s) + "\n"); added++;
      const fin = s.milestones.at(-1);
      console.log(s.mat, s.mode, "finish", new Date(fin.likely).toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles" }));
    } catch (e) { console.log(list[i].point, "failed:", e.message); }
  }
  if (added) push();
  if (Date.now() + EVERY_MS >= end) break;
  await sleep(Math.max(0, EVERY_MS - (Date.now() - started)));
} while (Date.now() < STOP_AT);
await browser.close();

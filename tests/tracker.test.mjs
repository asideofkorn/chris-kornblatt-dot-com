// Regression tests for the race tracker, replaying real IRONMAN California 2026 data.
// Run: cd tests && npm install && npm test   (LEAFLET_DIR / CHROME_PATH optional, see harness.mjs)
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { launch, openAt, readState, at, actualCum, bradleyCrossings, FIELD } from "./harness.mjs";

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser?.close(); });

const crossing = (point) => bradleyCrossings().find((c) => c.point === point);
const run = (mile) => 114.96 + mile; // cumulative miles at a run mile

test("fixture sanity: his real crossings are in the field data", () => {
  for (const p of ["SWIM", "T1", "BIKE10", "BIKE", "T2", "RUN1", "RUN2", "RUN3"]) assert.ok(crossing(p), `missing ${p}`);
});

test("catches up from the mat lists when his own feed is frozen at bike mile 84", async () => {
  // All afternoon his own feed ended at 1:11 pm; the page has to find T2 and the run mats in the per-mat lists.
  const { page, ctx, errors } = await openAt(browser, { now: at("15:20") });
  const s = await readState(page);
  assert.deepEqual(errors, []);
  assert.equal(s.lastMat.point, "RUN2", `last mat ${s.lastMat?.point}`);
  const truth = actualCum(at("15:20").getTime() / 1000);
  assert.ok(Math.abs(s.cum - truth) < 0.5, `position ${s.cum.toFixed(2)} vs actual ${truth.toFixed(2)} (cum mi)`);
  await ctx.close();
});

test("ignores a stray chip read that would need an impossible pace", async () => {
  // The bug users saw: a run mile 11.4 read 9 minutes after mile 4.1 made 'last stretch' 2:47/mi and put him at mile 13.
  const strayT = crossing("RUN3").t + 9 * 60;
  const { page, ctx, errors } = await openAt(browser, { now: at("15:35"), extra: [{ point: "RUN6", epochTime: String(strayT) }] });
  const s = await readState(page);
  assert.deepEqual(errors, []);
  assert.ok(!s.mats.includes("RUN6"), "stray RUN6 read was accepted");
  assert.equal(s.lastMat.point, "RUN3");
  assert.ok(s.pos.mile < 8, `run mile ${s.pos.mile.toFixed(1)} is too far`);
  const pace = s.speedText.match(/(\d+):(\d\d)\/mi/);
  if (pace) assert.ok(+pace[1] + pace[2] / 60 >= 5, `shown pace ${pace[0]} is impossible`);
  await ctx.close();
});

test("ignores a stray read that a generic human limit would allow", async () => {
  // At 4:12 pm the page jumped ~2 miles ahead of the IRONMAN app: a mile 11.4 read 44 minutes after mile 4.1
  // is 10 mph, possible for an elite but not for him (his fast target is 8:45/mi).
  const strayT = crossing("RUN3").t + 44 * 60;
  const { page, ctx, errors } = await openAt(browser, { now: new Date((strayT + 300) * 1000), extra: [{ point: "RUN6", epochTime: String(strayT) }] });
  const s = await readState(page);
  assert.deepEqual(errors, []);
  assert.ok(!s.mats.includes("RUN6"), "stray RUN6 read was accepted");
  assert.ok(s.pos.mile < 10.5, `run mile ${s.pos.mile.toFixed(1)} is too far`);
  await ctx.close();
});

test("drops a stray read already saved on a phone", async () => {
  const T = (p) => crossing(p).t * 1000;
  const saved = {
    v: 1, planV: 4, tab: "now", mode: "walk", alerts: {}, fired: {}, spots: [],
    plan: { start: { f: "07:47", x: "07:47", s: "07:47" }, swim: { f: 60, x: 70, s: 85 }, t1: { f: 9, x: 13, s: 17 }, bike: { f: 19.5, x: 18.5, s: 17 }, t2: { f: 6, x: 9, s: 12 }, run: { f: "8:45", x: "9:15", s: "10:30" }, fade: 8, bikeFade: 5 },
    obs: [
      { id: "rt:run:4.1", leg: "run", mile: 4.1, t: T("RUN3"), src: "auto", point: "RUN3" },
      { id: "rt:run:11.44", leg: "run", mile: 11.44, t: T("RUN3") + 9 * 60000, src: "auto", point: "RUN6" },
    ],
  };
  const { page, ctx, errors } = await openAt(browser, { now: at("15:35"), saved });
  const s = await readState(page);
  assert.deepEqual(errors, []);
  assert.ok(!s.mats.includes("RUN6"), "saved stray read survived a reload");
  await ctx.close();
});

test("plausibility check: real gaps pass, impossible jumps don't", async () => {
  const { page, ctx } = await openAt(browser, { now: at("15:35"), settle: 2000 });
  const r = await page.evaluate(() => {
    const T = (h, m) => new Date(`2026-10-18T${h}:${m}:00-07:00`).getTime();
    const prev = [{ src: "auto", leg: "run", mile: 4.1, t: T("15", "21") }];
    const bikeOnly = [{ src: "auto", leg: "bike", mile: 84.04, t: T("13", "11") }];
    return {
      normalRun: plausible("run", 7.45, T("15", "52"), prev),          // 3.35 mi in 31 min
      strayRun: plausible("run", 11.44, T("15", "30"), prev),          // 7.3 mi in 9 min
      backwards: plausible("run", 2.34, T("15", "40"), prev),
      longGapBikeToRun: plausible("run", 4.1, T("15", "21"), bikeOnly), // spans the end of the bike and the run start
    };
  });
  assert.deepEqual(r, { normalRun: true, strayRun: false, backwards: false, longGapBikeToRun: true });
  await ctx.close();
});

test("run projection doesn't inherit bike speed", async () => {
  // At 3:20 pm, after run miles 0.6 and 2.3, he should be shown near mile 4, not miles ahead.
  const { page, ctx } = await openAt(browser, { now: at("15:20") });
  const s = await readState(page);
  const truth = actualCum(at("15:20").getTime() / 1000);
  assert.ok(s.cum - truth < 0.4, `${(s.cum - truth).toFixed(2)} mi ahead of where he was`);
  await ctx.close();
});

test("IRONMAN dot never runs past the next mat", async () => {
  const { page, ctx } = await openAt(browser, { now: at("15:35") });
  const s = await readState(page);
  assert.ok(s.app == null || s.app <= run(7.45) + 0.01, `IRONMAN dot at ${s.app?.toFixed(2)} is past the next mat`);
  await ctx.close();
});

test("position tracks where he really was through the day", async () => {
  // Fresh page load at each moment, own feed frozen as it was; tolerance is wider on the bike between mats.
  const moments = ["09:00", "10:00", "11:00", "12:00", "13:00", "13:45", "14:20", "14:50", "15:10"];
  const misses = [];
  for (const hhmm of moments) {
    const { page, ctx, errors } = await openAt(browser, { now: at(hhmm) });
    const s = await readState(page);
    const truth = actualCum(at(hhmm).getTime() / 1000);
    const tol = truth > 114.96 ? 0.6 : truth > 2.76 ? 2.5 : 0.4;
    if (errors.length) misses.push(`${hhmm}: page errors ${errors.join("; ")}`);
    if (Math.abs(s.cum - truth) > tol) misses.push(`${hhmm}: shown ${s.cum.toFixed(1)} vs actual ${truth.toFixed(1)} (±${tol})`);
    await ctx.close();
  }
  assert.deepEqual(misses, []);
});

test("place counts everyone who started", async () => {
  const { page, ctx } = await openAt(browser, { now: at("15:20") });
  const txt = await page.locator(".kv2").innerText().catch(() => "");
  // The started count comes from the site's chart data; offline (file://) the page falls back to "so far".
  assert.ok(/started|so far/.test(txt) || !/PLACE/i.test(txt), txt);
  assert.ok(!/top 6\d%|top [7-9]\d%/.test(txt), `place looks like it's out of only the athletes through so far: ${txt}`);
  await ctx.close();
});

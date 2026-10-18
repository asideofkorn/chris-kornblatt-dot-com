// Turns a full-field pull into the anonymized dataset behind the public Marey chart:
// no names, bibs, ages or locations; athletes are just numbered lines (Bradley flagged).
// Usage: node build-marey.mjs data/field-....json.gz out/marey.json
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { gunzipSync } from "node:zlib";

const [, , input, output = "out/marey.json"] = process.argv;
const d = JSON.parse(gunzipSync(readFileSync(input)));
const BRADLEY = "RL78MBN2";
const COURSE = "ironman";

// Course position of each mat in cumulative miles (bike starts at 2.76, run at 114.96).
const LEG_START = { swim: 0, bike: 2.76, run: 114.96 };
const MATS = {
  START: ["swim", 0], SWIM: ["swim", 2.4], T1: ["bike", 0], BIKE0: ["bike", 0.06], BIKE1: ["bike", 7.62], BIKE2: ["bike", 14.95],
  BIKE3: ["bike", 19.92], BIKE4: ["bike", 25.57], BIKE5: ["bike", 28.03], BIKE6: ["bike", 30.48], BIKE7: ["bike", 36.12], BIKE8: ["bike", 41.07],
  BIKE9: ["bike", 48.42], BIKE10: ["bike", 56.03], BIKE11: ["bike", 56.03], BIKE12: ["bike", 63.64], BIKE13: ["bike", 71.0], BIKE14: ["bike", 75.94],
  BIKE15: ["bike", 81.58], BIKE16: ["bike", 84.04], BIKE17: ["bike", 86.49], BIKE18: ["bike", 92.13], BIKE19: ["bike", 97.07], BIKE20: ["bike", 104.44],
  BIKE21: ["bike", 111.95], BIKE: ["bike", 112.04], T2: ["run", 0], RUN1: ["run", 0.58], RUN2: ["run", 2.34], RUN3: ["run", 4.1], RUN4: ["run", 4.86],
  RUN5: ["run", 6.2], RUN6: ["run", 7.45], RUN7: ["run", 8.7], RUN8: ["run", 10.04], RUN9: ["run", 11.44], RUN10: ["run", 13.81], RUN11: ["run", 15.42],
  RUN12: ["run", 16], RUN13: ["run", 16.76], RUN14: ["run", 18.1], RUN15: ["run", 19.35], RUN16: ["run", 20.61], RUN17: ["run", 21.95], RUN18: ["run", 23.34],
  RUN19: ["run", 25.71], FINISH: ["run", 26.08],
};
// IRONMAN redefined the run mats mid-race, so the pull's own mat list wins over the table above.
for (const p of Array.isArray(d.points) ? d.points : Object.values(d.points || {})) {
  if (!p || !p.name || p.miles == null || (p.course && p.course !== COURSE) || p.name === "START" || p.name === "ANNOUNCER") continue;
  const m = +p.miles;
  MATS[p.name] = m <= 2.45 ? ["swim", +m.toFixed(2)] : m < 114.9 ? ["bike", +Math.max(0, m - 2.76).toFixed(2)] : ["run", +Math.max(0, m - 114.96).toFixed(2)];
}
const cumOf = (name) => { const m = MATS[name]; return m ? +(LEG_START[m[0]] + m[1]).toFixed(2) : null; };

// One mat per course position, in race order.
const mats = [];
for (const name of Object.keys(MATS)) {
  const cum = cumOf(name);
  if (!mats.some((m) => m.cum === cum)) mats.push({ name, leg: MATS[name][0], mile: MATS[name][1], cum });
}
mats.sort((a, b) => a.cum - b.cum);
const matIndex = new Map(mats.map((m, i) => [m.cum, i]));

// Guides race alongside visually impaired athletes; counting them would double those athletes.
const skip = new Set((d.profiles || []).filter((p) => p.class === "guide").map((p) => p.pid));

// Gather each athlete's earliest crossing at each course position.
const byPid = new Map();
// Age group only (e.g. "M30-34"), kept so places can be ranked within an age group.
const divOf = new Map((d.profiles || []).map((p) => [p.pid, (String(p.race || "").match(/[MF]\d{2}-\d{2}|[MF]\d{2}\+/) || [""])[0]]));
for (const [point, rows] of Object.entries(d.splits || {})) {
  const cum = cumOf(point); if (cum == null) continue;
  for (const r of rows) {
    if ((r.course && r.course !== COURSE) || skip.has(r.pid)) continue;
    const t = Math.round(parseFloat(r.epochTime)); if (!(t > 0) || !r.pid) continue;
    if (r.division && !divOf.get(r.pid)) divOf.set(r.pid, r.division);
    const a = byPid.get(r.pid) || new Map();
    const i = matIndex.get(cum);
    if (!a.has(i) || t < a.get(i)) a.set(i, t);
    byPid.set(r.pid, a);
  }
}

const asOf = Math.round(Date.parse(d.pulledAt) / 1000);
const courseClose = Math.round(Date.parse("2026-10-19T07:00:00Z") / 1000); // midnight PT
const finishIdx = mats.length - 1;
const registered = (d.profiles || []).filter((p) => (!p.course || p.course === COURSE) && p.class !== "guide").length;

// Status: 0 finished, 1 didn't finish, 2 still on course (only possible before the course closes).
const athletes = [], divCodes = [], divs = [];
let bradley = -1;
for (const [pid, times] of byPid) {
  const idx = [...times.keys()].sort((a, b) => a - b);
  const start = times.get(0) ?? Math.min(...times.values());
  const lastT = Math.max(...times.values());
  const status = times.has(finishIdx) ? 0 : asOf >= courseClose || asOf - lastT > 3 * 3600 ? 1 : 2;
  const row = [status, start];
  for (const i of idx) row.push(i, times.get(i) - start);
  if (pid === BRADLEY) bradley = athletes.length;
  athletes.push(row);
  const dv = divOf.get(pid) || "";
  if (!divs.includes(dv)) divs.push(dv);
  divCodes.push(divs.indexOf(dv));
}

const started = athletes.length;
const out = {
  asOf, courseClose, registered, started,
  didNotStart: Math.max(0, registered - started),
  mats: mats.map(({ name, leg, mile, cum }) => ({ name, leg, mile, cum })),
  athletes, bradley,
  divs, div: divCodes, // div[i] indexes divs for athletes[i]
};
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify(out));
const c = [0, 1, 2].map((s) => athletes.filter((a) => a[0] === s).length);
console.log(`${output}: registered ${registered}, started ${started}, finished ${c[0]}, DNF ${c[1]}, on course ${c[2]}, Bradley ${bradley >= 0 ? "found" : "missing"}, ${(JSON.stringify(out).length / 1024).toFixed(0)} KB`);

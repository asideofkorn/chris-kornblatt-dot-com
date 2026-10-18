// Pulls every athlete's splits at every timing mat for IRONMAN California 2026 from RTRT.me
// (the timing service behind the IRONMAN Tracker app) and saves them, gzipped, under data/.
// Private repo only: rows include athlete names, bibs and age groups.
import { mkdirSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const RT = { base: "https://api.rtrt.me", app: "5824c5c948fd08c23a8b4567", loader: "52139b797871851e0800638e", ev: process.env.EVENT || "IRM-CALIFORNIA-2026" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let token = null;

async function register() {
  try {
    const j = await (await fetch(`${RT.base}/register?appid=${RT.app}`)).json();
    if (j && (j.token || j.data?.token)) return j.token || j.data.token;
  } catch {}
  const t = [...crypto.getRandomValues(new Uint8Array(10))].map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  await fetch(`${RT.base}/publicconf`, { method: "POST", body: new URLSearchParams({ appid: RT.loader, token: t, lang_app: RT.app, tracker_ver: "3", web: "1", version: "8.3.0", secure: "1" }) });
  return t;
}
async function get(path, params = {}, retry = true) {
  token ??= await register();
  await sleep(700); // stay gentle: well under 2 requests a second
  const j = await (await fetch(`${RT.base}${path}?${new URLSearchParams({ appid: RT.app, token, ...params })}`)).json();
  if (j?.error?.type === "not_authorized" && retry) { token = null; return get(path, params, false); }
  if (j?.error?.type === "no_results") return { list: [] };
  if (j?.error) throw new Error(`${path}: ${j.error.msg || j.error.type}`);
  return j;
}
// Page until the feed returns nothing; a short page doesn't mean the end. Dedupe by pid+point in case pages overlap.
const info = {};
async function all(path) {
  const rows = [], seen = new Set();
  let start = 1;
  for (let page = 0; page < 40; page++) {
    const j = await get(path, { max: 1000, start });
    const list = j.list || [];
    if (page === 0) info[path] = j.info || null;
    if (!list.length) break;
    for (const r of list) { const k = (r.pid || r.u || JSON.stringify(r)) + "|" + (r.point || ""); if (!seen.has(k)) { seen.add(k); rows.push(r); } }
    const last = Number(j.info?.last);
    start = Number.isFinite(last) && last >= start ? last + 1 : start + list.length;
  }
  return rows;
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const out = { pulledAt: new Date().toISOString(), event: RT.ev, points: [], splits: {}, profiles: [] };
out.points = (await get(`/events/${RT.ev}/points`, { max: 200 })).list || [];
for (const p of out.points) {
  out.splits[p.name] = await all(`/events/${RT.ev}/points/${p.name}/splits`);
  console.log(p.name, out.splits[p.name].length);
}
try { out.profiles = await all(`/events/${RT.ev}/profiles`); } catch (e) { console.log("profiles:", e.message); }
try { out.categories = (await get(`/events/${RT.ev}/categories`)).list || []; } catch (e) { console.log("categories:", e.message); }

out.info = info;
mkdirSync("data", { recursive: true });
const gz = gzipSync(JSON.stringify(out));
writeFileSync(`data/field-${stamp}.json.gz`, gz);
writeFileSync("data/latest.txt", `field-${stamp}.json.gz\n`);
const athletes = new Set(Object.values(out.splits).flat().map((r) => r.pid));
console.log(`Saved data/field-${stamp}.json.gz: ${out.points.length} mats, ${athletes.size} athletes, ${out.profiles.length} profiles, ${(gz.length / 1e6).toFixed(1)} MB`);

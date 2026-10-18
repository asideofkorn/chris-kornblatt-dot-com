// Records Bradley's official IRONMAN California 2026 splits (and the IRONMAN app's own next-mat and
// finish estimates, which can't be fetched after the fact) from RTRT.me every 2 minutes.
// Runs in GitHub Actions on the race-data branch so the record survives independently of any phone.
import { appendFileSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";

const RT = { base: "https://api.rtrt.me", app: "5824c5c948fd08c23a8b4567", loader: "52139b797871851e0800638e", ev: "IRM-CALIFORNIA-2026", pid: "RL78MBN2" };
const OUT = "data/bradley.jsonl";
const EVERY_MS = 2 * 60 * 1000;
const RUN_MS = (Number(process.env.RUN_MINUTES) || 14) * 60 * 1000;
const STOP_AT = Date.parse("2026-10-19T09:00:00Z"); // 2am PT the night after the race

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let token = null;

async function register() {
  try {
    const j = await (await fetch(`${RT.base}/register?appid=${RT.app}`)).json();
    if (j && (j.token || j.data?.token)) return j.token || j.data.token;
  } catch {}
  // Same registration RTRT's own web tracker does: a random client id announced once.
  const t = [...crypto.getRandomValues(new Uint8Array(10))].map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  await fetch(`${RT.base}/publicconf`, { method: "POST", body: new URLSearchParams({ appid: RT.loader, token: t, lang_app: RT.app, tracker_ver: "3", web: "1", version: "8.3.0", secure: "1" }) });
  return t;
}

async function get(path, retry = true) {
  token ??= await register();
  const j = await (await fetch(`${RT.base}${path}?${new URLSearchParams({ appid: RT.app, token })}`)).json();
  if (j?.error?.type === "not_authorized" && retry) { token = null; return get(path, false); }
  if (j?.error?.type === "no_results") return { list: [] };
  if (j?.error) throw new Error(j.error.msg || j.error.type);
  return j;
}

async function poll() {
  const rec = { t: new Date().toISOString() };
  try {
    rec.list = (await get(`/events/${RT.ev}/profiles/${RT.pid}/splits`)).list || [];
    rec.ok = true;
  } catch (e) {
    rec.ok = false;
    rec.error = String(e.message || e);
  }
  mkdirSync("data", { recursive: true });
  appendFileSync(OUT, JSON.stringify(rec) + "\n");
  const last = rec.list?.at(-1);
  console.log(rec.t, rec.ok ? `${rec.list.length} splits, last ${last?.point ?? "none"}` : `error: ${rec.error}`);
}

function push() {
  try {
    execSync(`git add data && git commit -q -m "Race data $(date -u +%H:%M)" && git push -q origin HEAD:race-data`, { stdio: "inherit", shell: "/bin/bash" });
  } catch {
    // Another run may have pushed first; pull and retry once.
    try { execSync("git pull -q --rebase origin race-data && git push -q origin HEAD:race-data", { stdio: "inherit", shell: "/bin/bash" }); } catch {}
  }
}

if (Date.now() > STOP_AT) { console.log("Race window over; nothing to record."); process.exit(0); }
const end = Date.now() + RUN_MS;
while (Date.now() < end && Date.now() < STOP_AT) {
  const started = Date.now();
  await poll();
  push();
  await sleep(Math.max(0, EVERY_MS - (Date.now() - started)));
}
